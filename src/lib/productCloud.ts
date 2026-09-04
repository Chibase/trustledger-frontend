/**
 * Step 2 — Cloud product CRUD via Frappe resource API (TL Project / Incident / Evidence).
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

/** Frappe MySQL Datetime: `YYYY-MM-DD HH:MM:SS` (no ISO `T`/`Z`). */
export function toFrappeDatetime(isoOrDate: string | Date | null | undefined): string | null {
  if (!isoOrDate) return null;
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
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

export function incidentToFrappeDoc(
  incident: Incident,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  // Explicit fields only — TE-1 `trustResponse` overlay is not a Cloud column.
  return {
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
      projects: rows
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
  if (byCode.rows[0]) {
    return { ok: true, project: mapFrappeProjectRow(byCode.rows[0]) };
  }

  const byName = await fetchCloudProjects([
    ["customer", "=", customer],
    ["name", "=", code],
  ]);
  if (!byName.ok) return byName;
  if (byName.rows[0]) {
    return { ok: true, project: mapFrappeProjectRow(byName.rows[0]) };
  }

  return { ok: true, project: null };
}

export async function createCloudIncident(
  incident: Incident,
  customer: string,
  orgId?: string,
) {
  return resourcePost("TL Incident", incidentToFrappeDoc(incident, customer, orgId));
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
