/**
 * Operational delivery readiness — Steps 1→GO LIVE for Cloud-backed customers.
 * See docs/OPERATIONAL_DELIVERY.md and ADR-032.
 */

import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  getPlatformOperatorEmails,
  isPlatformOperatorOnly,
} from "@/lib/platformOperator";
import { frappeBase, frappeKeyPair } from "@/lib/leadCapture";
import { paystackConfigured } from "@/lib/paystackServer";
import { isFrappeAutoProvisionEnabled } from "@/lib/provisionOwnerCloud";
import {
  recaptchaConfigured,
  recaptchaRequired,
} from "@/lib/formGuard";
import { transactionalEmailConfigured } from "@/lib/transactionalEmail";
import {
  accessEmailVerificationEnabled,
  accessVerificationReady,
} from "@/lib/accessVerification";
import {
  OPERATIONAL_STEPS,
  STEP1_DESK_CHECKLIST,
  STEP2_DESK_CHECKLIST,
  STEP3_DESK_CHECKLIST,
  STEP4_DESK_CHECKLIST,
  STEP5_DESK_CHECKLIST,
  GO_LIVE_DESK_CHECKLIST,
  type OperationalStepId,
  type StepLaneStatus,
} from "@/lib/operationalDelivery.constants";

export type {
  OperationalStepId,
  StepLaneStatus,
} from "@/lib/operationalDelivery.constants";
export {
  OPERATIONAL_STEPS,
  OPERATIONAL_STEP1_REQUIRED_LABELS,
  STEP1_DESK_CHECKLIST,
  STEP2_DESK_CHECKLIST,
  STEP3_DESK_CHECKLIST,
  STEP4_DESK_CHECKLIST,
  STEP5_DESK_CHECKLIST,
  GO_LIVE_DESK_CHECKLIST,
} from "@/lib/operationalDelivery.constants";

type GateDef = {
  id: string;
  label: string;
  requiredForStep1: boolean;
  evaluate: () => { pass: boolean; detail: string };
};

const GATE_DEFS: GateDef[] = [
  {
    id: "lockdown",
    label: "Buyer live lockdown lifted",
    // Historical Step 1 required ON; after Step 4 we require OFF for buyers.
    requiredForStep1: false,
    evaluate: () => {
      const on = isPlatformOperatorOnly();
      return {
        pass: !on,
        detail: on
          ? "ON — buyers blocked from public live login"
          : "OFF — buyers may /login/live (Ops still allowlist)",
      };
    },
  },
  {
    id: "allowlist",
    label: "PLATFORM_OPERATOR_EMAILS set",
    requiredForStep1: true,
    evaluate: () => {
      const n = getPlatformOperatorEmails().length;
      return {
        pass: n > 0,
        detail: n > 0 ? `${n} identity(ies)` : "empty — fail closed",
      };
    },
  },
  {
    id: "issuance",
    label: "FRAPPE_OWNER_ISSUANCE=1",
    requiredForStep1: true,
    evaluate: () => {
      const on = isFrappeOwnerIssuanceEnabled();
      return {
        pass: on,
        detail: on ? "Operator provision tools enabled" : "Set on Vercel for Step 1",
      };
    },
  },
  {
    id: "frappe",
    label: "Frappe API base + keys",
    requiredForStep1: true,
    evaluate: () => {
      const pair = frappeKeyPair();
      const base = frappeBase();
      const pass = Boolean(pair && base);
      return {
        pass,
        detail: pass ? base : "Missing FRAPPE_BASE_URL or API key pair",
      };
    },
  },
  {
    id: "paystack",
    label: "Paystack keys (later steps)",
    requiredForStep1: false,
    evaluate: () => {
      const on = paystackConfigured();
      return {
        pass: on,
        detail: on
          ? "Configured"
          : "Needed for Step 3 auto-provision / billing",
      };
    },
  },
  {
    id: "autoProvision",
    label: "FRAPPE_AUTO_PROVISION=1",
    requiredForStep1: false,
    evaluate: () => {
      const on = isFrappeAutoProvisionEnabled();
      return {
        pass: on,
        detail: on
          ? "Paystack → Cloud Owner enabled"
          : "Set on Vercel so paid buyers get Customer+User",
      };
    },
  },
  {
    id: "cronSecret",
    label: "CRON_SECRET set (day-14)",
    requiredForStep1: false,
    evaluate: () => {
      const on = Boolean(process.env.CRON_SECRET?.trim());
      return {
        pass: on,
        detail: on
          ? "Cron auth configured"
          : "Set CRON_SECRET or use Ops Finance Charge due",
      };
    },
  },
  {
    id: "resend",
    label: "RESEND_API_KEY (welcome email)",
    requiredForStep1: false,
    evaluate: () => {
      const on = transactionalEmailConfigured();
      return {
        pass: on,
        detail: on
          ? "Trial welcome email can send"
          : "Unset — credentials still show on /pay/success",
      };
    },
  },
  {
    id: "recaptcha",
    label: "reCAPTCHA v3 (form spam)",
    requiredForStep1: false,
    evaluate: () => {
      const on = recaptchaConfigured();
      const required = recaptchaRequired();
      return {
        pass: on,
        detail: on
          ? required
            ? "Keys set · FORM_REQUIRE_RECAPTCHA=1 (fail closed)"
            : "Keys set · tokens verified on public forms"
          : "Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY + RECAPTCHA_SECRET_KEY (+ FORM_REQUIRE_RECAPTCHA=1)",
      };
    },
  },
  {
    id: "accessVerify",
    label: "Access email verification",
    requiredForStep1: false,
    evaluate: () => {
      const enabled = accessEmailVerificationEnabled();
      const ready = accessVerificationReady();
      if (!enabled) {
        return {
          pass: false,
          detail:
            "Off — set RESEND_API_KEY (auto-on in Production) or ACCESS_EMAIL_VERIFICATION=1",
        };
      }
      return {
        pass: ready,
        detail: ready
          ? "Live login OTP + trial email verify on"
          : "Enabled but RESEND_API_KEY missing — live login will 503",
      };
    },
  },
];

/** Re-export shape used by Ops panel footnotes (labels only). */
export const OPERATIONAL_GATE_CHECKS = GATE_DEFS.map(
  ({ id, label, requiredForStep1 }) => ({ id, label, requiredForStep1 }),
);

export type OperationalReadinessPayload = {
  ok: true;
  generatedAt: string;
  activeStepId: OperationalStepId;
  steps: Array<{
    id: OperationalStepId;
    title: string;
    status: StepLaneStatus;
    summary: string;
  }>;
  env: {
    platformOperatorOnly: boolean;
    frappeOwnerIssuance: boolean;
    frappeConfigured: boolean;
    paystackConfigured: boolean;
  };
  gateChecks: Array<{
    id: string;
    label: string;
    required: boolean;
    pass: boolean;
    detail: string;
  }>;
  blockedReasons: string[];
  goLiveReady: boolean;
  deskChecklist: string[];
  /** Short git SHA from the Vercel deployment (null outside Vercel). */
  deploySha: string | null;
  /** First-days hardening (spam, email, cron, auto-provision). */
  launchHardening: {
    ready: boolean;
    missing: string[];
  };
  docs: {
    path: string;
    frappeSoT: string;
  };
  summary: string;
};

/** Server-side snapshot — Desk/smoke remain manual (never auto-green). */
export function buildOperationalReadiness(): OperationalReadinessPayload {
  const gateChecks = GATE_DEFS.map((check) => {
    const result = check.evaluate();
    return {
      id: check.id,
      label: check.label,
      required: check.requiredForStep1,
      pass: result.pass,
      detail: result.detail,
    };
  });

  const step1EnvReady = gateChecks
    .filter((c) => c.required)
    .every((c) => c.pass);

  /** Steps 1–5 complete — ladder advances to GO LIVE criteria. */
  const step1Complete = true;
  const step2Complete = true;
  const step3Complete = true;
  const step4Complete = true;
  const step5Complete = true;

  const lockdownLifted = !isPlatformOperatorOnly();
  const goLiveReady = step5Complete && step1EnvReady && lockdownLifted;

  const blockedReasons = [
    ...gateChecks
      .filter((c) => c.required && !c.pass)
      .map((c) => `${c.label}: ${c.detail}`),
    ...(!lockdownLifted
      ? [
          "Buyer live lockdown lifted: ON — set PLATFORM_OPERATOR_ONLY=0 on Vercel, then redeploy",
        ]
      : []),
  ];

  const activeStepId: OperationalStepId = !step1EnvReady
    ? "1"
    : !step5Complete
      ? "5"
      : "go";

  const steps = OPERATIONAL_STEPS.map((step) => {
    let status: StepLaneStatus = "blocked";
    if (step.id === "1") {
      status = step1Complete ? "done" : step1EnvReady ? "active" : "blocked";
    } else if (step.id === "2") {
      status = step2Complete
        ? "done"
        : step1Complete && step1EnvReady
          ? "active"
          : "blocked";
    } else if (step.id === "3") {
      status = step3Complete
        ? "done"
        : step2Complete && step1EnvReady
          ? "active"
          : "blocked";
    } else if (step.id === "4") {
      status = step4Complete
        ? "done"
        : step3Complete && step1EnvReady
          ? "active"
          : "blocked";
    } else if (step.id === "5") {
      status = step5Complete
        ? "done"
        : step4Complete && step1EnvReady
          ? "active"
          : "blocked";
    } else if (step.id === "go") {
      // Done when env + lockdown green; active while Step 5 done but a GO LIVE gate fails.
      status = goLiveReady
        ? "done"
        : step5Complete && step1EnvReady
          ? "active"
          : "blocked";
    }
    return {
      id: step.id,
      title: step.title,
      status,
      summary: step.summary,
    };
  });

  const summaryByStep: Record<OperationalStepId, string> = {
    "1": step1EnvReady
      ? "Step 1 env ready — finish Desk fields + smoke create on Ops Accounts, then reply “Step 1 complete”."
      : "Step 1 blocked — set FRAPPE_OWNER_ISSUANCE=1, API keys, and operator allowlist on Vercel (see docs/OPERATIONAL_DELIVERY.md).",
    "2":
      "Step 2 active — ensure TL Project / Incident / Evidence DocTypes, then smoke create + Cloud File upload.",
    "3":
      "Step 3 active — enable FRAPPE_AUTO_PROVISION=1, smoke Paystack → Cloud Owner, then first-login migrate.",
    "4":
      "Step 4 active — wire day-14 cron, smoke charge-due → entitlement, then lift PLATFORM_OPERATOR_ONLY=0.",
    "5":
      "Step 5 active — V002 depth: engagements → commitments → grievance → ESG (packets 24c–24g).",
    go: goLiveReady
      ? "GO LIVE done — TrustLedger is operational-grade for paying customers. Keep /demo separate."
      : !lockdownLifted
        ? "GO LIVE waiting — set PLATFORM_OPERATOR_ONLY=0 on Vercel (buyer lockdown still ON)."
        : "GO LIVE waiting — fix Environment gates below, then Refresh.",
  };
  const summary = summaryByStep[activeStepId];

  const checklistByStep: Record<OperationalStepId, string[]> = {
    "1": STEP1_DESK_CHECKLIST,
    "2": STEP2_DESK_CHECKLIST,
    "3": STEP3_DESK_CHECKLIST,
    "4": STEP4_DESK_CHECKLIST,
    "5": STEP5_DESK_CHECKLIST,
    go: GO_LIVE_DESK_CHECKLIST,
  };
  const deskChecklist = checklistByStep[activeStepId];

  const deploySha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
    null;

  const launchGateIds = [
    "autoProvision",
    "cronSecret",
    "resend",
    "recaptcha",
    "accessVerify",
  ] as const;
  const launchMissing = gateChecks
    .filter((c) => (launchGateIds as readonly string[]).includes(c.id) && !c.pass)
    .map((c) => c.label);
  const launchHardening = {
    ready: launchMissing.length === 0,
    missing: launchMissing,
  };

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    activeStepId,
    steps,
    env: {
      platformOperatorOnly: isPlatformOperatorOnly(),
      frappeOwnerIssuance: isFrappeOwnerIssuanceEnabled(),
      frappeConfigured: Boolean(frappeKeyPair() && frappeBase()),
      paystackConfigured: paystackConfigured(),
    },
    gateChecks,
    blockedReasons,
    goLiveReady,
    deskChecklist,
    deploySha,
    launchHardening,
    docs: {
      path: "/docs/OPERATIONAL_DELIVERY.md",
      frappeSoT: "/docs/FRAPPE_SOT.md",
    },
    summary,
  };
}
