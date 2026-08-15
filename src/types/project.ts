/**
 * Durable programme facts for a project — captured once, reused by
 * field notes, issue intake, and report generation.
 */

export type ProjectStatus =
  | "Draft"
  | "Approved"
  | "Active"
  | "OnHold"
  | "Completed"
  | "Closed";

export type ProjectPromise = {
  id: string;
  text: string;
  ownerLabel?: string;
  dueOn?: string;
  status?: "open" | "at_risk" | "fulfilled" | "deferred";
};

export type ProjectDossier = {
  sector?: string;
  siteDescription?: string;
  empowermentTargets?: {
    localHireTarget?: number;
    bbbeeLevelTarget?: string;
    blackOwnershipTargetPct?: number;
    preferentialProcurementTargetZar?: number;
    skillsDevTargetZar?: number;
    womenYouthPwdTargets?: string;
  };
  promises?: ProjectPromise[];
  geo?: {
    countryCode?: string;
    provinceName?: string;
    municipalityName?: string;
    wardName?: string;
    placeLabel?: string;
  };
  communityIntel?: {
    unemploymentRatePct?: number;
    unemploymentSource?: string;
    localBusinessesNotes?: string;
    structuresNotes?: string;
    neetYouthNotes?: string;
  };
  funder?: {
    name?: string;
    contactLabel?: string;
    reportingCadence?: string;
  };
  budget?: {
    authorisedZar?: number;
    contingencyZar?: number;
  };
  dates?: {
    startDate?: string;
    targetEndDate?: string;
  };
  updatedAt?: string;
};

export interface Project {
  id: string;
  name: string;
  clientFunder: string;
  budgetTotal: number;
  budgetSpent: number;
  ward: string;
  municipality: string;
  status: ProjectStatus;
  contractorName: string;
  startDate: string;
  targetEndDate: string;
  publicSummary: string;
  /** Durable programme pack — empowerment, geo, community intel, promises. */
  dossier?: ProjectDossier;
}

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  "Draft",
  "Approved",
  "Active",
  "OnHold",
  "Completed",
  "Closed",
];

export const PROJECT_SECTOR_OPTIONS = [
  "Infrastructure / roads",
  "Housing",
  "Mining / extractives",
  "Energy",
  "Water / sanitation",
  "Education",
  "Health",
  "Agriculture",
  "Other",
] as const;

export const MEETING_PURPOSE_OPTIONS = [
  "inform",
  "consult",
  "decide",
  "remediate",
] as const;

export const ENGAGEMENT_KIND_OPTIONS = [
  "meeting",
  "consultation",
  "walkabout",
  "briefing",
] as const;

export const SEVERITY_OPTIONS = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export function projectHasDossierBasics(project: Project): boolean {
  const d = project.dossier;
  if (!d) {
    return Boolean(
      project.clientFunder ||
        project.ward ||
        project.municipality ||
        project.budgetTotal > 0 ||
        project.publicSummary,
    );
  }
  return Boolean(
    d.funder?.name ||
      project.clientFunder ||
      d.geo?.wardName ||
      project.ward ||
      d.budget?.authorisedZar ||
      project.budgetTotal > 0 ||
      d.sector ||
      d.siteDescription ||
      d.empowermentTargets?.localHireTarget != null ||
      (d.promises && d.promises.length > 0) ||
      d.communityIntel?.unemploymentRatePct != null ||
      d.communityIntel?.structuresNotes,
  );
}

export function projectChipLabel(project: Project): string {
  const funder =
    project.dossier?.funder?.name || project.clientFunder || "no funder";
  const ward = project.dossier?.geo?.wardName || project.ward || "no ward";
  const budget =
    project.dossier?.budget?.authorisedZar ?? project.budgetTotal;
  const budgetLabel =
    budget > 0 ? `R${budget.toLocaleString("en-ZA")}` : "no budget";
  return `${project.name} · ${funder} · ${ward} · ${budgetLabel}`;
}
