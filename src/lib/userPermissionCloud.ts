/**
 * SEC-1 — bind Plan Owner Cloud Users to their Customer (Desk User Permission).
 * Public copy says “organisation”, never the Cloud product name.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";

function authHeaders(): HeadersInit | null {
  const pair = frappeKeyPair();
  if (!pair) return null;
  return {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export type UserPermissionEnsureResult =
  | { ok: true; skipped?: boolean; name?: string }
  | { ok: false; error: string };

async function findExistingPermission(
  base: string,
  headers: HeadersInit,
  userEmail: string,
  customerName: string,
): Promise<string | null> {
  const filters = encodeURIComponent(
    JSON.stringify([
      ["user", "=", userEmail],
      ["allow", "=", "Customer"],
      ["for_value", "=", customerName],
    ]),
  );
  const fields = encodeURIComponent(JSON.stringify(["name"]));
  const res = await fetch(
    `${base}/api/resource/User%20Permission?filters=${filters}&fields=${fields}&limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ name?: string }> };
  return json.data?.[0]?.name || null;
}

export async function hasCustomerUserPermission(
  userEmail: string,
  customerName: string,
): Promise<boolean> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) return false;
  const name = await findExistingPermission(
    base,
    headers,
    userEmail.trim(),
    customerName.trim(),
  );
  return Boolean(name);
}

/**
 * Restrict the Cloud User so Desk + sid calls only see this Customer.
 * Idempotent. API-key BFF still uses a site key — tenant bind is in tenantScope.
 */
export async function ensureCustomerUserPermission(
  userEmail: string,
  customerName: string,
): Promise<UserPermissionEnsureResult> {
  const email = userEmail.trim();
  const customer = customerName.trim();
  if (!email || !customer) {
    return { ok: false, error: "user and organisation required" };
  }

  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return { ok: false, error: "Cloud API not configured" };
  }

  const existing = await findExistingPermission(base, headers, email, customer);
  if (existing) {
    return { ok: true, skipped: true, name: existing };
  }

  const res = await fetch(`${base}/api/resource/User%20Permission`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user: email,
      allow: "Customer",
      for_value: customer,
      apply_to_all_doctypes: 1,
    }),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    return {
      ok: false,
      error: `${res.status}: ${text.slice(0, 280)}`,
    };
  }
  let name = "";
  try {
    const json = JSON.parse(text) as { data?: { name?: string } };
    name = json.data?.name || "";
  } catch {
    /* ignore */
  }
  return { ok: true, name: name || undefined };
}

export async function probeUserPermissionApi(): Promise<{
  reachable: boolean;
  status?: number;
}> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) return { reachable: false };
  try {
    const res = await fetch(
      `${base}/api/resource/User%20Permission?limit_page_length=1`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(6000) },
    );
    return { reachable: res.ok || res.status === 403, status: res.status };
  } catch {
    return { reachable: false };
  }
}
