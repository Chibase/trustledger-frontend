import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS = new Set([
  "module_visit",
  "executive_drill",
  "empty_state_cta",
]);

/**
 * Fire-and-forget packaging metrics. No mailbox. Best-effort log.
 */
export async function POST(request: Request) {
  let body: { event?: string; moduleKey?: string };
  try {
    body = (await request.json()) as { event?: string; moduleKey?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const event = (body.event || "").trim();
  const moduleKey = (body.moduleKey || "").trim();
  if (!EVENTS.has(event) || !moduleKey) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  console.info("[plan-packaging]", event, moduleKey);
  return NextResponse.json({ ok: true });
}
