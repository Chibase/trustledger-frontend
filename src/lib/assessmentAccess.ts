/**
 * Assessment report unlock — OTP (or skip when Resend unavailable) before hub/report.
 * Tokens are signed HMAC payloads (same secret ladder as live OTP pending).
 */

import { createHmac, timingSafeEqual } from "crypto";
import {
  accessVerificationReady,
  hashLoginOtp,
  mintLoginOtp,
  verifyLoginOtp,
} from "@/lib/accessVerification";
import type { RiskBand } from "@/types/assessment";

function pendingSecret(): string {
  const explicit = process.env.TRIAL_TOKEN_SECRET?.trim();
  if (explicit) return explicit;
  const paystack = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (paystack) return `tl-assessment-access:${paystack}`;
  return "trustledger-dev-assessment-access";
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(value: string): Buffer {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(normalized, "base64");
}

function signPayload(payload: object): string {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    createHmac("sha256", pendingSecret()).update(body).digest(),
  );
  return `${body}.${sig}`;
}

function readSignedPayload<T extends { exp: number }>(
  token: string | undefined,
): T | null {
  if (!token?.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(
    createHmac("sha256", pendingSecret()).update(body).digest(),
  );
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(fromB64url(body).toString("utf8")) as T;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type PendingAssessmentUnlock = {
  email: string;
  name: string;
  otpHash: string;
  overallScore: number;
  riskBand: RiskBand;
  exp: number;
};

export type AssessmentReportGrant = {
  email: string;
  name: string;
  overallScore: number;
  riskBand: RiskBand;
  exp: number;
};

export function assessmentOtpRequired(): boolean {
  return accessVerificationReady();
}

export function assessmentPendingMaxAgeMs(): number {
  return 10 * 60 * 1000;
}

export function assessmentGrantMaxAgeMs(): number {
  return 7 * 24 * 60 * 60 * 1000;
}

export function mintAssessmentOtp(): string {
  return mintLoginOtp();
}

export function hashAssessmentOtp(code: string, email: string): string {
  return hashLoginOtp(code, email);
}

export function verifyAssessmentOtp(
  code: string,
  email: string,
  otpHash: string,
): boolean {
  return verifyLoginOtp(code, email, otpHash);
}

export function signPendingAssessmentUnlock(
  payload: PendingAssessmentUnlock,
): string {
  return signPayload(payload);
}

export function readPendingAssessmentUnlock(
  token: string | undefined,
): PendingAssessmentUnlock | null {
  const parsed = readSignedPayload<PendingAssessmentUnlock>(token);
  if (!parsed?.email || !parsed.otpHash || !parsed.riskBand) return null;
  return parsed;
}

export function signAssessmentReportGrant(
  payload: AssessmentReportGrant,
): string {
  return signPayload(payload);
}

export function readAssessmentReportGrant(
  token: string | undefined,
): AssessmentReportGrant | null {
  const parsed = readSignedPayload<AssessmentReportGrant>(token);
  if (!parsed?.email || !parsed.riskBand) return null;
  return parsed;
}
