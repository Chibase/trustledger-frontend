/**
 * OD-4 — Customer entitlement on Frappe Cloud (trial / active / past_due / cancelled).
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import { toFrappeDatetime } from "@/lib/productCloud";
import type { PlanId } from "@/config/plans";

export type EntitlementStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled";

export type DueTrialCustomer = {
  name: string;
  ownerEmail: string;
  planId: PlanId | null;
  authorizationCode: string;
  amountCents: number;
  billAt: string;
  organization: string;
};

function authHeaders(): HeadersInit | null {
  const pair = frappeKeyPair();
  if (!pair) return null;
  return {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function entitlementAllowsLiveAccess(status: EntitlementStatus | string | null | undefined): boolean {
  if (!status) return true; // unknown — do not block operators / legacy
  return status === "trial" || status === "active";
}

export async function getCustomerEntitlementByOwnerEmail(
  ownerEmail: string,
): Promise<{
  customerName: string | null;
  status: EntitlementStatus | null;
} | null> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) return null;

  const email = ownerEmail.trim().toLowerCase();
  const filters = encodeURIComponent(
    JSON.stringify([["custom_owner_email", "=", email]]),
  );
  const fields = encodeURIComponent(
    JSON.stringify(["name", "custom_entitlement_status"]),
  );
  const res = await fetch(
    `${base}/api/resource/Customer?filters=${filters}&fields=${fields}&limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: Array<{ name?: string; custom_entitlement_status?: string }>;
  };
  const row = json.data?.[0];
  if (!row?.name) return { customerName: null, status: null };
  return {
    customerName: row.name,
    status: (row.custom_entitlement_status as EntitlementStatus) || null,
  };
}

export async function setCustomerEntitlement(
  customerName: string,
  status: EntitlementStatus,
): Promise<{ ok: boolean; error?: string }> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Frappe API not configured" };
  }
  const res = await fetch(
    `${base}/api/resource/Customer/${encodeURIComponent(customerName)}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ custom_entitlement_status: status }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `${res.status}: ${text.slice(0, 200)}` };
  }
  return { ok: true };
}

/** Trial Customers whose bill_at is due and still have an authorization code. */
export async function listDueTrialCustomers(now = new Date()): Promise<DueTrialCustomer[]> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) return [];

  const nowStr = toFrappeDatetime(now) || "";
  const filters = encodeURIComponent(
    JSON.stringify([
      ["custom_entitlement_status", "=", "trial"],
      ["custom_bill_at", "<=", nowStr],
      ["custom_authorization_code", "!=", ""],
    ]),
  );
  const fields = encodeURIComponent(
    JSON.stringify([
      "name",
      "customer_name",
      "custom_owner_email",
      "custom_plan_code",
      "custom_authorization_code",
      "custom_plan_amount_cents",
      "custom_bill_at",
    ]),
  );
  const res = await fetch(
    `${base}/api/resource/Customer?filters=${filters}&fields=${fields}&limit_page_length=50`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: Array<{
      name?: string;
      customer_name?: string;
      custom_owner_email?: string;
      custom_plan_code?: string;
      custom_authorization_code?: string;
      custom_plan_amount_cents?: number;
      custom_bill_at?: string;
    }>;
  };

  return (json.data || [])
    .filter((row) => row.custom_owner_email && row.custom_authorization_code)
    .map((row) => ({
      name: row.name || row.customer_name || "",
      organization: row.customer_name || row.name || "",
      ownerEmail: (row.custom_owner_email || "").toLowerCase(),
      planId: (row.custom_plan_code as PlanId) || null,
      authorizationCode: row.custom_authorization_code || "",
      amountCents: Number(row.custom_plan_amount_cents) || 0,
      billAt: row.custom_bill_at || "",
    }))
    .filter((row) => row.name && row.amountCents > 0);
}
