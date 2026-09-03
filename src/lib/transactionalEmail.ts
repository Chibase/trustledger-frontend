import {
  cleanSecret,
  byteStringHeaderErrorMessage,
} from "@/lib/leadCapture";
import {
  TRUSTLEDGER_APEX_DOMAIN,
  TRUSTLEDGER_LEGACY_APEX_DOMAIN,
  TRUSTLEDGER_NOREPLY_EMAIL,
} from "@/lib/security/hosts";

export type TrialWelcomeEmailInput = {
  to: string;
  name: string;
  tempPassword: string;
  planLabel: string;
  trialEndsAt: string;
  loginUrl: string;
  workspaceUrl: string;
  /** When true, buyer must open workspaceUrl (activation link) before access. */
  requireEmailVerification?: boolean;
};

export type LoginOtpEmailInput = {
  to: string;
  name?: string;
  code: string;
  expiresMinutes: number;
};

const RESEND_KEY_ENV_CANDIDATES = [
  "RESEND_API_KEY",
  "RESEND_KEY",
  "RESEND",
] as const;

/** Real Resend secrets are `re_` + a long token — reject stubs like `re_` alone. */
const RESEND_KEY_MIN_LENGTH = 20;

function isPlausibleResendKey(value: string): boolean {
  return value.startsWith("re_") && value.length >= RESEND_KEY_MIN_LENGTH;
}

/** Normalize pasted secrets: strip Bearer, quotes, whitespace, junk. */
function normalizeResendSecret(raw: string | undefined): string {
  let value = cleanSecret(raw);
  // Accidental "Bearer re_…" paste would become Authorization: Bearer Bearer re_…
  value = value.replace(/^Bearer\s+/i, "");
  value = cleanSecret(value);
  return value;
}

/**
 * Resend API key from Vercel.
 * Prefers a plausible `re_…` secret. Among those, prefers RESEND_API_KEY.
 * The Resend dashboard *key name* (e.g. "resend") is cosmetic and ignored.
 * Truncated stubs (`re_` only) are treated as missing.
 */
export function resendApiKey(): string {
  const found: Array<{ source: string; value: string }> = [];
  for (const name of RESEND_KEY_ENV_CANDIDATES) {
    const value = normalizeResendSecret(process.env[name]);
    if (value) found.push({ source: name, value });
  }
  const plausible = found.filter((row) => isPlausibleResendKey(row.value));
  if (plausible.length) {
    return (
      plausible.find((row) => row.source === "RESEND_API_KEY")?.value ||
      plausible[0].value
    );
  }
  return "";
}

export function resendApiKeySource(): string | null {
  const key = resendApiKey();
  if (!key) return null;
  for (const name of RESEND_KEY_ENV_CANDIDATES) {
    if (normalizeResendSecret(process.env[name]) === key) return name;
  }
  return "RESEND_API_KEY";
}

/**
 * From address. Prefer verified TrustLedger domain when set.
 * Fallback `onboarding@resend.dev` works for Resend test sends (often only to
 * the Resend account owner until a domain is verified).
 */
export function resendFromAddress(): string {
  const raw =
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    "TrustLedger <onboarding@resend.dev>";
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\u2026/g, "");
}

export function isResendTestFrom(from = resendFromAddress()): boolean {
  return /@resend\.dev\b/i.test(from);
}

type ResendDomainRow = {
  name?: string;
  status?: string;
};

let cachedVerifiedFrom:
  | { at: number; from: string | null; domains: string[] }
  | null = null;
const DOMAIN_CACHE_MS = 5 * 60 * 1000;

/** List domains on the Resend account (for From resolution + health). */
export async function listResendDomains(): Promise<{
  ok: boolean;
  domains: ResendDomainRow[];
  detail?: string;
}> {
  const apiKey = resendApiKey();
  if (!apiKey) return { ok: false, domains: [], detail: "RESEND_API_KEY missing" };
  try {
    const res = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "TrustLedger/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        domains: [],
        detail: text.slice(0, 160) || `HTTP ${res.status}`,
      };
    }
    const json = JSON.parse(text) as { data?: ResendDomainRow[] };
    return { ok: true, domains: json.data || [] };
  } catch (err) {
    return {
      ok: false,
      domains: [],
      detail: err instanceof Error ? err.message : "domains probe failed",
    };
  }
}

function isSendCapableResendDomainStatus(status: string | undefined): boolean {
  const s = String(status || "").toLowerCase();
  // Resend: verified = full; partially_verified = often send-capable while receive lags.
  return s === "verified" || s === "partially_verified";
}

/**
 * Resolve the From address for outbound mail.
 * 1) Explicit RESEND_FROM_EMAIL / RESEND_FROM
 * 2) Else first verified Resend domain → TrustLedger <noreply@domain>
 * 3) Else onboarding@resend.dev (test-only)
 */
export async function resolveResendFromAddress(): Promise<{
  from: string;
  source: "env" | "verified-domain" | "test-fallback";
  verifiedDomains: string[];
}> {
  const explicit = (
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    ""
  )
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\u2026/g, "");
  if (explicit && !isResendTestFrom(explicit)) {
    return { from: explicit, source: "env", verifiedDomains: [] };
  }

  const now = Date.now();
  if (cachedVerifiedFrom && now - cachedVerifiedFrom.at < DOMAIN_CACHE_MS) {
    if (cachedVerifiedFrom.from) {
      return {
        from: cachedVerifiedFrom.from,
        source: "verified-domain",
        verifiedDomains: cachedVerifiedFrom.domains,
      };
    }
    if (explicit) {
      return {
        from: explicit,
        source: "test-fallback",
        verifiedDomains: cachedVerifiedFrom.domains,
      };
    }
    return {
      from: "TrustLedger <onboarding@resend.dev>",
      source: "test-fallback",
      verifiedDomains: cachedVerifiedFrom.domains,
    };
  }

  const listed = await listResendDomains();
  // Do not cache empty results from a failed domains probe — retry next send.
  if (!listed.ok) {
    if (explicit) {
      return {
        from: explicit,
        source: "test-fallback",
        verifiedDomains: [],
      };
    }
    return {
      from: "TrustLedger <onboarding@resend.dev>",
      source: "test-fallback",
      verifiedDomains: [],
    };
  }

  const verified = listed.domains
    .filter((d) => isSendCapableResendDomainStatus(d.status) && d.name)
    .map((d) => d.name!.toLowerCase());
  // Prefer the current marketing apex, then the retired apex during DNS cutover.
  const preferred =
    verified.find((n) => n === TRUSTLEDGER_APEX_DOMAIN) ||
    verified.find((n) => n.endsWith(`.${TRUSTLEDGER_APEX_DOMAIN}`)) ||
    verified.find((n) => n === TRUSTLEDGER_LEGACY_APEX_DOMAIN) ||
    verified.find((n) => n.endsWith(`.${TRUSTLEDGER_LEGACY_APEX_DOMAIN}`)) ||
    verified[0] ||
    null;
  const autoFrom = preferred
    ? `TrustLedger <noreply@${preferred}>`
    : null;
  cachedVerifiedFrom = {
    at: now,
    from: autoFrom,
    domains: verified,
  };

  if (explicit && !autoFrom) {
    return {
      from: explicit,
      source: "test-fallback",
      verifiedDomains: verified,
    };
  }
  if (autoFrom) {
    // Prefer verified domain over an env that still points at resend.dev.
    return {
      from: autoFrom,
      source: "verified-domain",
      verifiedDomains: verified,
    };
  }
  // Prefer explicit env even if test, else default test sender.
  return {
    from: explicit || "TrustLedger <onboarding@resend.dev>",
    source: "test-fallback",
    verifiedDomains: verified,
  };
}

/** True when invite/OTP mail can reach arbitrary inboxes (not Resend test-only). */
export async function inviteEmailDeliveryReady(): Promise<{
  ready: boolean;
  from: string;
  source: "env" | "verified-domain" | "test-fallback";
  verifiedDomains: string[];
  reason?: string;
}> {
  if (!transactionalEmailConfigured()) {
    return {
      ready: false,
      from: resendFromAddress(),
      source: "test-fallback",
      verifiedDomains: [],
      reason: "RESEND_API_KEY missing or invalid",
    };
  }
  const resolved = await resolveResendFromAddress();
  if (isResendTestFrom(resolved.from)) {
    return {
      ready: false,
      from: resolved.from,
      source: resolved.source,
      verifiedDomains: resolved.verifiedDomains,
      reason:
        `From address is still onboarding@resend.dev (Resend test sender). Verify ${TRUSTLEDGER_APEX_DOMAIN} in Resend and set RESEND_FROM_EMAIL to TrustLedger <${TRUSTLEDGER_NOREPLY_EMAIL}>, then Redeploy — or add a verified domain so the app can auto-use noreply@that-domain.`,
    };
  }
  return {
    ready: true,
    from: resolved.from,
    source: resolved.source,
    verifiedDomains: resolved.verifiedDomains,
  };
}

export function transactionalEmailConfigured(): boolean {
  return isPlausibleResendKey(resendApiKey());
}

/** Safe diagnostics for /api/health — never includes the secret. */
export function resendPublicDiagnostics(): {
  configured: boolean;
  envSource: string | null;
  keyStartsWithRe: boolean;
  keyLength: number;
  keyPrefix: string | null;
  from: string;
  /** True when an env var is set but too short / not a real re_ secret. */
  keyLooksTruncated: boolean;
  fromIsTestSender: boolean;
} {
  const rawCandidates = RESEND_KEY_ENV_CANDIDATES.map((name) =>
    normalizeResendSecret(process.env[name]),
  ).filter(Boolean);
  const key = resendApiKey();
  const longestRaw = rawCandidates.reduce((a, b) => (a.length >= b.length ? a : b), "");
  const from = resendFromAddress();
  return {
    configured: Boolean(key),
    envSource: resendApiKeySource(),
    keyStartsWithRe: key.startsWith("re_") || longestRaw.startsWith("re_"),
    keyLength: key.length || longestRaw.length,
    keyPrefix: key
      ? `${key.slice(0, 3)}…`
      : longestRaw
        ? `${longestRaw.slice(0, 3)}…`
        : null,
    from,
    keyLooksTruncated: Boolean(longestRaw) && !isPlausibleResendKey(longestRaw),
    fromIsTestSender: isResendTestFrom(from),
  };
}

/** Probe Resend auth without sending mail (GET /domains). */
export async function probeResendAuth(): Promise<{
  ok: boolean;
  status?: number;
  detail?: string;
}> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    return { ok: false, detail: "RESEND_API_KEY missing" };
  }
  if (!apiKey.startsWith("re_")) {
    return { ok: false, detail: "key must start with re_" };
  }
  try {
    const res = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "TrustLedger/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) return { ok: true, status: res.status };
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      detail: body.slice(0, 160) || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "Resend probe failed",
    };
  }
}

function explainResendFailure(
  status: number,
  body: string,
  fromUsed?: string,
): string {
  const snippet = body.slice(0, 240);
  const diag = resendPublicDiagnostics();
  const from = fromUsed || diag.from;
  const hint = `env=${diag.envSource || "none"} len=${diag.keyLength} prefix=${diag.keyPrefix || "none"} from=${from}`;
  const lower = body.toLowerCase();
  if (
    status === 401 ||
    /api key is invalid|missing_api_key|invalid_api_key/i.test(body)
  ) {
    return (
      "Resend rejected the API key (often a revoked key still on Vercel, or a bad paste). " +
      "In Vercel Production: delete RESEND_API_KEY, create a new key in Resend, paste only the re_… secret, Redeploy. " +
      `Or set ACCESS_EMAIL_VERIFICATION=0 temporarily. (${hint}) Detail: ${snippet}`
    );
  }
  if (
    /only send testing emails|verify a domain|invalid.*from|domain is not verified/i.test(
      lower,
    ) ||
    status === 403 ||
    isResendTestFrom(from)
  ) {
    return (
      "Resend cannot deliver to that inbox yet: the From address is still on the test sender " +
      "(onboarding@resend.dev) or the domain is not verified. " +
      "In Resend, verify " +
      TRUSTLEDGER_APEX_DOMAIN +
      " (or your mail domain), then set " +
      `RESEND_FROM_EMAIL to TrustLedger <${TRUSTLEDGER_NOREPLY_EMAIL}> (or another verified address) and Redeploy. ` +
      "Until then, Resend only delivers test mail to the Resend account owner. " +
      `(${hint}) Detail: ${snippet}`
    );
  }
  return `Resend HTTP ${status}: ${snippet} (${hint})`;
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<{ sent: boolean; detail?: string; from?: string }> {
  const apiKey = resendApiKey();
  if (!apiKey) {
    return {
      sent: false,
      detail:
        "RESEND_API_KEY not set on this deployment. Add it under Vercel → Production env, then Redeploy.",
    };
  }
  if (!apiKey.startsWith("re_")) {
    return {
      sent: false,
      detail:
        "RESEND_API_KEY must start with re_ (paste the secret value, not the key display name).",
    };
  }

  const resolved = await resolveResendFromAddress();
  const from = resolved.from;
  const replyTo = input.replyTo?.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "TrustLedger/1.0",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(replyTo && replyTo.includes("@") ? { reply_to: replyTo } : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        sent: false,
        detail: explainResendFailure(res.status, detail, from),
        from,
      };
    }
    return { sent: true, from };
  } catch (err) {
    const byteMsg = byteStringHeaderErrorMessage(err);
    return {
      sent: false,
      detail: byteMsg || (err instanceof Error ? err.message : "email failed"),
      from,
    };
  }
}

export async function sendTrialWelcomeEmail(
  input: TrialWelcomeEmailInput,
): Promise<{ sent: boolean; detail?: string }> {
  const verify = Boolean(input.requireEmailVerification);
  const subject = verify
    ? "Verify your email to open TrustLedger"
    : "Your TrustLedger trial is active";

  const text = verify
    ? [
        `Hi ${input.name},`,
        "",
        `Thank you for subscribing to TrustLedger (${input.planLabel}).`,
        "Verify your email to open your 14-day workspace. Your card is on file and will only be charged when the trial ends, unless you cancel beforehand.",
        "",
        `Work email: ${input.to}`,
        `Temporary password: ${input.tempPassword}`,
        "",
        `Verify & open workspace: ${input.workspaceUrl}`,
        `Sign in later (after verify): ${input.loginUrl}`,
        "",
        `Trial ends: ${input.trialEndsAt}`,
        "",
        "— TrustLedger",
      ].join("\n")
    : [
        `Hi ${input.name},`,
        "",
        `Thank you for subscribing to TrustLedger (${input.planLabel}).`,
        "Your 14-day trial is active now. Your card is on file and will only be charged when the trial ends, unless you cancel beforehand.",
        "",
        `Work email: ${input.to}`,
        `Temporary password: ${input.tempPassword}`,
        "",
        "Please change this password when you first sign in.",
        "",
        `Open workspace: ${input.workspaceUrl}`,
        `Sign in later: ${input.loginUrl}`,
        "",
        `Trial ends: ${input.trialEndsAt}`,
        "",
        "— TrustLedger",
      ].join("\n");

  const html = verify
    ? `
    <p>Hi ${escapeHtml(input.name)},</p>
    <p>Thank you for subscribing to <strong>TrustLedger</strong> (${escapeHtml(input.planLabel)}).</p>
    <p><strong>Verify your email</strong> to open your 14-day workspace. Your banking details are on file for the charge at the end of the trial — cancel anytime before then to stop billing.</p>
    <p>
      <strong>Work email:</strong> ${escapeHtml(input.to)}<br/>
      <strong>Temporary password:</strong> <code>${escapeHtml(input.tempPassword)}</code>
    </p>
    <p><a href="${escapeAttr(input.workspaceUrl)}"><strong>Verify &amp; open workspace</strong></a></p>
    <p style="color:#666;font-size:13px">Trial ends: ${escapeHtml(input.trialEndsAt)}</p>
    <p>— TrustLedger</p>
  `
    : `
    <p>Hi ${escapeHtml(input.name)},</p>
    <p>Thank you for subscribing to <strong>TrustLedger</strong> (${escapeHtml(input.planLabel)}).</p>
    <p>Your 14-day trial is <strong>active now</strong>. Your banking details are on file for the charge at the end of the trial — cancel anytime before then to stop billing.</p>
    <p>
      <strong>Work email:</strong> ${escapeHtml(input.to)}<br/>
      <strong>Temporary password:</strong> <code>${escapeHtml(input.tempPassword)}</code>
    </p>
    <p>Please change this password when you first sign in.</p>
    <p>
      <a href="${escapeAttr(input.workspaceUrl)}">Open your workspace</a>
      ·
      <a href="${escapeAttr(input.loginUrl)}">Sign in later</a>
    </p>
    <p style="color:#666;font-size:13px">Trial ends: ${escapeHtml(input.trialEndsAt)}</p>
    <p>— TrustLedger</p>
  `;

  return sendResendEmail({ to: input.to, subject, text, html });
}

export async function sendLoginOtpEmail(
  input: LoginOtpEmailInput,
): Promise<{ sent: boolean; detail?: string }> {
  const name = input.name?.trim() || "there";
  const subject = "Your TrustLedger sign-in code";
  const text = [
    `Hi ${name},`,
    "",
    `Your TrustLedger verification code is: ${input.code}`,
    "",
    `It expires in ${input.expiresMinutes} minutes. If you did not try to sign in, ignore this email.`,
    "",
    "— TrustLedger",
  ].join("\n");
  const html = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Your TrustLedger verification code is:</p>
    <p style="font-size:28px;letter-spacing:0.2em;font-weight:700"><code>${escapeHtml(input.code)}</code></p>
    <p style="color:#666;font-size:13px">Expires in ${input.expiresMinutes} minutes. If you did not try to sign in, ignore this email.</p>
    <p>— TrustLedger</p>
  `;
  return sendResendEmail({ to: input.to, subject, text, html });
}

export type AssessmentOtpEmailInput = {
  to: string;
  name?: string;
  code: string;
  expiresMinutes: number;
  score?: number;
  riskLabel?: string;
};

/** OTP to unlock the public SRM readiness report hub. */
export async function sendAssessmentOtpEmail(
  input: AssessmentOtpEmailInput,
): Promise<{ sent: boolean; detail?: string }> {
  const name = input.name?.trim() || "there";
  const subject = "Your TrustLedger readiness report code";
  const scoreLine =
    typeof input.score === "number" && input.riskLabel
      ? `Your diagnostic scored ${input.score}/100 (${input.riskLabel}). `
      : "";
  const text = [
    `Hi ${name},`,
    "",
    `${scoreLine}Enter this code to open your SRM readiness report and next steps:`,
    "",
    input.code,
    "",
    `It expires in ${input.expiresMinutes} minutes. If you did not request a readiness report, ignore this email.`,
    "",
    "— TrustLedger",
  ].join("\n");
  const html = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>${escapeHtml(scoreLine)}Enter this code to open your <strong>SRM readiness report</strong> and choose how to close the gaps:</p>
    <p style="font-size:28px;letter-spacing:0.2em;font-weight:700"><code>${escapeHtml(input.code)}</code></p>
    <p style="color:#666;font-size:13px">Expires in ${input.expiresMinutes} minutes. If you did not request a readiness report, ignore this email.</p>
    <p>— TrustLedger</p>
  `;
  return sendResendEmail({ to: input.to, subject, text, html });
}

export type OrgInviteEmailInput = {
  to: string;
  inviteeName: string;
  orgName: string;
  ownerName: string;
  ownerEmail?: string;
  roleLabel: string;
  deskLabel: string;
  planLabel: string;
  acceptUrl: string;
  rejectUrl: string;
};

/** Notify invitee — Accept or Decline. */
export async function sendOrgInviteEmail(
  input: OrgInviteEmailInput,
): Promise<{ sent: boolean; detail?: string; from?: string }> {
  const subject = `${input.ownerName} invited you to ${input.orgName} on TrustLedger`;
  const text = [
    `Hi ${input.inviteeName},`,
    "",
    `${input.ownerName} invited you to join ${input.orgName} on TrustLedger.`,
    "",
    `Role: ${input.roleLabel}`,
    `Desk: ${input.deskLabel}`,
    `Plan: ${input.planLabel}`,
    "",
    `Accept invite: ${input.acceptUrl}`,
    `Decline invite: ${input.rejectUrl}`,
    "",
    "This link expires in 14 days. If you were not expecting this email, you can decline or ignore it.",
    "",
    "— TrustLedger",
  ].join("\n");
  const html = `
    <p>Hi ${escapeHtml(input.inviteeName)},</p>
    <p><strong>${escapeHtml(input.ownerName)}</strong> invited you to join
      <strong>${escapeHtml(input.orgName)}</strong> on TrustLedger.</p>
    <p>
      <strong>Role:</strong> ${escapeHtml(input.roleLabel)}<br/>
      <strong>Desk:</strong> ${escapeHtml(input.deskLabel)}<br/>
      <strong>Plan:</strong> ${escapeHtml(input.planLabel)}
    </p>
    <p style="margin:24px 0">
      <a href="${escapeAttr(input.acceptUrl)}"
         style="display:inline-block;background:#0e7c66;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">
        Accept invite
      </a>
      &nbsp;&nbsp;
      <a href="${escapeAttr(input.rejectUrl)}"
         style="display:inline-block;border:1px solid #d7dee4;color:#12202a;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">
        Decline
      </a>
    </p>
    <p style="color:#666;font-size:13px">Link expires in 14 days. If you were not expecting this, decline or ignore.</p>
    <p>— TrustLedger</p>
  `;
  return sendResendEmail({
    to: input.to,
    subject,
    text,
    html,
    replyTo: input.ownerEmail,
  });
}

export type TempPasswordEmailInput = {
  to: string;
  name: string;
  temporaryPassword: string;
  loginUrl: string;
  issuedByName: string;
  issuedByEmail: string;
};

/** Plan Owner issued a temporary Cloud password. */
export async function sendTempPasswordEmail(
  input: TempPasswordEmailInput,
): Promise<{ sent: boolean; detail?: string }> {
  const subject = "Your TrustLedger temporary password";
  const text = [
    `Hi ${input.name},`,
    "",
    `${input.issuedByName} (${input.issuedByEmail}) set a temporary password for your TrustLedger Cloud login.`,
    "",
    `Temporary password: ${input.temporaryPassword}`,
    `Sign in: ${input.loginUrl}`,
    "",
    "Change this password after you sign in.",
    "",
    "— TrustLedger",
  ].join("\n");
  const html = `
    <p>Hi ${escapeHtml(input.name)},</p>
    <p><strong>${escapeHtml(input.issuedByName)}</strong>
      (${escapeHtml(input.issuedByEmail)}) set a temporary password for your
      TrustLedger Cloud login.</p>
    <p><strong>Temporary password:</strong>
      <code>${escapeHtml(input.temporaryPassword)}</code></p>
    <p><a href="${escapeAttr(input.loginUrl)}">Sign in to TrustLedger</a></p>
    <p style="color:#666;font-size:13px">Change this password after you sign in.</p>
    <p>— TrustLedger</p>
  `;
  return sendResendEmail({
    to: input.to,
    subject,
    text,
    html,
    replyTo: input.issuedByEmail,
  });
}

export type OrgInviteDecisionEmailInput = {
  to: string;
  ownerName: string;
  inviteeName: string;
  inviteeEmail: string;
  orgName: string;
  decision: "accepted" | "rejected";
  settingsUrl: string;
};

/** Notify Plan Owner when invitee accepts or declines. */
export async function sendOrgInviteDecisionEmail(
  input: OrgInviteDecisionEmailInput,
): Promise<{ sent: boolean; detail?: string }> {
  const verb = input.decision === "accepted" ? "accepted" : "declined";
  const subject = `${input.inviteeName} ${verb} your TrustLedger invite`;
  const text = [
    `Hi ${input.ownerName},`,
    "",
    `${input.inviteeName} (${input.inviteeEmail}) ${verb} the invite to ${input.orgName}.`,
    "",
    `Update seats on this device: ${input.settingsUrl}`,
    "",
    "— TrustLedger",
  ].join("\n");
  const html = `
    <p>Hi ${escapeHtml(input.ownerName)},</p>
    <p><strong>${escapeHtml(input.inviteeName)}</strong>
      (${escapeHtml(input.inviteeEmail)}) <strong>${verb}</strong> the invite to
      <strong>${escapeHtml(input.orgName)}</strong>.</p>
    <p><a href="${escapeAttr(input.settingsUrl)}">Update Team / Seats on this device</a></p>
    <p>— TrustLedger</p>
  `;
  return sendResendEmail({ to: input.to, subject, text, html });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
