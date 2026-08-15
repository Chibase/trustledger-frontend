/**
 * Empowerment budget utilisation — Project.budgetSpent tracks empowerment
 * spend only (skills/training, preferential procurement, ESD), not CAPEX.
 * Programme authorisedZar on dossier.budget stays separate.
 */

import {
  latestPackCapture,
  type BbbeeFacts,
  type EmploymentFacts,
} from "@/lib/captureStore";
import type { Project, ProjectDossier } from "@/types/project";

export function sumDefined(...values: Array<number | undefined | null>): number {
  return values.reduce<number>((acc, v) => acc + (typeof v === "number" ? v : 0), 0);
}

/**
 * Skills + training: if both packs carry a figure, take the larger so the same
 * outlay entered twice is not fully double-counted.
 */
function skillsAndTrainingSpend(
  bbbee?: BbbeeFacts | null,
  employment?: EmploymentFacts | null,
): number {
  const training = employment?.trainingSpendZar;
  const skills = bbbee?.skillsDevSpendZar;
  if (training != null && skills != null) return Math.max(training, skills);
  return sumDefined(training, skills);
}

export function empowermentSpendFromFacts(args: {
  bbbee?: BbbeeFacts | null;
  employment?: EmploymentFacts | null;
}): number {
  return sumDefined(
    skillsAndTrainingSpend(args.bbbee, args.employment),
    args.bbbee?.preferentialProcurementZar,
    args.bbbee?.esdSpendZar,
  );
}

export function hasEmpowermentSpendLines(args: {
  bbbee?: BbbeeFacts | null;
  employment?: EmploymentFacts | null;
}): boolean {
  return (
    args.bbbee?.skillsDevSpendZar != null ||
    args.bbbee?.preferentialProcurementZar != null ||
    args.bbbee?.esdSpendZar != null ||
    args.employment?.trainingSpendZar != null
  );
}

/** Latest B-BBEE + employment packs → empowerment spent (ZAR). */
export function computeEmpowermentSpent(projectId: string): number {
  const bbbee = latestPackCapture(projectId, "bbbee");
  const employment = latestPackCapture(projectId, "employment");
  const bb =
    bbbee?.structured?.pack === "bbbee" ? bbbee.structured.data : null;
  const emp =
    employment?.structured?.pack === "employment"
      ? employment.structured.data
      : null;
  return empowermentSpendFromFacts({ bbbee: bb, employment: emp });
}

/** Authorised empowerment envelope from dossier targets. */
export function empowermentBudgetFromDossier(
  dossier: ProjectDossier | undefined,
): number | undefined {
  const t = dossier?.empowermentTargets;
  if (!t) return undefined;
  if (typeof t.empowermentBudgetZar === "number") {
    return t.empowermentBudgetZar;
  }
  const sum = sumDefined(
    t.skillsDevTargetZar,
    t.preferentialProcurementTargetZar,
  );
  return sum > 0 ? sum : undefined;
}

/**
 * Apply rolled empowerment spent onto the project without touching CAPEX
 * `dossier.budget.authorisedZar`. When an empowerment envelope exists, use it
 * as `budgetTotal` for utilisation %; otherwise leave programme total alone.
 */
export function withEmpowermentSpend(
  project: Project,
  spentZar: number,
): Project {
  const envelope = empowermentBudgetFromDossier(project.dossier);
  const dossier: ProjectDossier = {
    ...(project.dossier || {}),
    empowermentTargets: {
      ...project.dossier?.empowermentTargets,
      empowermentSpentZar: spentZar,
    },
  };
  return {
    ...project,
    budgetSpent: spentZar,
    budgetTotal:
      envelope != null && envelope > 0 ? envelope : project.budgetTotal,
    dossier,
  };
}
