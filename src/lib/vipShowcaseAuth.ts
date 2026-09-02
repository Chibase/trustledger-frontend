/**
 * Gated VIP Institutional showcase login (operator / preview).
 * Not the retired public sample `/demo`. Production stays fail-closed
 * unless VIP_SHOWCASE_PASSWORD or VIP_SHOWCASE_LOGIN=1 is set.
 */

import { createHash, timingSafeEqual } from "crypto";
import { getPlatformOperatorEmails } from "@/lib/platformOperator";

export const VIP_SHOWCASE_WEEKS = 8;
export const VIP_SHOWCASE_PLAN_ID = "institutional" as const;
export const VIP_SHOWCASE_ORG_NAME = "VIP Pilot — NCGR-B Showcase";
export const VIP_SHOWCASE_OWNER_NAME = "Thozamile KaDlanga";

/** Preview / local default only — Production requires VIP_SHOWCASE_PASSWORD. */
export const DEFAULT_PREVIEW_PASSWORD = "NcgrB-Showcase-2026";

const DEFAULT_EMAILS = ["admin@chibaseconsulting.co.za"];

export function isHostedProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function isVipShowcaseEnabled(): boolean {
  const flag = (process.env.VIP_SHOWCASE_LOGIN || "").trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  if (flag === "1" || flag === "true" || flag === "on") return true;
  if (isHostedProduction()) {
    return Boolean(process.env.VIP_SHOWCASE_PASSWORD?.trim());
  }
  return true;
}

export function vipShowcaseExpectedPassword(): string | null {
  const fromEnv = process.env.VIP_SHOWCASE_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (isHostedProduction()) return null;
  return DEFAULT_PREVIEW_PASSWORD;
}

export function allowedVipShowcaseEmails(): string[] {
  const out = new Set<string>();
  for (const email of DEFAULT_EMAILS) out.add(email);
  for (const email of getPlatformOperatorEmails()) {
    if (email.includes("@")) out.add(email);
  }
  const extra =
    process.env.VIP_SHOWCASE_EMAILS || process.env.VIP_SHOWCASE_EMAIL || "";
  for (const part of extra.split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase();
    if (email.includes("@")) out.add(email);
  }
  return [...out];
}

export function isAllowedVipShowcaseEmail(email: string): boolean {
  const needle = email.trim().toLowerCase();
  return allowedVipShowcaseEmails().includes(needle);
}

function passwordDigest(password: string): Buffer {
  return createHash("sha256")
    .update(`tl-vip-showcase-v1:${password}`, "utf8")
    .digest();
}

export function vipShowcasePasswordsMatch(
  provided: string,
  expected: string,
): boolean {
  const got = passwordDigest(provided);
  const want = passwordDigest(expected);
  if (got.length !== want.length) return false;
  try {
    return timingSafeEqual(got, want);
  } catch {
    return false;
  }
}

export function displayNameForVipEmail(email: string): string {
  if (email.trim().toLowerCase() === "admin@chibaseconsulting.co.za") {
    return VIP_SHOWCASE_OWNER_NAME;
  }
  const local = email.split("@")[0] || "Plan Owner";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function vipShowcaseRateLimitOk(ip: string): boolean {
  const now = Date.now();
  const row = attempts.get(ip);
  if (!row || now >= row.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (row.count >= RATE_MAX) return false;
  row.count += 1;
  return true;
}
