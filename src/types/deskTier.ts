/**
 * Professional desk tiers — rank 1 (highest) → 5 (lowest).
 * Plan Owner invites only desks strictly below their own rank.
 */

import type { CapabilityId } from "@/types/entitlements";
import type { PlanId } from "@/config/plans";
import type { UserRole } from "@/types/rbac";

/** Ordered highest → lowest for UI. */
export const DESK_TIERS = [
  "funder",
  "executive",
  "delivery",
  "supervisor",
  "clo",
] as const;

export type DeskTier = (typeof DESK_TIERS)[number];

/** 1 = highest (Client/Board/funder), 5 = lowest (CLO/consultant). */
export const DESK_TIER_RANK: Record<DeskTier, number> = {
  funder: 1,
  executive: 2,
  delivery: 3,
  supervisor: 4,
  clo: 5,
};

export const DESK_TIER_LABELS: Record<DeskTier, string> = {
  funder: "Client / Board / funder",
  executive: "CEO / MD",
  delivery: "Director / PM / architect / engineer",
  supervisor: "Site foreman / senior consultant / supervisor",
  clo: "CLO / consultant",
};

/** Plan Owner’s own desk by commercial plan. */
export const PLAN_OWNER_DESK_TIER: Record<PlanId, DeskTier> = {
  practitioner: "supervisor",
  project: "delivery",
  institutional: "funder",
};

/** Default desk when a login role has no override. */
export const ROLE_DEFAULT_DESK_TIER: Record<UserRole, DeskTier> = {
  community: "clo",
  contractor: "supervisor",
  admin: "supervisor",
  client: "funder",
};

/** Map legacy ids from older builds. */
export function normalizeDeskTier(raw: string | null | undefined): DeskTier | null {
  if (!raw) return null;
  if (raw === "site") return "supervisor";
  if (raw === "oversight") return "executive";
  if ((DESK_TIERS as readonly string[]).includes(raw)) return raw as DeskTier;
  return null;
}

export function isDeskTier(value: string | undefined | null): value is DeskTier {
  return normalizeDeskTier(value) !== null;
}

/** True when author is at least as senior as minTier (1 = highest). */
export function tierMeetsMinimum(
  authorTier: DeskTier,
  minTier: DeskTier,
): boolean {
  return DESK_TIER_RANK[authorTier] <= DESK_TIER_RANK[minTier];
}

/** Invitee desks strictly below the Owner desk (higher rank number). */
export function desksBelow(ownerTier: DeskTier): DeskTier[] {
  const ownerRank = DESK_TIER_RANK[ownerTier];
  return DESK_TIERS.filter((t) => DESK_TIER_RANK[t] > ownerRank);
}

export type VisibilityFlag =
  | "graphs"
  | "crmDetail"
  | "budget"
  | "supervisorQueue"
  | "esgSignals"
  | "captureHub"
  | "trustPulse";

export type TierVisibility = Record<VisibilityFlag, boolean>;

export type VisibilityMatrix = Record<DeskTier, TierVisibility>;

export const DEFAULT_VISIBILITY_MATRIX: VisibilityMatrix = {
  funder: {
    graphs: true,
    crmDetail: true,
    budget: true,
    supervisorQueue: false,
    esgSignals: true,
    captureHub: false,
    trustPulse: true,
  },
  executive: {
    graphs: true,
    crmDetail: true,
    budget: true,
    supervisorQueue: true,
    esgSignals: true,
    captureHub: true,
    trustPulse: true,
  },
  delivery: {
    graphs: true,
    crmDetail: true,
    budget: true,
    supervisorQueue: true,
    esgSignals: true,
    captureHub: true,
    trustPulse: true,
  },
  supervisor: {
    graphs: true,
    crmDetail: true,
    budget: false,
    supervisorQueue: true,
    esgSignals: true,
    captureHub: true,
    trustPulse: true,
  },
  clo: {
    graphs: false,
    crmDetail: false,
    budget: false,
    supervisorQueue: false,
    esgSignals: false,
    captureHub: true,
    trustPulse: true,
  },
};

export const VISIBILITY_FLAG_LABELS: Record<VisibilityFlag, string> = {
  graphs: "Charts / graphs",
  crmDetail: "CRM detail",
  budget: "Budget figures",
  supervisorQueue: "Supervisor ranked queue",
  esgSignals: "ESG / assurance signals",
  captureHub: "Capture hub",
  trustPulse: "Trust pulse",
};

/**
 * Map desk-visibility rows → commercial capability ids (plan matrix).
 * Rows outside the plan stay visible but greyed out in Settings.
 */
export const VISIBILITY_FLAG_CAPABILITY: Record<VisibilityFlag, CapabilityId> = {
  graphs: "deskGraphs",
  crmDetail: "stakeholdersCrm",
  budget: "deskGraphs",
  supervisorQueue: "supervisorQueue",
  esgSignals: "esgIndicators",
  captureHub: "captureHub",
  trustPulse: "trustPulse",
};
