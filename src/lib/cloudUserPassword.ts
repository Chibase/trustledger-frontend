/**
 * Set a TrustLedger Cloud User password via API keys (Owner or Ops).
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import { mintReadablePassword } from "@/lib/tempPassword";

export async function setCloudUserPassword(input: {
  email: string;
  newPassword?: string;
}): Promise<
  | { ok: true; email: string; temporaryPassword: string }
  | { ok: false; error: string; status?: number }
> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "email required", status: 400 };
  }

  const password =
    (input.newPassword || "").trim().length >= 8
      ? input.newPassword!.trim()
      : mintReadablePassword();

  const pair = frappeKeyPair();
  const base = frappeBase();
  if (!pair || !base) {
    return {
      ok: false,
      error: "FRAPPE_API_KEY / SECRET / BASE_URL missing",
      status: 503,
    };
  }

  const headers = {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const exists = await fetch(
      `${base}/api/resource/User/${encodeURIComponent(email)}`,
      { headers, cache: "no-store" },
    );
    if (!exists.ok) {
      return {
        ok: false,
        error:
          "No TrustLedger Cloud login exists for that email yet. Provision the User first, or re-send a team invite for browser seats.",
        status: 404,
      };
    }

    const res = await fetch(
      `${base}/api/resource/User/${encodeURIComponent(email)}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ new_password: password }),
        cache: "no-store",
      },
    );
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        error: `Could not set password (${res.status}): ${text.slice(0, 280)}`,
        status: 502,
      };
    }

    return { ok: true, email, temporaryPassword: password };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Password update failed",
      status: 502,
    };
  }
}

/** Customer name owned by this Plan Owner email, if any. */
export async function findCustomerNameForOwnerEmail(
  ownerEmail: string,
): Promise<string | null> {
  const pair = frappeKeyPair();
  const base = frappeBase();
  if (!pair || !base) return null;
  const headers = {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    Accept: "application/json",
  };
  const email = ownerEmail.trim().toLowerCase();
  const filters = encodeURIComponent(
    JSON.stringify([["custom_owner_email", "=", email]]),
  );
  const res = await fetch(
    `${base}/api/resource/Customer?filters=${filters}&fields=${encodeURIComponent(JSON.stringify(["name"]))}&limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string }> };
  return json.data?.[0]?.name || null;
}

/** Whether target User belongs to this Customer (or is the Owner email). */
export async function userBelongsToCustomer(input: {
  targetEmail: string;
  customerName: string;
  ownerEmail: string;
}): Promise<boolean> {
  const target = input.targetEmail.trim().toLowerCase();
  const owner = input.ownerEmail.trim().toLowerCase();
  if (target === owner) return true;

  const pair = frappeKeyPair();
  const base = frappeBase();
  if (!pair || !base) return false;
  const headers = {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    Accept: "application/json",
  };
  const res = await fetch(
    `${base}/api/resource/User/${encodeURIComponent(target)}?fields=${encodeURIComponent(JSON.stringify(["name", "email", "custom_tl_customer"]))}`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as {
    data?: { email?: string; custom_tl_customer?: string };
  };
  const customer = (json.data?.custom_tl_customer || "").trim();
  return customer === input.customerName;
}
