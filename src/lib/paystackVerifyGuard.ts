/**
 * Paystack verify credentials — rate-limit + one-shot reveal.
 * Success-page remounts keep a short-lived httpOnly reveal cookie so React
 * Strict Mode does not lose the temp password. Later callers without that
 * cookie get payment status only.
 */

import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";
import { clientIp, rateLimitAllow } from "@/lib/formGuard";

export const PAYSTACK_VERIFY_REVEAL_COOKIE = "tl-pay-reveal";
export const PAYSTACK_VERIFY_PENDING_COOKIE = "tl-pay-pending";
const REVEAL_MAX_AGE_SECONDS = 30 * 60;
const PENDING_MAX_AGE_SECONDS = 2 * 60 * 60;

const mintedReferences = new Map<string, number>();
const MINT_TTL_MS = 24 * 60 * 60 * 1000;

function tokenSecret(): string {
  const explicit = process.env.TRIAL_TOKEN_SECRET?.trim();
  if (explicit) return explicit;
  const paystack = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (paystack) return `tl-pay-reveal:${paystack}`;
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  if (isProd) {
    throw new Error(
      "TRIAL_TOKEN_SECRET (or PAYSTACK_SECRET_KEY) must be set in production",
    );
  }
  return "trustledger-dev-pay-reveal";
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

function signReveal(reference: string, exp: number): string {
  const payload = b64url(JSON.stringify({ r: reference, exp }));
  const mac = createHmac("sha256", tokenSecret())
    .update(payload)
    .digest();
  return `${payload}.${b64url(mac)}`;
}

export function verifyPaystackRevealToken(
  token: string | null | undefined,
  reference: string,
): boolean {
  if (!token || !reference.trim()) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, mac] = parts;
  if (!payload || !mac) return false;
  let expected: Buffer;
  try {
    expected = createHmac("sha256", tokenSecret()).update(payload).digest();
  } catch {
    return false;
  }
  const given = fromB64url(mac);
  if (given.length !== expected.length) return false;
  if (!timingSafeEqual(given, expected)) return false;
  try {
    const json = JSON.parse(fromB64url(payload).toString("utf8")) as {
      r?: string;
      exp?: number;
    };
    if (json.r !== reference) return false;
    if (typeof json.exp !== "number" || json.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function pruneMinted(now: number) {
  for (const [key, exp] of mintedReferences) {
    if (exp <= now) mintedReferences.delete(key);
  }
}

export function markPaystackVerifyMinted(reference: string): void {
  pruneMinted(Date.now());
  mintedReferences.set(reference, Date.now() + MINT_TTL_MS);
}

export function paystackVerifyAlreadyMinted(reference: string): boolean {
  pruneMinted(Date.now());
  const exp = mintedReferences.get(reference);
  return Boolean(exp && exp > Date.now());
}

/**
 * mint = first reveal (return + email credentials)
 * replay = same browser remount (return credentials, do not re-email)
 * withhold = later caller without the reveal cookie
 */
export function decidePaystackCredentialReveal(input: {
  alreadyMinted: boolean;
  hasCheckoutCookie: boolean;
}): "mint" | "replay" | "withhold" {
  if (!input.hasCheckoutCookie) return "withhold";
  return input.alreadyMinted ? "replay" : "mint";
}

export function paystackVerifyRateLimit(request: Request, reference: string): boolean {
  const ip = clientIp(request);
  const refKey = reference.trim().slice(0, 80);
  if (!rateLimitAllow(`paystack-verify-ip:${ip}`, 20, 15 * 60 * 1000)) {
    return false;
  }
  if (!rateLimitAllow(`paystack-verify-ref:${refKey}`, 8, 15 * 60 * 1000)) {
    return false;
  }
  return true;
}

export function attachPaystackVerifyReveal(
  response: NextResponse,
  reference: string,
): void {
  attachPaystackVerifyCookie(
    response,
    PAYSTACK_VERIFY_REVEAL_COOKIE,
    reference,
    REVEAL_MAX_AGE_SECONDS,
  );
}

export function attachPaystackVerifyPending(
  response: NextResponse,
  reference: string,
): void {
  attachPaystackVerifyCookie(
    response,
    PAYSTACK_VERIFY_PENDING_COOKIE,
    reference,
    PENDING_MAX_AGE_SECONDS,
  );
}

function attachPaystackVerifyCookie(
  response: NextResponse,
  name: string,
  reference: string,
  maxAge: number,
): void {
  const exp = Date.now() + maxAge * 1000;
  const token = signReveal(reference, exp);
  response.cookies.set(name, token, {
    path: "/",
    maxAge,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
}
