/**
 * Evidence-based activity / assurance reports — human selects, AI drafts.
 */

import type { DeskTier } from "@/types/deskTier";

export const REPORT_KINDS = [
  "monthly_activity",
  "issue_handling",
  "grm",
  "environmental",
  "health_safety",
  "esg",
  "bbbee",
  "csi",
  "mel",
  "executive_risk",
  "board_investor",
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  monthly_activity: "Monthly activity report",
  issue_handling: "Issue handling report",
  grm: "Grievance (GRM) report",
  environmental: "Environmental report",
  health_safety: "Health & safety (H&S) report",
  esg: "ESG report",
  bbbee: "Empowerment / B-BBEE report",
  csi: "CSI report",
  mel: "MEL (monitoring & evaluation) report",
  executive_risk: "Executive risk brief",
  board_investor: "Board / investor / funder brief",
};

export const REPORT_AUDIENCES = [
  "supervisor",
  "site_leadership",
  "delivery_leadership",
  "clients",
  "funders_investors",
  "board",
  "regulator",
] as const;

export type ReportAudience = (typeof REPORT_AUDIENCES)[number];

export const REPORT_AUDIENCE_LABELS: Record<ReportAudience, string> = {
  supervisor: "Supervisor / senior consultant",
  site_leadership: "Site manager / foreman",
  delivery_leadership: "Directors / PMs / engineers",
  clients: "Clients",
  funders_investors: "Funders / investors",
  board: "Board",
  regulator: "Regulator / assurance",
};

export const REPORT_SECTION_IDS = [
  "period_summary",
  "activity_log",
  "issues_attended",
  "issues_escalated",
  "issues_resolved",
  "issues_pending",
  "issues_unresolved",
  "meetings_arranged",
  "meetings_conducted",
  "meetings_attended",
  "attendance_registers",
  "meeting_minutes",
  "photo_evidence",
  "trust_sentiment",
  "tat_sla",
  "grievance_lifecycle",
  "issue_log_pathway",
  "environmental_indicators",
  "hs_incidents",
  "esg_scorecard",
  "bbbee_empowerment",
  "csi_spend",
  "mel_indicators",
  "budget_spend",
  "portfolio_risk",
  "identified_risks",
  "project_impact",
  "impact_level",
  "mitigation_in_progress",
  "mitigation_process",
  "expected_outcome",
  "executive_expedite",
  "board_recommendations",
  "appendix_evidence",
] as const;

export type ReportSectionId = (typeof REPORT_SECTION_IDS)[number];

export type ReportSectionDef = {
  id: ReportSectionId;
  label: string;
  description: string;
  /** Minimum desk tier that may include this section. */
  minTier: DeskTier;
  /** Typical report kinds that default this section on. */
  defaultFor: ReportKind[];
};

export type EvidenceStubRef = {
  id: string;
  kind: "attendance" | "minutes" | "photo" | "register" | "other";
  label: string;
  linkedCaptureId?: string;
};

export type SavedReport = {
  id: string;
  kind: ReportKind;
  audience: ReportAudience;
  title: string;
  periodLabel: string;
  authorTier: DeskTier;
  authorName: string;
  projectId?: string;
  projectName?: string;
  includedSections: ReportSectionId[];
  /** Locked / greyed sections shown for transparency. */
  lockedSections: ReportSectionId[];
  bodyMarkdown: string;
  evidence: EvidenceStubRef[];
  status: "draft" | "submitted" | "archived";
  createdAt: string;
  updatedAt: string;
  /** Evidence / performance / dispute use. */
  purposeTags: Array<"reporting" | "performance" | "dispute">;
  /** Preferred view/print format when reopening (charts / details / both). */
  preferredFormat?: ReportFormatId;
};

/** Project report view / print / download format. */
export type ReportFormatId = "charts" | "details" | "charts_details";

export const REPORT_FORMAT_LABELS: Record<ReportFormatId, string> = {
  charts: "Charts",
  details: "Details",
  charts_details: "Charts + details",
};
