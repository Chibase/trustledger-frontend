/**
 * Professional desk tiers — overlay on demo login roles.
 * CLO → supervisor → site → delivery → oversight → funder/client.
 */

import type { UserRole } from "@/types/rbac";

export const DESK_TIERS = [
  "clo",
  "supervisor",
  "site",
  "delivery",
  "oversight",
  "funder",
] as const;

export type DeskTier = (typeof DESK_TIERS)[number];

export const DESK_TIER_LABELS: Record<DeskTier, string> = {
  clo: "CLO / consultant",
  supervisor: "Supervisor / senior consultant",
  site: "Site foreman / manager",
  delivery: "Director / architect / engineer / PM",
  oversight: "Senior govt / ESG assessor",
  funder: "Funder / client",
};

/** Default desk tier when a login role has no override in localStorage. */
export const ROLE_DEFAULT_DESK_TIER: Record<UserRole, DeskTier> = {
  community: "clo",
  contractor: "site",
  admin: "supervisor",
  client: "funder",
};

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
  clo: {
    graphs: false,
    crmDetail: false,
    budget: false,
    supervisorQueue: false,
    esgSignals: false,
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
  site: {
    graphs: false,
    crmDetail: false,
    budget: false,
    supervisorQueue: false,
    esgSignals: false,
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
  oversight: {
    graphs: true,
    crmDetail: true,
    budget: false,
    supervisorQueue: false,
    esgSignals: true,
    captureHub: true,
    trustPulse: true,
  },
  funder: {
    graphs: true,
    crmDetail: true,
    budget: true,
    supervisorQueue: false,
    esgSignals: true,
    captureHub: false,
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
