/**
 * Shared lead-form guards: honeypot, optional reCAPTCHA v3, light rate limit.
 */

export function honeypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Prefer `tl_hp`; still accept legacy `company_url` from older clients. */
export function readHoneypot(
  body: Record<string, unknown> | null | undefined,
): unknown {
  if (!body) return undefined;
  if ("tl_hp" in body) return body.tl_hp;
  return body.company_url;
}

export function normalizeComment(value: unknown, min = 10): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < min) return null;
  return trimmed.slice(0, 2000);
}

type RateBucket = { count: number; resetAt: number };

const buckets = new Map<string, RateBucket>();

/** Soft in-memory limit (best-effort on serverless). */
export function rateLimitAllow(
  key: string,
  limit = 8,
  windowMs = 15 * 60 * 1000,
): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function recaptchaConfigured(): boolean {
  return Boolean(
    process.env.RECAPTCHA_SECRET_KEY && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  );
}

export function recaptchaRequired(): boolean {
  const raw = (process.env.FORM_REQUIRE_RECAPTCHA || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

type RecaptchaVerifyResult =
  | { ok: true; score: number }
  | { ok: false; reason: string };

export async function verifyRecaptchaToken(
  token: string | undefined,
  action: string,
): Promise<RecaptchaVerifyResult> {
  if (!recaptchaConfigured()) {
    if (recaptchaRequired()) {
      return { ok: false, reason: "reCAPTCHA is required but not configured." };
    }
    return { ok: true, score: 1 };
  }

  if (!token?.trim()) {
    return { ok: false, reason: "Missing reCAPTCHA token." };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY!;
  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
    };

    if (!data.success) {
      return {
        ok: false,
        reason: `reCAPTCHA failed (${(data["error-codes"] || []).join(",") || "unknown"}).`,
      };
    }

    if (data.action && data.action !== action) {
      return { ok: false, reason: "reCAPTCHA action mismatch." };
    }

    const score = typeof data.score === "number" ? data.score : 0;
    const min = Number(process.env.RECAPTCHA_MIN_SCORE || "0.5");
    if (score < min) {
      return { ok: false, reason: "Submission looked automated. Please try again." };
    }

    return { ok: true, score };
  } catch {
    return { ok: false, reason: "Could not verify reCAPTCHA." };
  }
}

export async function assertLeadFormGuards(
  request: Request,
  opts: {
    routeKey: string;
    honeypot?: unknown;
    captchaToken?: unknown;
    captchaAction: string;
  },
): Promise<
  | { ok: true }
  | { ok: false; status: number; error: string; silent?: boolean }
> {
  if (honeypotFilled(opts.honeypot)) {
    // Accept quietly — do not create a lead
    return { ok: false, status: 200, error: "ignored", silent: true };
  }

  const ip = clientIp(request);
  if (!rateLimitAllow(`${opts.routeKey}:${ip}`)) {
    return {
      ok: false,
      status: 429,
      error: "Too many submissions. Please wait a few minutes and try again.",
    };
  }

  const token =
    typeof opts.captchaToken === "string" ? opts.captchaToken : undefined;
  const captcha = await verifyRecaptchaToken(token, opts.captchaAction);
  if (!captcha.ok) {
    return { ok: false, status: 400, error: captcha.reason };
  }

  return { ok: true };
}
