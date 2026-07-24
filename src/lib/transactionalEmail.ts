import {
  cleanSecret,
  byteStringHeaderErrorMessage,
} from "@/lib/leadCapture";

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

/**
 * Resend API key from Vercel.
 * Prefer `RESEND_API_KEY`. Also accept common misnames (`RESEND`, `RESEND_KEY`).
 * The Resend dashboard *key name* (e.g. "resend") is cosmetic and ignored.
 */
export function resendApiKey(): string {
  return cleanSecret(
    process.env.RESEND_API_KEY ||
      process.env.RESEND_KEY ||
      process.env.RESEND ||
      "",
  );
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

export function transactionalEmailConfigured(): boolean {
  return Boolean(resendApiKey());
}

function explainResendFailure(status: number, body: string): string {
  const snippet = body.slice(0, 240);
  const lower = body.toLowerCase();
  if (status === 401 || /api key is invalid|missing_api_key|invalid_api_key/i.test(body)) {
    return (
      "Resend rejected the API key. On Vercel Production set RESEND_API_KEY to the full re_… secret " +
      "(not the dashboard key name), then Redeploy. " +
      `Detail: ${snippet}`
    );
  }
  if (
    /only send testing emails|verify a domain|invalid.*from/i.test(lower) ||
    status === 403
  ) {
    return (
      "Resend blocked the From address. Set RESEND_FROM_EMAIL to a verified domain sender " +
      "(or temporarily TrustLedger <onboarding@resend.dev>), verify trustledger.co.za in Resend → Domains, Redeploy. " +
      `Detail: ${snippet}`
    );
  }
  return `Resend HTTP ${status}: ${snippet}`;
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ sent: boolean; detail?: string }> {
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

  const from = resendFromAddress();

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
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        sent: false,
        detail: explainResendFailure(res.status, detail),
      };
    }
    return { sent: true };
  } catch (err) {
    const byteMsg = byteStringHeaderErrorMessage(err);
    return {
      sent: false,
      detail: byteMsg || (err instanceof Error ? err.message : "email failed"),
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
