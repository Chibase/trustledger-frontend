import { NextResponse } from "next/server";
import { buildOperationalReadiness } from "@/lib/operationalDelivery";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ops-only readiness snapshot for operational delivery Steps 1–5. */
export async function GET() {
  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session);

  return NextResponse.json(buildOperationalReadiness());
}
