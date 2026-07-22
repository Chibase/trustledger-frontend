/**
 * Client-safe operational delivery constants (no server env imports).
 * Server snapshot: `operationalDelivery.ts` → `buildOperationalReadiness`.
 */

export type OperationalStepId = "1" | "2" | "3" | "4" | "5" | "go";

export type StepLaneStatus = "done" | "active" | "blocked";

export const OPERATIONAL_STEPS: Array<{
  id: OperationalStepId;
  title: string;
  summary: string;
}> = [
  {
    id: "1",
    title: "Frappe SoT ready (Customer + Owner User)",
    summary:
      "Desk custom fields + FRAPPE_OWNER_ISSUANCE + one successful provision-owner smoke.",
  },
  {
    id: "2",
    title: "Product DocTypes + Cloud File",
    summary: "Org-scoped Project / Incident / Evidence and File upload for media.",
  },
  {
    id: "3",
    title: "Sync browser org → Cloud + auto-provision",
    summary: "Migrate tl-org-* on first live login; Paystack → provision-owner.",
  },
  {
    id: "4",
    title: "Billing scheduler + lift ADR-013 for buyers",
    summary: "Day-14 charges, entitlement gates, then PLATFORM_OPERATOR_ONLY=0.",
  },
  {
    id: "5",
    title: "V002 depth (engagements → commitments → grievance → ESG)",
    summary: "Packets 24c → 24d → 24e → 24g after Cloud SoT is honest.",
  },
  {
    id: "go",
    title: "GO LIVE — operational grade",
    summary: "Multi-device production for paying customers; demo stays separate.",
  },
];

/** Labels for gates that must pass before Step 1 smoke. */
export const OPERATIONAL_STEP1_REQUIRED_LABELS = [
  "PLATFORM_OPERATOR_ONLY on",
  "PLATFORM_OPERATOR_EMAILS set",
  "FRAPPE_OWNER_ISSUANCE=1",
  "Frappe API base + keys",
] as const;

export const STEP1_DESK_CHECKLIST: string[] = [
  "Customize Form → Customer: custom_plan_code, custom_seat_limit, custom_project_limit, custom_entitlement_status, custom_tl_org_id, custom_owner_email",
  "Customize Form → User (recommended): custom_tl_desk_tier, custom_tl_plan_owner, custom_tl_customer",
  "API key user can create Customer + User",
  "Vercel: FRAPPE_OWNER_ISSUANCE=1 + API keys + PLATFORM_OPERATOR_ONLY=1",
  "Ops → Accounts: dry-run then Create on Cloud for a test buyer email you control",
  "Smoke /login/live as that Owner (temporarily allowlist if needed); confirm no demo INC-* seed",
];
