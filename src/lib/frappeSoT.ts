/**
 * T5 — Frappe system-of-record contract for Customer + Plan Owner User.
 * Issuance stays operator-gated while ADR-013 lockdown is on.
 */

import type { PlanId } from "@/config/plans";
import type { DeskTier } from "@/types/deskTier";

/** Env flag — must be explicitly "1" to allow operator dry-run / issuance helpers. */
export function isFrappeOwnerIssuanceEnabled(): boolean {
  return (
    process.env.FRAPPE_OWNER_ISSUANCE === "1" ||
    process.env.FRAPPE_OWNER_ISSUANCE === "true"
  );
}

export type FrappeCustomerDraft = {
  customer_name: string;
  customer_type: "Company";
  territory?: string;
  /** Custom fields expected on Customer once Desk is configured */
  plan_code: PlanId;
  seat_limit: number | null;
  project_limit: number | null;
  entitlement_status: "trial" | "active" | "past_due" | "cancelled";
  owner_email: string;
  owner_full_name: string;
  tl_org_id?: string;
};

export type FrappeOwnerUserDraft = {
  email: string;
  first_name: string;
  last_name?: string;
  send_welcome_email: boolean;
  roles: Array<"System Manager" | "Customer" | string>;
  /** Desk tier for TrustLedger session after login */
  tl_desk_tier: DeskTier;
  tl_plan_owner: 1;
  customer: string;
};

export type ProvisionChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
};

/**
 * Build the Cloud Customer payload from browser org + billing hints.
 * Does not call Frappe — operators / gated routes use this shape.
 */
export function buildCustomerDraft(input: {
  organization: string;
  ownerEmail: string;
  ownerName: string;
  planId: PlanId;
  orgId?: string;
  status?: FrappeCustomerDraft["entitlement_status"];
}): FrappeCustomerDraft {
  const seat =
    input.planId === "practitioner"
      ? 0
      : input.planId === "project"
        ? null
        : null;
  const projects =
    input.planId === "practitioner" ? 2 : input.planId === "project" ? null : null;
  return {
    customer_name: input.organization.trim() || `${input.ownerName}'s TrustLedger`,
    customer_type: "Company",
    plan_code: input.planId,
    seat_limit: seat,
    project_limit: projects,
    entitlement_status: input.status || "trial",
    owner_email: input.ownerEmail.trim().toLowerCase(),
    owner_full_name: input.ownerName.trim(),
    tl_org_id: input.orgId,
  };
}

export function buildOwnerUserDraft(input: {
  email: string;
  fullName: string;
  customerName: string;
  deskTier: DeskTier;
}): FrappeOwnerUserDraft {
  const parts = input.fullName.trim().split(/\s+/);
  const first = parts[0] || "Owner";
  const last = parts.slice(1).join(" ") || undefined;
  return {
    email: input.email.trim().toLowerCase(),
    first_name: first,
    last_name: last,
    send_welcome_email: true,
    roles: ["Customer"],
    tl_desk_tier: input.deskTier,
    tl_plan_owner: 1,
    customer: input.customerName,
  };
}

/** Operator checklist before lifting ADR-013 for a buyer. */
export function buildProvisionChecklist(input: {
  hasPaystackRef: boolean;
  hasCrmLead: boolean;
  customerDraftReady: boolean;
  issuanceFlagOn: boolean;
  lockdownOn: boolean;
}): ProvisionChecklistItem[] {
  return [
    {
      id: "pay",
      label: "Paystack trial/authorize or EFT confirmed",
      done: input.hasPaystackRef,
    },
    {
      id: "crm",
      label: "CRM Lead present (Trial Authorize / Paystack Payment)",
      done: input.hasCrmLead,
    },
    {
      id: "draft",
      label: "Customer + Owner User draft mapped from org",
      done: input.customerDraftReady,
    },
    {
      id: "flag",
      label: "FRAPPE_OWNER_ISSUANCE=1 on Vercel (operator tools)",
      done: input.issuanceFlagOn,
      note: "Keep PLATFORM_OPERATOR_ONLY=1 until smoke passes",
    },
    {
      id: "lock",
      label: "ADR-013 lockdown still on for buyers",
      done: input.lockdownOn,
      note: "Lift only after Owner login works end-to-end",
    },
  ];
}
