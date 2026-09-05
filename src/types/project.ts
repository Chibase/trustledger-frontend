import type { MelIndicator } from "@/types/mel";

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
    /** Authorised empowerment envelope (skills + procurement + ESD). */
    empowermentBudgetZar?: number;
    /** Rolled empowerment spent from Capture packs (auto). */
    empowermentSpentZar?: number;
    womenYouthPwdTargets?: string;
  };
  promises?: ProjectPromise[];
  geo?: {
    countryCode?: string;
    countryName?: string;
    provinceId?: string;
    provinceName?: string;
    districtId?: string;
    districtName?: string;
    municipalityId?: string;
    municipalityName?: string;
    traditionalCouncilId?: string;
    traditionalCouncilName?: string;
    wardId?: string;
    wardName?: string;
    /** Leaf place used for platform baseline lookup (ADR-040). */
    placeId?: string;
    placeLabel?: string;
  };
  communityIntel?: {
    unemploymentRatePct?: number;
    unemploymentSource?: string;
    localBusinessesNotes?: string;
    structuresNotes?: string;
    neetYouthNotes?: string;
    /** Featured / cascade place id the baseline was taken from. */
    baselinePlaceId?: string;
    baselineAttachedAt?: string;
    /** Snapshot of attached Stats SA / Census rows (platform baseline). */
    attachedIndicators?: Array<{
      placeId: string;
      key: string;
      label: string;
      value: number;
      unit: string;
      year?: number;
      source?: string;
    }>;
    /** Human-readable dump of attached baseline rows. */
    baselineSummary?: string;
    /**
     * Tenant-owned local community intelligence + project impact.
     * - baseline_compare: ward surveys beside Stats SA
     * - project_impact: labour / training / procurement (count + ZAR) for LED, ESG, M&E
     * Never merged into platform packs (ADR-040); feeds funder roll-up from local upward.
     */
    localIndicators?: Array<{
      key: string;
      label: string;
      value: number;
      unit: string;
      year?: number;
      source?: string;
      notes?: string;
      captureId?: string;
      domain?: "baseline_compare" | "project_impact";
      category?: "baseline" | "labour" | "training" | "procurement" | "socio";
      audiences?: Array<"LED" | "ESG" | "ME" | "funder" | "CLO">;
    }>;
    localIntelAttachedAt?: string;
    localIntelCaptureId?: string;
    localIntelSummary?: string;
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
  /**
   * MEL-1 expected vs actual rows. Cloud SoT on `mel_json`.
   * Undefined = not loaded / omit on PUT. Empty array is explicit empty.
   */
  melIndicators?: MelIndicator[];
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
      d.communityIntel?.structuresNotes ||
      (d.communityIntel?.attachedIndicators?.length ?? 0) > 0 ||
      (d.communityIntel?.localIndicators?.length ?? 0) > 0 ||
      d.geo?.placeId ||
      d.geo?.municipalityId,
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
