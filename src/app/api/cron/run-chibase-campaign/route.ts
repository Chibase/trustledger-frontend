import { NextResponse } from "next/server";
import {
  authorizeCronOrOps,
  readDryRunFlag,
} from "@/lib/marketing/auth";
import { runDraftCycle } from "@/lib/marketing/engine";
import { marketingEngineStatus } from "@/lib/marketing/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * MKT-1 — scheduled Chibase thought-leadership draft.
 * Auth: Bearer CRON_SECRET, or Platform Operator session.
 * Never publishes. Stages a ClickUp review task.
 */
async function run(request: Request) {
  const gate = await authorizeCronOrOps(request);
  if (!gate.ok) return gate.response;
  const dryRun = await readDryRunFlag(request);
  const result = await runDraftCycle("chibase", { dryRun });
  return NextResponse.json({
    ...result,
    engine: "chibase-campaign",
    status: marketingEngineStatus(),
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
