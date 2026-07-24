/**
 * Turnaround / stage pressure helpers for dashboards and reports.
 */

import {
  PROCESS_STAGE_KEYS,
  hoursBetween,
  processTurnaroundHours,
  stageTimestamp,
  type ProcessStageKey,
} from "@/lib/grievanceProcess";
import type { Incident } from "@/types/incident";

export function averageTatHours(incidents: Incident[]): number | null {
  const vals = incidents
    .map((i) => processTurnaroundHours(i.processStages))
    .filter((h): h is number => h !== null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

/** Count open cases where current stage lag exceeds client target hours. */
export function countOverStageTarget(incidents: Incident[]): number {
  const now = Date.now();
  let n = 0;
  for (const inc of incidents) {
    if (inc.status === "Closed") continue;
    const stages = inc.processStages;
    if (!stages?.targetHours) continue;
    const keys = PROCESS_STAGE_KEYS;
    for (let i = 1; i < keys.length; i++) {
      const key = keys[i] as ProcessStageKey;
      const prev = keys[i - 1] as ProcessStageKey;
      const prevAt = stageTimestamp(stages, prev);
      const at = stageTimestamp(stages, key);
      if (!prevAt || at) continue;
      const target = stages.targetHours[key];
      if (typeof target !== "number") continue;
      const hours = hoursBetween(prevAt, new Date(now).toISOString());
      if (hours !== null && hours > target) {
        n += 1;
        break;
      }
    }
  }
  return n;
}
