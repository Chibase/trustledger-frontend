/**
 * TierFlowDefinition — allowed modules, sequence, and capability gates.
 * Same flow mechanics for VIP and non-VIP; only demo seed differs (ADR-033).
 */

import { PLAN_CAPABILITIES } from "@/config/entitlements";
import type { PlanId } from "@/config/plans";
import type { CapabilityId } from "@/types/entitlements";
import type {
  PlanDashboardDescriptor,
  PlanDashboardModuleKey,
  TierFlowDefinition,
} from "@/types/planPackaging";

export const PLAN_DASHBOARD_CATALOG: Record<
  PlanDashboardModuleKey,
  PlanDashboardDescriptor
> = {
  executive: {
    key: "executive",
    label: "Executive",
    href: "/app/dashboard",
    capability: "dashboard",
    emptyHint: "Capture a project to start the roll-up.",
  },
  projects: {
    key: "projects",
    label: "Projects",
    href: "/app/projects",
    capability: "projects",
    emptyHint: "Add a project — this plan does not preload programme data.",
  },
  incidents: {
    key: "incidents",
    label: "Incidents",
    href: "/app/incidents",
    capability: "incidents",
    emptyHint: "Log a grievance or site incident when one arrives.",
  },
  capture: {
    key: "capture",
    label: "Capture",
    href: "/app/capture",
    capability: "captureHub",
    emptyHint: "Record minutes or a field pack when the meeting happens.",
  },
  stakeholders: {
    key: "stakeholders",
    label: "Stakeholders",
    href: "/app/stakeholders",
    capability: "stakeholdersCrm",
    emptyHint: "Add named counterparts you already meet this week.",
  },
  engagements: {
    key: "engagements",
    label: "Engagements",
    href: "/app/engagements",
    capability: "engagements",
    emptyHint: "Log a meeting or consultation after it is held.",
  },
  sep: {
    key: "sep",
    label: "Engagement plan",
    href: "/app/engagement-plan",
    capability: "engagements",
    emptyHint: "Compose a stakeholder engagement plan from a briefing.",
  },
  commitments: {
    key: "commitments",
    label: "Commitments",
    href: "/app/commitments",
    capability: "commitments",
    emptyHint: "Promote a promise from an engagement onto the board.",
  },
  esg: {
    key: "esg",
    label: "Intelligence / ESG",
    href: "/app/intelligence",
    capability: "esgIndicators",
    emptyHint: "Save an indicator brief for the project place.",
  },
  reports: {
    key: "reports",
    label: "Reports",
    href: "/app/reports",
    capability: "governanceReports",
    emptyHint: "Write a pack once the desk has evidence.",
  },
};

const SOLO_FLOW: PlanDashboardModuleKey[] = [
  "executive",
  "projects",
  "incidents",
  "reports",
];

const SI_FLOW: PlanDashboardModuleKey[] = [
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
];

/** Config-driven sequence per commercial tier. VIP uses Institutional. */
export const TIER_FLOW: Record<PlanId, TierFlowDefinition> = {
  solo: { planId: "solo", modules: SOLO_FLOW },
  practitioner: { planId: "practitioner", modules: SOLO_FLOW },
  project: { planId: "project", modules: SI_FLOW },
  institutional: { planId: "institutional", modules: SI_FLOW },
};

export function capabilityForModule(
  key: PlanDashboardModuleKey,
): CapabilityId {
  return PLAN_DASHBOARD_CATALOG[key].capability;
}

/**
 * includedModules ∩ tier.allowedModules, preserving TIER_FLOW order.
 * Owner entitlement overrides still apply via hasCapability at render time.
 */
export function includedDashboardKeys(
  planId: PlanId | null | undefined,
): PlanDashboardModuleKey[] {
  const id: PlanId = planId || "project";
  const flow = TIER_FLOW[id];
  const allowed = new Set(PLAN_CAPABILITIES[id]);
  return flow.modules.filter((key) =>
    allowed.has(PLAN_DASHBOARD_CATALOG[key].capability),
  );
}

export function hrefForDashboardModule(
  key: string | undefined,
): string | null {
  if (!key) return PLAN_DASHBOARD_CATALOG.executive.href;
  const normalised = key.trim().toLowerCase();
  if (
    normalised === "sep" ||
    normalised === "engagement-plan" ||
    normalised === "engagement_plan"
  ) {
    return PLAN_DASHBOARD_CATALOG.sep.href;
  }
  if (normalised === "intelligence" || normalised === "esg") {
    return PLAN_DASHBOARD_CATALOG.esg.href;
  }
  if (normalised in PLAN_DASHBOARD_CATALOG) {
    return PLAN_DASHBOARD_CATALOG[normalised as PlanDashboardModuleKey].href;
  }
  return null;
}
