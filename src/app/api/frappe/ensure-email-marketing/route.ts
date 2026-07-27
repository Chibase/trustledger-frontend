import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  emailMarketingSetupTokenOk,
  ensureEmailMarketing,
  probeEmailMarketing,
} from "@/lib/emailMarketingSetup";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  /** Default true — probe only. Set false to upsert Email Templates + Groups. */
  dryRun?: boolean;
  /** Probe only (no write intent). */
  probe?: boolean;
};

async function authorized(request: Request): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const token = request.headers.get("x-tl-email-marketing-setup");
  if (emailMarketingSetupTokenOk(token)) {
    return { ok: true };
  }

  if (!isFrappeOwnerIssuanceEnabled()) {
    return {
      ok: false,
      status: 403,
      error:
        "FRAPPE_OWNER_ISSUANCE is off, or pass x-tl-email-marketing-setup with EMAIL_MARKETING_SETUP_TOKEN / CRM_SETUP_TOKEN.",
    };
  }

  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertLiveOperatorAccess(email);
  if (!gate.ok) {
    return {
      ok: false,
      status: 403,
      error: operatorGateMessage(gate.reason),
    };
  }
  return { ok: true };
}

/**
 * EM-1 — probe / upsert Frappe Email Templates + Email Groups from
 * docs/exports/email-marketing/. Does not send campaigns or set SMTP passwords.
 */
export async function POST(request: Request) {
  const auth = await authorized(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  if (body.probe === true) {
    const result = await probeEmailMarketing();
    return NextResponse.json(result, { status: result.apiKeysPresent ? 200 : 503 });
  }

  const dryRun = body.dryRun !== false;
  const result = await ensureEmailMarketing({ dryRun });
  return NextResponse.json(result, {
    status: result.apiKeysPresent ? 200 : 503,
  });
}

export async function GET(request: Request) {
  const auth = await authorized(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const result = await probeEmailMarketing();
  return NextResponse.json(result, {
    status: result.apiKeysPresent ? 200 : 503,
  });
}
