/**
 * SI-SEP — CRUD for TL Engagement Plan via Frappe resource API.
 * Indexed columns + JSON payload / execution overlay. Customer required.
 * Blank datetimes stay blank — never fill in now. Overlay omitted on PUT
 * unless the caller sent it.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import {
  fromFrappeDatetime,
  toFrappeDatetime,
} from "@/lib/productCloud";
import { rowsForCustomer } from "@/lib/tenantScope";
import type { EngagementPlan } from "@/types/engagementPlan";
import type { SepExecutionOverlay } from "@/types/sepExecution";

export const SEP_CLOUD_DOCTYPE = "TL Engagement Plan";

export type SepCloudUpsertOptions = {
  overlay?: SepExecutionOverlay | null;
  /** When false/undefined, PUT omits execution_json so a partial write cannot wipe it. */
  includeExecution?: boolean;
  orgId?: string;
};

export type SepWriteBody = {
  overlay?: SepExecutionOverlay | null;
  includeExecution?: boolean;
};

/** Overlay JSON is written only when the client sent a real overlay object. */
export function sepShouldWriteExecution(body: SepWriteBody): boolean {
  const overlay = body.overlay;
  if (!overlay || typeof overlay !== "object") return false;
  if (!overlay.planId) return false;
  return body.includeExecution !== false;
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

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function asPlanStatus(value: unknown): EngagementPlan["status"] {
  const raw = String(value || "").trim();
  if (
    raw === "draft" ||
    raw === "suggested" ||
    raw === "saved" ||
    raw === "applied"
  ) {
    return raw;
  }
  return "draft";
}

function asSourceKind(value: unknown): EngagementPlan["sourceKind"] {
  const raw = String(value || "").trim();
  if (
    raw === "rfp" ||
    raw === "tender" ||
    raw === "briefing" ||
    raw === "paste" ||
    raw === "manual"
  ) {
    return raw;
  }
  return "manual";
}

function asSectorId(value: unknown): EngagementPlan["sectorId"] {
  const raw = String(value || "").trim();
  const allowed: EngagementPlan["sectorId"][] = [
    "infrastructure",
    "housing",
    "mining",
    "energy",
    "water",
    "education",
    "health",
    "agriculture",
    "municipal",
    "conservation",
    "logistics",
    "generic",
  ];
  return allowed.includes(raw as EngagementPlan["sectorId"])
    ? (raw as EngagementPlan["sectorId"])
    : "generic";
}

function asProgrammeKind(
  value: unknown,
): EngagementPlan["programmeKind"] | undefined {
  const raw = String(value || "").trim();
  if (raw === "standard" || raw === "relocation") return raw;
  return undefined;
}

function emptyPlan(id: string): EngagementPlan {
  return {
    id,
    title: "",
    status: "draft",
    sourceKind: "manual",
    sectorId: "generic",
    projectId: null,
    projectNameHint: "",
    placeHint: "",
    clientFunderHint: "",
    timelineHint: "",
    createdAt: "",
    updatedAt: "",
    sourceExcerpt: "",
    purposeStatement: "",
    phases: [],
    stakeholderClasses: [],
    activities: [],
    commitments: [],
    instruments: [],
    grievancePath: "",
    assumptions: [],
    documentSections: [],
  };
}

/** Strip secrets if a client ever stuffed them onto the plan object. */
export function sanitizePlanForCloud(plan: EngagementPlan): EngagementPlan {
  const next = { ...plan };
  const bag = next as unknown as Record<string, unknown>;
  delete bag.apiKey;
  delete bag.geminiApiKey;
  delete bag.GEMINI_API_KEY;
  return next;
}

export function overlayToJsonField(
  overlay: SepExecutionOverlay | null | undefined,
): string {
  if (!overlay) return "";
  return JSON.stringify(overlay);
}

export function frappeToSepOverlay(
  value: unknown,
): SepExecutionOverlay | null {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;
  if (parsed.version !== 1 || !parsed.planId) return null;
  return parsed as unknown as SepExecutionOverlay;
}

export function engagementPlanToFrappeDoc(
  plan: EngagementPlan,
  customer: string,
  options?: SepCloudUpsertOptions,
): Record<string, unknown> {
  const safe = sanitizePlanForCloud(plan);
  const orgId = options?.orgId;
  const doc: Record<string, unknown> = {
    plan_code: safe.id,
    title: safe.title,
    customer,
    status: safe.status,
    source_kind: safe.sourceKind,
    sector_id: safe.sectorId,
    project_id: safe.projectId || "",
    place_hint: safe.placeHint || "",
    client_funder_hint: safe.clientFunderHint || "",
    payload: JSON.stringify(safe),
    tl_org_id: orgId || "",
  };
  const programme = safe.programmeKind;
  if (programme) doc.programme_kind = programme;

  const created = toFrappeDatetime(safe.createdAt);
  if (created) doc.created_at = created;
  const updated = toFrappeDatetime(safe.updatedAt);
  if (updated) doc.updated_at = updated;

  if (options?.includeExecution) {
    doc.execution_json = overlayToJsonField(options.overlay || null);
  }

  return doc;
}

export function frappeToEngagementPlan(
  doc: Record<string, unknown>,
): EngagementPlan {
  const id = String(doc.plan_code || doc.name || "");
  const payload = parseJsonObject(doc.payload) as Partial<EngagementPlan> | null;
  const base = emptyPlan(id);
  const fromPayload = payload
    ? ({ ...base, ...payload, id: payload.id || id } as EngagementPlan)
    : base;

  const createdAt =
    fromFrappeDatetime(doc.created_at) ??
    (fromPayload.createdAt ? String(fromPayload.createdAt) : "");
  const updatedAt =
    fromFrappeDatetime(doc.updated_at) ??
    (fromPayload.updatedAt ? String(fromPayload.updatedAt) : "");

  return {
    ...fromPayload,
    id,
    title: String(doc.title || fromPayload.title || ""),
    status: asPlanStatus(doc.status || fromPayload.status),
    sourceKind: asSourceKind(doc.source_kind || fromPayload.sourceKind),
    sectorId: asSectorId(doc.sector_id || fromPayload.sectorId),
    programmeKind:
      asProgrammeKind(doc.programme_kind) ?? fromPayload.programmeKind,
    projectId: doc.project_id
      ? String(doc.project_id)
      : fromPayload.projectId ?? null,
    placeHint: String(doc.place_hint || fromPayload.placeHint || ""),
    clientFunderHint: String(
      doc.client_funder_hint || fromPayload.clientFunderHint || "",
    ),
    createdAt,
    updatedAt,
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
    return { ok: true, name: json.data?.name || String(body.plan_code || "") };
  } catch {
    return { ok: true, name: String(body.plan_code || "") };
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

async function resourceDelete(
  doctype: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { method: "DELETE", headers, cache: "no-store" },
  );
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  return { ok: true };
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

const SEP_LIST_FIELDS = [
  "name",
  "plan_code",
  "title",
  "customer",
  "status",
  "source_kind",
  "sector_id",
  "programme_kind",
  "project_id",
  "place_hint",
  "client_funder_hint",
  "created_at",
  "updated_at",
  "payload",
  "execution_json",
  "tl_org_id",
];

export type SepCloudListResult =
  | {
      ok: true;
      plans: EngagementPlan[];
      overlays: Record<string, SepExecutionOverlay>;
    }
  | { ok: false; error: string };

export async function listCloudEngagementPlans(
  customer: string,
): Promise<SepCloudListResult> {
  const trimmed = customer.trim();
  if (!trimmed) {
    return { ok: false, error: "customer required" };
  }
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }

  const filters = encodeURIComponent(
    JSON.stringify([["customer", "=", trimmed]]),
  );
  const fieldsEnc = encodeURIComponent(JSON.stringify(SEP_LIST_FIELDS));
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(SEP_CLOUD_DOCTYPE)}?filters=${filters}&fields=${fieldsEnc}&limit_page_length=500`,
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

  const scoped = rowsForCustomer(data, trimmed);
  const overlays: Record<string, SepExecutionOverlay> = {};
  const plans = scoped.map((doc) => {
    const plan = frappeToEngagementPlan(doc);
    const overlay = frappeToSepOverlay(doc.execution_json);
    if (overlay) overlays[plan.id] = overlay;
    return plan;
  });
  return { ok: true, plans, overlays };
}

export async function getCloudEngagementPlan(
  id: string,
  customer: string,
): Promise<
  | {
      ok: true;
      plan: EngagementPlan | null;
      overlay: SepExecutionOverlay | null;
    }
  | { ok: false; error: string }
> {
  const trimmed = customer.trim();
  const code = id.trim();
  if (!trimmed) return { ok: false, error: "customer required" };
  if (!code) return { ok: false, error: "plan id required" };
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const res = await fetch(
    `${base}/api/resource/${encodeURIComponent(SEP_CLOUD_DOCTYPE)}/${encodeURIComponent(code)}`,
    { headers, cache: "no-store" },
  );
  if (res.status === 404) {
    return { ok: true, plan: null, overlay: null };
  }
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: `${res.status}: ${text.slice(0, 280)}` };
  }
  let doc: Record<string, unknown> = {};
  try {
    const json = JSON.parse(text) as { data?: Record<string, unknown> };
    doc = json.data || {};
  } catch {
    return { ok: false, error: "Invalid Frappe get response" };
  }
  const scoped = rowsForCustomer([doc], trimmed);
  if (!scoped.length) {
    return { ok: true, plan: null, overlay: null };
  }
  const row = scoped[0];
  return {
    ok: true,
    plan: frappeToEngagementPlan(row),
    overlay: frappeToSepOverlay(row.execution_json),
  };
}

export async function upsertCloudEngagementPlan(
  plan: EngagementPlan,
  customer: string,
  options?: SepCloudUpsertOptions,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const trimmed = customer.trim();
  if (!trimmed) return { ok: false, error: "customer required" };
  if (!plan.id?.trim() || !plan.title?.trim()) {
    return { ok: false, error: "plan.id and title required" };
  }
  const body = engagementPlanToFrappeDoc(plan, trimmed, options);
  if (await resourceExists(SEP_CLOUD_DOCTYPE, plan.id)) {
    return resourcePut(SEP_CLOUD_DOCTYPE, plan.id, body);
  }
  return resourcePost(SEP_CLOUD_DOCTYPE, body);
}

export async function deleteCloudEngagementPlan(
  id: string,
  customer: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = customer.trim();
  if (!trimmed) return { ok: false, error: "customer required" };
  const got = await getCloudEngagementPlan(id, trimmed);
  if (!got.ok) return got;
  if (!got.plan) return { ok: true };
  return resourceDelete(SEP_CLOUD_DOCTYPE, id);
}

export async function createCloudEngagementPlan(
  plan: EngagementPlan,
  customer: string,
  options?: SepCloudUpsertOptions,
) {
  return upsertCloudEngagementPlan(plan, customer, options);
}
