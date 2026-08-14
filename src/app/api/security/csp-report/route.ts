import { NextResponse } from "next/server";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { recordSecurityEvent } from "@/lib/security/log";

export const runtime = "nodejs";

function extractCspReport(body: unknown): {
  directive: string;
  document: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const report =
    (raw["csp-report"] as Record<string, unknown> | undefined) ||
    (raw.body as Record<string, unknown> | undefined) ||
    raw;
  if (!report || typeof report !== "object") return null;
  const directive = String(
    report["effective-directive"] ||
      report["violated-directive"] ||
      report.effectiveDirective ||
      "",
  ).slice(0, 80);
  const document = String(
    report["document-uri"] || report.documentURL || report["blocked-uri"] || "",
  ).slice(0, 240);
  if (!directive && !document) return null;
  return { directive: directive || "csp", document: document || "/" };
}

/**
 * Browser CSP reports (no custom auth headers possible).
 * Rate-limited; never alerts outbound (too noisy). 204 even on junk.
 */
export async function POST(request: Request) {
  if (!rateLimitAllow(`csp:${clientIp(request)}`, 40)) {
    return new NextResponse(null, { status: 204 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const report = extractCspReport(body);
  if (report) {
    recordSecurityEvent(
      {
        kind: "csp_violation",
        reason: report.directive,
        path: report.document,
        ip: clientIp(request),
        host: request.headers.get("host") || "",
        ua: request.headers.get("user-agent") || "",
      },
      { alert: false },
    );
  }
  return new NextResponse(null, { status: 204 });
}
