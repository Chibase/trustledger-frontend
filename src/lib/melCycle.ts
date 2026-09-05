/**
 * MEL-5 — close the Learn & Adapt cycle.
 * A material expected-vs-actual gap is a watch. It may suggest a Learn & Adapt
 * record. Human apply is required. Not a cause (TE-12). Not Themba. Not addon_mel.
 */

import { collectMelShortfalls, formatMelNumber } from "@/lib/melIndicators";
import { collectOpenAdaptRecords } from "@/lib/melLearnAdapt";
import type { Commitment } from "@/types/commitment";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

export type MelCycleCandidate = {
  id: string;
  title: string;
  status: Incident["status"];
};

export type MelCycleSuggestion = {
  indicatorId: string;
  label: string;
  projectId: string;
  projectName: string;
  expected: number;
  actual: number;
  material: boolean;
  /** Honest shortfall text. Does not name a cause. */
  monitor: string;
  candidates: MelCycleCandidate[];
};

function casesForProject(
  incidents: Incident[],
  projectId: string,
): Incident[] {
  const scoped = incidents.filter((row) => row.projectId === projectId);
  const open = scoped.filter((row) => row.status !== "Closed");
  return open.length ? open : scoped;
}

function projectHasOpenAdapt(
  incidents: Incident[],
  projectId: string,
): boolean {
  return collectOpenAdaptRecords(
    incidents.filter((row) => row.projectId === projectId),
  ).length > 0;
}

export function scopeCommitmentsForMelCycle(
  commitments: Commitment[],
  projects: Project[],
): Commitment[] {
  const ids = new Set(projects.map((row) => row.id));
  const projectScoped = projects.length === 1;
  return commitments.filter((row) => {
    if (!row.projectId) return !projectScoped;
    return ids.has(row.projectId);
  });
}

export function monitorFromShortfall(input: {
  label: string;
  projectName?: string;
  actual: number;
  expected: number;
}): string {
  const where = input.projectName ? ` on ${input.projectName}` : "";
  return `Expected vs actual shortfall${where}: ${input.label} is ${formatMelNumber(input.actual)} against ${formatMelNumber(input.expected)}. This is a watch, not a named cause.`;
}

/**
 * Material shortfalls with no open Learn & Adapt record on that project yet.
 * Does not invent a case, a cause, or an Adapt action.
 */
export function collectMelCycleSuggestions(input: {
  projects: Project[];
  commitments?: Commitment[];
  incidents: Incident[];
}): MelCycleSuggestion[] {
  const gaps = collectMelShortfalls({
    projects: input.projects,
    commitments: input.commitments,
  }).filter((row) => row.material && row.projectId);
  const out: MelCycleSuggestion[] = [];
  for (const gap of gaps) {
    const projectId = gap.projectId as string;
    if (projectHasOpenAdapt(input.incidents, projectId)) continue;
    const cases = casesForProject(input.incidents, projectId);
    out.push({
      indicatorId: gap.indicatorId,
      label: gap.label,
      projectId,
      projectName: gap.projectName || projectId,
      expected: gap.expected,
      actual: gap.actual,
      material: gap.material,
      monitor: monitorFromShortfall({
        label: gap.label,
        projectName: gap.projectName,
        actual: gap.actual,
        expected: gap.expected,
      }),
      candidates: cases.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
      })),
    });
  }
  return out;
}

/** Applying a cycle suggestion must not stamp grievance stages. */
export function applyingAdaptLeavesStages(
  before: Incident,
  after: Incident,
): boolean {
  return (
    before.processStages?.closedAt === after.processStages?.closedAt &&
    before.processStages?.resolvedAt === after.processStages?.resolvedAt &&
    before.status === after.status
  );
}
