/**
 * SEC-1 — A≠B tenancy smoke for Ops.
 * Confirms Owner Cloud Users are bound to their organisation permission
 * and not bound to a peer organisation.
 */

import {
  cleanSecret,
  frappeBase,
  frappeKeyPair,
} from "@/lib/leadCapture";
import {
  ensureCustomerUserPermission,
  hasCustomerUserPermission,
} from "@/lib/userPermissionCloud";

function authHeaders(): HeadersInit | null {
  const pair = frappeKeyPair();
  if (!pair) return null;
  return {
    Authorization: `token ${cleanSecret(pair.key)}:${cleanSecret(pair.secret)}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export type TenancySmokeResult = {
  ok: boolean;
  userPermissionApi: boolean;
  ownersChecked: number;
  bound: number;
  unbound: string[];
  foreignBinds: string[];
  peerCustomers: boolean;
  detail: string;
};

type CustomerRow = {
  name?: string;
  custom_owner_email?: string;
};

async function listOwnerCustomers(
  base: string,
  headers: HeadersInit,
): Promise<CustomerRow[]> {
  const filters = encodeURIComponent(
    JSON.stringify([["custom_owner_email", "!=", ""]]),
  );
  const fields = encodeURIComponent(
    JSON.stringify(["name", "custom_owner_email"]),
  );
  const res = await fetch(
    `${base}/api/resource/Customer?filters=${filters}&fields=${fields}&limit_page_length=20`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: CustomerRow[] };
  return Array.isArray(json.data) ? json.data : [];
}

function emptyFail(detail: string): TenancySmokeResult {
  return {
    ok: false,
    userPermissionApi: false,
    ownersChecked: 0,
    bound: 0,
    unbound: [],
    foreignBinds: [],
    peerCustomers: false,
    detail,
  };
}

export async function runTenancyAbSmoke(opts?: {
  applyMissing?: boolean;
}): Promise<TenancySmokeResult> {
  const base = frappeBase();
  const headers = authHeaders();
  if (!base || !headers) {
    return emptyFail("Cloud API keys not configured");
  }

  const probe = await fetch(
    `${base}/api/resource/User%20Permission?limit_page_length=1`,
    { headers, cache: "no-store" },
  );
  const userPermissionApi = probe.ok || probe.status === 403;
  if (!probe.ok && probe.status !== 403) {
    return {
      ...emptyFail(`User Permission API ${probe.status}`),
      userPermissionApi: false,
    };
  }

  const customers = await listOwnerCustomers(base, headers);
  const unique = new Map<string, string>();
  for (const row of customers) {
    const email = (row.custom_owner_email || "").trim().toLowerCase();
    const name = (row.name || "").trim();
    if (email && name && !unique.has(email)) unique.set(email, name);
  }

  const unbound: string[] = [];
  let bound = 0;
  for (const [email, customerName] of unique) {
    const has = await hasCustomerUserPermission(email, customerName);
    if (has) {
      bound += 1;
      continue;
    }
    if (opts?.applyMissing) {
      const ensured = await ensureCustomerUserPermission(email, customerName);
      if (ensured.ok) bound += 1;
      else unbound.push(email);
      continue;
    }
    unbound.push(email);
  }

  const foreignBinds: string[] = [];
  const owners = [...unique.entries()];
  for (const [email, ownCustomer] of owners) {
    for (const [, otherCustomer] of owners) {
      if (otherCustomer === ownCustomer) continue;
      if (await hasCustomerUserPermission(email, otherCustomer)) {
        foreignBinds.push(`${email} → ${otherCustomer}`);
      }
    }
  }

  const peerCustomers = unique.size >= 2;
  const ok =
    userPermissionApi &&
    unbound.length === 0 &&
    foreignBinds.length === 0 &&
    unique.size > 0;

  let detail: string;
  if (!unique.size) {
    detail = "No Plan Owner organisations found to bind.";
  } else if (foreignBinds.length) {
    detail = `Owner(s) also bound to a peer organisation: ${foreignBinds.join("; ")}.`;
  } else if (peerCustomers) {
    detail = `Bound ${bound}/${unique.size} Plan Owners. ${unique.size} organisations present (A≠B peers exist).`;
  } else {
    detail = `Bound ${bound}/${unique.size} Plan Owner. Add a second organisation to confirm A≠B peers.`;
  }

  return {
    ok,
    userPermissionApi,
    ownersChecked: unique.size,
    bound,
    unbound,
    foreignBinds,
    peerCustomers,
    detail,
  };
}
