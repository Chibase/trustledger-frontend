/**
 * SI-Cloud — CRUD for TL Stakeholder / Engagement / Commitment via Frappe resource API.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { Stakeholder } from "@/types/stakeholder";

function authHeaders(): HeadersInit | null {
  const pair = frappeKeyPair();
  if (!pair) return null;
  return {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function asJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function toJsonField(value: string[] | undefined): string {
  return JSON.stringify(value || []);
}

export type SiKind = "stakeholder" | "engagement" | "commitment";

export function siDocType(kind: SiKind): string {
  if (kind === "stakeholder") return "TL Stakeholder";
  if (kind === "engagement") return "TL Engagement";
  return "TL Commitment";
}

export function stakeholderToFrappeDoc(
  row: Stakeholder,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  return {
    stakeholder_code: row.id,
    stakeholder_name: row.name,
    customer,
    kind: row.kind,
    status: row.status,
    organisation: row.organisation || "",
    place_id: row.placeId || "",
    country_code: row.countryCode || "",
    influence: row.influence,
    interests: toJsonField(row.interests),
    tags: toJsonField(row.tags),
    email: row.email || "",
    phone: row.phone || "",
    alternative_contact: row.alternativeContact || "",
    summary: row.summary || "",
    engagement_role: row.engagementRole || "",
    preferred_channel: row.preferredChannel || "",
    related_stakeholder_ids: toJsonField(row.relatedStakeholderIds),
    project_ids: toJsonField(row.projectIds),
    last_engaged_on: row.lastEngagedOn || null,
    next_action: row.nextAction || "",
    owner_user_id: row.ownerUserId || "",
    tl_org_id: orgId || "",
  };
}

export function engagementToFrappeDoc(
  row: Engagement,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  return {
    engagement_code: row.id,
    title: row.title,
    customer,
    kind: row.kind,
    status: row.status,
    held_on: row.heldOn || null,
    ward: row.ward || "",
    place_label: row.placeLabel || "",
    project_id: row.projectId || "",
    summary: row.summary || "",
    attendees_label: row.attendeesLabel || "",
    action_items: toJsonField(row.actionItems),
    stakeholder_ids: toJsonField(row.stakeholderIds),
    capture_id: row.captureId || "",
    source: row.source,
    tl_org_id: orgId || "",
  };
}

export function commitmentToFrappeDoc(
  row: Commitment,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  return {
    commitment_code: row.id,
    title: row.title,
    customer,
    status: row.status,
    owner_label: row.ownerLabel || "",
    due_on: row.dueOn || null,
    project_id: row.projectId || "",
    engagement_id: row.engagementId || "",
    stakeholder_ids: toJsonField(row.stakeholderIds),
    source_action_item: row.sourceActionItem || "",
    evidence_note: row.evidenceNote || "",
    tl_org_id: orgId || "",
  };
}

export function frappeToStakeholder(
  doc: Record<string, unknown>,
): Stakeholder {
  return {
    id: String(doc.stakeholder_code || doc.name || ""),
    name: String(doc.stakeholder_name || ""),
    kind: (doc.kind as Stakeholder["kind"]) || "other",
    status: (doc.status as Stakeholder["status"]) || "active",
    organisation: doc.organisation ? String(doc.organisation) : undefined,
    placeId: doc.place_id ? String(doc.place_id) : undefined,
    countryCode: doc.country_code ? String(doc.country_code) : undefined,
    influence: (doc.influence as Stakeholder["influence"]) || "unknown",
    interests: asJsonArray(doc.interests),
    tags: asJsonArray(doc.tags),
    email: doc.email ? String(doc.email) : undefined,
    phone: doc.phone ? String(doc.phone) : undefined,
    alternativeContact: doc.alternative_contact
      ? String(doc.alternative_contact)
      : undefined,
    summary: doc.summary ? String(doc.summary) : undefined,
    engagementRole: doc.engagement_role
      ? String(doc.engagement_role)
      : undefined,
    preferredChannel: doc.preferred_channel
      ? (doc.preferred_channel as Stakeholder["preferredChannel"])
      : undefined,
    relatedStakeholderIds: asJsonArray(doc.related_stakeholder_ids),
    projectIds: asJsonArray(doc.project_ids),
    lastEngagedOn: doc.last_engaged_on
      ? String(doc.last_engaged_on)
      : undefined,
    nextAction: doc.next_action ? String(doc.next_action) : undefined,
    ownerUserId: doc.owner_user_id ? String(doc.owner_user_id) : undefined,
    source: "live",
  };
}

export function frappeToEngagement(doc: Record<string, unknown>): Engagement {
  return {
    id: String(doc.engagement_code || doc.name || ""),
    title: String(doc.title || ""),
    kind: (doc.kind as Engagement["kind"]) || "other",
    status: (doc.status as Engagement["status"]) || "held",
    heldOn: String(doc.held_on || ""),
    ward: String(doc.ward || ""),
    placeLabel: doc.place_label ? String(doc.place_label) : undefined,
    projectId: doc.project_id ? String(doc.project_id) : null,
    summary: String(doc.summary || ""),
    attendeesLabel: String(doc.attendees_label || ""),
    actionItems: asJsonArray(doc.action_items),
    stakeholderIds: asJsonArray(doc.stakeholder_ids),
    captureId: doc.capture_id ? String(doc.capture_id) : undefined,
    source: (doc.source as Engagement["source"]) || "minutes",
    createdAt: String(doc.creation || new Date().toISOString()),
  };
}

export function frappeToCommitment(doc: Record<string, unknown>): Commitment {
  return {
    id: String(doc.commitment_code || doc.name || ""),
    title: String(doc.title || ""),
    status: (doc.status as Commitment["status"]) || "open",
    ownerLabel: String(doc.owner_label || ""),
    dueOn: String(doc.due_on || ""),
    projectId: doc.project_id ? String(doc.project_id) : null,
    engagementId: doc.engagement_id ? String(doc.engagement_id) : null,
    stakeholderIds: asJsonArray(doc.stakeholder_ids),
    sourceActionItem: doc.source_action_item
      ? String(doc.source_action_item)
      : undefined,
    evidenceNote: doc.evidence_note ? String(doc.evidence_note) : undefined,
    createdAt: String(doc.creation || new Date().toISOString()),
  };
}

async function resourcePost(
  doctype: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
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
    return { ok: true, name: json.data?.name || String(body.name || "") };
  } catch {
    return { ok: true, name: String(body.name || "") };
  }
}

async function resourcePut(
  doctype: string,
  name: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
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
  return { ok: true, name };
}

const STAKEHOLDER_FIELDS = [
  "name",
  "stakeholder_code",
  "stakeholder_name",
  "kind",
  "status",
  "organisation",
  "place_id",
  "country_code",
  "influence",
  "interests",
  "tags",
  "email",
  "phone",
  "alternative_contact",
  "summary",
  "engagement_role",
  "preferred_channel",
  "related_stakeholder_ids",
  "project_ids",
  "last_engaged_on",
  "next_action",
  "owner_user_id",
  "tl_org_id",
  "customer",
];

const ENGAGEMENT_FIELDS = [
  "name",
  "engagement_code",
  "title",
  "kind",
  "status",
  "held_on",
  "ward",
  "place_label",
  "project_id",
  "summary",
  "attendees_label",
  "action_items",
  "stakeholder_ids",
  "capture_id",
  "source",
  "tl_org_id",
  "customer",
  "creation",
];

const COMMITMENT_FIELDS = [
  "name",
  "commitment_code",
  "title",
  "status",
  "owner_label",
  "due_on",
  "project_id",
  "engagement_id",
  "stakeholder_ids",
  "source_action_item",
  "evidence_note",
  "tl_org_id",
  "customer",
  "creation",
];

export async function listCloudSiRows(
  kind: SiKind,
  customer: string,
): Promise<
  | { ok: true; stakeholders?: Stakeholder[]; engagements?: Engagement[]; commitments?: Commitment[] }
  | { ok: false; error: string }
> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }

  const doctype = siDocType(kind);
  const fields =
    kind === "stakeholder"
      ? STAKEHOLDER_FIELDS
      : kind === "engagement"
        ? ENGAGEMENT_FIELDS
        : COMMITMENT_FIELDS;
  const filters = encodeURIComponent(
    JSON.stringify([["customer", "=", customer]]),
  );
  const fieldsEnc = encodeURIComponent(JSON.stringify(fields));
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(doctype)}?filters=${filters}&fields=${fieldsEnc}&limit_page_length=500`,
    { headers, cache: "no-store" },
  );
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  let data: Record<string, unknown>[] = [];
  try {
    const json = JSON.parse(text) as { data?: Record<string, unknown>[] };
    data = Array.isArray(json.data) ? json.data : [];
  } catch {
    return { ok: false, error: "Invalid Frappe list response" };
  }

  if (kind === "stakeholder") {
    return { ok: true, stakeholders: data.map(frappeToStakeholder) };
  }
  if (kind === "engagement") {
    return { ok: true, engagements: data.map(frappeToEngagement) };
  }
  return { ok: true, commitments: data.map(frappeToCommitment) };
}

async function resourceExists(
  doctype: string,
  name: string,
): Promise<boolean> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) return false;
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { headers, cache: "no-store" },
  );
  return res.ok;
}

export async function upsertCloudStakeholder(
  row: Stakeholder,
  customer: string,
  orgId?: string,
) {
  const doctype = "TL Stakeholder";
  const body = stakeholderToFrappeDoc(row, customer, orgId);
  if (await resourceExists(doctype, row.id)) {
    return resourcePut(doctype, row.id, body);
  }
  return resourcePost(doctype, body);
}

export async function upsertCloudEngagement(
  row: Engagement,
  customer: string,
  orgId?: string,
) {
  const doctype = "TL Engagement";
  const body = engagementToFrappeDoc(row, customer, orgId);
  if (await resourceExists(doctype, row.id)) {
    return resourcePut(doctype, row.id, body);
  }
  return resourcePost(doctype, body);
}

export async function upsertCloudCommitment(
  row: Commitment,
  customer: string,
  orgId?: string,
) {
  const doctype = "TL Commitment";
  const body = commitmentToFrappeDoc(row, customer, orgId);
  if (await resourceExists(doctype, row.id)) {
    return resourcePut(doctype, row.id, body);
  }
  return resourcePost(doctype, body);
}

export async function createCloudStakeholder(
  row: Stakeholder,
  customer: string,
  orgId?: string,
) {
  return resourcePost(
    "TL Stakeholder",
    stakeholderToFrappeDoc(row, customer, orgId),
  );
}

export async function createCloudEngagement(
  row: Engagement,
  customer: string,
  orgId?: string,
) {
  return resourcePost(
    "TL Engagement",
    engagementToFrappeDoc(row, customer, orgId),
  );
}

export async function createCloudCommitment(
  row: Commitment,
  customer: string,
  orgId?: string,
) {
  return resourcePost(
    "TL Commitment",
    commitmentToFrappeDoc(row, customer, orgId),
  );
}
