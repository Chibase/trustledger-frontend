/**
 * Plan-as-container: commercial SKU (PlanId) packages module dashboards.
 * SEP is a module (`sep`), never the plan identity.
 */

import type { PlanId } from "@/config/plans";
import type { CapabilityId } from "@/types/entitlements";

export const PLAN_DASHBOARD_MODULE_KEYS = [
  "executive",
  "projects",
  "incidents",
  "capture",
  "stakeholders",
  "engagements",
  "sep",
  "commitments",
  "esg",
  "reports",
] as const;

export type PlanDashboardModuleKey =
  (typeof PLAN_DASHBOARD_MODULE_KEYS)[number];

export type PlanDashboardDescriptor = {
  key: PlanDashboardModuleKey;
  label: string;
  href: string;
  capability: CapabilityId;
  emptyHint: string;
};

/** Soft sequence hint: prefer filling `after` before suggesting this module. */
export type TierFlowGate = {
  module: PlanDashboardModuleKey;
  after: PlanDashboardModuleKey;
};

export type TierFlowDefinition = {
  planId: PlanId;
  /** Ordered dashboards for this tier. Always starts with executive. */
  modules: PlanDashboardModuleKey[];
  /**
   * Advisory progression only. Entitled modules stay reachable so non-VIP
   * plans can populate any desk immediately.
   */
  gates?: TierFlowGate[];
};

export type PlanDashboardPackaging = {
  planId: PlanId | "demo";
  vip: boolean;
  demoSeedAllowed: boolean;
  executiveDashboard: PlanDashboardDescriptor;
  moduleDashboards: PlanDashboardDescriptor[];
  emptyStateFlags: { key: PlanDashboardModuleKey; empty: boolean }[];
  /** First empty module in tier sequence, honouring advisory gates. */
  suggestedNextKey: PlanDashboardModuleKey | null;
};

export type PlanModuleContribution = {
  key: PlanDashboardModuleKey;
  label: string;
  href: string;
  empty: boolean;
  scorePct: number;
  contributionPct: number;
  count: number;
};

export const VIP_DEMO_BUNDLE_VERSION = 2;
export const VIP_DEMO_BUNDLE_KEY = "tl-vip-demo-bundle";
