# Trust layer Cloud DocTypes (future)

**Status:** Contract only. Not ensured on Cloud. Not buyer CRUD.  
**First-class model today:** TypeScript types + `tl-trust-layer` (`docs/TRUST_LAYER.md`).

TE-2b completes the **frontend** trust model so SRM sentiment is not used as a stand-in. Frappe DocTypes (`TL Trust Observation`, dimension status, participation, community context) stay **future** until an approved packet wires `ensure` + BFF + SEC-1, same as TE-6 `TRUST_MVP_FUTURE`.

## Proposed names (do not create yet)

| DocType (working name) | Maps to |
|------------------------|---------|
| TL Trust Observation | `TrustObservation` |
| TL Trust Dimension Status | `TrustDimensionStatus` (derived, may stay computed) |
| TL Trust Participation | `TrustParticipationRecord` |
| TL Trust Community Context | `TrustCommunityContext` |

Each would need `customer` (Link Customer) for SEC-1. Do not POST TE-2 rows to Frappe until that packet exists.

## Sentiment

`srm_sentiment_capture` / case `sentiment_label` / `sentiment_score` remain **generic sentiment**. They are not these DocTypes and must not be copied into trust observations.
