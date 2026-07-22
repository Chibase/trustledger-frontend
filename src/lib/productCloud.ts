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

<<<<<<< HEAD
/** Frappe MySQL Datetime: `YYYY-MM-DD HH:MM:SS` (no ISO `T`/`Z`). */
export function toFrappeDatetime(isoOrDate: string | Date | null | undefined): string | null {
  if (!isoOrDate) return null;
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

=======
>>>>>>> origin/master
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
  return {
    evidence_code: evidence.id,
    incident: evidence.incidentId,
    customer,
    file_name: evidence.fileName,
    classification: evidence.classification,
    uploaded_by: evidence.uploadedBy,
<<<<<<< HEAD
    uploaded_at: toFrappeDatetime(evidence.uploadedAt),
=======
    uploaded_at: evidence.uploadedAt,
>>>>>>> origin/master
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
