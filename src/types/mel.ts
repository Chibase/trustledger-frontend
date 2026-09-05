/**
 * MEL-1 — expected vs actual indicators (not a standalone product).
 * Variance is a watch, not a cause. Empty Cloud stays empty.
 */

export type MelIndicator = {
  id: string;
  label: string;
  /** people, %, ZAR, count, or free text */
  unit: string;
  expected: number | null;
  actual: number | null;
  /** Optional link to a TL Commitment id */
  commitmentId?: string;
  note?: string;
};

export type MelVariance = {
  indicatorId: string;
  label: string;
  projectId?: string;
  projectName?: string;
  commitmentId?: string;
  expected: number;
  actual: number;
  delta: number;
  ratio: number;
  /** actual < expected */
  shortfall: boolean;
  /** shortfall and actual/expected < MATERIAL_MEL_RATIO */
  material: boolean;
};

/** 620 / 1,000 participation gap is material; smaller gaps still shortfall. */
export const MATERIAL_MEL_RATIO = 0.8;
