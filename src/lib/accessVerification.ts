/**
 * Access email verification — prove inbox control before platform session.
 * Live: OTP after password. Trial: activation link (no auto-cookie on /pay/success).
 */

import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { transactionalEmailConfigured } from "@/lib/transactionalEmail";

export const TL_AUTH_PENDING_COOKIE = "tl-auth-pending";

/** Explicit ACCESS_EMAIL_VERIFICATION=1, or Production when Resend is configured. */
export function accessEmailVerificationEnabled(): boolean {
  const raw = (process.env.ACCESS_EMAIL_VERIFICATION || "").trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") {
    return false;
  }
  if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") {
    return true;
  }
  return (
    process.env.VERCEL_ENV === "production" && transactionalEmailConfigured()
  );
}

export function accessVerificationReady(): boolean {
  return accessEmailVerificationEnabled() && transactionalEmailConfigured();
}

function pendingSecret(): string {
  const explicit = process.env.TRIAL_TOKEN_SECRET?.trim();
  if (explicit) return explicit;
  const paystack = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (paystack) return `tl-auth-pending:${paystack}`;
  return "trustledger-dev-auth-pending";
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

export function mintLoginOtp(): string {
  return String(randomInt(100000, 1000000));
}

export function hashLoginOtp(code: string, email: string): string {
  return createHmac("sha256", pendingSecret())
    .update(`tl-live-otp:${email.trim().toLowerCase()}:${code.trim()}`)
    .digest("hex");
}

export function verifyLoginOtp(
  code: string,
  email: string,
  otpHash: string,
): boolean {
  const got = Buffer.from(hashLoginOtp(code, email));
  const expected = Buffer.from(otpHash);
  if (got.length !== expected.length) return false;
  try {
    return timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

export type PendingLiveAuth = {
  email: string;
  sid: string;
  role: string;
  fullName: string;
  home: string;
  platformOperator: boolean;
  otpHash: string;
  exp: number;
};

export function signPendingLiveAuth(payload: PendingLiveAuth): string {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    createHmac("sha256", pendingSecret()).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function readPendingLiveAuth(token: string | undefined): PendingLiveAuth | null {
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
    const parsed = JSON.parse(fromB64url(body).toString("utf8")) as PendingLiveAuth;
    if (!parsed.email || !parsed.sid || !parsed.otpHash || !parsed.exp) {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function pendingAuthMaxAgeSeconds(): number {
  return 10 * 60;
}
