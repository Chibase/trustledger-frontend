import { leadBackendStatus, type ProductLeadInput } from "@/lib/leadCapture";
import {
  LEAD_FORM_INVENTORY,
  smokeRequiredForms,
  type LeadFormEntry,
} from "@/lib/leadFormInventory";

/** Operator HS-2 write — Desk CRM Lead, not a customer enquiry. */
export const HS2_SMOKE_EMAIL = "hs2-smoke@trustledgersrm.co.za";
export const HS2_SMOKE_JOB_TITLE = "HS-2 smoke";
export const HS2_SMOKE_SOURCE_TAG = "hs2_smoke";

export const EM1_REMAINING_DESK_STEPS = [
  "Uninstall Frappe Cloud Email Delivery Service if it blocks custom SMTP",
  "Desk Email Account sales@trustledgersrm.co.za — Webway SMTP 465 SSL",
  "Send Test from Desk before any Newsletter blast",
  "Do not blast marketing from Resend OTP / onboarding keys",
] as const;

export type LeadSmokeSnapshot = {
  inventory: readonly LeadFormEntry[];
  smokeRequired: LeadFormEntry[];
  leadBackend: ReturnType<typeof leadBackendStatus>;
  em1: {
    templates: string;
    runbook: string;
    from: string;
    remaining: readonly string[];
  };
  webway: string;
  hs34: {
    deferred: true;
    note: string;
  };
};

export function buildHs2SmokeLeadInput(): ProductLeadInput {
  return {
    email: HS2_SMOKE_EMAIL,
    name: "HS-2 Ops Smoke",
    company: "TrustLedger Ops",
    message:
      "Operator HS-2 smoke: confirm the CRM Lead writer (Frappe). Not a customer enquiry.",
    pageUri: "/ops/readiness",
    pageName: "TrustLedger ops HS-2 smoke",
    sourceTag: HS2_SMOKE_SOURCE_TAG,
    jobTitle: HS2_SMOKE_JOB_TITLE,
  };
}

export function buildLeadSmokeSnapshot(): LeadSmokeSnapshot {
  return {
    inventory: LEAD_FORM_INVENTORY,
    smokeRequired: smokeRequiredForms(),
    leadBackend: leadBackendStatus(),
    em1: {
      templates: "docs/exports/email-marketing/",
      runbook: "docs/FRAPPE_EMAIL_MARKETING.md",
      from: "sales@trustledgersrm.co.za",
      remaining: EM1_REMAINING_DESK_STEPS,
    },
    webway: "docs/WEBWAY_CUTOVER.md",
    hs34: {
      deferred: true,
      note: "HS-3/HS-4 stay planned until Production form smoke is confirmed. Do not drop HUBSPOT_* or delete the HubSpot client in this packet.",
    },
  };
}
