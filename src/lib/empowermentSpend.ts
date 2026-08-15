/**
 * Empowerment budget utilisation — Project.budgetSpent tracks empowerment
 * spend only (skills, training, preferential procurement, ESD), not CAPEX.
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

export function empowermentSpendFromFacts(args: {
  bbbee?: BbbeeFacts | null;
  employment?: EmploymentFacts | null;
}): number {
  return sumDefined(
    args.bbbee?.skillsDevSpendZar,
    args.bbbee?.preferentialProcurementZar,
    args.bbbee?.esdSpendZar,
    args.employment?.trainingSpendZar,
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
 * Apply rolled empowerment spent (and envelope when known) onto the project.
 * budgetSpent = empowerment utilisation only.
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
    budget: {
      ...project.dossier?.budget,
      authorisedZar:
        envelope ??
        project.dossier?.budget?.authorisedZar ??
        (project.budgetTotal > 0 ? project.budgetTotal : undefined),
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
