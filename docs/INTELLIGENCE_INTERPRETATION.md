# I-04 — Explainable Interpretation Foundation

**Status:** Shipped as **contracts and helpers only**. Not a product module. Not a dashboard. Not Cloud DocTypes.  
**Packet:** I-04.  
**Depends on:** I-01, I-02, I-03.  
**Does not replace** I-01 `IntelligenceInterpretationRecord`, TE-4 recommendations, or SRM entities.

An interpretation answers: *what else could this signal mean?* It is a **reasoned hypothesis**, not established truth and not intelligence synthesis.

## What this is

| Piece | Path |
|--------|------|
| Types | `src/types/intelligenceInterpretation.ts` |
| Helpers | `src/lib/intelligence/interpretation.ts` |

An `ExplainableInterpretationRecord` is an I-01 `IntelligenceInterpretationRecord` plus:

- **Identity / domain** — `id`, optional `domain`
- **Inputs** — `signalId` / `signalIds`, `contextIds`, `evidenceRefs`
- **Hypothesis + rationale** — required; not inferred from the signal
- **Alternatives** — `alternatives` (I-01 strings) and `alternativesDetailed`
- **Confidence** — I-01 evidential vocabulary (`indicative`, `uncertain`, …). Not a probability or score
- **Limitations / missing evidence**
- **Temporal window** — I-02 `IntelligenceTemporalContext`
- **Provenance** — I-01, including optional methodology identity/version
- **Review state** — `proposed | reviewed | endorsed | disputed | withdrawn` (judgement on the hypothesis, not an action decision)

`assembleInterpretationFromSignal` copies signal/context refs and the temporal window. Hypothesis, rationale, and alternatives must be supplied. Two interpretation rows may share a `signalId`.

`recordInterpretationReview` returns a **new** row. Endorsement is not a recommendation or human decision to act.

## Compatibility

| Surface | Change |
|---------|--------|
| I-01 / I-02 / I-03 contracts | Unchanged (interpretation record is compatible) |
| TE-4 / SRM entities | Unchanged |
| UI / Cloud / `srm-core` | None |

## Next packet (not this one)

Intelligence synthesis (I-05) requires a new ASSIGNED TASK.
