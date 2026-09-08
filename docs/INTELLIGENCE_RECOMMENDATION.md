# I-06 — Explainable Recommendation Foundation

**Status:** Shipped as **contracts and helpers only**. Not a product module. Not a dashboard. Not Cloud DocTypes.  
**Packet:** I-06.  
**Depends on:** I-01, I-02, I-03, I-04, I-05.  
**Does not replace** I-01 `IntelligenceRecommendationRecord`, TE-4 `TrustRecommendation`, or SRM entities.

A recommendation answers: *what might a person consider doing, given the intelligence?* It is a **suggestion**, not a decision, not an action, and not a copied intelligence statement. ADR-006 remains locked: `suggestion_only`, `humanApplyRequired: true`, `autonomous: false`.

## What this is

| Piece | Path |
|--------|------|
| Types | `src/types/intelligenceRecommendation.ts` |
| Helpers | `src/lib/intelligence/recommendation.ts` |

An `ExplainableRecommendationRecord` is an I-01 `IntelligenceRecommendationRecord` plus:

- **Identity / domain / subject** — `id`, optional `domain`, `subjectRefs`
- **Statement** — `statement` (kept in sync with I-01 `title`); must not copy a contributing intelligence statement
- **Suggested action + rationale + objective**
- **Intelligence inputs** — `intelligenceId` / `intelligenceIds` (one or more)
- **Traceability** — `interpretationIds`, `signalIds`, `contextIds`, `evidenceRefs`
- **Alternatives** — always includes an explicit **no-action** option
- **Risks, constraints, dependencies, limitations, missing evidence**
- **Confidence** — I-01 evidential vocabulary. Not a probability or score
- **Temporal window** — I-02 `IntelligenceTemporalContext`
- **Provenance** — I-01, including optional methodology identity/version
- **Governance** — locked `SuggestionGovernance`
- **Review state** — `proposed | reviewed | accepted | rejected | withdrawn` (judgement on the suggestion). This is **not** `HumanDecisionStatus`. Accepting a recommendation does not create a decision record and does not execute anything.

`assembleRecommendationFromIntelligence` copies intelligence/interpretation/signal/context/evidence refs. Statement, action, rationale, and objective must be supplied.

`recordRecommendationReview` returns a **new** row. `accepted` / `rejected` here are still suggestions.

Traceability: **Recommendation → Intelligence → Interpretation → Signal → Context → Evidence**.

## Compatibility

| Surface | Change |
|---------|--------|
| I-01 / I-02 / I-03 / I-04 / I-05 contracts | Unchanged (recommendation record is compatible with I-01) |
| TE-4 adapter `commonRecommendationFromTrust` | Unchanged |
| SRM entities / UI / Cloud / `srm-core` | None |

## Next packet (not this one)

Human Decision remains an I-01 record (`recordHumanDecision`). P-01 productises it on the stakeholder workspace (`docs/STAKEHOLDER_INTELLIGENCE_WORKSPACE.md`). A dedicated I-07 foundation packet still requires a new ASSIGNED TASK.
