# I-02 — Contextual Intelligence Foundation

**Status:** Shipped as **contracts and helpers only**. Not a product module. Not a dashboard. Not Cloud DocTypes.  
**Packet:** I-02.  
**Depends on:** I-01 (`docs/INTELLIGENCE_FOUNDATION.md`).  
**Does not replace** Stakeholder CRM, Commitment entities, Trust community context, or I-01 lifecycle types.

Context answers: *what surrounds the data?* It stays **descriptive**. A signal, interpretation, or recommendation is a later stage.

## What this is

| Piece | Path |
|--------|------|
| Types | `src/types/intelligenceContext.ts` |
| Assembly | `src/lib/intelligence/context.ts` |

A context row (`ContextualIntelligenceRecord`) is an I-01 `IntelligenceContextRecord` plus:

- **Temporal window** — `asOf`, `capturedAt`, `validFrom`, `validTo` (open window when `validTo` is omitted or null)
- **Entity refs** — `subjectRefs` + `relatedRefs` to existing spine records (not a graph)
- **Evidence / provenance** — `evidenceRefs` + I-01 `IntelligenceProvenance`
- **Stakeholder operating context** — Influence, Impact, Capacity, Commitment, plus BAU pressure, competing priorities, availability, accountability clarity, engagement burden

Levels are `high | medium | low | unknown`, matching existing `StakeholderInfluence`. They are not scores. `commitment` here is an operating-context attribute, not the Commitment DocType.

`assembleStakeholderContext` copies recorded `influence` and optional supplied attributes. It does **not** infer burden, pressure, or capacity from engagement/commitment counts.

## Compatibility

| Surface | Change |
|---------|--------|
| Stakeholder / engagement / commitment entities | Unchanged |
| I-01 lifecycle types | Unchanged (context record is compatible) |
| UI / Cloud / `srm-core` | None |

## Next packet (not this one)

Signals, interpretation, relationship intelligence, and I-03 require a new ASSIGNED TASK.
