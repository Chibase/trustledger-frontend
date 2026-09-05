import { NextResponse } from "next/server";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";
import { recentSecurityEvents } from "@/lib/security/log";

export const runtime = "nodejs";

/** Ops-only: recent in-process security events (best-effort on serverless). */
export async function GET() {
  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session);
  return NextResponse.json({
    ok: true,
    events: recentSecurityEvents(50),
  });
}
