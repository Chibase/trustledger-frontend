/**
 * Signed live-password-reset tokens. Same secret family as invites / OTP
 * (`TRIAL_TOKEN_SECRET`). Not a Frappe Desk reset key.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const PASSWORD_RESET_TTL_SECONDS = 60 * 60;
export const PASSWORD_RESET_KIND = "live-password-reset" as const;

export type PasswordResetPayload = {
  kind: typeof PASSWORD_RESET_KIND;
  email: string;
  jti: string;
  exp: number;
};

function tokenSecret(): string {
  const explicit = process.env.TRIAL_TOKEN_SECRET?.trim();
  if (explicit) return explicit;
  const paystack = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (paystack) return `tl-password-reset:${paystack}`;
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  if (isProd) {
    throw new Error(
      "TRIAL_TOKEN_SECRET (or PAYSTACK_SECRET_KEY) must be set in production for password reset emails",
    );
  }
  return "trustledger-dev-password-reset";
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

export function signPasswordResetToken(
  email: string,
  nowSec = Math.floor(Date.now() / 1000),
): string {
  const body: PasswordResetPayload = {
    kind: PASSWORD_RESET_KIND,
    email: email.trim().toLowerCase(),
    jti: randomBytes(16).toString("hex"),
    exp: nowSec + PASSWORD_RESET_TTL_SECONDS,
  };
  const bodyB64 = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", tokenSecret()).update(bodyB64).digest();
  return `${bodyB64}.${b64url(sig)}`;
}

export function verifyPasswordResetToken(
  token: string,
  nowSec = Math.floor(Date.now() / 1000),
): PasswordResetPayload | null {
  const [bodyB64, sigB64] = token.split(".");
  if (!bodyB64 || !sigB64) return null;
  let expected: Buffer;
  try {
    expected = createHmac("sha256", tokenSecret()).update(bodyB64).digest();
  } catch {
    return null;
  }
  const got = fromB64url(sigB64);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      fromB64url(bodyB64).toString("utf8"),
    ) as PasswordResetPayload;
    if (parsed.kind !== PASSWORD_RESET_KIND) return null;
    if (!parsed.email || !parsed.email.includes("@")) return null;
    if (typeof parsed.exp !== "number" || parsed.exp < nowSec) return null;
    return { ...parsed, email: parsed.email.trim().toLowerCase() };
  } catch {
    return null;
  }
}
