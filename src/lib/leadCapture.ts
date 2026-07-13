import { API_BASE_URL } from "@/config/api";
import {
  hubspotConfigured,
  submitHubSpotLead,
  type HubSpotLeadInput,
} from "@/lib/hubspot";

export type ProductLeadInput = HubSpotLeadInput & {
  /** Short source tag e.g. assessment | demo_entry | support_ticket */
  sourceTag?: string;
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
        headers: frappeAuthHeaders(pair.key, pair.secret, mode),
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

/**
 * Create a Frappe CRM "CRM Lead" via Resource API.
 * Payload is kept minimal — Link fields (source) are optional and only set
 * when FRAPPE_LEAD_SOURCE exists as a CRM Lead Source name.
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
      }),
    });
  }

  const doctype = (process.env.FRAPPE_LEAD_DOCTYPE || "CRM Lead").trim();
  const encoded = encodeURIComponent(doctype);
  const status = (process.env.FRAPPE_LEAD_STATUS || "New").trim();
  const leadSource = process.env.FRAPPE_LEAD_SOURCE?.trim();

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
  if (leadSource) {
    body.source = leadSource;
  }

  const res = await authedFetch(`${frappeBase()}/api/resource/${encoded}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

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
          content: [
            `<p><b>${sourceTag}</b> · ${input.pageName}</p>`,
            `<p>${input.pageUri}</p>`,
            `<p>${input.message.replace(/</g, "&lt;")}</p>`,
          ].join(""),
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
