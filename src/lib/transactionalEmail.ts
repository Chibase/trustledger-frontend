/**
 * Optional transactional email (Resend).
 * When unset, callers still surface credentials on the success page and CRM lead.
 */

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

export function transactionalEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ sent: boolean; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, detail: "RESEND_API_KEY not set" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "TrustLedger <onboarding@trustledger.co.za>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
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
        detail: `Resend HTTP ${res.status}: ${detail.slice(0, 200)}`,
      };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      detail: err instanceof Error ? err.message : "email failed",
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
