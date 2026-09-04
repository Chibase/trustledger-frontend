import { getCustomerEntitlementByOwnerEmail } from "@/lib/entitlementCloud";
import { getLoggedUserFromSid } from "@/lib/frappeServer";
import {
  isPlatformOperatorIdentity,
  normalizeIdentity,
} from "@/lib/platformOperator";

export const TENANT_MISMATCH_CODE = "TENANT_MISMATCH" as const;
export const SESSION_IDENTITY_MISMATCH_CODE = "SESSION_IDENTITY_MISMATCH" as const;

export type SessionTenant = {
  customerName: string;
  customerLabel?: string;
};

/**
 * Resolve the signed-in user's organisation from Cloud entitlement.
 * Never trust a client-supplied Customer name for this lookup.
 */
export async function resolveSessionCustomer(
  email: string | null | undefined,
): Promise<SessionTenant | null> {
  const trimmed = (email || "").trim();
  if (!trimmed) return null;
  const ent = await getCustomerEntitlementByOwnerEmail(trimmed);
  if (!ent?.customerName) return null;
  return {
    customerName: ent.customerName,
    customerLabel: ent.customerLabel || undefined,
  };
}

export type BindTenantResult =
  | { ok: true; customerName: string; breakGlass: boolean }
  | {
      ok: false;
      status: 400 | 401 | 403 | 404;
      code?: typeof TENANT_MISMATCH_CODE | typeof SESSION_IDENTITY_MISMATCH_CODE;
      error: string;
    };

/**
 * Prefer the Cloud sid user over a client-writable email cookie.
 * When both are present they must match.
 */
export async function canonicalLiveEmail(args: {
  sid?: string | null;
  cookieEmail?: string | null;
}): Promise<
  | { ok: true; email: string }
  | {
      ok: false;
      status: 401 | 403;
      code?: typeof SESSION_IDENTITY_MISMATCH_CODE;
      error: string;
    }
> {
  const cookie = (args.cookieEmail || "").trim();
  if (args.sid) {
    const sidUser = await getLoggedUserFromSid(args.sid);
    if (!sidUser) {
      return { ok: false, status: 401, error: "Live session is not active." };
    }
    if (cookie && normalizeIdentity(cookie) !== normalizeIdentity(sidUser)) {
      return {
        ok: false,
        status: 403,
        code: SESSION_IDENTITY_MISMATCH_CODE,
        error: "Sign-in identity does not match this workspace session.",
      };
    }
    return { ok: true, email: sidUser };
  }
  if (!cookie) {
    return { ok: false, status: 401, error: "Not logged in to live session" };
  }
  return { ok: true, email: cookie };
}

/**
 * Pure bind: session Customer vs optional claimed name.
 * Platform Operators may pass `claimed` for break-glass support.
 * Everyone else: claimed is ignored — organisation comes from sign-in only.
 */
export function decideTenantBind(args: {
  sessionCustomer: string | null;
  claimed?: string | null;
  operator: boolean;
  /** Ops upload / support: allow a bind with no Customer name. */
  operatorUnscoped?: boolean;
}): BindTenantResult {
  const requested = (args.claimed || "").trim();

  if (args.operator && requested) {
    return { ok: true, customerName: requested, breakGlass: true };
  }

  if (args.operator && args.operatorUnscoped && !requested) {
    return { ok: true, customerName: "", breakGlass: true };
  }

  if (!args.sessionCustomer) {
    return {
      ok: false,
      status: 404,
      error: "No TrustLedger Cloud organisation is linked to this sign-in.",
    };
  }

  return { ok: true, customerName: args.sessionCustomer, breakGlass: false };
}

/**
 * Bind Cloud CRUD to the session Customer.
 * Identity comes from the live sid when present (not a forgeable email cookie).
 * Platform Operators may pass `claimed` for break-glass support.
 */
export async function bindSessionCustomer(
  email: string | null | undefined,
  claimed?: string | null,
  opts?: { operatorUnscoped?: boolean; sid?: string | null },
): Promise<BindTenantResult> {
  let bindEmail = (email || "").trim();
  if (opts?.sid || email) {
    const canonical = await canonicalLiveEmail({
      sid: opts?.sid,
      cookieEmail: email,
    });
    if (!canonical.ok) {
      return {
        ok: false,
        status: canonical.status,
        code: canonical.code,
        error: canonical.error,
      };
    }
    bindEmail = canonical.email;
  }

  const session = await resolveSessionCustomer(bindEmail);
  return decideTenantBind({
    sessionCustomer: session?.customerName || null,
    claimed,
    operator: isPlatformOperatorIdentity(bindEmail, email),
    operatorUnscoped: opts?.operatorUnscoped,
  });
}

export function rowMatchesCustomer(
  row: { customer?: unknown },
  customer: string,
): boolean {
  return String(row.customer || "") === customer;
}

/** Drop rows that are not stamped to this organisation. Empty customer is not shared. */
export function rowsForCustomer<T extends { customer?: unknown }>(
  rows: T[],
  customer: string,
): T[] {
  return rows.filter((row) => rowMatchesCustomer(row, customer));
}
