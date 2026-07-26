/**
 * Default capability grants per commercial plan.
 * Solo = essentials only (ADR-035). Revisit packaging via PLATFORM_STRATEGIC_BRIEF.
 */

import type { PlanId } from "@/config/plans";
import type { CapabilityId } from "@/types/entitlements";

/**
 * Solo essentials — survive desk without AI / SI.
 * Monthly report hub is included (pack depth still gated by plan rank).
 */
const SOLO_CORE: CapabilityId[] = [
  "dashboard",
  "projects",
  "incidents",
  "issueIntake",
  "geoIntake",
  "trustPulse",
  "governanceReports",
];

const PRACTITIONER_CORE: CapabilityId[] = [
  ...SOLO_CORE,
  "aiAssist",
];

/** Base plan → enabled capabilities (before add-ons). */
export const PLAN_CAPABILITIES: Record<PlanId, CapabilityId[]> = {
  solo: [...SOLO_CORE],
  practitioner: [...PRACTITIONER_CORE],
  project: [
    ...PRACTITIONER_CORE,
    "captureHub",
    "stakeholdersCrm",
    "engagements",
    "commitments",
    "esgIndicators",
    "deskGraphs",
    "supervisorQueue",
  ],
  institutional: [
    ...PRACTITIONER_CORE,
    "captureHub",
    "stakeholdersCrm",
    "engagements",
    "deskGraphs",
    "supervisorQueue",
    "commitments",
    "esgIndicators",
  ],
};

/** Demo / no-plan sessions see the Project lens so V002 surfaces stay tryable. */
export const DEMO_CAPABILITIES: CapabilityId[] =
  PLAN_CAPABILITIES.project;
