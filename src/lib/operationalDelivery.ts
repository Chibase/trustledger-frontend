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
import {
  OPERATIONAL_STEPS,
  STEP1_DESK_CHECKLIST,
  STEP2_DESK_CHECKLIST,
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
    label: "PLATFORM_OPERATOR_ONLY on",
    requiredForStep1: true,
    evaluate: () => {
      const on = isPlatformOperatorOnly();
      return {
        pass: on,
        detail: on
          ? "Buyers stay off public live login (correct for Step 1)"
          : "OFF — only after Steps 1–3 smoke",
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
        detail: on ? "Configured" : "Needed for Step 3 auto-provision / billing",
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

  const blockedReasons = gateChecks
    .filter((c) => c.required && !c.pass)
    .map((c) => `${c.label}: ${c.detail}`);

  /** Step 1 Owner smoke completed 2026-07-22 — ladder advances to DocTypes + File. */
  const step1Complete = true;
  const activeStepId: OperationalStepId = step1Complete && step1EnvReady ? "2" : "1";

  const steps = OPERATIONAL_STEPS.map((step) => {
    let status: StepLaneStatus = "blocked";
    if (step.id === "1") {
      status = step1Complete ? "done" : step1EnvReady ? "active" : "blocked";
    } else if (step.id === "2") {
      status = step1Complete && step1EnvReady ? "active" : "blocked";
    }
    return {
      id: step.id,
      title: step.title,
      status,
      summary: step.summary,
    };
  });

  const summary =
    activeStepId === "2"
      ? "Step 2 active — ensure TL Project / Incident / Evidence DocTypes, then smoke create + Cloud File upload."
      : step1EnvReady
        ? "Step 1 env ready — finish Desk fields + smoke create on Ops Accounts, then reply “Step 1 complete”."
        : "Step 1 blocked — set FRAPPE_OWNER_ISSUANCE=1, API keys, and operator allowlist on Vercel (see docs/OPERATIONAL_DELIVERY.md).";

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
    goLiveReady: false,
    deskChecklist: activeStepId === "2" ? STEP2_DESK_CHECKLIST : STEP1_DESK_CHECKLIST,
    docs: {
      path: "/docs/OPERATIONAL_DELIVERY.md",
      frappeSoT: "/docs/FRAPPE_SOT.md",
    },
    summary,
  };
}
