/**
 * Gated VIP Institutional showcase login (operator / unpublished path).
 * Not the retired public sample `/demo`. Off only when VIP_SHOWCASE_LOGIN=0.
 */

import { createHash, timingSafeEqual } from "crypto";
import { VIP_SHOWCASE_DEFAULT_EMAIL } from "@/lib/vipShowcaseIdentity";

export { VIP_SHOWCASE_DEFAULT_EMAIL } from "@/lib/vipShowcaseIdentity";

export const VIP_SHOWCASE_WEEKS = 8;
export const VIP_SHOWCASE_PLAN_ID = "institutional" as const;
export const VIP_SHOWCASE_ORG_NAME = "VIP Pilot — NCGR-B Showcase";
export const VIP_SHOWCASE_OWNER_NAME = "Thozamile KaDlanga";

/** Documented showcase password; override with VIP_SHOWCASE_PASSWORD. */
export const DEFAULT_PREVIEW_PASSWORD = "NcgrB-Showcase-2026";

const DEFAULT_EMAILS = [VIP_SHOWCASE_DEFAULT_EMAIL];

export function isVipShowcaseEnabled(): boolean {
  const flag = (process.env.VIP_SHOWCASE_LOGIN || "").trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  return true;
}

export function vipShowcaseExpectedPassword(): string | null {
  if (!isVipShowcaseEnabled()) return null;
  const fromEnv = process.env.VIP_SHOWCASE_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_PREVIEW_PASSWORD;
}

export function allowedVipShowcaseEmails(): string[] {
  const out = new Set<string>();
  for (const email of DEFAULT_EMAILS) out.add(email);
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

/** Showcase mailbox belongs on /login/vip, not Frappe /login/live. */
export function isVipShowcaseLiveLoginMailbox(usr: string): boolean {
  return isVipShowcaseEnabled() && isAllowedVipShowcaseEmail(usr);
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
  if (email.trim().toLowerCase() === VIP_SHOWCASE_DEFAULT_EMAIL) {
    return VIP_SHOWCASE_OWNER_NAME;
  }
  const local = email.split("@")[0] || "Plan Owner";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 10;
const RATE_MAP_CAP = 500;
const attempts = new Map<string, { count: number; resetAt: number }>();

function pruneVipShowcaseAttempts(now: number) {
  for (const [key, row] of attempts) {
    if (now >= row.resetAt) attempts.delete(key);
  }
  while (attempts.size > RATE_MAP_CAP) {
    const oldest = attempts.keys().next().value;
    if (!oldest) break;
    attempts.delete(oldest);
  }
}

/** Prefer Vercel’s hop; otherwise the last x-forwarded-for entry (proxy-appended). */
export function vipShowcaseClientIp(request: Request): string {
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }
  const xf = request.headers.get("x-forwarded-for");
  if (xf) {
    const hops = xf
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (hops.length) return hops[hops.length - 1]!;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function vipShowcaseRateLimitOk(ip: string): boolean {
  const now = Date.now();
  pruneVipShowcaseAttempts(now);
  const row = attempts.get(ip);
  if (!row || now >= row.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (row.count >= RATE_MAX) return false;
  row.count += 1;
  return true;
}
