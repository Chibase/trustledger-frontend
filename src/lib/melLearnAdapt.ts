/**
 * MEL-3 — Learn & Adapt records on a grievance.
 * Monitor → Analyse → Adapt is a corrective-action card, not a case stage.
 * Completing a record does not close or advance the grievance (TE-12: not a cause).
 */

import { parseGrievanceRootCause } from "@/lib/grievanceRootCause";
import type { Incident } from "@/types/incident";
import type {
  MelAdaptStatus,
  MelLearnAdaptRecord,
} from "@/types/melAdapt";

export type { MelAdaptStatus, MelLearnAdaptRecord };
export { MEL_ADAPT_STEPS } from "@/types/melAdapt";

export function createMelAdaptId(): string {
  return `ADA-${Date.now().toString(36).toUpperCase()}`;
}

export function parseMelAdaptRecords(raw: unknown): MelLearnAdaptRecord[] {
  if (raw == null || raw === "") return [];
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const rows: MelLearnAdaptRecord[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = String(rec.id || "").trim();
    const monitor = String(rec.monitor || "").trim();
    if (!id || !monitor) continue;
    const status: MelAdaptStatus =
      rec.status === "done" ? "done" : "open";
    const rootCause = parseGrievanceRootCause(rec.rootCause);
    rows.push({
      id,
      monitor,
      analyse: String(rec.analyse || "").trim(),
      action: String(rec.action || "").trim(),
      ...(rootCause ? { rootCause } : {}),
      ownerLabel: String(rec.ownerLabel || "").trim() || undefined,
      dueOn: String(rec.dueOn || "").trim() || undefined,
      status,
      createdAt: String(rec.createdAt || "").trim() || new Date().toISOString(),
      completedAt:
        status === "done"
          ? String(rec.completedAt || "").trim() || undefined
          : undefined,
    });
  }
  return rows;
}

export function serializeMelAdaptRecords(
  rows: MelLearnAdaptRecord[] | undefined,
): string {
  return JSON.stringify(rows || []);
}

export function readIncidentAdaptRecords(
  row: Record<string, unknown>,
): MelLearnAdaptRecord[] | undefined {
  if (!("adapt_json" in row)) return undefined;
  return parseMelAdaptRecords(row.adapt_json);
}

export function reasonCannotCompleteAdapt(
  row: Pick<MelLearnAdaptRecord, "action" | "monitor">,
): string | null {
  if (!String(row.monitor || "").trim()) {
    return "Write the Monitor observation before marking the record done.";
  }
  if (!String(row.action || "").trim()) {
    return "Write the Adapt action before marking the record done.";
  }
  return null;
}

export function completeMelAdaptRecord(
  row: MelLearnAdaptRecord,
  at = new Date().toISOString(),
): MelLearnAdaptRecord {
  if (reasonCannotCompleteAdapt(row)) return row;
  if (row.status === "done") return row;
  return { ...row, status: "done", completedAt: at };
}

/** Completing a Learn & Adapt record must not stamp grievance stages. */
export function completingAdaptLeavesStages(
  before: Incident,
  after: Incident,
): boolean {
  return (
    before.processStages?.closedAt === after.processStages?.closedAt &&
    before.processStages?.resolvedAt === after.processStages?.resolvedAt &&
    before.status === after.status
  );
}

export type MelAdaptWatchRow = {
  recordId: string;
  incidentId: string;
  incidentTitle: string;
  monitor: string;
  action: string;
  dueOn?: string;
  overdue: boolean;
};

export function collectOpenAdaptRecords(
  incidents: Incident[],
  now = new Date().toISOString().slice(0, 10),
): MelAdaptWatchRow[] {
  const rows: MelAdaptWatchRow[] = [];
  for (const incident of incidents) {
    for (const rec of incident.learnAdaptRecords || []) {
      if (rec.status !== "open") continue;
      const dueOn = rec.dueOn || undefined;
      rows.push({
        recordId: rec.id,
        incidentId: incident.id,
        incidentTitle: incident.title,
        monitor: rec.monitor,
        action: rec.action,
        dueOn,
        overdue: Boolean(dueOn && dueOn < now),
      });
    }
  }
  return rows.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return (a.dueOn || "9999").localeCompare(b.dueOn || "9999");
  });
}
