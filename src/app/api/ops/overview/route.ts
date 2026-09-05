import { NextResponse } from "next/server";
import { buildOpsOverview } from "@/lib/opsIntel";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

export async function GET() {
  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session);

  const overview = await buildOpsOverview();
  return NextResponse.json(overview, {
    headers: { "Cache-Control": "no-store" },
  });
}
