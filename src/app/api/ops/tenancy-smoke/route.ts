import { NextResponse } from "next/server";
import { runTenancyAbSmoke } from "@/lib/tenancySmoke";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SEC-1 — bind Plan Owner Cloud Users to their organisation, then report A≠B readiness.
 * POST { applyMissing: true } stamps missing User Permissions.
 */
export async function GET() {
  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session);
  const smoke = await runTenancyAbSmoke();
  return NextResponse.json({ ok: smoke.ok, smoke });
}

export async function POST(request: Request) {
  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session);
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
