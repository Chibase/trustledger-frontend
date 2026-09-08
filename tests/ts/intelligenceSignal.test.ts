import {
  assembleSignalFromContext,
  assembleStakeholderContext,
  createExplainableSignal,
  createIntelligenceProvenance,
  createIntelligenceRecommendation,
  isSignalRecord,
  signalAppliesAt,
  signalIsNotInterpretation,
} from "@/lib/intelligence";
import type { Stakeholder } from "@/types/stakeholder";
import {
  SIGNAL_CLASSIFICATIONS,
  SIGNAL_STATES,
} from "@/types/intelligenceSignal";
import type { IntelligenceLifecycleRecord } from "@/types/intelligenceFoundation";

const stakeholder: Stakeholder = {
  id: "STK-SIG-1",
  name: "Example liaison",
  kind: "individual",
  status: "active",
  influence: "high",
  interests: [],
  tags: [],
  placeId: "za-place-1",
  projectIds: ["PRJ-1"],
  lastEngagedOn: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
};

describe("I-03 explainable signal foundation", () => {
  it("records an explainable signal with identity, refs, time, and provenance", () => {
    const provenance = createIntelligenceProvenance({
      producer: "observation",
      method: { kind: "unknown", id: "manual-note", version: "0" },
      recordRefs: [{ kind: "stakeholder", id: "STK-SIG-1" }],
      capturedAt: "2026-08-15T00:00:00.000Z",
    });
    const signal = createExplainableSignal({
      id: "sig-1",
      domain: "stakeholder",
      summary: "Missed two recorded meetings in the current window.",
      explanation:
        "Attendance notes ENG-1 and ENG-2 list the stakeholder as absent.",
      classification: "observation",
      state: "observed",
      provenance,
      subjectRefs: [{ kind: "stakeholder", id: "STK-SIG-1" }],
      relatedRefs: [{ kind: "engagement", id: "ENG-1" }],
      evidenceRefs: [{ kind: "evidence", id: "EVD-1" }],
      observations: [
        {
          id: "obs-1",
          observedAt: "2026-08-01T00:00:00.000Z",
          refs: [{ kind: "engagement", id: "ENG-1" }],
          note: "Marked absent on ENG-1.",
        },
      ],
      temporal: {
        asOf: "2026-08-15T00:00:00.000Z",
        capturedAt: "2026-08-15T00:00:00.000Z",
        validFrom: "2026-07-01T00:00:00.000Z",
        validTo: null,
      },
    });

    expect(signal.stage).toBe("signal");
    expect(isSignalRecord(signal)).toBe(true);
    expect(signalIsNotInterpretation(signal)).toBe(true);
    expect(signal.classification).toBe("observation");
    expect(signal.state).toBe("observed");
    expect(signal.subjectRefs).toEqual([
      { kind: "stakeholder", id: "STK-SIG-1" },
    ]);
    expect(signal.relatedRefs).toEqual([{ kind: "engagement", id: "ENG-1" }]);
    expect(signal.evidenceRefs).toEqual(
      expect.arrayContaining([
        { kind: "evidence", id: "EVD-1" },
        { kind: "engagement", id: "ENG-1" },
      ]),
    );
    expect(signal.observations).toHaveLength(1);
    expect(signal.provenance.method?.id).toBe("manual-note");
    expect(signal.provenance.method).not.toHaveProperty("score");
    expect(signal).not.toHaveProperty("hypothesis");
    expect(signal).not.toHaveProperty("score");
  });

  it("links I-02 context without inferring a classification from operating levels", () => {
    const context = assembleStakeholderContext({
      id: "ctx-sig-1",
      stakeholder,
      operating: { bauPressure: "high", capacity: "low" },
      engagements: [{ id: "ENG-9" }],
    });
    const signal = assembleSignalFromContext({
      id: "sig-from-ctx",
      context,
      summary: "High recorded BAU pressure on the stakeholder context row.",
      explanation:
        "The context row records bauPressure=high. This is a copied attribute, not a cause.",
      classification: "condition",
    });
    expect(signal.contextIds).toEqual(["ctx-sig-1"]);
    expect(signal.subjectRefs).toEqual([
      { kind: "stakeholder", id: "STK-SIG-1" },
    ]);
    expect(signal.relatedRefs.some((ref) => ref.id === "ENG-9")).toBe(true);
    expect(signal.classification).toBe("condition");
    expect(signal.classification).not.toBe("change");
    expect(context.operating?.bauPressure).toBe("high");
    expect(signal).not.toHaveProperty("riskScore");
  });

  it("stays a signal, not interpretation, recommendation, or decision", () => {
    const provenance = createIntelligenceProvenance({
      producer: "recorded_fact",
      recordRefs: [{ kind: "stakeholder", id: "STK-SIG-1" }],
    });
    const signal = createExplainableSignal({
      id: "sig-sep",
      summary: "Three open commitments are on file.",
      explanation: "Commitment records COM-1, COM-2, and COM-3 are open.",
      classification: "pattern",
      provenance,
      temporal: {
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2026-06-30T00:00:00.000Z",
      },
    });
    expect(signalAppliesAt(signal, "2026-03-01T00:00:00.000Z")).toBe(true);
    expect(signalAppliesAt(signal, "2026-08-01T00:00:00.000Z")).toBe(false);

    const recommendation = createIntelligenceRecommendation({
      id: "rec-1",
      title: "Consider a listening step",
      action: "A person decides.",
      rationale: "Suggestion only.",
      provenance,
    });
    const stages: IntelligenceLifecycleRecord[] = [signal, recommendation];
    expect(stages.map((row) => row.stage)).toEqual(["signal", "recommendation"]);
    expect(SIGNAL_CLASSIFICATIONS).toEqual([
      "condition",
      "change",
      "pattern",
      "observation",
    ]);
    expect(SIGNAL_STATES).toEqual([
      "observed",
      "active",
      "superseded",
      "withdrawn",
    ]);
  });
});
