import { NextResponse } from "next/server";
import { recordSecurityEvent, type SecurityEventKind } from "@/lib/security/log";

export const runtime = "nodejs";

const KINDS = new Set<SecurityEventKind>([
  "probe_blocked",
  "rate_limited",
  "honeypot",
  "form_rejected",
  "csp_violation",
]);

/**
 * Optional Node ingest for probes/forms from log drains or operators.
 * Auth: CRON_SECRET or SECURITY_INGEST_SECRET.
 */
export async function POST(request: Request) {
  const secret = (
    process.env.SECURITY_INGEST_SECRET ||
    process.env.CRON_SECRET ||
    ""
  ).trim();
  if (!secret) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const sent = request.headers.get("x-security-ingest")?.trim();
  if (sent !== secret) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const kind = body.kind;
  if (typeof kind !== "string" || !KINDS.has(kind as SecurityEventKind)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  recordSecurityEvent({
    kind: kind as SecurityEventKind,
    reason: String(body.reason || "unspecified").slice(0, 80),
    path: String(body.path || "/").slice(0, 240),
    ip: String(body.ip || "unknown").slice(0, 80),
    host: String(body.host || "").slice(0, 120),
    ua: String(body.ua || "").slice(0, 180),
  });

  return NextResponse.json({ ok: true });
}
