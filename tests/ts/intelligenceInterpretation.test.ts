import {
  assembleInterpretationFromSignal,
  assembleSignalFromContext,
  assembleStakeholderContext,
  createExplainableInterpretation,
  createIntelligenceProvenance,
  createIntelligenceRecommendation,
  interpretationAppliesAt,
  interpretationIsNotIntelligence,
  isInterpretationRecord,
  recordInterpretationReview,
} from "@/lib/intelligence";
import { INTELLIGENCE_CONFIDENCE_LEVELS } from "@/types/intelligenceFoundation";
import { INTERPRETATION_REVIEW_STATES } from "@/types/intelligenceInterpretation";
import type { IntelligenceLifecycleRecord } from "@/types/intelligenceFoundation";
import type { Stakeholder } from "@/types/stakeholder";

const stakeholder: Stakeholder = {
  id: "STK-INT-1",
  name: "Example liaison",
  kind: "individual",
  status: "active",
  influence: "high",
  interests: [],
  tags: [],
  lastEngagedOn: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
};

describe("I-04 explainable interpretation foundation", () => {
  it("records a hypothesis with alternatives, evidence, and evidential confidence", () => {
    const provenance = createIntelligenceProvenance({
      producer: "human",
      method: { kind: "methodology", id: "client-lens", version: "0.1" },
      recordRefs: [{ kind: "stakeholder", id: "STK-INT-1" }],
      humanReviewed: true,
    });
    const row = createExplainableInterpretation({
      id: "int-1",
      domain: "stakeholder",
      signalId: "sig-1",
      signalIds: ["sig-1", "sig-2"],
      contextIds: ["ctx-1"],
      evidenceRefs: [{ kind: "engagement", id: "ENG-1" }],
      missingEvidenceRefs: [{ kind: "evidence", id: "EVD-missing" }],
      hypothesis: "Absences may reflect competing priorities.",
      rationale: "The context row records competingPriorities=medium and two missed meetings.",
      alternatives: [
        { id: "alt-capacity", hypothesis: "Absences may reflect capacity constraints." },
        { id: "alt-access", hypothesis: "Absences may reflect access or timing barriers." },
      ],
      confidence: "indicative",
      limitations: "No interview record confirming the reason.",
      temporal: {
        asOf: "2026-08-15T00:00:00.000Z",
        validFrom: "2026-07-01T00:00:00.000Z",
        validTo: null,
      },
      provenance,
    });

    expect(row.stage).toBe("interpretation");
    expect(isInterpretationRecord(row)).toBe(true);
    expect(interpretationIsNotIntelligence(row)).toBe(true);
    expect(row.signalId).toBe("sig-1");
    expect(row.signalIds).toEqual(["sig-1", "sig-2"]);
    expect(row.alternatives).toHaveLength(2);
    expect(row.alternativesDetailed).toHaveLength(2);
    expect(row.confidence).toBe("indicative");
    expect(INTELLIGENCE_CONFIDENCE_LEVELS).toContain(row.confidence);
    expect(row).not.toHaveProperty("probability");
    expect(row).not.toHaveProperty("score");
    expect(row.provenance.method?.id).toBe("client-lens");
    expect(row.reviewState).toBe("proposed");
    expect(typeof row.confidence).toBe("string");
  });

  it("assembles from an I-03 signal without inferring the hypothesis", () => {
    const context = assembleStakeholderContext({
      id: "ctx-int-1",
      stakeholder,
      operating: { capacity: "low", bauPressure: "high" },
    });
    const signal = assembleSignalFromContext({
      id: "sig-int-1",
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
    });
    expect(first.signalId).toBe("sig-int-1");
    expect(second.signalId).toBe("sig-int-1");
    expect(first.hypothesis).not.toBe(second.hypothesis);
    expect(first.contextIds).toContain("ctx-int-1");
    expect(signal.classification).toBe("observation");
    expect(first.hypothesis).not.toBe(signal.explanation);
  });

  it("keeps review state separate from recommendations and decisions", () => {
    const provenance = createIntelligenceProvenance({
      producer: "human",
      recordRefs: [{ kind: "stakeholder", id: "STK-INT-1" }],
    });
    const proposed = createExplainableInterpretation({
      id: "int-rev",
      signalId: "sig-1",
      hypothesis: "Competing priorities may explain delayed replies.",
      rationale: "Open commitments and delayed replies are both on file.",
      alternatives: ["Capacity constraints may explain delayed replies."],
      temporal: {
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2026-06-30T00:00:00.000Z",
      },
      provenance,
    });
    const reviewed = recordInterpretationReview(proposed, {
      reviewState: "endorsed",
      reviewedBy: "plan-owner",
      reviewedAt: "2026-09-08T00:00:00.000Z",
    });
    expect(proposed.reviewState).toBe("proposed");
    expect(reviewed.reviewState).toBe("endorsed");
    expect(reviewed.provenance.humanReviewed).toBe(true);
    expect(interpretationAppliesAt(proposed, "2026-03-01T00:00:00.000Z")).toBe(
      true,
    );
    expect(interpretationAppliesAt(proposed, "2026-08-01T00:00:00.000Z")).toBe(
      false,
    );

    const recommendation = createIntelligenceRecommendation({
      id: "rec-1",
      title: "Consider a listening step",
      action: "A person decides.",
      rationale: "Suggestion only.",
      provenance,
    });
    const stages: IntelligenceLifecycleRecord[] = [proposed, recommendation];
    expect(stages.map((row) => row.stage)).toEqual([
      "interpretation",
      "recommendation",
    ]);
    expect(INTERPRETATION_REVIEW_STATES).toEqual([
      "proposed",
      "reviewed",
      "endorsed",
      "disputed",
      "withdrawn",
    ]);
    expect(reviewed).not.toHaveProperty("action");
    expect(reviewed).not.toHaveProperty("governance");
  });
});
