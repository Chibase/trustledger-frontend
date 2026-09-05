/**
 * Live Plan Owner for mutating APIs — Cloud Customer.custom_owner_email.
 * Never trust tl-org-owner (client-writable unless httpOnly, and forgeable on the wire).
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FRAPPE_SID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { getCustomerEntitlementByOwnerEmail } from "@/lib/entitlementCloud";
import { liveOwnerFromCloudCustomer } from "@/lib/secBffRules";
import { canonicalLiveEmail } from "@/lib/tenantScope";

export { liveOwnerFromCloudCustomer } from "@/lib/secBffRules";

export type LiveOwnerOk = {
  ok: true;
  email: string;
  sid: string;
  customerName: string;
};
export type LiveOwnerDenied = {
  ok: false;
  status: 401 | 403 | 404;
  error: string;
};
export type LiveOwnerResult = LiveOwnerOk | LiveOwnerDenied;

export async function requireLivePlanOwner(): Promise<LiveOwnerResult> {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value?.trim() || "";
  const cookieEmail = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  if (!sid) {
    return {
      ok: false,
      status: 401,
      error:
        "Sign in with a live TrustLedger Cloud Plan Owner account to continue.",
    };
  }

  const canonical = await canonicalLiveEmail({ sid, cookieEmail });
  if (!canonical.ok) {
    return {
      ok: false,
      status: canonical.status,
      error: canonical.error,
    };
  }

  const owner = await getCustomerEntitlementByOwnerEmail(canonical.email);
  const customerName = owner?.customerName?.trim() || "";
  if (!liveOwnerFromCloudCustomer({ ownerCustomerName: customerName })) {
    return {
      ok: false,
      status: 403,
      error: "Only the package Plan Owner can do that.",
    };
  }

  return {
    ok: true,
    email: canonical.email,
    sid,
    customerName,
  };
}

export function liveOwnerDenied(result: LiveOwnerDenied): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
