/**
 * OP-1 sitting copy + types. Safe for the ops client panel (no Node crypto).
 */

import { TRUSTLEDGER_NOREPLY_EMAIL } from "@/lib/security/hosts";

export const OPERATOR_SITTING_DOCS = "docs/OPERATOR_SITTING.md";

export const RECAPTCHA_SITTING_DOMAINS = [
  "trustledger-frontend-pi.vercel.app",
  "trustledgersrm.co.za",
] as const;

export const VERCEL_SITTING_VALUES = {
  recaptchaSite: "NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<Google reCAPTCHA v3 site key>",
  recaptchaSecret: "RECAPTCHA_SECRET_KEY=<Google reCAPTCHA v3 secret>",
  recaptchaRequire: "FORM_REQUIRE_RECAPTCHA=1",
  recaptchaScore: "RECAPTCHA_MIN_SCORE=0.5",
  accessVerifyOn: "ACCESS_EMAIL_VERIFICATION=1",
  resendFrom: `RESEND_FROM_EMAIL=TrustLedger <${TRUSTLEDGER_NOREPLY_EMAIL}>`,
} as const;

export type SittingLane = "env" | "operator";
export type SittingStatus = "pass" | "sitting";

export type OperatorSittingItem = {
  id: string;
  lane: SittingLane;
  label: string;
  status: SittingStatus;
  detail: string;
  vercelValue?: string;
  docs: string;
};

export type OperatorSittingSnapshot = {
  envClear: boolean;
  /** Always false — Webway / Desk / click-smoke are not verifiable here. */
  operatorClear: false;
  remainingEnv: string[];
  remainingOperator: string[];
  items: OperatorSittingItem[];
  smokeForms: Array<{ id: string; label: string; path: string }>;
};

export type OperatorSittingHealthInput = {
  recaptcha?: boolean;
  recaptchaFailClosed?: boolean;
  accessEmailVerification?: boolean;
  accessVerificationReady?: boolean;
  resend?: boolean;
  from?: string;
  fromIsTestSender?: boolean;
};
