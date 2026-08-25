import { getCustomerEntitlementByOwnerEmail } from "@/lib/entitlementCloud";
import { isPlatformOperatorIdentity } from "@/lib/platformOperator";

export const TENANT_MISMATCH_CODE = "TENANT_MISMATCH" as const;

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
      status: 400 | 403 | 404;
      code?: typeof TENANT_MISMATCH_CODE;
      error: string;
    };

/**
 * Pure bind: session Customer vs optional claimed name.
 * Platform Operators may pass `claimed` for break-glass support.
 * Everyone else: claimed must be empty or match the session Customer.
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

  if (requested && requested !== args.sessionCustomer) {
    return {
      ok: false,
      status: 403,
      code: TENANT_MISMATCH_CODE,
      error: "That organisation is not this workspace.",
    };
  }

  return { ok: true, customerName: args.sessionCustomer, breakGlass: false };
}

/**
 * Bind Cloud CRUD to the session Customer.
 * Platform Operators may pass `claimed` for break-glass support.
 * Everyone else: claimed must be empty or match the session Customer.
 */
export async function bindSessionCustomer(
  email: string | null | undefined,
  claimed?: string | null,
  opts?: { operatorUnscoped?: boolean },
): Promise<BindTenantResult> {
  const session = await resolveSessionCustomer(email);
  return decideTenantBind({
    sessionCustomer: session?.customerName || null,
    claimed,
    operator: isPlatformOperatorIdentity(email),
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
