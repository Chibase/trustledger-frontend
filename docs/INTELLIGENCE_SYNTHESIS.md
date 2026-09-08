# I-05 — Explainable Intelligence Foundation

**Status:** Shipped as **contracts and helpers only**. Not a product module. Not a dashboard. Not Cloud DocTypes.  
**Packet:** I-05.  
**Depends on:** I-01, I-02, I-03, I-04.  
**Does not replace** I-01 `IntelligenceSynthesisRecord`, I-04 interpretations, TE-4 recommendations, or SRM entities.

Intelligence answers: *what understanding follows from the contributing interpretations?* It is a **decision-relevant synthesis**, not a copied hypothesis, not a recommendation, and not a decision to act.

## What this is

| Piece | Path |
|--------|------|
| Types | `src/types/intelligenceSynthesis.ts` |
| Helpers | `src/lib/intelligence/synthesis.ts` |

An `ExplainableIntelligenceRecord` is an I-01 `IntelligenceSynthesisRecord` plus:

- **Identity / domain** — `id`, optional `domain`
- **Statement** — `statement` (kept in sync with I-01 `summary`); must not duplicate a contributing hypothesis
- **Synthesis** — required rationale for why the statement follows from the interpretations
- **Inputs** — `interpretationIds` (one or more), `signalIds`, `contextIds`, `evidenceRefs`, `subjectRefs`
- **Confidence** — I-01 evidential vocabulary (`indicative`, `uncertain`, …). Not a probability or score
- **Limitations / missing evidence** — caller text plus contributing interpretation limitations
- **Temporal window** — I-02 `IntelligenceTemporalContext`
- **Provenance** — I-01, including optional methodology identity/version
- **Review state** — `proposed | reviewed | endorsed | disputed | withdrawn` (judgement on the synthesis, not an action decision)

`assembleIntelligenceFromInterpretations` copies interpretation/signal/context/evidence refs. Statement and synthesis must be supplied. Two or more interpretation rows may contribute to one intelligence row. A single interpretation is allowed only when the statement is still a synthesis, not a copy of that hypothesis.

`recordIntelligenceReview` returns a **new** row. Endorsement is not a recommendation or human decision to act.

Traceability: **Intelligence → Interpretations → Signals → Context → Evidence**.

## Compatibility

| Surface | Change |
|---------|--------|
| I-01 / I-02 / I-03 / I-04 contracts | Unchanged (intelligence record is compatible with I-01 synthesis) |
| TE-4 / SRM entities | Unchanged |
| UI / Cloud / `srm-core` | None |

## Next packet (not this one)

Recommendation (I-06) requires a new ASSIGNED TASK.
