/**
 * TE-4 rule catalog — auditable, suggestion-only.
 * IDs are stable so a recommendation can be traced to the rule that produced it.
 */

export const TRUST_INTELLIGENCE_RULES = {
  "TR-REPAIR-DECLINING": {
    kind: "trust_repair" as const,
    summary:
      "When a dimension trend is declining, suggest a trust-repair conversation on that dimension. Does not change case status.",
  },
  "TR-REPAIR-AT-RISK": {
    kind: "trust_repair" as const,
    summary:
      "When a dimension level is at risk (mean ≤ −0.34), suggest a repair step. Does not auto-close or auto-escalate.",
  },
  "TR-ENGAGE-LOW-WILLINGNESS": {
    kind: "next_engagement" as const,
    summary:
      "When willingness to participate is low more often than high, suggest a listening / confirmation step before asking for contributions.",
  },
  "TR-ENGAGE-NO-CAPTURE": {
    kind: "next_engagement" as const,
    summary:
      "When there are trust observations but no participation rows, suggest capturing willingness on the next engagement. Overlay remains optional.",
  },
  "TR-FOLLOWUP-LOW-CONFIDENCE": {
    kind: "follow_up" as const,
    summary:
      "When a scored sample is below 3, suggest more observations before treating the reading as firm.",
  },
  "TR-FOLLOWUP-MISSING-EVIDENCE": {
    kind: "follow_up" as const,
    summary:
      "When a declining or at-risk reading has no evidence ids, suggest attaching evidence before using the claim in a pack.",
  },
  "TR-ESCALATE-OPEN-DECLINE": {
    kind: "escalation" as const,
    summary:
      "When trust is declining or at risk and high-priority cases are still open, suggest considering senior review. Never auto-escalates.",
  },
  "TR-ALERT-WEAK-PARTICIPATION": {
    kind: "alert" as const,
    summary:
      "Flag weak participation from explicit low willingness only. Mixed, obligation, or livelihood motive does not invent this alert. Informational — does not create engagements.",
  },
  "TR-ALERT-UNRESOLVED-CONCERN": {
    kind: "alert" as const,
    summary:
      "Flag open community cases that still look unresolved while trust is being read. Does not change incident workflow.",
  },
} as const;

export type TrustIntelligenceRuleId = keyof typeof TRUST_INTELLIGENCE_RULES;

export type TrustRecommendationKind =
  | "next_engagement"
  | "trust_repair"
  | "follow_up"
  | "escalation";

export type TrustAlertKind =
  | "declining_trust"
  | "missing_evidence"
  | "weak_participation"
  | "unresolved_concerns";

export type TrustTrace = {
  ruleId: TrustIntelligenceRuleId;
  ruleSummary: string;
  observationIds: string[];
  evidenceIds: string[];
  incidentIds: string[];
  riskIds: string[];
};

export type TrustRecommendation = {
  id: string;
  kind: TrustRecommendationKind;
  title: string;
  action: string;
  rationale: string;
  priority: "attention" | "watch";
  decision: "suggestion_only";
  humanApplyRequired: true;
  autonomous: false;
  trace: TrustTrace;
};

export type TrustAlert = {
  id: string;
  kind: TrustAlertKind;
  title: string;
  detail: string;
  severity: "watch" | "attention";
  decision: "suggestion_only";
  trace: TrustTrace;
};

export function trustRuleSummary(ruleId: TrustIntelligenceRuleId): string {
  return TRUST_INTELLIGENCE_RULES[ruleId].summary;
}
