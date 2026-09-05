/**
 * MEL-3 — Learn & Adapt corrective-action records.
 * Not a grievance stage. Completing a record does not close the case.
 */

export type MelAdaptStatus = "open" | "done";

export const MEL_ADAPT_STEPS = ["monitor", "analyse", "adapt"] as const;
export type MelAdaptStep = (typeof MEL_ADAPT_STEPS)[number];

export type MelLearnAdaptRecord = {
  id: string;
  /** Monitor — what was observed */
  monitor: string;
  /** Analyse — why it happened */
  analyse: string;
  /** Optional MEL-2 tag copied onto the record */
  rootCause?: string;
  /** Adapt — what we will change */
  action: string;
  ownerLabel?: string;
  dueOn?: string;
  status: MelAdaptStatus;
  createdAt: string;
  completedAt?: string;
};
