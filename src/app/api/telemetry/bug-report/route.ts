import { NextResponse } from "next/server";
import { OPERATOR_ORG } from "@/lib/aeo/siteFacts";
import {
  honeypotFilled,
  readHoneypot,
  clientIp,
  rateLimitAllow,
} from "@/lib/formGuard";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import { isProductDefectReport, mentionsBugKeyword } from "@/lib/themba/bugDetect";
import { normalizeBugReport } from "@/lib/themba/telemetry";

export const runtime = "nodejs";

/**
 * Public telemetry intake for Themba defect keywords.
 * No LLM keys. Rate-limited. CRM Lead only when lead backend is configured
 * (lands on an ops mailbox so the queue is visible without a visitor email).
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const asRecord = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (honeypotFilled(readHoneypot(asRecord))) {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`themba-bug:${ip}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many reports. Please wait." },
      { status: 429 },
    );
  }

  const report = normalizeBugReport(raw);
  if (!report) {
    return NextResponse.json({ error: "Incomplete report." }, { status: 400 });
  }
  if (!mentionsBugKeyword(report.user_query)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const ticketId = `TL-BUG-${Date.now().toString(36).toUpperCase()}`;
  const history = report.chat_history
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n");
  const message = [
    "Themba bug telemetry.",
    `Ticket: ${ticketId}`,
    `Query: ${report.user_query}`,
    `Page: ${report.page_url}`,
    `When: ${report.timestamp}`,
    `UA: ${report.browser_info || "n/a"}`,
    history ? `Last turns:\n${history}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  console.warn("[themba-bug]", {
    ticketId,
    page_url: report.page_url,
    user_query: report.user_query.slice(0, 240),
    timestamp: report.timestamp,
  });

  const notifyEmail = (
    process.env.THEMBA_BUG_NOTIFY_EMAIL ||
    OPERATOR_ORG.email
  )
    .trim()
    .toLowerCase();

  if (leadCaptureConfigured() && isProductDefectReport(report.user_query)) {
    const path =
      report.page_url.replace(siteBaseUrl(), "").split("?")[0] || "/";
    const result = await submitProductLead({
      email: notifyEmail,
      name: "Themba bug telemetry",
      message,
      pageUri: report.page_url.startsWith("http")
        ? report.page_url
        : `${siteBaseUrl()}${path}`,
      pageName: "Themba bug report",
      sourceTag: "themba_bug",
      jobTitle: `Themba bug · ${path} · ${ticketId}`,
      userQuote: report.user_query,
    });
    if (!result.ok) {
      console.error("[themba-bug] CRM write failed", result.detail);
      // Still ack — logs already captured the payload.
      return NextResponse.json({ ok: true, ticketId, stored: "log" });
    }
    return NextResponse.json({
      ok: true,
      ticketId,
      stored: "crm",
    });
  }

  if (isProductionRuntime()) {
    console.error("[themba-bug] no lead backend in production", { ticketId });
  }

  return NextResponse.json({ ok: true, ticketId, stored: "log" });
}
