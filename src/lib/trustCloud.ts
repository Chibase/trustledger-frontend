/**
 * TE-7 — CRUD for TL Trust Observation / Participation / Community Context.
 * Explicit fields only. Never maps SRM sentiment_label / sentiment_score.
 * TE-1 overlay keys are not Cloud columns.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import { rowsForCustomer } from "@/lib/tenantScope";
import { normalizeTrustCommunityContext } from "@/lib/trust/communityContext";
import { normalizeTrustObservation } from "@/lib/trust/observation";
import { normalizeTrustParticipation } from "@/lib/trust/participation";
import type {
  TrustCommunityContext,
  TrustLayerBucket,
  TrustObservation,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export type TrustCloudKind =
  | "observation"
  | "participation"
  | "community"
  | "bucket";

export function trustCloudDocType(
  kind: Exclude<TrustCloudKind, "bucket">,
): string {
  if (kind === "observation") return "TL Trust Observation";
  if (kind === "participation") return "TL Trust Participation";
  return "TL Trust Community Context";
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

function asCheck(value: boolean | undefined): 0 | 1 {
  return value === true ? 1 : 0;
}

function fromCheck(value: unknown): boolean | undefined {
  if (value === 1 || value === true || value === "1") return true;
  return undefined;
}

function trustDrivenToSelect(
  value: TrustParticipationRecord["trustDriven"],
): "yes" | "no" | "unknown" {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
}

function trustDrivenFromSelect(
  value: unknown,
): TrustParticipationRecord["trustDriven"] {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "yes" || raw === "true" || raw === "1") return true;
  if (raw === "no" || raw === "false" || raw === "0") return false;
  return "unknown";
}

export function observationToFrappeDoc(
  row: TrustObservation,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  return {
    observation_code: row.id,
    customer,
    observed_at: row.observedAt || null,
    dimension: row.dimension,
    signal: row.signal,
    signal_score:
      typeof row.signalScore === "number" ? row.signalScore : "",
    source: row.source,
    source_id: row.sourceId || "",
    project_id: row.projectId || "",
    community_place_id: row.communityPlaceId || "",
    stakeholder_id: row.stakeholderId || "",
    evidence_ids: toJsonField(row.evidenceIds),
    note: row.note || "",
    narrative_language: row.narrativeLanguage || "",
    translation_status: row.translationStatus || "",
    oral_source: asCheck(row.oralSource),
    tl_org_id: orgId || "",
  };
}

export function participationToFrappeDoc(
  row: TrustParticipationRecord,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  return {
    participation_code: row.id,
    customer,
    observed_at: row.observedAt || null,
    source: row.source,
    source_id: row.sourceId || "",
    project_id: row.projectId || "",
    stakeholder_id: row.stakeholderId || "",
    willingness_to_participate: row.willingnessToParticipate,
    willingness_to_contribute: row.willingnessToContribute,
    trust_driven: trustDrivenToSelect(row.trustDriven),
    note: row.note || "",
    motivation: row.motivation || "",
    presence_mode: row.presenceMode || "",
    attendance_does_not_equal_consent: asCheck(
      row.attendanceDoesNotEqualConsent,
    ),
    response_pattern: row.responsePattern || "",
    tl_org_id: orgId || "",
  };
}

export function communityToFrappeDoc(
  row: TrustCommunityContext,
  customer: string,
  orgId?: string,
): Record<string, unknown> {
  return {
    community_code: row.id,
    customer,
    updated_at: row.updatedAt || null,
    project_id: row.projectId || "",
    place_id: row.placeId || "",
    place_label: row.placeLabel || "",
    community_ref: row.communityRef || "",
    notes: row.notes || "",
    barriers: row.barriers || "",
    sensitivity_notes: row.sensitivityNotes || "",
    ward: row.ward || "",
    municipality: row.municipality || "",
    history_notes: row.historyNotes || "",
    power_structure_notes: row.powerStructureNotes || "",
    barrier_tags: toJsonField(row.barrierTags),
    working_language: row.workingLanguage || "",
    narrative_language: row.narrativeLanguage || "",
    translation_status: row.translationStatus || "",
    oral_source: asCheck(row.oralSource),
    tl_org_id: orgId || "",
  };
}

export function frappeToObservation(
  doc: Record<string, unknown>,
): TrustObservation | null {
  return normalizeTrustObservation({
    id: String(doc.observation_code || doc.name || ""),
    layer: "trust",
    observedAt: String(doc.observed_at || ""),
    dimension: String(doc.dimension || "") as TrustObservation["dimension"],
    signal: String(doc.signal || "unknown") as TrustObservation["signal"],
    signalScore:
      typeof doc.signal_score === "number"
        ? doc.signal_score
        : doc.signal_score
          ? Number(doc.signal_score) || null
          : null,
    source: String(doc.source || "derived") as TrustObservation["source"],
    sourceId: doc.source_id ? String(doc.source_id) : undefined,
    projectId: doc.project_id ? String(doc.project_id) : null,
    communityPlaceId: doc.community_place_id
      ? String(doc.community_place_id)
      : null,
    stakeholderId: doc.stakeholder_id ? String(doc.stakeholder_id) : undefined,
    evidenceIds: asJsonArray(doc.evidence_ids),
    note: doc.note ? String(doc.note) : undefined,
    narrativeLanguage: doc.narrative_language
      ? String(doc.narrative_language)
      : undefined,
    translationStatus: doc.translation_status
      ? (String(doc.translation_status) as TrustObservation["translationStatus"])
      : undefined,
    oralSource: fromCheck(doc.oral_source),
  });
}

export function frappeToParticipation(
  doc: Record<string, unknown>,
): TrustParticipationRecord | null {
  return normalizeTrustParticipation({
    id: String(doc.participation_code || doc.name || ""),
    layer: "trust",
    observedAt: String(doc.observed_at || ""),
    source: String(doc.source || "derived") as TrustParticipationRecord["source"],
    sourceId: doc.source_id ? String(doc.source_id) : undefined,
    projectId: doc.project_id ? String(doc.project_id) : null,
    stakeholderId: doc.stakeholder_id ? String(doc.stakeholder_id) : undefined,
    willingnessToParticipate: String(
      doc.willingness_to_participate || "unknown",
    ) as TrustParticipationRecord["willingnessToParticipate"],
    willingnessToContribute: String(
      doc.willingness_to_contribute || "unknown",
    ) as TrustParticipationRecord["willingnessToContribute"],
    trustDriven: trustDrivenFromSelect(doc.trust_driven),
    note: doc.note ? String(doc.note) : undefined,
    motivation: doc.motivation
      ? (String(doc.motivation) as TrustParticipationRecord["motivation"])
      : undefined,
    presenceMode: doc.presence_mode
      ? (String(doc.presence_mode) as TrustParticipationRecord["presenceMode"])
      : undefined,
    attendanceDoesNotEqualConsent: fromCheck(
      doc.attendance_does_not_equal_consent,
    ),
    responsePattern: doc.response_pattern
      ? (String(
          doc.response_pattern,
        ) as TrustParticipationRecord["responsePattern"])
      : undefined,
  });
}

export function frappeToCommunity(
  doc: Record<string, unknown>,
): TrustCommunityContext | null {
  return normalizeTrustCommunityContext({
    id: String(doc.community_code || doc.name || ""),
    layer: "trust",
    updatedAt: String(doc.updated_at || ""),
    projectId: doc.project_id ? String(doc.project_id) : null,
    placeId: doc.place_id ? String(doc.place_id) : undefined,
    placeLabel: doc.place_label ? String(doc.place_label) : undefined,
    communityRef: doc.community_ref ? String(doc.community_ref) : undefined,
    notes: doc.notes ? String(doc.notes) : undefined,
    barriers: doc.barriers ? String(doc.barriers) : undefined,
    sensitivityNotes: doc.sensitivity_notes
      ? String(doc.sensitivity_notes)
      : undefined,
    ward: doc.ward ? String(doc.ward) : undefined,
    municipality: doc.municipality ? String(doc.municipality) : undefined,
    historyNotes: doc.history_notes ? String(doc.history_notes) : undefined,
    powerStructureNotes: doc.power_structure_notes
      ? String(doc.power_structure_notes)
      : undefined,
    barrierTags: asJsonArray(doc.barrier_tags) as TrustCommunityContext["barrierTags"],
    workingLanguage: doc.working_language
      ? String(doc.working_language)
      : undefined,
    narrativeLanguage: doc.narrative_language
      ? String(doc.narrative_language)
      : undefined,
    translationStatus: doc.translation_status
      ? (String(
          doc.translation_status,
        ) as TrustCommunityContext["translationStatus"])
      : undefined,
    oralSource: fromCheck(doc.oral_source),
  });
}

const OBSERVATION_FIELDS = [
  "name",
  "observation_code",
  "observed_at",
  "dimension",
  "signal",
  "signal_score",
  "source",
  "source_id",
  "project_id",
  "community_place_id",
  "stakeholder_id",
  "evidence_ids",
  "note",
  "narrative_language",
  "translation_status",
  "oral_source",
  "tl_org_id",
  "customer",
];

const PARTICIPATION_FIELDS = [
  "name",
  "participation_code",
  "observed_at",
  "source",
  "source_id",
  "project_id",
  "stakeholder_id",
  "willingness_to_participate",
  "willingness_to_contribute",
  "trust_driven",
  "note",
  "motivation",
  "presence_mode",
  "attendance_does_not_equal_consent",
  "response_pattern",
  "tl_org_id",
  "customer",
];

const COMMUNITY_FIELDS = [
  "name",
  "community_code",
  "updated_at",
  "project_id",
  "place_id",
  "place_label",
  "community_ref",
  "notes",
  "barriers",
  "sensitivity_notes",
  "ward",
  "municipality",
  "history_notes",
  "power_structure_notes",
  "barrier_tags",
  "working_language",
  "narrative_language",
  "translation_status",
  "oral_source",
  "tl_org_id",
  "customer",
];

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

async function listDocs(
  doctype: string,
  fields: string[],
  customer: string,
): Promise<
  { ok: true; data: Record<string, unknown>[] } | { ok: false; error: string }
> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const filters = encodeURIComponent(
    JSON.stringify([["customer", "=", customer]]),
  );
  const fieldsEnc = encodeURIComponent(JSON.stringify(fields));
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(doctype)}?filters=${filters}&fields=${fieldsEnc}&limit_page_length=500`,
    { headers, cache: "no-store" },
  );
  if (res.status === 404) {
    return { ok: true, data: [] };
  }
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  try {
    const json = JSON.parse(text) as { data?: Record<string, unknown>[] };
    return { ok: true, data: Array.isArray(json.data) ? json.data : [] };
  } catch {
    return { ok: false, error: "Invalid Frappe list response" };
  }
}

export async function listCloudTrustBucket(
  customer: string,
): Promise<
  | {
      ok: true;
      observations: TrustObservation[];
      participation: TrustParticipationRecord[];
      community: TrustCommunityContext[];
    }
  | { ok: false; error: string }
> {
  const [obs, part, comm] = await Promise.all([
    listDocs("TL Trust Observation", OBSERVATION_FIELDS, customer),
    listDocs("TL Trust Participation", PARTICIPATION_FIELDS, customer),
    listDocs("TL Trust Community Context", COMMUNITY_FIELDS, customer),
  ]);
  if (!obs.ok) return obs;
  if (!part.ok) return part;
  if (!comm.ok) return comm;

  return {
    ok: true,
    observations: rowsForCustomer(obs.data, customer)
      .map(frappeToObservation)
      .filter((row): row is TrustObservation => Boolean(row?.id)),
    participation: rowsForCustomer(part.data, customer)
      .map(frappeToParticipation)
      .filter((row): row is TrustParticipationRecord => Boolean(row?.id)),
    community: rowsForCustomer(comm.data, customer)
      .map(frappeToCommunity)
      .filter((row): row is TrustCommunityContext => Boolean(row?.id)),
  };
}

export async function upsertCloudObservation(
  row: TrustObservation,
  customer: string,
  orgId?: string,
) {
  const doctype = "TL Trust Observation";
  const body = observationToFrappeDoc(row, customer, orgId);
  if (await resourceExists(doctype, row.id)) {
    return resourcePut(doctype, row.id, body);
  }
  return resourcePost(doctype, body);
}

export async function upsertCloudParticipation(
  row: TrustParticipationRecord,
  customer: string,
  orgId?: string,
) {
  const doctype = "TL Trust Participation";
  const body = participationToFrappeDoc(row, customer, orgId);
  if (await resourceExists(doctype, row.id)) {
    return resourcePut(doctype, row.id, body);
  }
  return resourcePost(doctype, body);
}

export async function upsertCloudCommunity(
  row: TrustCommunityContext,
  customer: string,
  orgId?: string,
) {
  const doctype = "TL Trust Community Context";
  const body = communityToFrappeDoc(row, customer, orgId);
  if (await resourceExists(doctype, row.id)) {
    return resourcePut(doctype, row.id, body);
  }
  return resourcePost(doctype, body);
}

export async function upsertCloudTrustBucket(
  bucket: Pick<
    TrustLayerBucket,
    "observations" | "participation" | "community"
  >,
  customer: string,
  orgId?: string,
): Promise<{
  ok: boolean;
  failed: number;
  results: Array<{ id: string; kind: string; ok: boolean; error?: string }>;
}> {
  const results: Array<{
    id: string;
    kind: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const row of bucket.observations || []) {
    const r = await upsertCloudObservation(row, customer, orgId);
    results.push({
      id: row.id,
      kind: "observation",
      ok: r.ok,
      error: r.ok ? undefined : r.error,
    });
  }
  for (const row of bucket.participation || []) {
    const r = await upsertCloudParticipation(row, customer, orgId);
    results.push({
      id: row.id,
      kind: "participation",
      ok: r.ok,
      error: r.ok ? undefined : r.error,
    });
  }
  for (const row of bucket.community || []) {
    const r = await upsertCloudCommunity(row, customer, orgId);
    results.push({
      id: row.id,
      kind: "community",
      ok: r.ok,
      error: r.ok ? undefined : r.error,
    });
  }

  const failed = results.filter((row) => !row.ok).length;
  return { ok: failed === 0, failed, results };
}
