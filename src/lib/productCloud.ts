/**
 * Step 2 — Cloud product CRUD via Frappe resource API (TL Project / Incident / Evidence).
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import { INCIDENT_PROCESS_STAGE_FIELDNAMES } from "@/lib/frappeProductDocTypes";
import { rowsForCustomer } from "@/lib/tenantScope";
import type { EvidenceStub } from "@/types/engagement";
import type { Incident, IncidentPriority, IncidentStatus } from "@/types/incident";
import type { IncidentProcessStages } from "@/lib/grievanceProcess";
import type { Project } from "@/types/project";
import { omitCloudTrustOverlay } from "@/types/trustOverlay";

/** Frappe MySQL Datetime: `YYYY-MM-DD HH:MM:SS` (no ISO `T`/`Z`). */
export function toFrappeDatetime(isoOrDate: string | Date | null | undefined): string | null {
  if (!isoOrDate) return null;
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

/** Convert a stored Cloud datetime back to ISO. Blank stays blank — never fills in now. */
export function fromFrappeDatetime(value: unknown): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const parsed = raw.includes("T") ? new Date(raw) : new Date(raw.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString();
}

function authHeaders(): HeadersInit | null {
  const pair = frappeKeyPair();
  if (!pair) return null;
  return {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function resourcePost(
  doctype: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; name: string; data: unknown } | { ok: false; error: string }> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const res = await fetch(`${base}/api/resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  try {
    const json = JSON.parse(text) as { data?: { name?: string } };
    return {
      ok: true,
      name: json.data?.name || String(body.name || ""),
      data: json.data,
    };
  } catch {
    return { ok: true, name: String(body.name || ""), data: text };
  }
}

export function projectToFrappeDoc(
  project: Project,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  return {
    project_code: project.id,
    project_title: project.name,
    customer,
    client_funder: project.clientFunder,
    budget_total: project.budgetTotal,
    budget_spent: project.budgetSpent,
    ward: project.ward,
    municipality: project.municipality,
    status: project.status,
    contractor_name: project.contractorName,
    start_date: project.startDate || null,
    target_end_date: project.targetEndDate || null,
    public_summary: project.publicSummary,
    tl_org_id: orgId,
  };
}

export const INCIDENT_STAGE_CLOUD_FIELDS = {
  reportedAt: "reported_at",
  resourceDeployedAt: "resource_deployed_at",
  investigatedAt: "investigated_at",
  resolvedAt: "resolved_at",
  verifiedAt: "verified_at",
  closedAt: "closed_at",
} as const;

function asIncidentStatus(value: unknown): IncidentStatus {
  const raw = String(value || "").trim();
  if (
    raw === "Open" ||
    raw === "Investigating" ||
    raw === "Escalated" ||
    raw === "Closed"
  ) {
    return raw;
  }
  return "Open";
}

function asIncidentPriority(value: unknown): IncidentPriority {
  const raw = String(value || "").trim();
  if (
    raw === "P4-Low" ||
    raw === "P3-Medium" ||
    raw === "P2-High" ||
    raw === "P1-Critical"
  ) {
    return raw;
  }
  return "P3-Medium";
}

/** Non-blank Cloud datetime only — never fills in now. */
export function nonBlankCloudTime(value: unknown): string | undefined {
  return fromFrappeDatetime(value);
}

function stageToCloud(
  value: string | null | undefined,
): string | null {
  const raw = String(value || "").trim();
  return raw ? toFrappeDatetime(raw) : null;
}

export function processStagesFromCloud(
  row: Record<string, unknown>,
): IncidentProcessStages | undefined {
  const reportedAt = nonBlankCloudTime(row.reported_at);
  const resourceDeployedAt = nonBlankCloudTime(row.resource_deployed_at);
  const investigatedAt = nonBlankCloudTime(row.investigated_at);
  const resolvedAt = nonBlankCloudTime(row.resolved_at);
  const verifiedAt = nonBlankCloudTime(row.verified_at);
  const closedAt = nonBlankCloudTime(row.closed_at);
  if (
    !reportedAt &&
    !resourceDeployedAt &&
    !investigatedAt &&
    !resolvedAt &&
    !verifiedAt &&
    !closedAt
  ) {
    return undefined;
  }
  return {
    reportedAt: reportedAt || "",
    resourceDeployedAt: resourceDeployedAt ?? null,
    investigatedAt: investigatedAt ?? null,
    resolvedAt: resolvedAt ?? null,
    verifiedAt: verifiedAt ?? null,
    closedAt: closedAt ?? null,
  };
}

export function incidentToFrappeDoc(
  incident: Incident,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  // Explicit fields only — TE-1 `trustResponse` overlay is not a Cloud column.
  const stages = incident.processStages;
  const doc: Record<string, unknown> = {
    incident_code: incident.id,
    title: incident.title,
    description: incident.description,
    customer,
    project: incident.projectId || null,
    project_name: incident.projectName,
    ward: incident.ward,
    geographic_area: incident.geographicArea,
    status: incident.status,
    priority: incident.priority,
    reporter_name: incident.reporterName || null,
    tl_org_id: orgId,
  };
  if (stages) {
    doc.reported_at = stageToCloud(stages.reportedAt || incident.reportedAt);
    doc.resource_deployed_at = stageToCloud(stages.resourceDeployedAt);
    doc.investigated_at = stageToCloud(stages.investigatedAt);
    doc.resolved_at = stageToCloud(stages.resolvedAt);
    doc.verified_at = stageToCloud(stages.verifiedAt);
    doc.closed_at = stageToCloud(stages.closedAt);
  } else {
    doc.reported_at = stageToCloud(incident.reportedAt);
  }
  return omitCloudTrustOverlay(doc);
}

export function frappeToIncident(
  row: Record<string, unknown>,
): Incident | null {
  const id = String(row.incident_code || row.name || "").trim();
  if (!id) return null;
  const stages = processStagesFromCloud(row);
  const reportedAt = stages?.reportedAt || "";
  return {
    id,
    title: String(row.title || ""),
    description: String(row.description || ""),
    ward: String(row.ward || ""),
    geographicArea: String(row.geographic_area || ""),
    status: asIncidentStatus(row.status),
    priority: asIncidentPriority(row.priority),
    projectId: String(row.project || ""),
    projectName: String(row.project_name || ""),
    reportedByRole: "community",
    reporterName: row.reporter_name ? String(row.reporter_name) : null,
    reportedAt,
    slaDueBy: "",
    slaBreached: false,
    escalationLevel: "None",
    ownerName: "",
    category: "",
    impactScore: 0,
    sentimentScore: null,
    timeline: [],
    processStages: stages,
  };
}

export function evidenceToFrappeDoc(
  evidence: EvidenceStub,
  customer: string,
  orgId?: string,
  fileUrl?: string,
): Record<string, unknown> {
  // Explicit fields only — TE-1 `trustSupport` overlay is not a Cloud column.
  return {
    evidence_code: evidence.id,
    incident: evidence.incidentId,
    customer,
    file_name: evidence.fileName,
    classification: evidence.classification,
    uploaded_by: evidence.uploadedBy,
    uploaded_at: toFrappeDatetime(evidence.uploadedAt),
    is_primary: evidence.isPrimary ? 1 : 0,
    file: fileUrl || undefined,
    tl_org_id: orgId,
  };
}

export async function createCloudProject(
  project: Project,
  customer: string,
  orgId?: string,
) {
  return resourcePost("TL Project", projectToFrappeDoc(project, customer, orgId));
}

function mapFrappeProjectRow(row: Record<string, unknown>): Project {
  return {
    id: String(row.project_code || row.name || ""),
    name: String(row.project_title || row.name || "Untitled project"),
    clientFunder: String(row.client_funder || ""),
    budgetTotal: Number(row.budget_total) || 0,
    budgetSpent: Number(row.budget_spent) || 0,
    ward: String(row.ward || ""),
    municipality: String(row.municipality || ""),
    status: (String(row.status || "Active") as Project["status"]) || "Active",
    contractorName: String(row.contractor_name || ""),
    startDate: String(row.start_date || ""),
    targetEndDate: String(row.target_end_date || ""),
    publicSummary: String(row.public_summary || ""),
  };
}

/** List TL Project rows for a Customer via resource API (VIP / live fallback). */
export async function listCloudProjectsForCustomer(
  customer: string,
): Promise<{ ok: true; projects: Project[] } | { ok: false; error: string }> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const filters = encodeURIComponent(
    JSON.stringify([["customer", "=", customer]]),
  );
  const fields = encodeURIComponent(
    JSON.stringify([
      "name",
      "project_code",
      "project_title",
      "client_funder",
      "budget_total",
      "budget_spent",
      "ward",
      "municipality",
      "status",
      "contractor_name",
      "start_date",
      "target_end_date",
      "public_summary",
      "customer",
    ]),
  );
  const res = await fetch(
    `${base}/api/resource/TL%20Project?filters=${filters}&fields=${fields}&limit_page_length=200`,
    { headers, cache: "no-store" },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  try {
    const json = JSON.parse(text) as { data?: Record<string, unknown>[] };
    const rows = Array.isArray(json.data) ? json.data : [];
    return {
      ok: true,
      projects: rowsForCustomer(rows, customer)
        .map(mapFrappeProjectRow)
        .filter((p) => Boolean(p.id)),
    };
  } catch {
    return { ok: false, error: "Invalid TL Project list response" };
  }
}

const PROJECT_FIELDS = [
  "name",
  "project_code",
  "project_title",
  "client_funder",
  "budget_total",
  "budget_spent",
  "ward",
  "municipality",
  "status",
  "contractor_name",
  "start_date",
  "target_end_date",
  "public_summary",
  "customer",
] as const;

async function fetchCloudProjects(
  filters: unknown[][],
): Promise<{ ok: true; rows: Record<string, unknown>[] } | { ok: false; error: string }> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const filtersEnc = encodeURIComponent(JSON.stringify(filters));
  const fieldsEnc = encodeURIComponent(JSON.stringify([...PROJECT_FIELDS]));
  const res = await fetch(
    `${base}/api/resource/TL%20Project?filters=${filtersEnc}&fields=${fieldsEnc}&limit_page_length=5`,
    { headers, cache: "no-store" },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  try {
    const json = JSON.parse(text) as { data?: Record<string, unknown>[] };
    return { ok: true, rows: Array.isArray(json.data) ? json.data : [] };
  } catch {
    return { ok: false, error: "Invalid TL Project response" };
  }
}

/**
 * Resolve one TL Project for a Customer by project_code or Frappe name.
 * List links use project_code; create may also surface the Cloud doc name.
 */
export async function getCloudProjectForCustomer(
  customer: string,
  id: string,
): Promise<{ ok: true; project: Project | null } | { ok: false; error: string }> {
  const code = id.trim();
  if (!code) return { ok: true, project: null };

  const byCode = await fetchCloudProjects([
    ["customer", "=", customer],
    ["project_code", "=", code],
  ]);
  if (!byCode.ok) return byCode;
  const codeRow = rowsForCustomer(byCode.rows, customer)[0];
  if (codeRow) {
    return { ok: true, project: mapFrappeProjectRow(codeRow) };
  }

  const byName = await fetchCloudProjects([
    ["customer", "=", customer],
    ["name", "=", code],
  ]);
  if (!byName.ok) return byName;
  const nameRow = rowsForCustomer(byName.rows, customer)[0];
  if (nameRow) {
    return { ok: true, project: mapFrappeProjectRow(nameRow) };
  }

  return { ok: true, project: null };
}

export async function createCloudIncident(
  incident: Incident,
  customer: string,
  orgId?: string,
) {
  return upsertCloudIncident(incident, customer, orgId);
}

async function resourcePut(
  doctype: string,
  name: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; name: string; data: unknown } | { ok: false; error: string }> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  try {
    const json = JSON.parse(text) as { data?: { name?: string } };
    return {
      ok: true,
      name: json.data?.name || name,
      data: json.data,
    };
  } catch {
    return { ok: true, name, data: text };
  }
}

async function resourceExists(doctype: string, name: string): Promise<boolean> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) return false;
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { headers, cache: "no-store" },
  );
  return res.ok;
}

const INCIDENT_CORE_FIELDS = [
  "name",
  "incident_code",
  "title",
  "description",
  "customer",
  "project",
  "project_name",
  "ward",
  "geographic_area",
  "status",
  "priority",
  "reporter_name",
  "tl_org_id",
] as const;

function incidentListFields(includeStages: boolean): string[] {
  return includeStages
    ? [...INCIDENT_CORE_FIELDS, ...INCIDENT_PROCESS_STAGE_FIELDNAMES]
    : [...INCIDENT_CORE_FIELDS];
}

async function fetchCloudIncidents(
  customer: string,
  includeStages: boolean,
): Promise<{ ok: true; rows: Record<string, unknown>[] } | { ok: false; error: string }> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const filters = encodeURIComponent(
    JSON.stringify([["customer", "=", customer]]),
  );
  const fields = encodeURIComponent(
    JSON.stringify(incidentListFields(includeStages)),
  );
  const res = await fetch(
    `${base}/api/resource/TL%20Incident?filters=${filters}&fields=${fields}&limit_page_length=200`,
    { headers, cache: "no-store" },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  try {
    const json = JSON.parse(text) as { data?: Record<string, unknown>[] };
    return { ok: true, rows: Array.isArray(json.data) ? json.data : [] };
  } catch {
    return { ok: false, error: "Invalid TL Incident list response" };
  }
}

export async function listCloudIncidentsForCustomer(
  customer: string,
): Promise<{ ok: true; incidents: Incident[] } | { ok: false; error: string }> {
  let listed = await fetchCloudIncidents(customer, true);
  if (!listed.ok) {
    listed = await fetchCloudIncidents(customer, false);
  }
  if (!listed.ok) return listed;
  return {
    ok: true,
    incidents: rowsForCustomer(listed.rows, customer)
      .map(frappeToIncident)
      .filter((row): row is Incident => Boolean(row)),
  };
}

export async function upsertCloudIncident(
  incident: Incident,
  customer: string,
  orgId?: string,
) {
  const doctype = "TL Incident";
  const body = incidentToFrappeDoc(incident, customer, orgId);
  if (!incident.id || !incident.title) {
    return {
      ok: false as const,
      error: "incident.id and title required",
    };
  }
  if (await resourceExists(doctype, incident.id)) {
    return resourcePut(doctype, incident.id, body);
  }
  return resourcePost(doctype, body);
}

export async function createCloudEvidence(
  evidence: EvidenceStub,
  customer: string,
  orgId?: string,
  fileUrl?: string,
) {
  return resourcePost(
    "TL Evidence",
    evidenceToFrappeDoc(evidence, customer, orgId, fileUrl),
  );
}
