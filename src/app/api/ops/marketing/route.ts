import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  buildMarketingDesk,
  runMarketingDeskAction,
} from "@/lib/marketing/desk";
import type { MarketingBriefInput, MarketingDeskAction } from "@/lib/marketing/desk.types";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

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
  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  return assertOpsAccess(email);
}

function forbidden(reason: "lockdown_misconfigured" | "not_operator") {
  return NextResponse.json(
    { error: operatorGateMessage(reason) },
    { status: 403 },
  );
}

/** Ops-only snapshot of the MKT-1 engine + Marketing Review list. */
export async function GET() {
  const access = await gate();
  if (!access.ok) return forbidden(access.reason);
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
  if (!access.ok) return forbidden(access.reason);

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
