import {
  assertLeadFormGuards,
  normalizeComment,
} from "@/lib/formGuard";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import type { AssessmentLeadPayload } from "@/types/assessment";
import { isWorkEmail } from "@/data/assessment";
import { NextResponse } from "next/server";

function isValidPayload(body: unknown): body is AssessmentLeadPayload & {
  company_url?: string;
  captchaToken?: string;
  comment?: string;
} {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === "string" &&
    b.name.trim().length >= 2 &&
    typeof b.email === "string" &&
    typeof b.overallScore === "number" &&
    typeof b.riskBand === "string" &&
    typeof b.landingPath === "string" &&
    typeof b.completedAt === "string" &&
    typeof b.answers === "object" &&
    b.answers !== null &&
    typeof b.dimensionScores === "object" &&
    b.dimensionScores !== null &&
    Array.isArray(b.topPriorities)
  );
}

function buildAssessmentMessage(
  payload: AssessmentLeadPayload,
  comment: string,
): string {
  const scores = Object.entries(payload.dimensionScores)
    .map(([id, score]) => `${id}:${score}`)
    .join(", ");
  const utm = payload.utm
    ? [payload.utm.source, payload.utm.medium, payload.utm.campaign]
        .filter(Boolean)
        .join("/")
    : "none";

  return [
    `[Source: assessment] SRM Assessment score ${payload.overallScore}/100 (${payload.riskBand}).`,
    `Comment: ${comment}`,
    `Top priorities: ${payload.topPriorities.join(", ") || "n/a"}.`,
    `Dimension scores: ${scores || "n/a"}.`,
    payload.sector ? `Sector: ${payload.sector}.` : null,
    `UTM: ${utm}.`,
    `Completed: ${payload.completedAt}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const guard = await assertLeadFormGuards(request, {
    routeKey: "assessment-lead",
    honeypot: body.company_url,
    captchaToken: body.captchaToken,
    captchaAction: "assessment_lead",
  });
  if (!guard.ok) {
    if (guard.silent) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const comment = normalizeComment(body.comment, 10);

  if (!isWorkEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Please use a work email address (personal free-mail domains are not accepted).",
      },
      { status: 400 },
    );
  }

  if (!comment) {
    return NextResponse.json(
      {
        error:
          "Please share a short comment on what you need help with (at least 10 characters).",
      },
      { status: 400 },
    );
  }

  const payload: AssessmentLeadPayload = {
    ...body,
    name,
    email,
    organization: body.organization?.trim() || undefined,
    sector: body.sector?.trim() || undefined,
    comment,
  };

  const webhook = process.env.ASSESSMENT_WEBHOOK_URL;

  if (leadCaptureConfigured()) {
    const result = await submitProductLead({
      email: payload.email,
      name: payload.name,
      company: payload.organization,
      message: buildAssessmentMessage(payload, comment),
      pageUri: `${siteBaseUrl()}${payload.landingPath}`,
      pageName: "SRM Readiness Assessment",
      sourceTag: "assessment",
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "Lead delivery failed. Please try again." },
        { status: 502 },
      );
    }
  } else if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(
          "[assessment/lead] webhook failed",
          res.status,
          await res.text().catch(() => ""),
        );
        return NextResponse.json(
          { error: "Lead delivery failed. Please try again." },
          { status: 502 },
        );
      }
    } catch (err) {
      console.error("[assessment/lead] webhook error", err);
      return NextResponse.json(
        { error: "Lead delivery failed. Please try again." },
        { status: 502 },
      );
    }
  } else if (isProductionRuntime()) {
    console.error("[assessment/lead] no Frappe/HubSpot/webhook in production");
    return NextResponse.json(
      { error: "Lead capture is temporarily unavailable." },
      { status: 503 },
    );
  } else {
    console.info(
      "[assessment/lead] accepted (local — no lead backend)",
      JSON.stringify({
        name: payload.name,
        email: payload.email,
        overallScore: payload.overallScore,
        riskBand: payload.riskBand,
      }),
    );
  }

  return NextResponse.json({ ok: true });
}
