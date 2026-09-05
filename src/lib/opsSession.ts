/**
 * Platform Ops API gate — live Cloud sid + allowlisted operator identity.
 * Email cookie alone is not enough (that value can be sent on a forged request).
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FRAPPE_SID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import {
  decideOpsApiAccess,
  type OpsSessionDenied,
} from "@/lib/secBffRules";
import { canonicalLiveEmail } from "@/lib/tenantScope";

export type OpsSessionOk = { ok: true; email: string };
export type { OpsSessionDenied };
export type OpsSessionResult = OpsSessionOk | OpsSessionDenied;

/**
 * Verify the httpOnly Cloud sid, then allowlist that Cloud user.
 * Callers must still send Bearer CRON_SECRET for machine jobs.
 */
export async function requireOpsLiveSession(): Promise<OpsSessionResult> {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  const cookieEmail = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const presence = decideOpsApiAccess({
    sid,
    allowlisted: true,
  });
  if (!presence.ok) return presence;

  const canonical = await canonicalLiveEmail({ sid, cookieEmail });
  if (!canonical.ok) {
    return {
      ok: false,
      status: canonical.status,
      error: canonical.error,
    };
  }

  const gate = assertOpsAccess(canonical.email);
  if (!gate.ok) {
    return {
      ok: false,
      status: 403,
      error: operatorGateMessage(gate.reason),
    };
  }
  return { ok: true, email: canonical.email };
}

export function opsDenied(
  result: OpsSessionDenied,
  opts?: { text?: boolean },
): NextResponse | Response {
  if (opts?.text) {
    return new Response(result.error, { status: result.status });
  }
  return NextResponse.json({ error: result.error }, { status: result.status });
}
