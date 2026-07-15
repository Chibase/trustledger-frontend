import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { buildOpsOverview } from "@/lib/opsIntel";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

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

  const overview = await buildOpsOverview();
  return NextResponse.json(overview, {
    headers: { "Cache-Control": "no-store" },
  });
}
