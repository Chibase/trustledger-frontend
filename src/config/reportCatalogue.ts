/**
 * Report catalogue — kinds, sections, seniority gates.
 * Desk rank 1 (highest) → 5 (lowest); see `@/types/deskTier`.
 */

import {
  DESK_TIER_RANK,
  tierMeetsMinimum,
  type DeskTier,
} from "@/types/deskTier";
import {
  type ReportKind,
  type ReportSectionDef,
  type ReportSectionId,
} from "@/types/activityReport";

export { DESK_TIER_RANK, tierMeetsMinimum };

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
    id: "issue_log_pathway",
    label: "Issue log pathway",
    description:
      "Report → follow-ups → escalate → feedback → resolve → close from Capture Issue log entries.",
    minTier: "clo",
    defaultFor: ["issue_handling", "grm", "monthly_activity", "mel"],
  },
  {
    id: "environmental_indicators",
    label: "Environmental indicators",
    description: "Env KPIs and incidents.",
    minTier: "supervisor",
    defaultFor: ["environmental", "esg"],
  },
  {
    id: "hs_incidents",
    label: "H&S incidents & controls",
    description: "Health and safety case summary.",
    minTier: "supervisor",
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
    id: "what_worked",
    label: "What worked",
    description: "On-track expected vs actual, closed cases, done Learn & Adapt records.",
    minTier: "clo",
    defaultFor: ["mel_retrospective"],
  },
  {
    id: "what_did_not",
    label: "What did not",
    description: "Shortfall watches, open tagged cases, open Learn & Adapt records.",
    minTier: "clo",
    defaultFor: ["mel_retrospective"],
  },
  {
    id: "what_will_change",
    label: "What we will change",
    description: "Open Adapt actions on file — never invented.",
    minTier: "clo",
    defaultFor: ["mel_retrospective"],
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
    defaultFor: ["board_investor", "esg", "executive_risk"],
  },
  {
    id: "identified_risks",
    label: "Identified issues",
    description: "Open and escalated matters the executive must see.",
    minTier: "delivery",
    defaultFor: ["executive_risk"],
  },
  {
    id: "project_impact",
    label: "Project impact",
    description: "How each issue affects delivery, access, or social licence.",
    minTier: "delivery",
    defaultFor: ["executive_risk"],
  },
  {
    id: "impact_level",
    label: "Impact level",
    description: "Critical / high / medium with SLA and escalation.",
    minTier: "delivery",
    defaultFor: ["executive_risk"],
  },
  {
    id: "mitigation_in_progress",
    label: "Mitigation in progress",
    description: "What the desk is doing now.",
    minTier: "delivery",
    defaultFor: ["executive_risk"],
  },
  {
    id: "mitigation_process",
    label: "Mitigation process",
    description: "Where each issue sits on report → close.",
    minTier: "delivery",
    defaultFor: ["executive_risk"],
  },
  {
    id: "expected_outcome",
    label: "Expected outcome",
    description: "What close-out should look like.",
    minTier: "delivery",
    defaultFor: ["executive_risk"],
  },
  {
    id: "executive_expedite",
    label: "Executive actions",
    description: "Decisions or unblocks that would speed close-out.",
    minTier: "delivery",
    defaultFor: ["executive_risk"],
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
  if (kind === "mel_retrospective") {
    return REPORT_SECTIONS.filter(
      (s) =>
        s.id === "what_worked" ||
        s.id === "what_did_not" ||
        s.id === "what_will_change",
    );
  }
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
    case "supervisor":
      return "delivery_leadership";
    case "delivery":
      return "board";
    case "executive":
      return "board";
    case "funder":
      return "board";
  }
}

export function defaultKindForTier(tier: DeskTier): ReportKind {
  switch (tier) {
    case "clo":
      return "monthly_activity";
    case "supervisor":
      return "grm";
    case "delivery":
      return "executive_risk";
    case "executive":
      return "executive_risk";
    case "funder":
      return "board_investor";
  }
}
