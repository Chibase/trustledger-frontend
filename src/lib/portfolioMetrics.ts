/**
 * Portfolio + project KPIs for the executive dashboard sequence:
 * all projects overview → project workspace → kind-based reports.
 */

import {
  latestPackCapture,
  trustFromProjectPackEvidence,
  type BbbeeFacts,
  type EmploymentFacts,
  type EsgPeriodFacts,
} from "@/lib/captureStore";
import {
  computeEmpowermentSpent,
  empowermentBudgetFromDossier,
} from "@/lib/empowermentSpend";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

export type ProjectPortfolioRow = {
  project: Project;
  empowermentBudget: number;
  empowermentSpent: number;
  empowermentAvailable: number;
  /** 0–100 when budget > 0 */
  empowermentPct: number | null;
  localHireTarget: number | null;
  localHireActual: number | null;
  localHirePct: number | null;
  bbbeeLevelTarget: string | null;
  openCases: number;
  trustIndex: number;
  trustLabel: string;
  hasEmploymentPack: boolean;
  hasBbbeePack: boolean;
  hasEsgPack: boolean;
  hasGrmPack: boolean;
  hasIssueLogPack: boolean;
};

export type PortfolioOverview = {
  rows: ProjectPortfolioRow[];
  totals: {
    projectCount: number;
    empowermentBudget: number;
    empowermentSpent: number;
    empowermentAvailable: number;
    empowermentPct: number | null;
    openCases: number;
    avgTrust: number | null;
    localHireTargetSum: number;
    localHireActualSum: number;
    localHirePct: number | null;
  };
};

function packData<T>(
  projectId: string,
  pack: "employment" | "bbbee" | "esg_period" | "grm_period" | "issue_log",
): T | null {
  const row = latestPackCapture(projectId, pack);
  if (!row?.structured || row.structured.pack !== pack) return null;
  return row.structured.data as T;
}

export function buildProjectPortfolioRow(
  project: Project,
  incidents: Incident[],
): ProjectPortfolioRow {
  const scoped = incidents.filter((i) => i.projectId === project.id);
  const open = scoped.filter((i) => i.status !== "Closed");
  const pulse = trustFromProjectPackEvidence(
    project.id,
    trustIndexFromIncidents(scoped),
  );

  const emp = packData<EmploymentFacts>(project.id, "employment");
  const bb = packData<BbbeeFacts>(project.id, "bbbee");
  const esg = packData<EsgPeriodFacts>(project.id, "esg_period");
  const grm = packData(project.id, "grm_period");
  const issueLog = packData(project.id, "issue_log");

  const fromPacks = computeEmpowermentSpent(project.id);
  const spent =
    fromPacks > 0
      ? fromPacks
      : project.dossier?.empowermentTargets?.empowermentSpentZar ??
        project.budgetSpent ??
        0;
  const budget =
    empowermentBudgetFromDossier(project.dossier) ??
    (project.budgetTotal > 0 ? project.budgetTotal : 0);
  const available = Math.max(0, budget - spent);
  const empowermentPct =
    budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : null;

  const localHireTarget =
    emp?.localHireTarget ??
    project.dossier?.empowermentTargets?.localHireTarget ??
    null;
  const localHireActual = emp?.localHireActual ?? null;
  const localHirePct =
    localHireTarget != null && localHireTarget > 0 && localHireActual != null
      ? Math.min(100, Math.round((localHireActual / localHireTarget) * 100))
      : null;

  return {
    project,
    empowermentBudget: budget,
    empowermentSpent: spent,
    empowermentAvailable: available,
    empowermentPct,
    localHireTarget,
    localHireActual,
    localHirePct,
    bbbeeLevelTarget:
      project.dossier?.empowermentTargets?.bbbeeLevelTarget ||
      bb?.bbbeeLevel ||
      null,
    openCases: open.length,
    trustIndex: pulse.trustIndex,
    trustLabel: pulse.label,
    hasEmploymentPack: Boolean(emp),
    hasBbbeePack: Boolean(bb),
    hasEsgPack: Boolean(esg),
    hasGrmPack: Boolean(grm),
    hasIssueLogPack: Boolean(issueLog),
  };
}

export function buildPortfolioOverview(
  projects: Project[],
  incidents: Incident[],
): PortfolioOverview {
  const rows = projects.map((p) => buildProjectPortfolioRow(p, incidents));
  const empowermentBudget = rows.reduce((s, r) => s + r.empowermentBudget, 0);
  const empowermentSpent = rows.reduce((s, r) => s + r.empowermentSpent, 0);
  const localHireTargetSum = rows.reduce(
    (s, r) => s + (r.localHireTarget ?? 0),
    0,
  );
  const localHireActualSum = rows.reduce(
    (s, r) => s + (r.localHireActual ?? 0),
    0,
  );
  const trusts = rows.map((r) => r.trustIndex);
  return {
    rows,
    totals: {
      projectCount: rows.length,
      empowermentBudget,
      empowermentSpent,
      empowermentAvailable: Math.max(0, empowermentBudget - empowermentSpent),
      empowermentPct:
        empowermentBudget > 0
          ? Math.min(
              100,
              Math.round((empowermentSpent / empowermentBudget) * 100),
            )
          : null,
      openCases: rows.reduce((s, r) => s + r.openCases, 0),
      avgTrust: trusts.length
        ? Math.round(trusts.reduce((a, b) => a + b, 0) / trusts.length)
        : null,
      localHireTargetSum,
      localHireActualSum,
      localHirePct:
        localHireTargetSum > 0
          ? Math.min(
              100,
              Math.round((localHireActualSum / localHireTargetSum) * 100),
            )
          : null,
    },
  };
}

/** Chart bars for a single project — only categories with captured data. */
export function projectCategoryBars(row: ProjectPortfolioRow): Array<{
  label: string;
  value: number;
  unit?: string;
}> {
  const bars: Array<{ label: string; value: number; unit?: string }> = [];
  if (row.empowermentPct != null) {
    bars.push({
      label: "Empowerment spend",
      value: row.empowermentPct,
      unit: "%",
    });
  }
  if (row.localHirePct != null) {
    bars.push({ label: "Local hire", value: row.localHirePct, unit: "%" });
  }
  if (row.trustIndex != null) {
    bars.push({ label: "Trust pulse", value: row.trustIndex, unit: "/100" });
  }
  bars.push({ label: "Open cases", value: row.openCases });
  return bars;
}

export function zar(n: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function pctLabel(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n}%`;
}
