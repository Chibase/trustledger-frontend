import { API_BASE_URL } from "@/config/api";
import {
  hubspotConfigured,
  submitHubSpotLead,
  type HubSpotLeadInput,
} from "@/lib/hubspot";

export type ProductLeadInput = HubSpotLeadInput & {
  /** Short source tag e.g. assessment | demo_entry | support_ticket */
  sourceTag?: string;
  /** Shown on CRM Lead as Job Title — scannable in list views */
  jobTitle?: string;
  /** 1–5 experience rating when kind is product feedback */
  rating?: number;
  /**
   * Override CRM Lead Source name for this submission.
   * Must already exist in Desk → CRM Lead Source.
   */
  crmSource?: string;
  /** Exact visitor words (stored distinctly for executive quote banks) */
  userQuote?: string;
  /** Industry / sector */
  industry?: string;
  /** Stakeholder / demo role for influence classification */
  role?: string;
  /** Attribution string e.g. source/medium/campaign */
  utm?: string;
};

export function frappeBase(): string {
  return (
    process.env.FRAPPE_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    API_BASE_URL
  ).replace(/\/$/, "");
}

/** Trim + strip accidental quotes/whitespace/invisible chars from Vercel paste. */
export function cleanSecret(raw: string | undefined): string {
  return (raw || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "");
}

export function frappeKeyPair(): { key: string; secret: string } | null {
  const key = cleanSecret(process.env.FRAPPE_API_KEY);
  const secret = cleanSecret(process.env.FRAPPE_API_SECRET);
  if (!key || !secret) return null;
  return { key, secret };
}

function frappeAuthHeaders(
  key: string,
  secret: string,
  mode: "token" | "basic" = "token",
): HeadersInit {
  if (mode === "basic") {
    const encoded = Buffer.from(`${key}:${secret}`).toString("base64");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${encoded}`,
    };
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `token ${key}:${secret}`,
  };
}

export function frappeLeadConfigured(): boolean {
  return Boolean(frappeKeyPair());
}

function leadBackendPreference(): "frappe" | "hubspot" | "auto" {
  const raw = (process.env.LEAD_BACKEND || "auto").trim().toLowerCase();
  if (raw === "frappe" || raw === "hubspot") return raw;
  return "auto";
}

function firstNameFrom(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || fullName;
}

function lastNameFrom(fullName: string): string | undefined {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  return parts.slice(1).join(" ");
}

/** Server-side auth probe — never returns key/secret values. */
export async function verifyFrappeApiAuth(): Promise<{
  configured: boolean;
  base: string;
  keyLength: number;
  secretLength: number;
  ok: boolean;
  user?: string;
  status?: number;
  mode?: "token" | "basic";
  detail?: string;
}> {
  const pair = frappeKeyPair();
  const base = frappeBase();
  if (!pair) {
    return {
      configured: false,
      base,
      keyLength: 0,
      secretLength: 0,
      ok: false,
      detail: "FRAPPE_API_KEY / FRAPPE_API_SECRET missing on this deployment",
    };
  }

  async function probe(mode: "token" | "basic") {
    const res = await fetch(
      `${base}/api/method/frappe.auth.get_logged_user`,
      {
        method: "GET",
        headers: frappeAuthHeaders(pair!.key, pair!.secret, mode),
        cache: "no-store",
      },
    );
    const text = await res.text();
    let user: string | undefined;
    try {
      const json = JSON.parse(text) as { message?: string };
      user = typeof json.message === "string" ? json.message : undefined;
    } catch {
      /* ignore */
    }
    return {
      ok: res.ok && Boolean(user) && user !== "Guest",
      user: user && user !== "Guest" ? user : undefined,
      status: res.status,
      detail: res.ok ? undefined : text.slice(0, 300),
      mode,
    };
  }

  try {
    const tokenProbe = await probe("token");
    if (tokenProbe.ok) {
      return {
        configured: true,
        base,
        keyLength: pair.key.length,
        secretLength: pair.secret.length,
        ...tokenProbe,
      };
    }
    const basicProbe = await probe("basic");
    return {
      configured: true,
      base,
      keyLength: pair.key.length,
      secretLength: pair.secret.length,
      ...(basicProbe.ok ? basicProbe : tokenProbe),
    };
  } catch (err) {
    return {
      configured: true,
      base,
      keyLength: pair.key.length,
      secretLength: pair.secret.length,
      ok: false,
      detail: err instanceof Error ? err.message : "Network error",
    };
  }
}

/** Map website sourceTag → Desk CRM Lead Source name (must exist). */
function resolveCrmSource(
  sourceTag: string,
  explicit?: string,
): string | undefined {
  if (explicit?.trim()) return explicit.trim();
  const envKey = `FRAPPE_LEAD_SOURCE_${sourceTag
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;
  const perTag = process.env[envKey]?.trim();
  if (perTag) return perTag;
  // Sensible defaults — create these exact names in Desk (see docs/CRM_VIEWS.md)
  const defaults: Record<string, string> = {
    product_feedback: "Product Feedback",
    contact: "Website Contact",
    demo_entry: "Website Demo",
    demo_soft_gate: "Website Demo",
    assessment: "Website Assessment",
    paystack_payment: "Paystack Payment",
    eft_payment: "EFT Payment",
    quote_request: "Quote Request",
    support_ticket: "Support Ticket",
  };
  return defaults[sourceTag] || process.env.FRAPPE_LEAD_SOURCE?.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLeadCommentHtml(input: ProductLeadInput, sourceTag: string): string {
  const rating =
    typeof input.rating === "number" &&
    input.rating >= 1 &&
    input.rating <= 5
      ? Math.round(input.rating)
      : undefined;
  const relevance =
    rating === undefined
      ? "Review note for sales relevance"
      : rating <= 2
        ? "High attention — weak experience"
        : rating === 3
          ? "Mixed — triage for product gaps"
          : "Positive — candidate quote / case study";

  const quote = (input.userQuote || "").trim();
  const industry = (input.industry || "").trim();
  const role = (input.role || "").trim();
  const utm = (input.utm || "").trim();

  return [
    `<p><b>TrustLedger intake</b> · ${escapeHtml(sourceTag)} · ${escapeHtml(input.pageName || "")}</p>`,
    rating !== undefined
      ? `<p><b>Rating:</b> ${rating}/5 &nbsp;|&nbsp; <b>Relevance:</b> ${relevance}</p>`
      : `<p><b>Relevance:</b> ${relevance}</p>`,
    input.jobTitle
      ? `<p><b>List label:</b> ${escapeHtml(input.jobTitle)}</p>`
      : "",
    industry ? `<p><b>Sector:</b> ${escapeHtml(industry)}</p>` : "",
    role ? `<p><b>Demo role:</b> ${escapeHtml(role)}</p>` : "",
    utm ? `<p><b>UTM:</b> ${escapeHtml(utm)}</p>` : "",
    input.company
      ? `<p><b>Organization:</b> ${escapeHtml(input.company)}</p>`
      : "",
    `<p><b>Page:</b> ${escapeHtml(input.pageUri || "")}</p>`,
    quote
      ? `<p><b>Comment:</b> ${escapeHtml(quote).replace(/\n/g, "<br/>")}</p>`
      : "",
    `<p><b>User view:</b></p><p>${escapeHtml(input.message || "").replace(/\n/g, "<br/>")}</p>`,
    `<p style="font-size:11px;opacity:.7">TL_META kind=${escapeHtml(sourceTag)}${rating !== undefined ? ` rating=${rating}` : ""}${industry ? ` sector=${escapeHtml(industry)}` : ""}${role ? ` role=${escapeHtml(role)}` : ""}${utm ? ` utm=${escapeHtml(utm)}` : ""}</p>`,
  ]
    .filter(Boolean)
    .join("");
}

/**
 * Create a Frappe CRM "CRM Lead" via Resource API.
 * Job Title + Source make list views filterable; full user views go on Comment.
 */
export async function submitFrappeLead(
  input: ProductLeadInput,
): Promise<Response> {
  const pair = frappeKeyPair();
  if (!pair) {
    throw new Error("Frappe API key/secret not configured");
  }
  const { key, secret } = pair;

  async function authedFetch(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    const tokenRes = await fetch(url, {
      ...init,
      headers: {
        ...frappeAuthHeaders(key, secret, "token"),
        ...(init.headers || {}),
      },
    });
    if (tokenRes.status !== 401 && tokenRes.status !== 403) {
      return tokenRes;
    }
    // Retry once with Basic auth (some proxies mishandle token header)
    return fetch(url, {
      ...init,
      headers: {
        ...frappeAuthHeaders(key, secret, "basic"),
        ...(init.headers || {}),
      },
    });
  }

  const customMethod = process.env.FRAPPE_LEAD_METHOD?.trim();
  const sourceTag =
    input.sourceTag ||
    input.pageName ||
    "Website";

  const leadName =
    input.name?.trim() ||
    input.email.split("@")[0] ||
    "Website lead";

  if (customMethod) {
    const path = customMethod.startsWith("/")
      ? customMethod
      : `/api/method/${customMethod}`;
    return authedFetch(`${frappeBase()}${path}`, {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        name: leadName,
        company: input.company,
        message: input.message,
        source: sourceTag,
        page_uri: input.pageUri,
        page_name: input.pageName,
        job_title: input.jobTitle,
        rating: input.rating,
      }),
    });
  }

  const doctype = (process.env.FRAPPE_LEAD_DOCTYPE || "CRM Lead").trim();
  const encoded = encodeURIComponent(doctype);
  const status = (process.env.FRAPPE_LEAD_STATUS || "New").trim();
  const leadSource = resolveCrmSource(sourceTag, input.crmSource);

  const first = firstNameFrom(leadName);
  const last = lastNameFrom(leadName);

  const body: Record<string, unknown> = {
    doctype,
    first_name: first.slice(0, 140),
    email: input.email,
    status,
  };

  if (last) body.last_name = last.slice(0, 140);
  if (input.company?.trim()) {
    body.organization = input.company.trim().slice(0, 140);
  }
  if (input.jobTitle?.trim()) {
    body.job_title = input.jobTitle.trim().slice(0, 140);
  }
  if (leadSource) {
    body.source = leadSource;
  }

  let res = await authedFetch(`${frappeBase()}/api/resource/${encoded}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  // If CRM Lead Source name is missing in Desk, retry without source so intake still lands
  if (!res.ok && leadSource && body.source) {
    const detail = await res.clone().text().catch(() => "");
    if (/source|Link|CRM Lead Source/i.test(detail)) {
      console.warn(
        "[lead] CRM Lead Source missing; retrying without source:",
        leadSource,
      );
      delete body.source;
      res = await authedFetch(`${frappeBase()}/api/resource/${encoded}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    }
  }

  if (!res.ok) return res;

  // Attach intake notes as a Comment (CRM Lead has no description field)
  try {
    const payload = (await res.clone().json()) as {
      data?: { name?: string };
    };
    const docname = payload.data?.name;
    if (docname && input.message?.trim()) {
      await authedFetch(`${frappeBase()}/api/resource/Comment`, {
        method: "POST",
        body: JSON.stringify({
          doctype: "Comment",
          comment_type: "Comment",
          reference_doctype: doctype,
          reference_name: docname,
          content: buildLeadCommentHtml(input, sourceTag),
        }),
      });
    }
  } catch (err) {
    console.error("[lead] Frappe comment attach failed", err);
  }

  return res;
}

export type LeadSubmitResult = {
  ok: boolean;
  backend: "frappe" | "hubspot" | "none";
  status?: number;
  detail?: string;
};

/**
 * Prefer Frappe Cloud when API keys exist; otherwise HubSpot.
 * LEAD_BACKEND=frappe|hubspot|auto overrides preference.
 */
export async function submitProductLead(
  input: ProductLeadInput,
): Promise<LeadSubmitResult> {
  const pref = leadBackendPreference();
  const tryFrappe =
    (pref === "frappe" || pref === "auto") && frappeLeadConfigured();
  const tryHubspot =
    (pref === "hubspot" || pref === "auto") && hubspotConfigured();

  if (tryFrappe) {
    try {
      const res = await submitFrappeLead(input);
      if (res.ok) {
        return { ok: true, backend: "frappe", status: res.status };
      }
      const detail = await res.text().catch(() => "");
      console.error("[lead] Frappe failed", res.status, detail.slice(0, 800));
      if (!tryHubspot) {
        return {
          ok: false,
          backend: "frappe",
          status: res.status,
          detail: detail.slice(0, 400),
        };
      }
    } catch (err) {
      console.error("[lead] Frappe error", err);
      if (!tryHubspot) {
        return {
          ok: false,
          backend: "frappe",
          detail: err instanceof Error ? err.message : "Frappe error",
        };
      }
    }
  }

  if (tryHubspot) {
    try {
      const res = await submitHubSpotLead(input);
      if (res.ok) {
        return { ok: true, backend: "hubspot", status: res.status };
      }
      const detail = await res.text().catch(() => "");
      console.error("[lead] HubSpot failed", res.status, detail.slice(0, 400));
      return {
        ok: false,
        backend: "hubspot",
        status: res.status,
        detail: detail.slice(0, 200),
      };
    } catch (err) {
      console.error("[lead] HubSpot error", err);
      return {
        ok: false,
        backend: "hubspot",
        detail: err instanceof Error ? err.message : "HubSpot error",
      };
    }
  }

  return { ok: false, backend: "none", detail: "No lead backend configured" };
}

export function leadCaptureConfigured(): boolean {
  return frappeLeadConfigured() || hubspotConfigured();
}
