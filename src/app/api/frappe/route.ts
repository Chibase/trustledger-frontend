import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FRAPPE_SID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { frappeCallWithSid } from "@/lib/frappeServer";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

/**
 * Same-origin proxy so the browser never needs the Frappe sid cookie.
 * POST body: { method: "/api/method/...", ...args }
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Not logged in to live session" }, { status: 401 });
  }

  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertLiveOperatorAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const method = body.method;
  if (typeof method !== "string" || !method.includes("/api/method/")) {
    return NextResponse.json(
      { error: "body.method must be a /api/method/... path" },
      { status: 400 },
    );
  }

  // Hard block Cloud LLM report methods — Grok returns Month-End / [Insert …]
  // fill-in guides. TrustLedger composes reports locally (reportComposer).
  const blockedAi = [
    "srm_core.api.ai.compose_activity_report",
    "srm_core.api.ai.generate_report_brief",
  ];
  if (blockedAi.some((m) => method.includes(m))) {
    return NextResponse.json(
      {
        error:
          "Report AI is local-only on TrustLedger. Use Create report → evidence writer (never Cloud compose/brief).",
      },
      { status: 403 },
    );
  }

  const { method: _method, ...args } = body;
  try {
    const message = await frappeCallWithSid(sid, method, args);
    return NextResponse.json({ message });
  } catch (error) {
    const text = error instanceof Error ? error.message : "Proxy failed";
    const status = text.includes("(401)") || text.includes("(403)") ? 401 : 502;
    return NextResponse.json({ error: text }, { status });
  }
}
