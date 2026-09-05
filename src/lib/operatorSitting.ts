/**
 * OP-1 — operator sitting (not engineering).
 * Vercel env, Google reCAPTCHA, Resend domain verify, Webway CMS, and Desk
 * SMTP cannot be set from this repo. This snapshot makes the leftover obvious.
 */

import {
  recaptchaConfigured,
  recaptchaRequired,
} from "@/lib/formGuard";
import {
  accessEmailVerificationEnabled,
  accessEmailVerificationForcedOff,
  accessVerificationReady,
} from "@/lib/accessVerification";
import {
  isResendTestFrom,
  resendFromAddress,
  transactionalEmailConfigured,
} from "@/lib/transactionalEmail";
import { smokeRequiredForms } from "@/lib/leadFormInventory";
import {
  TRUSTLEDGER_NOREPLY_EMAIL,
  fromAddressUsesCurrentApex,
  fromAddressUsesLegacyApex,
} from "@/lib/security/hosts";
import {
  RECAPTCHA_SITTING_DOMAINS,
  VERCEL_SITTING_VALUES,
  type OperatorSittingHealthInput,
  type OperatorSittingItem,
  type OperatorSittingSnapshot,
} from "@/lib/operatorSitting.constants";

export {
  OPERATOR_SITTING_DOCS,
  RECAPTCHA_SITTING_DOMAINS,
  VERCEL_SITTING_VALUES,
} from "@/lib/operatorSitting.constants";
export type {
  OperatorSittingHealthInput,
  OperatorSittingItem,
  OperatorSittingSnapshot,
  SittingLane,
  SittingStatus,
} from "@/lib/operatorSitting.constants";

export function buildOperatorSitting(
  input: OperatorSittingHealthInput = {},
): OperatorSittingSnapshot {
  const recaptcha = input.recaptcha ?? recaptchaConfigured();
  const recaptchaFailClosed = input.recaptchaFailClosed ?? recaptchaRequired();
  const resend = input.resend ?? transactionalEmailConfigured();
  const accessOn =
    input.accessEmailVerification ?? accessEmailVerificationEnabled();
  const accessReady =
    input.accessVerificationReady ?? accessVerificationReady();
  const from = (input.from ?? resendFromAddress()).trim();
  const fromIsTest = input.fromIsTestSender ?? isResendTestFrom(from);
  const legacyFrom = fromAddressUsesLegacyApex(from);
  const currentFrom = fromAddressUsesCurrentApex(from);
  const forcedOff = accessEmailVerificationForcedOff();

  const items: OperatorSittingItem[] = [
    {
      id: "recaptcha-keys",
      lane: "env",
      label: "reCAPTCHA v3 keys",
      status: recaptcha ? "pass" : "sitting",
      detail: recaptcha
        ? "Keys present — public forms verify v3 tokens."
        : `Create a Google reCAPTCHA v3 key for ${RECAPTCHA_SITTING_DOMAINS.join(" and ")}, set both Vercel keys, Redeploy. Until then, honeypot + tighter rate limit still run. Do not set FORM_REQUIRE_RECAPTCHA=1 before keys exist (that rejects every public lead).`,
      vercelValue: `${VERCEL_SITTING_VALUES.recaptchaSite}\n${VERCEL_SITTING_VALUES.recaptchaSecret}\n${VERCEL_SITTING_VALUES.recaptchaScore}`,
      docs: "docs/LEAD_FORMS.md",
    },
    {
      id: "recaptcha-fail-closed",
      lane: "env",
      label: "reCAPTCHA fail-closed",
      status: recaptcha && recaptchaFailClosed ? "pass" : "sitting",
      detail: recaptchaFailClosed
        ? recaptcha
          ? "Fail-closed on. Still set FORM_REQUIRE_RECAPTCHA=1 so missing keys later reject submissions instead of failing open."
          : "FORM_REQUIRE_RECAPTCHA=1 is on but keys are missing — public forms reject until keys land."
        : recaptcha
          ? "Keys are on but FORM_REQUIRE_RECAPTCHA=0 — emergency bypass. Remove 0 or set 1, then Redeploy."
          : "Set keys first. Then FORM_REQUIRE_RECAPTCHA=1 (sticky fail-closed if keys disappear).",
      vercelValue: VERCEL_SITTING_VALUES.recaptchaRequire,
      docs: "docs/LEAD_FORMS.md",
    },
    {
      id: "access-verify",
      lane: "env",
      label: "Access email verification",
      status: accessReady ? "pass" : "sitting",
      detail: forcedOff
        ? resend
          ? "ACCESS_EMAIL_VERIFICATION=0 despite Resend working — delete 0 or set 1, then Redeploy. Emergency bypass only."
          : "Off via ACCESS_EMAIL_VERIFICATION=0. Fix Resend, then delete 0 or set 1."
        : accessReady
          ? "Live login OTP + trial email verify on."
          : accessOn
            ? "Enabled but Resend is not usable — live OTP will fail."
            : "Off — Production auto-on needs Resend and no ACCESS_EMAIL_VERIFICATION=0.",
      vercelValue: VERCEL_SITTING_VALUES.accessVerifyOn,
      docs: "docs/LAUNCH_GATES_FIX.md",
    },
    {
      id: "resend-from",
      lane: "env",
      label: "Resend From (current apex)",
      status: !fromIsTest && currentFrom && !legacyFrom ? "pass" : "sitting",
      detail: fromIsTest
        ? `From is still the Resend test sender. Verify trustledgersrm.co.za in Resend, set ${VERCEL_SITTING_VALUES.resendFrom}, Redeploy. MX stays Webway.`
        : legacyFrom
          ? `From is still @trustledger.co.za (retired apex). After the current apex is verified in Resend, set ${VERCEL_SITTING_VALUES.resendFrom} and Redeploy. MX stays Webway. Invite mail can keep working on the legacy From until then — this app does not rewrite a working From.`
          : currentFrom
            ? `From uses ${TRUSTLEDGER_NOREPLY_EMAIL}.`
            : `From is ${from || "(empty)"} — prefer TrustLedger <${TRUSTLEDGER_NOREPLY_EMAIL}> after domain verify.`,
      vercelValue: VERCEL_SITTING_VALUES.resendFrom,
      docs: "docs/RESEND_PRODUCTION.md",
    },
    {
      id: "click-smoke",
      lane: "operator",
      label: "Production form click-smoke",
      status: "sitting",
      detail:
        "This repo cannot click Production. Open each public form on the live Vercel host, submit once, confirm CRM Lead in Desk. Inventory is on the Acquisition panel below.",
      docs: "docs/WEBWAY_CUTOVER.md",
    },
    {
      id: "webway",
      lane: "operator",
      label: "Webway CTA paste",
      status: "sitting",
      detail:
        "WordPress on Webway is brochure + buttons only. Paste absolute Vercel CTAs. This repo does not edit CMS.",
      docs: "docs/WEBWAY_CUTOVER.md",
    },
    {
      id: "desk-smtp",
      lane: "operator",
      label: "Desk SMTP / Email Delivery Service",
      status: "sitting",
      detail:
        "Uninstall Frappe Cloud Email Delivery Service if it blocks custom SMTP. Desk Email Account sales@trustledgersrm.co.za via Webway SMTP 465 SSL. Send Test before any Newsletter. Do not blast from Resend OTP keys.",
      docs: "docs/FRAPPE_EMAIL_MARKETING.md",
    },
  ];

  const remainingEnv = items
    .filter((row) => row.lane === "env" && row.status === "sitting")
    .map((row) => row.label);
  const remainingOperator = items
    .filter((row) => row.lane === "operator")
    .map((row) => row.label);

  return {
    envClear: remainingEnv.length === 0,
    operatorClear: false,
    remainingEnv,
    remainingOperator,
    items,
    smokeForms: smokeRequiredForms().map((row) => ({
      id: row.id,
      label: row.label,
      path: row.path,
    })),
  };
}
