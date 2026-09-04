import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { runTenancyAbSmoke } from "@/lib/tenancySmoke";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SEC-1 — bind Plan Owner Cloud Users to their organisation, then report A≠B readiness.
 * POST { applyMissing: true } stamps missing User Permissions.
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
  const smoke = await runTenancyAbSmoke();
  return NextResponse.json({ ok: smoke.ok, smoke });
}

export async function POST(request: Request) {
  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }
  let applyMissing = false;
  try {
    const body = (await request.json()) as { applyMissing?: boolean };
    applyMissing = body.applyMissing === true;
  } catch {
    applyMissing = false;
  }
  const smoke = await runTenancyAbSmoke({ applyMissing });
  return NextResponse.json({ ok: smoke.ok, smoke });
}
