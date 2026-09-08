# I-03 — Explainable Signal Foundation

**Status:** Shipped as **contracts and helpers only**. Not a product module. Not a dashboard. Not Cloud DocTypes.  
**Packet:** I-03.  
**Depends on:** I-01 (`docs/INTELLIGENCE_FOUNDATION.md`), I-02 (`docs/INTELLIGENCE_CONTEXT.md`).  
**Does not replace** TE-4 trust alerts/recommendations, I-01 `IntelligenceSignalRecord`, or SRM entities.

A signal answers: *what was observed that deserves attention?* It is **not** a conclusion. Interpretation is a later stage.

## What this is

| Piece | Path |
|--------|------|
| Types | `src/types/intelligenceSignal.ts` |
| Helpers | `src/lib/intelligence/signal.ts` |

An `ExplainableSignalRecord` is an I-01 `IntelligenceSignalRecord` plus:

- **Identity / domain / classification / state** — classification is `condition | change | pattern | observation` (descriptive, not a score)
- **State** — `observed | active | superseded | withdrawn` (lifecycle of the signal row, not risk)
- **Subject and related refs** — existing spine records, not a graph
- **Temporal window** — reused I-02 `IntelligenceTemporalContext`
- **Evidence / context linkage** — `evidenceRefs`, `contextRefs`, `contextIds` (I-02 row ids)
- **Observations** — supporting observable notes with refs
- **Explainability** — `explanation` (what was observed) + I-01 `IntelligenceProvenance` (including optional method identity)

`assembleSignalFromContext` copies refs and the temporal window from an I-02 context row. Classification and explanation must be supplied. Operating-context levels are **not** turned into a class, score, or cause.

## Compatibility

| Surface | Change |
|---------|--------|
| I-01 / I-02 contracts | Unchanged (signal record is compatible) |
| TE-4 alerts / recommendations | Unchanged; not mapped |
| Stakeholder / engagement / incident entities | Unchanged |
| UI / Cloud / `srm-core` | None |

## Next packet (not this one)

Interpretation lives in `docs/INTELLIGENCE_INTERPRETATION.md`. Intelligence synthesis and later packets require a new ASSIGNED TASK.
