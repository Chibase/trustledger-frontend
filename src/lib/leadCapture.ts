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

function frappeBase(): string {
  return (
    process.env.FRAPPE_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    API_BASE_URL
  ).replace(/\/$/, "");
}

export function frappeLeadConfigured(): boolean {
  return Boolean(
    process.env.FRAPPE_API_KEY && process.env.FRAPPE_API_SECRET,
  );
}

function leadBackendPreference(): "frappe" | "hubspot" | "auto" {
  const raw = (process.env.LEAD_BACKEND || "auto").trim().toLowerCase();
  if (raw === "frappe" || raw === "hubspot") return raw;
  return "auto";
}

/**
 * Create a CRM Lead on Frappe Cloud via Resource API.
 * Requires CRM (or ERPNext) Lead DocType + API key with Lead create rights.
 */
export async function submitFrappeLead(
  input: ProductLeadInput,
): Promise<Response> {
  const key = process.env.FRAPPE_API_KEY;
  const secret = process.env.FRAPPE_API_SECRET;
  if (!key || !secret) {
    throw new Error("Frappe API key/secret not configured");
  }

  const customMethod = process.env.FRAPPE_LEAD_METHOD?.trim();
  const source =
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
    return fetch(`${frappeBase()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `token ${key}:${secret}`,
      },
      body: JSON.stringify({
        email: input.email,
        name: leadName,
        company: input.company,
        message: input.message,
        source,
        page_uri: input.pageUri,
        page_name: input.pageName,
      }),
    });
  }

  // Default: Frappe CRM "CRM Lead" (not ERPNext "Lead")
  const doctype = (
    process.env.FRAPPE_LEAD_DOCTYPE ||
    "CRM Lead"
  ).trim();
  const encoded = encodeURIComponent(doctype);

  const first = firstNameFrom(leadName);
  const last = lastNameFrom(leadName);

  return fetch(`${frappeBase()}/api/resource/${encoded}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `token ${key}:${secret}`,
    },
    body: JSON.stringify({
      doctype,
      first_name: first.slice(0, 140),
      last_name: last?.slice(0, 140),
      lead_name: leadName.slice(0, 140),
      email: input.email,
      organization: input.company?.slice(0, 140) || undefined,
      company_name: input.company?.slice(0, 140) || undefined,
      source: "Website",
      status: "New",
      // Extra context for sales — field may be ignored if not on DocType
      description: [
        `Source: ${source}`,
        `Page: ${input.pageName} (${input.pageUri})`,
        input.message,
      ]
        .filter(Boolean)
        .join("\n"),
    }),
  });
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
      console.error("[lead] Frappe failed", res.status, detail.slice(0, 400));
      if (!tryHubspot) {
        return {
          ok: false,
          backend: "frappe",
          status: res.status,
          detail: detail.slice(0, 200),
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
