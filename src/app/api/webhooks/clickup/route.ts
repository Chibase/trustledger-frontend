import { NextResponse } from "next/server";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  clickupSignatureRequired,
  ensureClickUpWebhook,
  verifyClickUpSignature,
} from "@/lib/marketing/clickup";
import { handleClickUpWebhook } from "@/lib/marketing/engine";
import { marketingEngineStatus } from "@/lib/marketing/config";
import type { ClickUpWebhookEvent } from "@/lib/marketing/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ClickUp command-center webhook.
 * Publishes via Zernio only when a Marketing Review task is Approved
 * or a reviewer comments `/tl-publish`. Never sends bulk email.
 */
export async function GET() {
  const status = marketingEngineStatus();
  const endpoint = `${siteBaseUrl()}/api/webhooks/clickup`;
  const webhook = status.clickup
    ? await ensureClickUpWebhook(endpoint)
    : { ok: false, error: "CLICKUP_API_KEY missing" };
  return NextResponse.json({
    ok: webhook.ok,
    engine: "clickup-handler",
    endpoint,
    webhookSecret: status.webhookSecret,
    webhookSecretDedicated: status.webhookSecretDedicated,
    clickup: status.clickup,
    webhook,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const signed = verifyClickUpSignature(rawBody, signature);

  if (clickupSignatureRequired() && !signed) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (!clickupSignatureRequired() && isProductionRuntime()) {
    return NextResponse.json(
      { error: "CLICKUP_WEBHOOK_SECRET required in production" },
      { status: 503 },
    );
  }

  let event: ClickUpWebhookEvent;
  try {
    event = JSON.parse(rawBody) as ClickUpWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await handleClickUpWebhook(event);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[webhooks/clickup]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Handler failed" },
      { status: 500 },
    );
  }
}
