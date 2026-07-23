/**
 * Default capability grants per commercial plan.
 * Revisit commercial packaging later — this matrix is the switchboard.
 */

import type { PlanId } from "@/config/plans";
import type { CapabilityId } from "@/types/entitlements";

const CORE: CapabilityId[] = [
  "dashboard",
  "projects",
  "incidents",
  "issueIntake",
  "aiAssist",
  "geoIntake",
  "trustPulse",
];

/** Base plan → enabled capabilities (before add-ons). */
export const PLAN_CAPABILITIES: Record<PlanId, CapabilityId[]> = {
  practitioner: [...CORE, "governanceReports"],
  project: [
    ...CORE,
    "captureHub",
    "stakeholdersCrm",
    "engagements",
    "commitments",
    "deskGraphs",
    "supervisorQueue",
    "governanceReports",
  ],
  institutional: [
    ...CORE,
    "captureHub",
    "stakeholdersCrm",
    "engagements",
    "deskGraphs",
    "supervisorQueue",
    "governanceReports",
    "commitments",
    "esgIndicators",
  ],
};

/** Demo / no-plan sessions see the Project lens so V002 surfaces stay tryable. */
export const DEMO_CAPABILITIES: CapabilityId[] =
  PLAN_CAPABILITIES.project;
