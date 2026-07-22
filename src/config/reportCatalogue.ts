/**
 * Report catalogue — kinds, sections, seniority gates.
 */

import type { DeskTier } from "@/types/deskTier";
import {
  type ReportKind,
  type ReportSectionDef,
  type ReportSectionId,
} from "@/types/activityReport";

/** Lower = more junior. */
export const DESK_TIER_RANK: Record<DeskTier, number> = {
  clo: 1,
  site: 2,
  supervisor: 3,
  delivery: 4,
  oversight: 5,
  funder: 5,
};

export function tierMeetsMinimum(
  authorTier: DeskTier,
  minTier: DeskTier,
): boolean {
  return DESK_TIER_RANK[authorTier] >= DESK_TIER_RANK[minTier];
}

export const REPORT_SECTIONS: ReportSectionDef[] = [
  {
    id: "period_summary",
    label: "Period summary",
    description: "Narrative of what the incumbent did in the period.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "issue_handling", "mel"],
  },
  {
    id: "activity_log",
    label: "Activity log",
    description: "Day-to-day field and desk actions.",
    minTier: "clo",
    defaultFor: ["monthly_activity"],
  },
  {
    id: "issues_attended",
    label: "Issues attended to",
    description: "Cases the reporter handled.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "issue_handling", "grm"],
  },
  {
    id: "issues_escalated",
    label: "Issues escalated",
    description: "Cases sent to senior intervention.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "issue_handling", "grm"],
  },
  {
    id: "issues_resolved",
    label: "Issues resolved / closed",
    description: "Outcomes achieved in the period.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "issue_handling", "grm"],
  },
  {
    id: "issues_pending",
    label: "Issues still pending",
    description: "Open work remaining.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "issue_handling", "grm"],
  },
  {
    id: "issues_unresolved",
    label: "Unable to resolve",
    description: "Blocked or failed outcomes — with reasons.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "issue_handling", "grm"],
  },
  {
    id: "meetings_arranged",
    label: "Meetings arranged",
    description: "Consultations set up by the reporter.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "csi", "mel"],
  },
  {
    id: "meetings_conducted",
    label: "Meetings conducted",
    description: "Sessions chaired or facilitated.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "csi"],
  },
  {
    id: "meetings_attended",
    label: "Meetings attended (with whom)",
    description: "Participation and counterparties.",
    minTier: "clo",
    defaultFor: ["monthly_activity"],
  },
  {
    id: "attendance_registers",
    label: "Attendance registers",
    description: "Registers attached as evidence.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "csi", "mel"],
  },
  {
    id: "meeting_minutes",
    label: "Minutes of meetings",
    description: "Minute packs linked from Capture hub.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "csi", "mel"],
  },
  {
    id: "photo_evidence",
    label: "Photos / site evidence",
    description: "Visual evidence stubs for the period.",
    minTier: "clo",
    defaultFor: ["monthly_activity", "environmental", "health_safety"],
  },
  {
    id: "trust_sentiment",
    label: "Trust & sentiment",
    description: "Trust pulse and sentiment trends.",
    minTier: "supervisor",
    defaultFor: ["monthly_activity", "grm", "esg", "board_investor"],
  },
  {
    id: "tat_sla",
    label: "Turnaround / SLA",
    description: "Stage TAT vs client targets.",
    minTier: "supervisor",
    defaultFor: ["issue_handling", "grm", "mel"],
  },
  {
    id: "grievance_lifecycle",
    label: "GRM lifecycle summary",
    description: "Full grievance process view.",
    minTier: "supervisor",
    defaultFor: ["grm", "board_investor"],
  },
  {
    id: "environmental_indicators",
    label: "Environmental indicators",
    description: "Env KPIs and incidents.",
    minTier: "site",
    defaultFor: ["environmental", "esg"],
  },
  {
    id: "hs_incidents",
    label: "H&S incidents & controls",
    description: "Health and safety case summary.",
    minTier: "site",
    defaultFor: ["health_safety"],
  },
  {
    id: "esg_scorecard",
    label: "ESG scorecard",
    description: "Consolidated ESG view for seniors.",
    minTier: "delivery",
    defaultFor: ["esg", "board_investor"],
  },
  {
    id: "bbbee_empowerment",
    label: "Empowerment / B-BBEE",
    description: "Local content and empowerment metrics.",
    minTier: "delivery",
    defaultFor: ["bbbee", "board_investor"],
  },
  {
    id: "csi_spend",
    label: "CSI programmes & spend",
    description: "Community investment evidence.",
    minTier: "supervisor",
    defaultFor: ["csi"],
  },
  {
    id: "mel_indicators",
    label: "MEL indicators",
    description: "Monitoring, evaluation and learning measures.",
    minTier: "supervisor",
    defaultFor: ["mel", "board_investor"],
  },
  {
    id: "budget_spend",
    label: "Budget vs spend",
    description: "Financial portfolio figures.",
    minTier: "delivery",
    defaultFor: ["board_investor", "mel"],
  },
  {
    id: "portfolio_risk",
    label: "Portfolio risk overview",
    description: "Cross-project risk for seniors.",
    minTier: "delivery",
    defaultFor: ["board_investor", "esg"],
  },
  {
    id: "board_recommendations",
    label: "Board / investor recommendations",
    description: "Executive asks and decisions required.",
    minTier: "delivery",
    defaultFor: ["board_investor"],
  },
  {
    id: "appendix_evidence",
    label: "Evidence appendix",
    description: "Index of registers, minutes, photos for disputes / performance.",
    minTier: "clo",
    defaultFor: [
      "monthly_activity",
      "issue_handling",
      "grm",
      "environmental",
      "health_safety",
      "csi",
      "mel",
      "board_investor",
    ],
  },
];

export function sectionsForKind(kind: ReportKind): ReportSectionDef[] {
  return REPORT_SECTIONS.filter(
    (s) => s.defaultFor.includes(kind) || s.id === "appendix_evidence",
  );
}

export function allSections(): ReportSectionDef[] {
  return REPORT_SECTIONS;
}

export function sectionById(id: ReportSectionId): ReportSectionDef | undefined {
  return REPORT_SECTIONS.find((s) => s.id === id);
}

/** Preferred audience defaults by author tier. */
export function defaultAudienceForTier(tier: DeskTier): import("@/types/activityReport").ReportAudience {
  switch (tier) {
    case "clo":
      return "supervisor";
    case "site":
      return "delivery_leadership";
    case "supervisor":
      return "delivery_leadership";
    case "delivery":
      return "board";
    case "oversight":
      return "regulator";
    case "funder":
      return "board";
  }
}

export function defaultKindForTier(tier: DeskTier): ReportKind {
  switch (tier) {
    case "clo":
    case "site":
      return "monthly_activity";
    case "supervisor":
      return "grm";
    case "delivery":
    case "funder":
      return "board_investor";
    case "oversight":
      return "esg";
  }
}
