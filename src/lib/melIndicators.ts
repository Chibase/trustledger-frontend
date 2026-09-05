/**
 * MEL-1 — expected vs actual on projects and commitments.
 * Alerts watch a gap. They do not name a cause (TE-12).
 */

import type { Commitment } from "@/types/commitment";
import type { MelIndicator, MelVariance } from "@/types/mel";
import { MATERIAL_MEL_RATIO } from "@/types/mel";
import type { Project } from "@/types/project";

export { MATERIAL_MEL_RATIO };
export type { MelIndicator, MelVariance };

export function createMelIndicatorId(): string {
  return `MEL-${Date.now().toString(36).toUpperCase()}`;
}

export function parseOptionalMelNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseMelIndicators(raw: unknown): MelIndicator[] {
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
  const rows: MelIndicator[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = String(rec.id || "").trim();
    const label = String(rec.label || "").trim();
    if (!id || !label) continue;
    const expected = parseOptionalMelNumber(rec.expected);
    const actual = parseOptionalMelNumber(rec.actual);
    rows.push({
      id,
      label,
      unit: String(rec.unit || "").trim(),
      expected: expected === undefined ? null : expected,
      actual: actual === undefined ? null : actual,
      commitmentId: rec.commitmentId
        ? String(rec.commitmentId).trim() || undefined
        : undefined,
      note: rec.note ? String(rec.note).trim() || undefined : undefined,
    });
  }
  return rows;
}

export function serializeMelIndicators(rows: MelIndicator[] | undefined): string {
  return JSON.stringify(rows || []);
}

export function readProjectMelIndicators(
  row: Record<string, unknown>,
): MelIndicator[] | undefined {
  if (!("mel_json" in row)) return undefined;
  return parseMelIndicators(row.mel_json);
}

export function melVarianceFromPair(
  expected: number | null | undefined,
  actual: number | null | undefined,
): Pick<MelVariance, "delta" | "ratio" | "shortfall" | "material"> | null {
  if (
    expected == null ||
    actual == null ||
    !Number.isFinite(expected) ||
    !Number.isFinite(actual)
  ) {
    return null;
  }
  if (expected <= 0) return null;
  const delta = actual - expected;
  const ratio = actual / expected;
  const shortfall = actual < expected;
  return {
    delta,
    ratio,
    shortfall,
    material: shortfall && ratio < MATERIAL_MEL_RATIO,
  };
}

export function varianceForIndicator(
  row: MelIndicator,
  meta?: { projectId?: string; projectName?: string },
): MelVariance | null {
  const pair = melVarianceFromPair(row.expected, row.actual);
  if (!pair || !pair.shortfall) return null;
  return {
    indicatorId: row.id,
    label: row.label,
    projectId: meta?.projectId,
    projectName: meta?.projectName,
    commitmentId: row.commitmentId,
    expected: row.expected as number,
    actual: row.actual as number,
    ...pair,
  };
}

export function varianceForCommitment(
  row: Commitment,
  projectName?: string,
): MelVariance | null {
  const pair = melVarianceFromPair(row.expected, row.actual);
  if (!pair || !pair.shortfall) return null;
  return {
    indicatorId: row.id,
    label: row.title,
    projectId: row.projectId || undefined,
    projectName,
    commitmentId: row.id,
    expected: row.expected as number,
    actual: row.actual as number,
    ...pair,
  };
}

export type MelOnTrackRow = {
  indicatorId: string;
  label: string;
  projectId?: string;
  projectName?: string;
  commitmentId?: string;
  expected: number;
  actual: number;
  unit?: string;
};

/** Actual met or exceeded expected. Incomplete pairs are omitted. */
export function collectMelOnTrack(input: {
  projects: Project[];
  commitments?: Commitment[];
}): MelOnTrackRow[] {
  const out: MelOnTrackRow[] = [];
  const seenCommitment = new Set<string>();
  for (const project of input.projects) {
    for (const row of project.melIndicators || []) {
      if (
        row.expected == null ||
        row.actual == null ||
        !Number.isFinite(row.expected) ||
        !Number.isFinite(row.actual)
      ) {
        continue;
      }
      if (row.actual < row.expected) continue;
      out.push({
        indicatorId: row.id,
        label: row.label,
        projectId: project.id,
        projectName: project.name,
        commitmentId: row.commitmentId,
        expected: row.expected,
        actual: row.actual,
        unit: row.unit,
      });
      if (row.commitmentId) seenCommitment.add(row.commitmentId);
    }
  }
  for (const row of input.commitments || []) {
    if (seenCommitment.has(row.id)) continue;
    if (
      row.expected == null ||
      row.actual == null ||
      !Number.isFinite(row.expected) ||
      !Number.isFinite(row.actual)
    ) {
      continue;
    }
    if (row.actual < row.expected) continue;
    out.push({
      indicatorId: row.id,
      label: row.title,
      projectId: row.projectId || undefined,
      commitmentId: row.id,
      expected: row.expected,
      actual: row.actual,
      unit: row.melUnit,
    });
  }
  return out;
}

export function collectMelShortfalls(input: {
  projects: Project[];
  commitments?: Commitment[];
}): MelVariance[] {
  const out: MelVariance[] = [];
  const seenCommitment = new Set<string>();
  for (const project of input.projects) {
    for (const row of project.melIndicators || []) {
      const gap = varianceForIndicator(row, {
        projectId: project.id,
        projectName: project.name,
      });
      if (!gap) continue;
      out.push(gap);
      if (gap.commitmentId) seenCommitment.add(gap.commitmentId);
    }
  }
  for (const row of input.commitments || []) {
    if (seenCommitment.has(row.id)) continue;
    const gap = varianceForCommitment(row);
    if (gap) out.push(gap);
  }
  return out;
}

export function formatMelNumber(value: number, unit?: string): string {
  const n = Number.isInteger(value)
    ? value.toLocaleString("en-ZA")
    : value.toLocaleString("en-ZA", { maximumFractionDigits: 1 });
  const u = (unit || "").trim();
  if (!u) return n;
  if (u === "%") return `${n}%`;
  if (u.toUpperCase() === "ZAR") return `R${n}`;
  return `${n} ${u}`;
}
