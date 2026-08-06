import { NextResponse } from "next/server";
import {
  assessmentGrantMaxAgeMs,
  assessmentPendingMaxAgeMs,
  hashAssessmentOtp,
  mintAssessmentOtp,
  readPendingAssessmentUnlock,
  signAssessmentReportGrant,
  signPendingAssessmentUnlock,
  verifyAssessmentOtp,
} from "@/lib/assessmentAccess";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";
import { sendAssessmentOtpEmail } from "@/lib/transactionalEmail";
import type { RiskBand } from "@/types/assessment";

const RISK_LABEL: Record<RiskBand, string> = {
  critical: "Critical",
  elevated: "Elevated",
  moderate: "Moderate",
  strong: "Strong",
};

/** Verify assessment OTP and issue a report grant token. */
export async function POST(request: Request) {
  let body: { code?: string; pendingToken?: string };
  try {
    body = (await request.json()) as { code?: string; pendingToken?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = (body.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 400 },
    );
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`assessment-otp-verify:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const pending = readPendingAssessmentUnlock(body.pendingToken);
  if (!pending) {
    return NextResponse.json(
      { error: "Verification expired. Unlock your results again." },
      { status: 401 },
    );
  }

  if (!verifyAssessmentOtp(code, pending.email, pending.otpHash)) {
    return NextResponse.json(
      { error: "Incorrect code. Check your email and try again." },
      { status: 401 },
    );
  }

  const grantToken = signAssessmentReportGrant({
    email: pending.email,
    name: pending.name,
    overallScore: pending.overallScore,
    riskBand: pending.riskBand,
    exp: Date.now() + assessmentGrantMaxAgeMs(),
  });

  return NextResponse.json({
    ok: true,
    grantToken,
    nextPath: "/readiness/next",
    email: pending.email,
    name: pending.name,
    overallScore: pending.overallScore,
    riskBand: pending.riskBand,
  });
}

/** Resend assessment OTP using an existing pending token. */
export async function PUT(request: Request) {
  let body: { pendingToken?: string };
  try {
    body = (await request.json()) as { pendingToken?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pending = readPendingAssessmentUnlock(body.pendingToken);
  if (!pending) {
    return NextResponse.json(
      { error: "Verification expired. Unlock your results again." },
      { status: 401 },
    );
  }

  if (!rateLimitAllow(`assessment-otp-resend:${pending.email}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many resend attempts. Wait a few minutes." },
      { status: 429 },
    );
  }

  const code = mintAssessmentOtp();
  const otpHash = hashAssessmentOtp(code, pending.email);
  const pendingToken = signPendingAssessmentUnlock({
    ...pending,
    otpHash,
    exp: Date.now() + assessmentPendingMaxAgeMs(),
  });

  const sent = await sendAssessmentOtpEmail({
    to: pending.email,
    name: pending.name,
    code,
    expiresMinutes: 10,
    score: pending.overallScore,
    riskLabel: RISK_LABEL[pending.riskBand],
  });

  if (!sent.sent) {
    return NextResponse.json(
      { error: sent.detail || "Could not send verification email." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, pendingToken });
}
