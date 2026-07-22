import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { isPlanId, TRIAL_DAYS, type PlanId } from "@/config/plans";

/** Paystack ZAR minimum for a reusable card authorization (1.00). */
export const TRIAL_VERIFY_CENTS_DEFAULT = 100;

export type TrialActivationPayload = {
  email: string;
  name: string;
  planId: PlanId;
  organization?: string;
  startedAt: string;
  billAt: string;
  reference: string;
  /** Plain temp password only when freshly minted for email/UI. */
  tempPassword?: string;
};

export type SignedTrialToken = {
  email: string;
  name: string;
  planId: PlanId;
  organization?: string;
  startedAt: string;
  billAt: string;
  reference: string;
  passHash: string;
  authorizationCode?: string;
  exp: number;
};

function tokenSecret(): string {
  return (
    process.env.TRIAL_TOKEN_SECRET?.trim() ||
    process.env.PAYSTACK_SECRET_KEY?.trim() ||
    "trustledger-dev-trial-secret"
  );
}

export function trialVerifyCents(): number {
  const raw = process.env.PAYSTACK_TRIAL_VERIFY_CENTS?.trim();
  if (!raw) return TRIAL_VERIFY_CENTS_DEFAULT;
  const n = Number(raw);
  return Number.isFinite(n) && n >= TRIAL_VERIFY_CENTS_DEFAULT
    ? Math.round(n)
    : TRIAL_VERIFY_CENTS_DEFAULT;
}

export function computeBillAt(startedAt = new Date(), trialDays = TRIAL_DAYS): Date {
  const billAt = new Date(startedAt.getTime());
  billAt.setUTCDate(billAt.getUTCDate() + trialDays);
  return billAt;
}

/** Readable temporary password (no ambiguous chars). */
export function generateTempPassword(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export function hashTrialPassword(password: string): string {
  return createHmac("sha256", tokenSecret())
    .update(`tl-trial-pass:${password}`)
    .digest("hex");
}

export function verifyTrialPassword(
  password: string,
  passHash: string,
): boolean {
  const got = Buffer.from(hashTrialPassword(password));
  const expected = Buffer.from(passHash);
  if (got.length !== expected.length) return false;
  try {
    return timingSafeEqual(got, expected);
  } catch {
    return false;
  }
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

export function signTrialActivationToken(
  payload: Omit<SignedTrialToken, "exp"> & { exp?: number },
): string {
  const body: SignedTrialToken = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + TRIAL_DAYS * 24 * 60 * 60,
  };
  const bodyB64 = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", tokenSecret())
    .update(bodyB64)
    .digest();
  return `${bodyB64}.${b64url(sig)}`;
}

export function verifyTrialActivationToken(
  token: string,
): SignedTrialToken | null {
  const [bodyB64, sigB64] = token.split(".");
  if (!bodyB64 || !sigB64) return null;
  const expected = createHmac("sha256", tokenSecret()).update(bodyB64).digest();
  const got = fromB64url(sigB64);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fromB64url(bodyB64).toString("utf8")) as SignedTrialToken;
    if (!parsed.email || !parsed.passHash || !parsed.startedAt) return null;
    if (!isPlanId(parsed.planId)) return null;
    if (typeof parsed.exp === "number" && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
