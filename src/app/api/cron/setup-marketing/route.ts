import { NextResponse } from "next/server";
import { siteBaseUrl } from "@/lib/hubspot";
import {
  authorizeCronOrOps,
  readDryRunFlag,
} from "@/lib/marketing/auth";
import { marketingEngineStatus } from "@/lib/marketing/config";
import { ensureClickUpWebhook } from "@/lib/marketing/clickup";
import { runDraftCycle } from "@/lib/marketing/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * One-shot operator setup: register ClickUp webhook, then stage this week's
 * Chibase + TrustLedger drafts (or dryRun). Auth: CRON_SECRET or Ops session.
 */
async function run(request: Request) {
  const gate = await authorizeCronOrOps(request);
  if (!gate.ok) return gate.response;
  const dryRun = await readDryRunFlag(request);
  const endpoint = `${siteBaseUrl()}/api/webhooks/clickup`;
  const webhook = await ensureClickUpWebhook(endpoint);
  const chibase = await runDraftCycle("chibase", { dryRun });
  const trustledger = await runDraftCycle("trustledger", { dryRun });
  return NextResponse.json({
    ok: webhook.ok && chibase.ok && trustledger.ok,
    engine: "setup-marketing",
    endpoint,
    webhook,
    chibase,
    trustledger,
    status: marketingEngineStatus(),
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
