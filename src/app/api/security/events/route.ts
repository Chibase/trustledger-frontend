import { NextResponse } from "next/server";
import { assertOpsAccess } from "@/lib/platformOperator";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { recentSecurityEvents } from "@/lib/security/log";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/** Ops-only: recent in-process security events (best-effort on serverless). */
export async function GET() {
  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(email);
  if (!gate.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    events: recentSecurityEvents(50),
  });
}
