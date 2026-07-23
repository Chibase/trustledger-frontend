import { NextResponse } from "next/server";
import { recaptchaConfigured, recaptchaRequired } from "@/lib/formGuard";
import { isFrappeAutoProvisionEnabled } from "@/lib/provisionOwnerCloud";
import { transactionalEmailConfigured } from "@/lib/transactionalEmail";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import { isPlatformOperatorOnly } from "@/lib/platformOperator";
import { paystackConfigured } from "@/lib/paystackServer";
import {
  accessEmailVerificationEnabled,
  accessVerificationReady,
} from "@/lib/accessVerification";

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
  const [app, cloud] = await Promise.all([
    probe(
      "TrustLedger app",
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://trustledger-frontend-pi.vercel.app"}/`,
    ),
    probe(
      "TrustLedger Cloud",
      `${FRAPPE_SITE.replace(/\/$/, "")}/api/method/frappe.ping`,
    ),
  ]);

  const checks = [app, cloud];
  const ok = checks.every((c) => c.ok);

  const deploySha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    null;

  const launch = {
    lockdownLifted: !isPlatformOperatorOnly(),
    frappeOwnerIssuance: isFrappeOwnerIssuanceEnabled(),
    frappeAutoProvision: isFrappeAutoProvisionEnabled(),
    paystack: paystackConfigured(),
    cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    resend: transactionalEmailConfigured(),
    recaptcha: recaptchaConfigured(),
    recaptchaFailClosed: recaptchaRequired(),
    accessEmailVerification: accessEmailVerificationEnabled(),
    accessVerificationReady: accessVerificationReady(),
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
