import {
  assembleIntelligenceFromInterpretations,
  assembleInterpretationFromSignal,
  assembleSignalFromContext,
  assembleStakeholderContext,
  createExplainableIntelligence,
  createExplainableInterpretation,
  createIntelligenceProvenance,
  createIntelligenceRecommendation,
  intelligenceAppliesAt,
  intelligenceIsNotRecommendation,
  interpretationIsNotIntelligence,
  isIntelligenceRecord,
  isInterpretationRecord,
  recordHumanDecision,
  recordIntelligenceReview,
} from "@/lib/intelligence";
import { INTELLIGENCE_CONFIDENCE_LEVELS } from "@/types/intelligenceFoundation";
import { INTELLIGENCE_REVIEW_STATES } from "@/types/intelligenceSynthesis";
import type { IntelligenceLifecycleRecord } from "@/types/intelligenceFoundation";
import type { Stakeholder } from "@/types/stakeholder";

const stakeholder: Stakeholder = {
  id: "STK-INTL-1",
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
    recordRefs: [{ kind: "stakeholder", id: "STK-INTL-1" }],
    humanReviewed: true,
  });

describe("I-05 explainable intelligence foundation", () => {
  it("is distinct from interpretation and does not copy a hypothesis", () => {
    const interpretation = createExplainableInterpretation({
      id: "int-1",
      signalId: "sig-1",
      hypothesis: "Absences may reflect competing priorities.",
      rationale: "Two missed meetings are on file.",
      provenance: provenance(),
    });
    const row = createExplainableIntelligence(
      {
        id: "intl-1",
        domain: "stakeholder",
        statement:
          "Engagement reliability for this liaison is currently constrained.",
        synthesis:
          "Two plausible readings (competing priorities vs capacity) both point to reduced availability, not to established intent.",
        interpretationIds: ["int-1", "int-2"],
        signalIds: ["sig-1"],
        contextIds: ["ctx-1"],
        evidenceRefs: [{ kind: "engagement", id: "ENG-1" }],
        subjectRefs: [{ kind: "stakeholder", id: "STK-INTL-1" }],
        missingEvidenceRefs: [{ kind: "evidence", id: "EVD-missing" }],
        confidence: "indicative",
        limitations: "No interview record confirming the reason.",
        temporal: {
          asOf: "2026-08-15T00:00:00.000Z",
          validFrom: "2026-07-01T00:00:00.000Z",
          validTo: null,
        },
        provenance: provenance(),
      },
      [interpretation.hypothesis],
    );

    expect(row.stage).toBe("intelligence");
    expect(isIntelligenceRecord(row)).toBe(true);
    expect(isInterpretationRecord(row)).toBe(false);
    expect(intelligenceIsNotRecommendation(row)).toBe(true);
    expect(row.statement).not.toBe(interpretation.hypothesis);
    expect(row.summary).toBe(row.statement);
    expect(row.interpretationIds).toEqual(["int-1", "int-2"]);
    expect(row.confidence).toBe("indicative");
    expect(INTELLIGENCE_CONFIDENCE_LEVELS).toContain(row.confidence);
    expect(typeof row.confidence).toBe("string");
    expect(row).not.toHaveProperty("probability");
    expect(row).not.toHaveProperty("score");
    expect(row).not.toHaveProperty("hypothesis");
    expect(row.provenance.method?.id).toBe("client-lens");
    expect(row.reviewState).toBe("proposed");
    expect(() =>
      createExplainableIntelligence(
        {
          id: "intl-dup",
          statement: interpretation.hypothesis,
          synthesis: "A longer synthesis that is not the statement.",
          interpretationIds: ["int-1"],
          provenance: provenance(),
        },
        [interpretation.hypothesis],
      ),
    ).toThrow(/must not duplicate an interpretation hypothesis/);
  });

  it("lets multiple interpretations contribute and keeps the chain traceable", () => {
    const context = assembleStakeholderContext({
      id: "ctx-intl-1",
      stakeholder,
      operating: { capacity: "low", bauPressure: "high" },
      engagements: [{ id: "ENG-1" }, { id: "ENG-2" }],
      evidence: [{ id: "EVD-1" }],
    });
    const signal = assembleSignalFromContext({
      id: "sig-intl-1",
      context,
      summary: "Two missed meetings are on file.",
      explanation: "ENG-1 and ENG-2 list the stakeholder as absent.",
      classification: "observation",
    });
    const first = assembleInterpretationFromSignal({
      id: "int-a",
      signal,
      context,
      hypothesis: "The absences may reflect high BAU pressure.",
      rationale: "Context records bauPressure=high. This is one plausible reading.",
      alternatives: ["The absences may reflect low capacity."],
      confidence: "uncertain",
      limitations: "Cause is not established.",
    });
    const second = assembleInterpretationFromSignal({
      id: "int-b",
      signal,
      context,
      hypothesis: "The absences may reflect low capacity.",
      rationale: "Context records capacity=low. This is another plausible reading.",
      confidence: "uncertain",
      limitations: "No direct capacity assessment is on file.",
    });
    expect(interpretationIsNotIntelligence(first)).toBe(true);

    const intelligence = assembleIntelligenceFromInterpretations({
      id: "intl-chain",
      interpretations: [first, second],
      statement:
        "Current operating conditions make reliable meeting attendance uncertain.",
      synthesis:
        "The two hypotheses (BAU pressure and capacity) are both consistent with the same absences; neither is established. Decision-relevant understanding is that availability is constrained until further evidence arrives.",
      confidence: "uncertain",
      subjectRefs: [{ kind: "stakeholder", id: stakeholder.id }],
    });

    expect(intelligence.interpretationIds).toEqual(["int-a", "int-b"]);
    expect(intelligence.signalIds).toContain("sig-intl-1");
    expect(intelligence.contextIds).toContain("ctx-intl-1");
    expect(intelligence.evidenceRefs.length).toBeGreaterThan(0);
    expect(intelligence.statement).not.toBe(first.hypothesis);
    expect(intelligence.statement).not.toBe(second.hypothesis);
    expect(intelligence.limitations).toMatch(/Cause is not established/);
    expect(intelligence.limitations).toMatch(/capacity assessment/);
    expect(intelligence.confidence).toBe("uncertain");
    expect(first.confidence).toBe("uncertain");
    expect(second.confidence).toBe("uncertain");
  });

  it("keeps review state separate from recommendations and decisions", () => {
    const proposed = createExplainableIntelligence({
      id: "intl-rev",
      statement: "Attendance reliability is currently constrained.",
      synthesis:
        "Contributing interpretations remain hypotheses; the shared implication is reduced availability, not a prescribed next step.",
      interpretationIds: ["int-1"],
      temporal: {
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2026-06-30T00:00:00.000Z",
      },
      provenance: provenance(),
    });
    const reviewed = recordIntelligenceReview(proposed, {
      reviewState: "endorsed",
      reviewedBy: "plan-owner",
      reviewedAt: "2026-09-08T00:00:00.000Z",
    });
    expect(proposed.reviewState).toBe("proposed");
    expect(reviewed.reviewState).toBe("endorsed");
    expect(reviewed.provenance.humanReviewed).toBe(true);
    expect(intelligenceAppliesAt(proposed, "2026-03-01T00:00:00.000Z")).toBe(
      true,
    );
    expect(intelligenceAppliesAt(proposed, "2026-08-01T00:00:00.000Z")).toBe(
      false,
    );

    const recommendation = createIntelligenceRecommendation({
      id: "rec-1",
      intelligenceId: proposed.id,
      title: "Consider a listening step",
      action: "A person decides.",
      rationale: "Suggestion only.",
      provenance: provenance(),
    });
    const decision = recordHumanDecision({
      id: "dec-1",
      recommendationId: recommendation.id,
      status: "accepted",
      provenance: provenance(),
    });
    const stages: IntelligenceLifecycleRecord[] = [
      proposed,
      recommendation,
      decision,
    ];
    expect(stages.map((row) => row.stage)).toEqual([
      "intelligence",
      "recommendation",
      "human_decision",
    ]);
    expect(INTELLIGENCE_REVIEW_STATES).toEqual([
      "proposed",
      "reviewed",
      "endorsed",
      "disputed",
      "withdrawn",
    ]);
    expect(reviewed).not.toHaveProperty("action");
    expect(reviewed).not.toHaveProperty("governance");
    expect(reviewed).not.toHaveProperty("status");
    expect(isIntelligenceRecord(recommendation)).toBe(false);
  });
});
