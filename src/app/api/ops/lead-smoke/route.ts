import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { submitProductLead } from "@/lib/leadCapture";
import {
  buildHs2SmokeLeadInput,
  buildLeadSmokeSnapshot,
  HS2_SMOKE_EMAIL,
  HS2_SMOKE_JOB_TITLE,
} from "@/lib/leadSmoke";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HS-2 — operator inventory + one CRM Lead write.
 * Does not click public forms. Does not uninstall Desk email apps.
 */
export async function GET() {
  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }
  const smoke = buildLeadSmokeSnapshot();
  return NextResponse.json({ ok: true, smoke });
}

export async function POST() {
  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }
  const snapshot = buildLeadSmokeSnapshot();
  const input = buildHs2SmokeLeadInput();
  const write = await submitProductLead(input);
  return NextResponse.json({
    ok: write.ok,
    smoke: snapshot,
    write: {
      ok: write.ok,
      backend: write.backend,
      status: write.status,
      detail: write.detail,
      email: HS2_SMOKE_EMAIL,
      jobTitle: HS2_SMOKE_JOB_TITLE,
    },
  });
}
