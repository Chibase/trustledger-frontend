/**
 * Project data segmented by report category.
 * Capture packs + cases + stakeholders + dossier map into report kinds
 * so generate = kind + format + level only (no topic picking).
 */

import { sectionsForKind } from "@/config/reportCatalogue";
import {
  latestPackCapture,
  type BbbeeFacts,
  type BudgetFacts,
  type CsiFacts,
  type EmploymentFacts,
  type EsgPeriodFacts,
  type GrmPeriodFacts,
  type IssueLogFacts,
} from "@/lib/captureStore";
import {
  computeEmpowermentSpent,
  empowermentBudgetFromDossier,
} from "@/lib/empowermentSpend";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import {
  REPORT_KIND_LABELS,
  type ReportKind,
  type ReportSectionId,
} from "@/types/activityReport";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Stakeholder } from "@/types/stakeholder";

export type ProjectDataCategoryId =
  | "overview"
  | "incidents_grm"
  | "employment_training"
  | "bbbee"
  | "esg"
  | "budget"
  | "stakeholders"
  | "csi"
  | "issue_log";

export type ProjectCategoryFact = {
  label: string;
  value: string;
};

export type ProjectDataCategory = {
  id: ProjectDataCategoryId;
  label: string;
  description: string;
  /** Report kinds that pull this category when generating. */
  reportKinds: ReportKind[];
  /** Capture / module deep links for monitoring & editing. */
  captureHref?: string;
  moduleHref?: string;
  hasData: boolean;
  facts: ProjectCategoryFact[];
  chartBars: Array<{ label: string; value: number }>;
};

function pack<T>(
  projectId: string,
  id:
    | "employment"
    | "bbbee"
    | "esg_period"
    | "grm_period"
    | "issue_log"
    | "budget"
    | "csi",
): T | null {
  const row = latestPackCapture(projectId, id);
  if (!row?.structured || row.structured.pack !== id) return null;
  return row.structured.data as T;
}

function money(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(n);
}

function num(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return String(n);
}

/** Projects shown on the executive dashboard (open delivery set). */
export function isExecutiveDashboardProject(project: Project): boolean {
  // Include Draft — desks often create a second project before flipping status.
  // Only Completed / Closed are parked off the main overview.
  return project.status !== "Completed" && project.status !== "Closed";
}

/** @deprecated use isExecutiveDashboardProject */
export function isActivePortfolioProject(project: Project): boolean {
  return isExecutiveDashboardProject(project);
}

/**
 * Build category segments for one project — the project dashboard SoT
 * that also feeds report templates by kind.
 */
export function buildProjectCategoryMap(args: {
  project: Project;
  incidents: Incident[];
  stakeholders?: Stakeholder[];
}): ProjectDataCategory[] {
  const { project, incidents } = args;
  const scoped = incidents.filter((i) => i.projectId === project.id);
  const open = scoped.filter((i) => i.status !== "Closed");
  const pulse = trustIndexFromIncidents(scoped);
  const stakeholders = (args.stakeholders || []).filter((s) =>
    (s.projectIds || []).includes(project.id),
  );

  const emp = pack<EmploymentFacts>(project.id, "employment");
  const bb = pack<BbbeeFacts>(project.id, "bbbee");
  const esg = pack<EsgPeriodFacts>(project.id, "esg_period");
  const grm = pack<GrmPeriodFacts>(project.id, "grm_period");
  const issueLog = pack<IssueLogFacts>(project.id, "issue_log");
  const budgetPack = pack<BudgetFacts>(project.id, "budget");
  const csi = pack<CsiFacts>(project.id, "csi");

  const spent =
    computeEmpowermentSpent(project.id) ||
    project.dossier?.empowermentTargets?.empowermentSpentZar ||
    project.budgetSpent ||
    0;
  const envelope =
    empowermentBudgetFromDossier(project.dossier) ??
    (project.budgetTotal > 0 ? project.budgetTotal : 0);
  const available = Math.max(0, envelope - spent);
  const spendPct =
    envelope > 0 ? Math.min(100, Math.round((spent / envelope) * 100)) : null;

  const id = encodeURIComponent(project.id);
  const capture = (source: string) =>
    `/app/capture?projectId=${id}&source=${source}`;

  const categories: ProjectDataCategory[] = [
    {
      id: "overview",
      label: "Project overview",
      description: "Dossier, place, funder, and programme status.",
      reportKinds: ["monthly_activity", "mel", "mel_retrospective", "board_investor", "executive_risk"],
      captureHref: capture("project_profile"),
      moduleHref: `/app/projects/${id}`,
      hasData: Boolean(
        project.name ||
          project.clientFunder ||
          project.dossier?.funder?.name ||
          project.ward,
      ),
      facts: [
        { label: "Status", value: project.status },
        { label: "Funder / client", value: project.clientFunder || "—" },
        {
          label: "Place",
          value:
            [project.ward, project.municipality].filter(Boolean).join(" · ") ||
            "—",
        },
        {
          label: "Sector",
          value: project.dossier?.sector || "—",
        },
      ],
      chartBars: [
        { label: "Open cases", value: open.length },
        { label: "Trust", value: pulse.trustIndex },
      ],
    },
    {
      id: "incidents_grm",
      label: "Incidents & GRM",
      description: "Cases, grievance volumes, turnaround.",
      reportKinds: [
        "issue_handling",
        "grm",
        "monthly_activity",
        "mel",
        "mel_retrospective",
        "health_safety",
        "executive_risk",
      ],
      captureHref: capture("grm_period"),
      moduleHref: `/app/incidents?project=${id}`,
      hasData: scoped.length > 0 || Boolean(grm),
      facts: [
        { label: "Cases on file", value: num(scoped.length) },
        { label: "Open", value: num(open.length) },
        {
          label: "Escalated",
          value: num(
            open.filter(
              (i) =>
                i.status === "Escalated" || i.escalationLevel !== "None",
            ).length,
          ),
        },
        {
          label: "GRM pack opened / closed",
          value: grm
            ? `${num(grm.casesOpened)} / ${num(grm.casesClosed)}`
            : "—",
        },
        { label: "Trust pulse", value: `${pulse.trustIndex}/100 (${pulse.label})` },
      ],
      chartBars: [
        { label: "Open", value: open.length },
        {
          label: "Closed",
          value: scoped.filter((i) => i.status === "Closed").length,
        },
        {
          label: "Escalated",
          value: open.filter(
            (i) => i.status === "Escalated" || i.escalationLevel !== "None",
          ).length,
        },
      ],
    },
    {
      id: "issue_log",
      label: "Issue log pathway",
      description: "Report → follow-ups → escalate → resolve → close.",
      reportKinds: ["issue_handling", "grm", "monthly_activity", "mel", "mel_retrospective", "executive_risk"],
      captureHref: capture("issue_log"),
      hasData: Boolean(
        (issueLog?.entries || []).some((e) => e.title?.trim()) ||
          (issueLog?.casesLogged ?? 0) > 0,
      ),
      facts: [
        {
          label: "Pathways",
          value: num(
            (issueLog?.entries || []).filter((e) => e.title?.trim()).length ||
              issueLog?.casesLogged,
          ),
        },
        { label: "Open", value: num(issueLog?.casesOpen) },
        { label: "Closed", value: num(issueLog?.casesClosed) },
        { label: "Escalated", value: num(issueLog?.casesEscalated) },
        { label: "Themes", value: issueLog?.topThemes || "—" },
      ],
      chartBars: [
        { label: "Open", value: issueLog?.casesOpen ?? 0 },
        { label: "Closed", value: issueLog?.casesClosed ?? 0 },
        { label: "Escalated", value: issueLog?.casesEscalated ?? 0 },
      ],
    },
    {
      id: "employment_training",
      label: "Employment & training",
      description: "Local hire, workforce, training days and spend.",
      reportKinds: ["bbbee", "esg", "board_investor", "mel", "monthly_activity"],
      captureHref: capture("employment"),
      hasData: Boolean(emp),
      facts: [
        {
          label: "Local hire",
          value:
            emp?.localHireActual != null || emp?.localHireTarget != null
              ? `${num(emp?.localHireActual)} / ${num(emp?.localHireTarget)}`
              : "—",
        },
        { label: "Workforce", value: num(emp?.totalWorkforce) },
        { label: "Training days", value: num(emp?.trainingDays) },
        { label: "Training spend", value: money(emp?.trainingSpendZar) },
        {
          label: "Women / youth / PWD",
          value: `${num(emp?.womenEmployed)} / ${num(emp?.youthEmployed)} / ${num(emp?.personsWithDisability)}`,
        },
      ],
      chartBars: [
        { label: "Hire actual", value: emp?.localHireActual ?? 0 },
        { label: "Hire target", value: emp?.localHireTarget ?? 0 },
        { label: "Training days", value: emp?.trainingDays ?? 0 },
      ],
    },
    {
      id: "bbbee",
      label: "B-BBEE / empowerment",
      description: "Ownership, skills, procurement, ESD.",
      reportKinds: ["bbbee", "esg", "board_investor", "mel"],
      captureHref: capture("bbbee"),
      hasData: Boolean(bb) || Boolean(project.dossier?.empowermentTargets),
      facts: [
        {
          label: "Level",
          value:
            bb?.bbbeeLevel ||
            project.dossier?.empowermentTargets?.bbbeeLevelTarget ||
            "—",
        },
        { label: "Black ownership %", value: num(bb?.blackOwnershipPct) },
        { label: "Skills spend", value: money(bb?.skillsDevSpendZar) },
        {
          label: "Preferential procurement",
          value: money(bb?.preferentialProcurementZar),
        },
        { label: "ESD spend", value: money(bb?.esdSpendZar) },
      ],
      chartBars: [
        {
          label: "Skills Rk",
          value: Math.round((bb?.skillsDevSpendZar ?? 0) / 1000),
        },
        {
          label: "Procure Rk",
          value: Math.round((bb?.preferentialProcurementZar ?? 0) / 1000),
        },
        {
          label: "ESD Rk",
          value: Math.round((bb?.esdSpendZar ?? 0) / 1000),
        },
      ],
    },
    {
      id: "esg",
      label: "ESG",
      description: "Environment, social trust, H&S period notes.",
      reportKinds: ["esg", "environmental", "health_safety", "board_investor"],
      captureHref: capture("esg_period"),
      hasData: Boolean(esg) || Boolean(project.dossier?.communityIntel),
      facts: [
        {
          label: "Env incidents",
          value: num(esg?.environmentalIncidents),
        },
        {
          label: "Dust / water / noise",
          value: esg?.dustWaterNoiseNotes?.slice(0, 80) || "—",
        },
        {
          label: "H&S near miss / LTI",
          value: `${num(esg?.hsNearMisses)} / ${num(esg?.hsLostTimeInjuries)}`,
        },
        {
          label: "Community trust notes",
          value: esg?.communityTrustNotes?.slice(0, 80) || "—",
        },
        {
          label: "Area unemployment",
          value:
            project.dossier?.communityIntel?.unemploymentRatePct != null
              ? `${project.dossier.communityIntel.unemploymentRatePct}%`
              : "—",
        },
      ],
      chartBars: [
        { label: "Env incidents", value: esg?.environmentalIncidents ?? 0 },
        { label: "Near misses", value: esg?.hsNearMisses ?? 0 },
        { label: "LTI", value: esg?.hsLostTimeInjuries ?? 0 },
      ],
    },
    {
      id: "budget",
      label: "Empowerment budget",
      description: "Authorised envelope, spent, available.",
      reportKinds: ["board_investor", "mel", "bbbee", "esg"],
      captureHref: capture("budget"),
      hasData: envelope > 0 || spent > 0 || Boolean(budgetPack),
      facts: [
        { label: "Authorised", value: money(envelope) },
        { label: "Spent", value: money(spent) },
        { label: "Available", value: money(available) },
        {
          label: "Achieved",
          value: spendPct != null ? `${spendPct}%` : "—",
        },
        {
          label: "Period spend (pack)",
          value: money(budgetPack?.periodSpendZar),
        },
      ],
      chartBars: [
        { label: "Spent %", value: spendPct ?? 0 },
        { label: "Available Rk", value: Math.round(available / 1000) },
      ],
    },
    {
      id: "stakeholders",
      label: "Stakeholders",
      description: "People and organisations linked to this project.",
      reportKinds: ["monthly_activity", "csi", "mel", "board_investor", "grm", "executive_risk"],
      moduleHref: "/app/stakeholders",
      hasData: stakeholders.length > 0,
      facts: [
        { label: "Linked to project", value: num(stakeholders.length) },
        {
          label: "Kinds",
          value:
            [...new Set(stakeholders.map((s) => s.kind))].slice(0, 4).join(", ") ||
            "—",
        },
        {
          label: "Sample",
          value:
            stakeholders
              .slice(0, 3)
              .map((s) => s.name)
              .join(" · ") || "—",
        },
      ],
      chartBars: [{ label: "Linked", value: stakeholders.length }],
    },
    {
      id: "csi",
      label: "CSI / community investment",
      description: "Programmes, beneficiaries, spend.",
      reportKinds: ["csi", "esg", "board_investor", "monthly_activity"],
      captureHref: capture("csi"),
      hasData: Boolean(csi),
      facts: [
        { label: "Programme", value: csi?.programmeName || "—" },
        { label: "Beneficiaries", value: csi?.beneficiaryGroup || "—" },
        { label: "Amount", value: money(csi?.amountZar) },
        { label: "Reached", value: num(csi?.beneficiariesReached) },
      ],
      chartBars: [
        {
          label: "Spend Rk",
          value: Math.round((csi?.amountZar ?? 0) / 1000),
        },
        { label: "Reached", value: csi?.beneficiariesReached ?? 0 },
      ],
    },
  ];

  return categories;
}

/** Categories that feed a given report kind. */
export function categoriesForReportKind(
  categories: ProjectDataCategory[],
  kind: ReportKind,
): ProjectDataCategory[] {
  return categories.filter((c) => c.reportKinds.includes(kind));
}

/** Section ids auto-selected for a kind (desk-gated by caller). */
export function mappedSectionIdsForKind(kind: ReportKind): ReportSectionId[] {
  return sectionsForKind(kind).map((s) => s.id);
}

export function reportKindOptions(): Array<{ id: ReportKind; label: string }> {
  return (Object.keys(REPORT_KIND_LABELS) as ReportKind[]).map((id) => ({
    id,
    label: REPORT_KIND_LABELS[id],
  }));
}

/** Human summary of which category data will fill the chosen kind. */
export function kindDataCoverageSummary(
  categories: ProjectDataCategory[],
  kind: ReportKind,
): string {
  const mapped = categoriesForReportKind(categories, kind);
  const ready = mapped.filter((c) => c.hasData).map((c) => c.label);
  const empty = mapped.filter((c) => !c.hasData).map((c) => c.label);
  const parts: string[] = [];
  if (ready.length) parts.push(`Ready: ${ready.join(", ")}`);
  if (empty.length) parts.push(`Still empty: ${empty.join(", ")}`);
  return parts.join(" · ") || "No mapped categories for this kind yet.";
}
