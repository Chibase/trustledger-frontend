import {
  assembleIntelligenceFromInterpretations,
  assembleInterpretationFromSignal,
  assembleRecommendationFromIntelligence,
  assembleSignalFromContext,
  assembleStakeholderContext,
  createExplainableRecommendation,
  createIntelligenceProvenance,
  explainableRecommendationIsNotDecision,
  intelligenceIsNotRecommendation,
  isExplainableRecommendationRecord,
  isHumanDecisionRecord,
  isRecommendationRecord,
  recommendationAppliesAt,
  recommendationIsNotADecision,
  recordHumanDecision,
  recordRecommendationReview,
} from "@/lib/intelligence";
import { INTELLIGENCE_CONFIDENCE_LEVELS } from "@/types/intelligenceFoundation";
import { RECOMMENDATION_REVIEW_STATES } from "@/types/intelligenceRecommendation";
import type { IntelligenceLifecycleRecord } from "@/types/intelligenceFoundation";
import type { Stakeholder } from "@/types/stakeholder";

const stakeholder: Stakeholder = {
  id: "STK-REC-1",
  name: "Example liaison",
  kind: "individual",
  status: "active",
  influence: "high",
  interests: [],
  tags: [],
  lastEngagedOn: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
};

const provenance = () =>
  createIntelligenceProvenance({
    producer: "human",
    method: { kind: "methodology", id: "client-lens", version: "0.1" },
    recordRefs: [{ kind: "stakeholder", id: "STK-REC-1" }],
    humanReviewed: true,
  });

describe("I-06 explainable recommendation foundation", () => {
  it("is a suggestion with no-action, not a copy of intelligence or a score", () => {
    const intelligenceStatement =
      "Engagement reliability for this liaison is currently constrained.";
    const row = createExplainableRecommendation(
      {
        id: "rec-1",
        domain: "stakeholder",
        statement: "Consider a short listening conversation before the next meeting.",
        action: "Invite the liaison to a 20-minute listening conversation.",
        rationale:
          "Availability appears constrained; a listening step may confirm which hypothesis holds without committing to a programme change.",
        objective: "Restore a workable engagement cadence if the liaison can participate.",
        intelligenceIds: ["intl-1", "intl-2"],
        interpretationIds: ["int-a"],
        signalIds: ["sig-1"],
        contextIds: ["ctx-1"],
        evidenceRefs: [{ kind: "engagement", id: "ENG-1" }],
        subjectRefs: [{ kind: "stakeholder", id: "STK-REC-1" }],
        missingEvidenceRefs: [{ kind: "evidence", id: "EVD-missing" }],
        risks: "A meeting request may add burden.",
        constraints: "No extra staff time this week.",
        dependencies: "Plan Owner availability.",
        confidence: "indicative",
        limitations: "Cause of absences is not established.",
        temporal: {
          asOf: "2026-08-15T00:00:00.000Z",
          validFrom: "2026-07-01T00:00:00.000Z",
          validTo: null,
        },
        provenance: provenance(),
      },
      [intelligenceStatement],
    );

    expect(row.stage).toBe("recommendation");
    expect(isRecommendationRecord(row)).toBe(true);
    expect(isExplainableRecommendationRecord(row)).toBe(true);
    expect(explainableRecommendationIsNotDecision(row)).toBe(true);
    expect(recommendationIsNotADecision(row)).toBe(true);
    expect(row.statement).not.toBe(intelligenceStatement);
    expect(row.title).toBe(row.statement);
    expect(row.intelligenceId).toBe("intl-1");
    expect(row.intelligenceIds).toEqual(["intl-1", "intl-2"]);
    expect(row.alternatives.some((alt) => alt.noAction)).toBe(true);
    expect(row.governance).toEqual({
      decision: "suggestion_only",
      humanApplyRequired: true,
      autonomous: false,
    });
    expect(row.confidence).toBe("indicative");
    expect(INTELLIGENCE_CONFIDENCE_LEVELS).toContain(row.confidence);
    expect(typeof row.confidence).toBe("string");
    expect(row).not.toHaveProperty("probability");
    expect(row).not.toHaveProperty("score");
    expect(row).not.toHaveProperty("status");
    expect(row.provenance.method?.id).toBe("client-lens");
    expect(row.reviewState).toBe("proposed");
    expect(() =>
      createExplainableRecommendation(
        {
          id: "rec-dup",
          statement: intelligenceStatement,
          action: "Do something else.",
          rationale: "A rationale that is not the statement.",
          objective: "An objective.",
          intelligenceIds: ["intl-1"],
          provenance: provenance(),
        },
        [intelligenceStatement],
      ),
    ).toThrow(/must not copy an intelligence statement/);
  });

  it("assembles from intelligence and keeps the traceability chain", () => {
    const context = assembleStakeholderContext({
      id: "ctx-rec-1",
      stakeholder,
      operating: { capacity: "low", bauPressure: "high" },
      engagements: [{ id: "ENG-1" }],
      evidence: [{ id: "EVD-1" }],
    });
    const signal = assembleSignalFromContext({
      id: "sig-rec-1",
      context,
      summary: "Two missed meetings are on file.",
      explanation: "ENG-1 lists the stakeholder as absent.",
      classification: "observation",
    });
    const interpretation = assembleInterpretationFromSignal({
      id: "int-rec-1",
      signal,
      context,
      hypothesis: "The absences may reflect high BAU pressure.",
      rationale: "Context records bauPressure=high.",
      confidence: "uncertain",
      limitations: "Cause is not established.",
    });
    const intelligence = assembleIntelligenceFromInterpretations({
      id: "intl-rec-1",
      interpretations: [interpretation],
      statement:
        "Current operating conditions make reliable meeting attendance uncertain.",
      synthesis:
        "The BAU-pressure hypothesis is consistent with the absences but is not established.",
      confidence: "uncertain",
      subjectRefs: [{ kind: "stakeholder", id: stakeholder.id }],
    });
    expect(intelligenceIsNotRecommendation(intelligence)).toBe(true);

    const recommendation = assembleRecommendationFromIntelligence({
      id: "rec-chain",
      intelligence: [intelligence],
      statement: "Consider rescheduling the next engagement to a lighter window.",
      action: "Offer two alternative meeting times next week.",
      rationale:
        "If attendance is constrained, a lighter window is a low-commitment way to test availability.",
      objective: "Hold one completed conversation without increasing burden.",
      alternatives: [
        {
          id: "alt-phone",
          statement: "Consider a brief phone check-in instead of a meeting.",
          action: "Request a 10-minute call.",
        },
      ],
      risks: "Rescheduling may be read as deprioritising the relationship.",
      constraints: "The current calendar slot is already booked.",
      dependencies: "Liaison reply.",
      confidence: "uncertain",
    });

    expect(recommendation.intelligenceIds).toEqual(["intl-rec-1"]);
    expect(recommendation.interpretationIds).toContain("int-rec-1");
    expect(recommendation.signalIds).toContain("sig-rec-1");
    expect(recommendation.contextIds).toContain("ctx-rec-1");
    expect(recommendation.evidenceRefs.length).toBeGreaterThan(0);
    expect(recommendation.statement).not.toBe(intelligence.statement);
    expect(recommendation.alternatives.some((alt) => alt.noAction)).toBe(true);
    expect(recommendation.confidence).toBe("uncertain");
  });

  it("keeps accepted review as a suggestion, not a human decision", () => {
    const proposed = createExplainableRecommendation({
      id: "rec-rev",
      statement: "Consider a listening conversation.",
      action: "Invite a listening conversation.",
      rationale: "Availability appears constrained.",
      objective: "Confirm whether a lighter cadence is needed.",
      intelligenceIds: ["intl-1"],
      temporal: {
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2026-06-30T00:00:00.000Z",
      },
      provenance: provenance(),
    });
    const accepted = recordRecommendationReview(proposed, {
      reviewState: "accepted",
      reviewedBy: "plan-owner",
      reviewedAt: "2026-09-08T00:00:00.000Z",
    });
    expect(proposed.reviewState).toBe("proposed");
    expect(accepted.reviewState).toBe("accepted");
    expect(accepted.stage).toBe("recommendation");
    expect(accepted.governance.decision).toBe("suggestion_only");
    expect(explainableRecommendationIsNotDecision(accepted)).toBe(true);
    expect(isHumanDecisionRecord(accepted)).toBe(false);
    expect(recommendationAppliesAt(proposed, "2026-03-01T00:00:00.000Z")).toBe(
      true,
    );
    expect(recommendationAppliesAt(proposed, "2026-08-01T00:00:00.000Z")).toBe(
      false,
    );

    const decision = recordHumanDecision({
      id: "dec-1",
      recommendationId: accepted.id,
      status: "accepted",
      provenance: provenance(),
    });
    const stages: IntelligenceLifecycleRecord[] = [proposed, accepted, decision];
    expect(stages.map((row) => row.stage)).toEqual([
      "recommendation",
      "recommendation",
      "human_decision",
    ]);
    expect(RECOMMENDATION_REVIEW_STATES).toEqual([
      "proposed",
      "reviewed",
      "accepted",
      "rejected",
      "withdrawn",
    ]);
    expect(accepted).not.toHaveProperty("status");
    expect(accepted).not.toHaveProperty("decisionId");
  });
});
