/**
 * Rule-based trust recommendations and alerts.
 * Suggestion only — never writes SRM records or auto-escalates.
 */

import { TRUST_DIMENSION_LABELS } from "@/types/trustLayer";
import type { Incident } from "@/types/incident";
import type { TrustProofReport } from "@/lib/trust/proofReport";
import {
  TRUST_INTELLIGENCE_RULES,
  trustRuleSummary,
  type TrustAlert,
  type TrustIntelligenceRuleId,
  type TrustRecommendation,
  type TrustTrace,
} from "@/lib/trust/rules";

export type RecommendTrustInput = {
  proof: TrustProofReport;
  incidents?: Incident[];
};

function unique(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function trace(
  ruleId: TrustIntelligenceRuleId,
  extra: Partial<Omit<TrustTrace, "ruleId" | "ruleSummary">> = {},
): TrustTrace {
  return {
    ruleId,
    ruleSummary: trustRuleSummary(ruleId),
    observationIds: unique(extra.observationIds || []),
    evidenceIds: unique(extra.evidenceIds || []),
    incidentIds: unique(extra.incidentIds || []),
    riskIds: unique(extra.riskIds || []),
  };
}

function recommendation(
  rec: Omit<
    TrustRecommendation,
    "decision" | "humanApplyRequired" | "autonomous"
  >,
): TrustRecommendation {
  return {
    ...rec,
    decision: "suggestion_only",
    humanApplyRequired: true,
    autonomous: false,
  };
}

function isOpen(incident: Incident): boolean {
  return incident.status !== "Closed";
}

function isMaterialOpen(incident: Incident): boolean {
  if (!isOpen(incident)) return false;
  return (
    incident.priority === "P1-Critical" ||
    incident.priority === "P2-High" ||
    incident.slaBreached ||
    incident.status === "Escalated"
  );
}

export function openCommunityConcerns(incidents: Incident[] | undefined): Incident[] {
  return (incidents || []).filter(isOpen);
}

export function collectTrustAlerts(input: RecommendTrustInput): TrustAlert[] {
  const { proof } = input;
  const alerts: TrustAlert[] = [];
  const declining = proof.risks.filter((row) => row.kind === "declining_trust");
  const missing = proof.risks.filter(
    (row) => row.kind === "insufficient_evidence",
  );
  const part = proof.participation;
  const open = openCommunityConcerns(input.incidents);
  const material = open.filter(isMaterialOpen);

  if (declining.length) {
    alerts.push({
      id: "alert:declining_trust",
      kind: "declining_trust",
      title: "Declining trust",
      detail: declining.map((row) => row.title).join("; "),
      severity: "attention",
      decision: "suggestion_only",
      trace: trace("TR-REPAIR-DECLINING", {
        observationIds: declining.flatMap((row) => row.observationIds),
        evidenceIds: declining.flatMap((row) => row.evidenceIds),
        riskIds: declining.map((row) => row.id),
      }),
    });
  }

  if (missing.length) {
    alerts.push({
      id: "alert:missing_evidence",
      kind: "missing_evidence",
      title: "Missing evidence",
      detail: missing.map((row) => row.title).join("; "),
      severity: missing.some((row) => row.severity === "attention")
        ? "attention"
        : "watch",
      decision: "suggestion_only",
      trace: trace("TR-FOLLOWUP-MISSING-EVIDENCE", {
        observationIds: missing.flatMap((row) => row.observationIds),
        evidenceIds: missing.flatMap((row) => row.evidenceIds),
        riskIds: missing.map((row) => row.id),
      }),
    });
  }

  const weakParticipation =
    part.total > 0 &&
    (part.participateLow > part.participateHigh ||
      (part.participateHigh === 0 && part.participateLow > 0) ||
      (part.notTrustDriven > part.trustDriven && part.participateHigh === 0));
  if (weakParticipation) {
    alerts.push({
      id: "alert:weak_participation",
      kind: "weak_participation",
      title: "Weak participation signals",
      detail: `Willingness to participate is low (${part.participateLow}) more than high (${part.participateHigh}); trust-driven rows ${part.trustDriven}.`,
      severity: "watch",
      decision: "suggestion_only",
      trace: trace("TR-ALERT-WEAK-PARTICIPATION"),
    });
  }

  if (material.length) {
    const incidentIds = material.map((row) => row.id);
    alerts.push({
      id: "alert:unresolved_concerns",
      kind: "unresolved_concerns",
      title: "Unresolved community concerns",
      detail: `${material.length} open high-priority, breached, or escalated case(s): ${incidentIds.join(", ")}. Existing case workflow is unchanged.`,
      severity: "attention",
      decision: "suggestion_only",
      trace: trace("TR-ALERT-UNRESOLVED-CONCERN", { incidentIds }),
    });
  }

  return alerts;
}

export function recommendTrustActions(
  input: RecommendTrustInput,
): TrustRecommendation[] {
  const { proof } = input;
  const recs: TrustRecommendation[] = [];
  const open = openCommunityConcerns(input.incidents);
  const material = open.filter(isMaterialOpen);

  for (const status of proof.statuses) {
    if (status.trend !== "declining") continue;
    const claim = proof.claims.find((row) => row.dimension === status.dimension);
    const risk = proof.risks.find(
      (row) =>
        row.kind === "declining_trust" && row.dimension === status.dimension,
    );
    recs.push(
      recommendation({
        id: `rec:TR-REPAIR-DECLINING:${status.dimension}`,
        kind: "trust_repair",
        title: `Repair ${TRUST_DIMENSION_LABELS[status.dimension].toLowerCase()}`,
        action: `Acknowledge the decline on ${TRUST_DIMENSION_LABELS[status.dimension].toLowerCase()}, cite the linked evidence, and agree one repair step with the community. Do not close the reading from this suggestion.`,
        rationale: status.rationale,
        priority: "attention",
        trace: trace("TR-REPAIR-DECLINING", {
          observationIds: claim?.observationIds,
          evidenceIds: claim?.evidenceIds,
          riskIds: risk ? [risk.id] : [],
        }),
      }),
    );
  }

  for (const status of proof.statuses) {
    if (status.level !== "at_risk" || status.trend === "declining") continue;
    const claim = proof.claims.find((row) => row.dimension === status.dimension);
    const risk = proof.risks.find(
      (row) =>
        row.kind === "at_risk_level" && row.dimension === status.dimension,
    );
    recs.push(
      recommendation({
        id: `rec:TR-REPAIR-AT-RISK:${status.dimension}`,
        kind: "trust_repair",
        title: `${TRUST_DIMENSION_LABELS[status.dimension]} is at risk`,
        action: `Plan a repair conversation on ${TRUST_DIMENSION_LABELS[status.dimension].toLowerCase()} and record supporting evidence. Suggestion only.`,
        rationale: status.rationale,
        priority: "attention",
        trace: trace("TR-REPAIR-AT-RISK", {
          observationIds: claim?.observationIds,
          evidenceIds: claim?.evidenceIds,
          riskIds: risk ? [risk.id] : [],
        }),
      }),
    );
  }

  const part = proof.participation;
  if (
    part.total > 0 &&
    (part.participateLow > part.participateHigh ||
      (part.participateHigh === 0 && part.participateLow > 0))
  ) {
    recs.push(
      recommendation({
        id: "rec:TR-ENGAGE-LOW-WILLINGNESS",
        kind: "next_engagement",
        title: "Confirm willingness before asking more of people",
        action:
          "Schedule a listening step (meeting, walkabout, or follow-up) to confirm willingness to participate before requesting contributions. Do not auto-create an engagement.",
        rationale: `Low willingness (${part.participateLow}) exceeds high (${part.participateHigh}) on ${part.total} participation record(s).`,
        priority: "watch",
        trace: trace("TR-ENGAGE-LOW-WILLINGNESS"),
      }),
    );
  } else if (part.total === 0 && proof.history.length > 0) {
    recs.push(
      recommendation({
        id: "rec:TR-ENGAGE-NO-CAPTURE",
        kind: "next_engagement",
        title: "Capture participation on the next engagement",
        action:
          "On the next engagement, optionally record willingness to participate / contribute (TE-1 overlay). Capture stays optional and is not written automatically.",
        rationale:
          "Trust observations exist but no participation rows were derived.",
        priority: "watch",
        trace: trace("TR-ENGAGE-NO-CAPTURE", {
          observationIds: proof.history.map((row) => row.observationId),
        }),
      }),
    );
  }

  const lowConfidence = proof.risks.filter((row) => row.kind === "low_confidence");
  if (lowConfidence.length) {
    recs.push(
      recommendation({
        id: "rec:TR-FOLLOWUP-LOW-CONFIDENCE",
        kind: "follow_up",
        title: "Collect more observations before treating this as firm",
        action:
          "Add scored observations until each flagged dimension or community has at least 3 scores. The current reading stays visible.",
        rationale: lowConfidence.map((row) => row.detail).join(" "),
        priority: "watch",
        trace: trace("TR-FOLLOWUP-LOW-CONFIDENCE", {
          observationIds: lowConfidence.flatMap((row) => row.observationIds),
          evidenceIds: lowConfidence.flatMap((row) => row.evidenceIds),
          riskIds: lowConfidence.map((row) => row.id),
        }),
      }),
    );
  }

  const missing = proof.risks.filter(
    (row) => row.kind === "insufficient_evidence",
  );
  if (missing.length) {
    recs.push(
      recommendation({
        id: "rec:TR-FOLLOWUP-MISSING-EVIDENCE",
        kind: "follow_up",
        title: "Attach evidence before using the claim in a pack",
        action:
          "Link existing files or meeting notes to the trust observations. Do not invent evidence ids. Packs stay on the current writer.",
        rationale: missing.map((row) => row.title).join("; "),
        priority: "attention",
        trace: trace("TR-FOLLOWUP-MISSING-EVIDENCE", {
          observationIds: missing.flatMap((row) => row.observationIds),
          riskIds: missing.map((row) => row.id),
        }),
      }),
    );
  }

  const decliningOrRisk =
    proof.overallMovement === "declining" ||
    proof.statuses.some(
      (row) => row.trend === "declining" || row.level === "at_risk",
    );
  if (decliningOrRisk && material.length) {
    const incidentIds = material.map((row) => row.id);
    recs.push(
      recommendation({
        id: "rec:TR-ESCALATE-OPEN-DECLINE",
        kind: "escalation",
        title: "Consider senior review of open material cases",
        action: `Review ${incidentIds.join(", ")} with a senior desk. This does not change priority, escalation level, or case status.`,
        rationale:
          "Trust is declining or at risk while high-priority, breached, or escalated cases remain open. Suggestion only — do not auto-escalate.",
        priority: "attention",
        trace: trace("TR-ESCALATE-OPEN-DECLINE", {
          incidentIds,
          observationIds: proof.history
            .filter((row) => incidentIds.includes(row.sourceId || ""))
            .map((row) => row.observationId),
          riskIds: proof.risks
            .filter(
              (row) =>
                row.kind === "declining_trust" || row.kind === "at_risk_level",
            )
            .map((row) => row.id),
        }),
      }),
    );
  }

  const rank = (row: TrustRecommendation) =>
    (row.priority === "attention" ? "0" : "1") + row.id;
  return recs.sort((a, b) => rank(a).localeCompare(rank(b)));
}

export { TRUST_INTELLIGENCE_RULES };
