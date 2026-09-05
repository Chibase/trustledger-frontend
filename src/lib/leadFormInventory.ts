/**
 * HS-2 — canonical Vercel form → Frappe CRM Lead inventory (ADR-034).
 * Keep `resolveCrmSource` and this list in lockstep. Not HubSpot.
 */

export type LeadFormEntry = {
  id: string;
  /** Public or BFF path operators smoke. */
  path: string;
  /** File that must call `submitProductLead`. */
  routeFile: string;
  sourceTag: string;
  crmSource: string;
  /** HS-2 operator checklist: contact, quote, assessment (+ feedback/support). */
  smokeRequired: boolean;
  label: string;
};

export const LEAD_FORM_INVENTORY: readonly LeadFormEntry[] = [
  {
    id: "contact",
    path: "/contact",
    routeFile: "src/app/api/contact/route.ts",
    sourceTag: "contact",
    crmSource: "Website Contact",
    smokeRequired: true,
    label: "Contact enquiry",
  },
  {
    id: "feedback",
    path: "/contact (kind=feedback)",
    routeFile: "src/app/api/contact/route.ts",
    sourceTag: "product_feedback",
    crmSource: "Product Feedback",
    smokeRequired: true,
    label: "Product feedback",
  },
  {
    id: "quote",
    path: "/quote",
    routeFile: "src/app/api/quote/lead/route.ts",
    sourceTag: "quote_request",
    crmSource: "Quote Request",
    smokeRequired: true,
    label: "Quote request",
  },
  {
    id: "assessment",
    path: "/assessment",
    routeFile: "src/app/api/assessment/lead/route.ts",
    sourceTag: "assessment",
    crmSource: "Website Assessment",
    smokeRequired: true,
    label: "Assessment unlock",
  },
  {
    id: "support",
    path: "/api/support/ticket",
    routeFile: "src/app/api/support/ticket/route.ts",
    sourceTag: "support_ticket",
    crmSource: "Support Ticket",
    smokeRequired: true,
    label: "Support ticket",
  },
  {
    id: "demo",
    path: "/api/demo/lead",
    routeFile: "src/app/api/demo/lead/route.ts",
    sourceTag: "demo_entry",
    crmSource: "Website Demo",
    smokeRequired: false,
    label: "Demo interest",
  },
  {
    id: "resource",
    path: "/resources",
    routeFile: "src/app/api/resources/download/route.ts",
    sourceTag: "resource_download",
    crmSource: "Website Resource",
    smokeRequired: false,
    label: "Resource download",
  },
  {
    id: "themba",
    path: "/api/themba/chat",
    routeFile: "src/app/api/themba/chat/route.ts",
    sourceTag: "themba_escalate",
    crmSource: "Themba Guide",
    smokeRequired: false,
    label: "Themba escalate",
  },
  {
    id: "themba_bug",
    path: "/api/telemetry/bug-report",
    routeFile: "src/app/api/telemetry/bug-report/route.ts",
    sourceTag: "themba_bug",
    crmSource: "Themba Bug",
    smokeRequired: false,
    label: "Themba bug report",
  },
] as const;

export const CRM_SOURCE_BY_TAG: Record<string, string> = {
  product_feedback: "Product Feedback",
  contact: "Website Contact",
  demo_entry: "Website Demo",
  demo_soft_gate: "Website Demo",
  assessment: "Website Assessment",
  resource_download: "Website Resource",
  paystack_payment: "Paystack Payment",
  trial_authorize: "Trial Authorize",
  trial_opt_out: "Trial Opt-Out",
  eft_payment: "EFT Payment",
  quote_request: "Quote Request",
  support_ticket: "Support Ticket",
  themba_escalate: "Themba Guide",
  themba_bug: "Themba Bug",
  chibase_contact: "Chibase Consulting",
  chibase_package: "Chibase Consulting",
  hs2_smoke: "Website Contact",
};

export function smokeRequiredForms(): LeadFormEntry[] {
  return LEAD_FORM_INVENTORY.filter((row) => row.smokeRequired);
}
