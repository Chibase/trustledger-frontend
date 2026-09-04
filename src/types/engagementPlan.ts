/**
 * Stakeholder Engagement Plan (SEP) — SI deepening packet.
 * Facts and playbook mapping are local; Gemini drafts the presentable
 * document (suggest → apply → save). Applied rows land in the existing
 * SRM modules (registry, engagements, commitments).
 */

import type { EngagementKind } from "@/types/engagement";
import type { StakeholderInfluence, StakeholderKind } from "@/types/stakeholder";

export type SepProgrammeKind = "standard" | "relocation";

export type SepStatus = "draft" | "suggested" | "saved" | "applied";

export type SepSourceKind = "rfp" | "tender" | "briefing" | "paste" | "manual";

export type SepSectorId =
  | "infrastructure"
  | "housing"
  | "mining"
  | "energy"
  | "water"
  | "education"
  | "health"
  | "agriculture"
  | "municipal"
  | "conservation"
  | "logistics"
  | "generic";

export type SepModuleId =
  | "projects"
  | "stakeholders"
  | "engagements"
  | "commitments"
  | "capture"
  | "incidents"
  | "geo"
  | "intelligence"
  | "reports";

export type SepPhaseId =
  | "inception"
  | "mapping"
  | "scoping"
  | "first_contact"
  | "consultation"
  | "commitments"
  | "closeout";

export type SepPurpose = "inform" | "consult" | "decide" | "remediate";

export type SepInterest = "high" | "medium" | "low";

export type SepStakeholderClass = {
  id: string;
  label: string;
  kind: StakeholderKind;
  influence: StakeholderInfluence;
  /** Interest in the outcome (power–interest matrix). Derived from purpose if omitted. */
  interest?: SepInterest;
  purpose: SepPurpose;
  why: string;
  /** How this class can be harmed or excluded if skipped. */
  vulnerability?: string;
  namedFromBrief?: string[];
  module: SepModuleId;
};

export type SepActivity = {
  id: string;
  phaseId: SepPhaseId;
  title: string;
  method: string;
  purpose: SepPurpose;
  engagementKind: EngagementKind;
  ownerHint: string;
  timingHint: string;
  evidenceHint: string;
  module: SepModuleId;
  captureTemplate?: "minutes" | "attendance" | "field_note";
};

export type SepPhase = {
  id: SepPhaseId;
  order: number;
  title: string;
  intent: string;
  exitCriteria: string;
  typicalDuration: string;
  module: SepModuleId;
};

export type SepDraftCommitment = {
  id: string;
  title: string;
  ownerHint: string;
  dueHint: string;
  why: string;
};

export type SepInstrument = {
  id: string;
  label: string;
  note: string;
};

export type SepDocumentTable = {
  caption?: string;
  headers: string[];
  rows: string[][];
};

export type SepDocumentSection = {
  id: string;
  heading: string;
  body: string;
  tables?: SepDocumentTable[];
  /** How this section is executed on the live desk (operator only — never exported). */
  protocol?: string;
};

export type EngagementPlan = {
  id: string;
  title: string;
  status: SepStatus;
  sourceKind: SepSourceKind;
  sectorId: SepSectorId;
  /** Relocation / RAP overlay when the brief is a move, not only consultation. */
  programmeKind?: SepProgrammeKind;
  projectId: string | null;
  projectNameHint: string;
  placeHint: string;
  clientFunderHint: string;
  timelineHint: string;
  /** Professional fees / contract value if the briefing named one — never invented. */
  budgetHint?: string;
  /** Tender / RFP / bid number if the briefing labeled one. */
  tenderRefHint?: string;
  /**
   * Organisation implementing the plan (workspace / appointed entity).
   * Not a vendor brand. TBC if the briefing does not name one.
   */
  implementingEntityHint?: string;
  createdAt: string;
  updatedAt: string;
  sourceExcerpt: string;
  purposeStatement: string;
  phases: SepPhase[];
  stakeholderClasses: SepStakeholderClass[];
  activities: SepActivity[];
  commitments: SepDraftCommitment[];
  instruments: SepInstrument[];
  grievancePath: string;
  assumptions: string[];
  documentSections: SepDocumentSection[];
  /** Gemini drafts the client document; template is the playbook fallback. */
  documentDrafter?: "gemini" | "template";
  applied?: {
    at: string;
    stakeholderIds: string[];
    engagementIds: string[];
    commitmentIds: string[];
  };
};

export const SEP_PROGRAMME_LABELS: Record<SepProgrammeKind, string> = {
  standard: "Stakeholder engagement",
  relocation: "Relocation & migration",
};

export const SEP_STATUS_LABELS: Record<SepStatus, string> = {
  draft: "Draft",
  suggested: "Suggested",
  saved: "Saved",
  applied: "Applied to SRM",
};

export const SEP_SOURCE_LABELS: Record<SepSourceKind, string> = {
  rfp: "RFP",
  tender: "Tender",
  briefing: "Briefing",
  paste: "Pasted brief",
  manual: "Facts without a file",
};

export const SEP_SECTOR_LABELS: Record<SepSectorId, string> = {
  infrastructure: "Infrastructure / roads",
  housing: "Housing",
  mining: "Mining / extractives",
  energy: "Energy",
  water: "Water / sanitation",
  education: "Education",
  health: "Health",
  agriculture: "Agriculture",
  municipal: "Municipal / LED",
  conservation: "Conservation / heritage",
  logistics: "Ports / logistics",
  generic: "Multi-sector / other",
};

export const SEP_MODULE_HREF: Record<SepModuleId, string> = {
  projects: "/app/projects",
  stakeholders: "/app/stakeholders",
  engagements: "/app/engagements",
  commitments: "/app/commitments",
  capture: "/app/capture",
  incidents: "/app/incidents",
  geo: "/app/geo",
  intelligence: "/app/intelligence",
  reports: "/app/reports",
};

export const SEP_MODULE_LABELS: Record<SepModuleId, string> = {
  projects: "Projects",
  stakeholders: "Stakeholders",
  engagements: "Engagements",
  commitments: "Commitments",
  capture: "Capture",
  incidents: "Incidents",
  geo: "Place / geo",
  intelligence: "Intelligence",
  reports: "Reports",
};

export const SEP_PHASE_ORDER: SepPhaseId[] = [
  "inception",
  "mapping",
  "scoping",
  "first_contact",
  "consultation",
  "commitments",
  "closeout",
];

export const SEP_PURPOSE_LABELS: Record<SepPurpose, string> = {
  inform: "Inform",
  consult: "Consult",
  decide: "Decide",
  remediate: "Remediate",
};
