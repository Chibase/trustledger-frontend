import { NextResponse } from "next/server";
import { recaptchaConfigured, recaptchaRequired } from "@/lib/formGuard";
import { isFrappeAutoProvisionEnabled } from "@/lib/provisionOwnerCloud";
import {
  inviteEmailDeliveryReady,
  probeResendAuth,
  resendPublicDiagnostics,
  transactionalEmailConfigured,
} from "@/lib/transactionalEmail";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import { isPlatformOperatorOnly } from "@/lib/platformOperator";
import { paystackConfigured } from "@/lib/paystackServer";
import {
  accessEmailVerificationEnabled,
  accessVerificationReady,
} from "@/lib/accessVerification";
import { leadBackendStatus } from "@/lib/leadCapture";
import { marketingEngineStatus } from "@/lib/marketing/config";
import { probeUserPermissionApi } from "@/lib/userPermissionCloud";

const FRAPPE_SITE =
  process.env.FRAPPE_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://app.trustledger.co.za";

async function probe(
  label: string,
  url: string,
  init?: RequestInit,
): Promise<{ label: string; ok: boolean; status?: number; ms: number }> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    return {
      label,
      ok: res.ok || res.status < 500,
      status: res.status,
      ms: Date.now() - started,
    };
  } catch {
    return { label, ok: false, ms: Date.now() - started };
  }
}

export async function GET() {
  const [app, cloud, resendAuth, inviteEmail, userPermission] = await Promise.all([
    probe(
      "TrustLedger app",
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustledger-frontend-pi.vercel.app"}/`,
    ),
    probe(
      "TrustLedger Cloud",
      `${FRAPPE_SITE.replace(/\/$/, "")}/api/method/frappe.ping`,
    ),
    probeResendAuth(),
    inviteEmailDeliveryReady(),
    probeUserPermissionApi(),
  ]);

  const checks = [app, cloud];
  const ok = checks.every((c) => c.ok);

  const deploySha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    null;

  const leads = leadBackendStatus();
  const resendDiag = {
    ...resendPublicDiagnostics(),
    // Prefer resolved From (may auto-pick a verified domain).
    from: inviteEmail.from,
    fromIsTestSender: /@resend\.dev\b/i.test(inviteEmail.from),
    fromSource: inviteEmail.source,
    verifiedDomains: inviteEmail.verifiedDomains,
  };

  const launch = {
    lockdownLifted: !isPlatformOperatorOnly(),
    frappeOwnerIssuance: isFrappeOwnerIssuanceEnabled(),
    frappeAutoProvision: isFrappeAutoProvisionEnabled(),
    paystack: paystackConfigured(),
    cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    resend: transactionalEmailConfigured(),
    resendAuthOk: resendAuth.ok,
    resendAuthStatus: resendAuth.status ?? null,
    resendDiag,
    inviteEmailReady: inviteEmail.ready,
    inviteEmailReason: inviteEmail.reason ?? null,
    recaptcha: recaptchaConfigured(),
    recaptchaFailClosed: recaptchaRequired(),
    securityIngest: Boolean(
      (process.env.SECURITY_INGEST_SECRET || process.env.CRON_SECRET || "").trim(),
    ),
    accessEmailVerification: accessEmailVerificationEnabled(),
    accessVerificationReady: accessVerificationReady(),
    leadBackend: leads.preference,
    leadBackendCutover: leads.cutoverComplete,
    hubspotFallbackActive: leads.hubspotFallbackActive,
    marketingEngine: marketingEngineStatus(),
    tenancyL2: {
      bffSessionBind: true,
      userPermissionApi: userPermission.reachable,
      userPermissionStatus: userPermission.status ?? null,
    },
  };

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      deploySha,
      checks,
      launch,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
