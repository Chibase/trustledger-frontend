/**
 * Short-lived signed tokens for free resource pack downloads after lead gate.
 */

import { createHmac, timingSafeEqual } from "crypto";
import type { ResourcePackId } from "@/data/resources";

export type ResourceDownloadGrant = {
  packId: ResourcePackId;
  email: string;
  name: string;
  exp: number;
};

function downloadSecret(): string {
  const explicit = process.env.TRIAL_TOKEN_SECRET?.trim();
  if (explicit) return explicit;
  const paystack = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (paystack) return `tl-resource-download:${paystack}`;
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  if (isProd) {
    throw new Error(
      "TRIAL_TOKEN_SECRET (or PAYSTACK_SECRET_KEY) must be set in production for resource downloads",
    );
  }
  return "trustledger-dev-resource-download";
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

export function resourceDownloadMaxAgeMs(): number {
  return 60 * 60 * 1000; // 1 hour
}

export function signResourceDownloadGrant(
  payload: ResourceDownloadGrant,
): string {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(
    createHmac("sha256", downloadSecret()).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function readResourceDownloadGrant(
  token: string | undefined,
): ResourceDownloadGrant | null {
  if (!token?.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(
    createHmac("sha256", downloadSecret()).update(body).digest(),
  );
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      fromB64url(body).toString("utf8"),
    ) as ResourceDownloadGrant;
    if (!parsed.packId || !parsed.email || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
