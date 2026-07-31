import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import {
  createWhatsAppCrmLead,
  ensureWhatsAppCrm,
  probeWhatsApp,
  whatsappSetupTokenOk,
} from "@/lib/whatsappSetup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  dryRun?: boolean;
  probe?: boolean;
  /** Create a CRM Lead from a WhatsApp chat (Ops). */
  createLead?: {
    name: string;
    mobile: string;
    email?: string;
    message?: string;
    organization?: string;
  };
};

async function authorized(request: Request): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const token = request.headers.get("x-tl-whatsapp-setup");
  if (whatsappSetupTokenOk(token)) {
    return { ok: true };
  }

  if (!isFrappeOwnerIssuanceEnabled()) {
    return {
      ok: false,
      status: 403,
      error:
        "FRAPPE_OWNER_ISSUANCE is off, or pass x-tl-whatsapp-setup with WHATSAPP_SETUP_TOKEN / CRM_SETUP_TOKEN.",
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
 * WA-1 — probe Frappe WhatsApp, ensure CRM Lead Source, or log a WhatsApp lead.
 * Meta tokens stay in Desk only.
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

  if (body.createLead) {
    const result = await createWhatsAppCrmLead(body.createLead);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }

  if (body.probe === true) {
    const result = await probeWhatsApp();
    return NextResponse.json(result, {
      status: result.apiKeysPresent ? 200 : 503,
    });
  }

  const dryRun = body.dryRun !== false;
  const result = await ensureWhatsAppCrm({ dryRun });
  return NextResponse.json(result, {
    status: result.apiKeysPresent ? 200 : 503,
  });
}

export async function GET(request: Request) {
  const auth = await authorized(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const result = await probeWhatsApp();
  return NextResponse.json(result, {
    status: result.apiKeysPresent ? 200 : 503,
  });
}
