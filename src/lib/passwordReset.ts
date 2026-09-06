/**
 * Live forgot-password: email a TrustLedger reset link via Resend.
 * Frappe Desk mail is not used — it often never reaches the registered inbox.
 */

import { findCloudLoginUser, setCloudUserPassword } from "@/lib/cloudUserPassword";
import { rateLimitAllow } from "@/lib/formGuard";
import { siteBaseUrl } from "@/lib/hubspot";
import { frappeBase, frappeKeyPair } from "@/lib/leadCapture";
import {
  PASSWORD_RESET_TTL_SECONDS,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/passwordResetToken";
import {
  sendPasswordResetEmail,
  transactionalEmailConfigured,
} from "@/lib/transactionalEmail";
import { isVipShowcaseLiveLoginMailbox } from "@/lib/vipShowcaseAuth";

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "If this email is registered on TrustLedger Cloud, we sent a password reset link. Check inbox and spam.";

export type PasswordResetJson = {
  ok?: boolean;
  error?: string;
  message?: string;
};

function genericOk(): { status: 200; body: PasswordResetJson } {
  return {
    status: 200,
    body: { ok: true, message: PASSWORD_RESET_GENERIC_MESSAGE },
  };
}

export async function requestLivePasswordReset(
  rawEmail: string,
): Promise<{ status: number; body: PasswordResetJson }> {
  const email = (rawEmail || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return {
      status: 400,
      body: { error: "A valid email is required." },
    };
  }

  if (isVipShowcaseLiveLoginMailbox(email)) {
    return genericOk();
  }

  if (!rateLimitAllow(`live-forgot-password-email:${email}`, 5, 15 * 60 * 1000)) {
    return {
      status: 429,
      body: { error: "Too many reset requests. Try again later." },
    };
  }

  if (!transactionalEmailConfigured()) {
    return {
      status: 503,
      body: {
        error:
          "Password reset email is not configured on this deployment. Try again later or ask your Plan Owner to set a temporary password.",
      },
    };
  }

  if (!frappeKeyPair() || !frappeBase()) {
    return {
      status: 503,
      body: {
        error:
          "Password reset cannot reach TrustLedger Cloud on this deployment. Try again later or ask your Plan Owner to set a temporary password.",
      },
    };
  }

  const user = await findCloudLoginUser(email);
  if (!user || !user.enabled) {
    return genericOk();
  }

  let token: string;
  try {
    token = signPasswordResetToken(user.email, undefined, user.name);
  } catch {
    return {
      status: 503,
      body: {
        error:
          "Password reset is not available on this deployment. Try again later.",
      },
    };
  }

  const resetUrl = `${siteBaseUrl()}/login/live/reset?token=${encodeURIComponent(token)}`;
  const mail = await sendPasswordResetEmail({
    to: user.email,
    name: user.firstName,
    resetUrl,
    expiresMinutes: Math.round(PASSWORD_RESET_TTL_SECONDS / 60),
  });
  if (!mail.sent) {
    return {
      status: 502,
      body: {
        error:
          "Could not send the reset email just now. Try again shortly, or ask your Plan Owner to set a temporary password from Team.",
      },
    };
  }

  return genericOk();
}

export async function completeLivePasswordReset(input: {
  token: string;
  newPassword: string;
}): Promise<{ status: number; body: PasswordResetJson }> {
  const password = (input.newPassword || "").trim();
  if (password.length < 8) {
    return {
      status: 400,
      body: { error: "Use a new password of at least 8 characters." },
    };
  }

  const parsed = verifyPasswordResetToken(input.token || "");
  if (!parsed || isVipShowcaseLiveLoginMailbox(parsed.email)) {
    return {
      status: 400,
      body: {
        error:
          "This reset link is invalid or has expired. Request a new one from sign-in.",
      },
    };
  }

  const result = await setCloudUserPassword({
    email: parsed.user,
    newPassword: password,
  });
  if (!result.ok) {
    return {
      status: result.status && result.status >= 400 ? result.status : 502,
      body: {
        error:
          result.status === 404
            ? "No TrustLedger Cloud login exists for that email anymore. Ask your Plan Owner for a seat."
            : "Could not update the password. Request a new reset link and try again.",
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      message: "Password updated. Sign in with your new password.",
    },
  };
}
