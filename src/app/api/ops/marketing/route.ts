import { NextResponse } from "next/server";
import {
  buildMarketingDesk,
  runMarketingDeskAction,
} from "@/lib/marketing/desk";
import type { MarketingBriefInput, MarketingDeskAction } from "@/lib/marketing/desk.types";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ACTIONS = new Set<MarketingDeskAction>([
  "setup",
  "stage-chibase",
  "stage-trustledger",
  "register-webhook",
  "publish",
  "compose",
  "archive",
]);

async function gate() {
  return requireOpsLiveSession();
}

function forbidden(result: Awaited<ReturnType<typeof requireOpsLiveSession>>) {
  if (result.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return opsDenied(result);
}

/** Ops-only snapshot of the MKT-1 engine + Marketing Review list. */
export async function GET() {
  const access = await gate();
  if (!access.ok) return forbidden(access);
  return NextResponse.json(await buildMarketingDesk(), {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Operator actions: stage drafts, register webhook, or human-apply publish.
 * Never auto-runs from cron. Never sends bulk email.
 */
export async function POST(request: Request) {
  const access = await gate();
  if (!access.ok) return forbidden(access);

  let body: {
    action?: string;
    dryRun?: boolean;
    taskId?: string;
    brief?: MarketingBriefInput;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as MarketingDeskAction | undefined;
  if (!action || !ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "Unknown action. Use setup, stage-chibase, stage-trustledger, register-webhook, publish, compose, or archive." },
      { status: 400 },
    );
  }

  const result = await runMarketingDeskAction({
    action,
    dryRun: body.dryRun === true,
    taskId: typeof body.taskId === "string" ? body.taskId : undefined,
    brief: body.brief,
  });
  return NextResponse.json(result, {
    status: result.ok ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}
