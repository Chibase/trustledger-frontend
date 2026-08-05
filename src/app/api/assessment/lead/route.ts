import {
  assertLeadFormGuards,
  normalizeComment,
  readHoneypot,
  rateLimitAllow,
  clientIp,
} from "@/lib/formGuard";
import { isProductionRuntime, siteBaseUrl } from "@/lib/hubspot";
import {
  leadCaptureConfigured,
  submitProductLead,
} from "@/lib/leadCapture";
import {
  assessmentGrantMaxAgeMs,
  assessmentOtpRequired,
  assessmentPendingMaxAgeMs,
  hashAssessmentOtp,
  mintAssessmentOtp,
  signAssessmentReportGrant,
  signPendingAssessmentUnlock,
} from "@/lib/assessmentAccess";
import { sendAssessmentOtpEmail } from "@/lib/transactionalEmail";
import type { AssessmentLeadPayload, RiskBand } from "@/types/assessment";
import { isWorkEmail, riskBandForScore } from "@/data/assessment";
import { NextResponse } from "next/server";

const RISK_LABEL: Record<RiskBand, string> = {
  critical: "Critical",
  elevated: "Elevated",
  moderate: "Moderate",
  strong: "Strong",
};

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

function grantResponse(payload: AssessmentLeadPayload) {
  const riskBand =
    (payload.riskBand as RiskBand) || riskBandForScore(payload.overallScore);
  const grantToken = signAssessmentReportGrant({
    email: payload.email,
    name: payload.name,
    overallScore: payload.overallScore,
    riskBand,
    exp: Date.now() + assessmentGrantMaxAgeMs(),
  });
  return NextResponse.json({
    ok: true,
    requiresOtp: false,
    grantToken,
    nextPath: "/readiness/next",
  });
}

async function otpResponse(payload: AssessmentLeadPayload) {
  const riskBand =
    (payload.riskBand as RiskBand) || riskBandForScore(payload.overallScore);
  const code = mintAssessmentOtp();
  const otpHash = hashAssessmentOtp(code, payload.email);
  const pendingToken = signPendingAssessmentUnlock({
    email: payload.email,
    name: payload.name,
    otpHash,
    overallScore: payload.overallScore,
    riskBand,
    exp: Date.now() + assessmentPendingMaxAgeMs(),
  });

  const sent = await sendAssessmentOtpEmail({
    to: payload.email,
    name: payload.name,
    code,
    expiresMinutes: 10,
    score: payload.overallScore,
    riskLabel: RISK_LABEL[riskBand],
  });

  if (!sent.sent) {
    console.error("[assessment/lead] OTP email failed", sent.detail);
    return NextResponse.json(
      {
        error:
          "Could not send the verification email. Check the address and try again in a few minutes.",
        detail: process.env.LEAD_DEBUG === "1" ? sent.detail : undefined,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    requiresOtp: true,
    pendingToken,
    nextPath: "/readiness/next",
  });
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
    honeypot: readHoneypot(body as unknown as Record<string, unknown>),
    captchaToken: body.captchaToken,
    captchaAction: "assessment_lead",
  });
  if (!guard.ok) {
    if (guard.silent) {
      console.warn("[assessment/lead] honeypot tripped — lead not written");
      // Fake success for bots; still issue a grant so the client funnel completes.
      return grantResponse({
        ...body,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
      });
    }
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
    const utm = payload.utm
      ? [payload.utm.source, payload.utm.medium, payload.utm.campaign]
          .filter(Boolean)
          .join("/")
      : undefined;
    const result = await submitProductLead({
      email: payload.email,
      name: payload.name,
      company: payload.organization,
      message: buildAssessmentMessage(payload, comment),
      pageUri: `${siteBaseUrl()}${payload.landingPath}`,
      pageName: "SRM Readiness Assessment",
      sourceTag: "assessment",
      jobTitle: `Assessment · ${payload.riskBand} · ${payload.overallScore}/100`,
      userQuote: comment,
      industry: payload.sector,
      utm,
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Lead delivery failed. Please try again.",
          backend: result.backend,
          detail:
            process.env.LEAD_DEBUG === "1" ? result.detail : undefined,
        },
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

  if (assessmentOtpRequired()) {
    const ip = clientIp(request);
    if (!rateLimitAllow(`assessment-otp-send:${email}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many verification emails. Wait a few minutes." },
        { status: 429 },
      );
    }
    if (!rateLimitAllow(`assessment-otp-send-ip:${ip}`, 8, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many verification emails. Wait a few minutes." },
        { status: 429 },
      );
    }
    return otpResponse(payload);
  }

  return grantResponse(payload);
}
