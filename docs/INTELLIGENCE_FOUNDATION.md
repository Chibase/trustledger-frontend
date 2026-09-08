# I-01 — Common Intelligence Foundation

**Status:** Shipped as **contracts and helpers only**. Not a product module. Not a dashboard. Not Cloud DocTypes.  
**Packet:** I-01.  
**Does not replace** Trust layer (TE-1–TE-12), SI CRM, grievance, packs, or existing TE-4 recommendations.

Living contract for:

Evidence → Context → Signal → Interpretation → Intelligence → Recommendation → Human Decision → Action → Outcome → Learning

## What this is

Shared TypeScript contracts so later intelligence capabilities attach to one lifecycle instead of inventing parallel shapes.

| Piece | Path |
|--------|------|
| Types | `src/types/intelligenceFoundation.ts` |
| Helpers | `src/lib/intelligence/foundation.ts` |
| TE-4 adapter (read-only) | `src/lib/intelligence/fromTrust.ts` |

Recommendations always carry `decision: "suggestion_only"`, `humanApplyRequired: true`, `autonomous: false` (ADR-006). Human decisions are a **separate stage** and a **new record**. Existing TE-4 `TrustRecommendation` rows are unchanged; they can be mapped with `commonRecommendationFromTrust`.

Methodologies are an identity stub (`IntelligenceMethodRef`). There is no methodology engine, registry UI, marketplace, LLM, graph, or BAU module in this packet.

## Compatibility

| Surface | Change |
|---------|--------|
| Trust pulse / TE-4 panel / packs | Unchanged |
| Stakeholder / engagement / incident entities | Unchanged |
| Cloud DocTypes / `srm-core` | None |
| UI | None |

## Next packet (not this one)

I-02 context contracts live in `docs/INTELLIGENCE_CONTEXT.md`. Further intelligence packets require a new ASSIGNED TASK.
