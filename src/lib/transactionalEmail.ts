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
};

export function transactionalEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendTrialWelcomeEmail(
  input: TrialWelcomeEmailInput,
): Promise<{ sent: boolean; detail?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, detail: "RESEND_API_KEY not set" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "TrustLedger <onboarding@trustledger.co.za>";

  const subject = "Your TrustLedger trial is active";
  const text = [
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

  const html = `
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
        subject,
        text,
        html,
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
