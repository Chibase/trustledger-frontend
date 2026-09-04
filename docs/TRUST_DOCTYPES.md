# Trust layer Cloud DocTypes (TE-7)

**Status:** Shipped as Cloud SoT for live customer/trial workspaces. Ops ensure + BFF CRUD.  
**Frontend types:** `src/types/trustLayer.ts`  
**Local cache:** `tl-trust-layer` (offline / demo). Live SoT is Frappe.

Dimension status stays **computed** (TE-2/TE-3 ±0.34 rules). Not a DocType.

## Names

| DocType | Maps to | Autoname |
|---------|---------|----------|
| `TL Trust Observation` | `TrustObservation` | `observation_code` |
| `TL Trust Participation` | `TrustParticipationRecord` | `participation_code` |
| `TL Trust Community Context` | `TrustCommunityContext` | `community_code` |

Each has required `customer` (Link Customer) for SEC-1. Buyer role: read/write/create, no delete.

## Sentiment

`srm_sentiment_capture` / case `sentiment_label` / `sentiment_score` remain **generic sentiment**. They are not these DocTypes and must not be copied into trust observations. Observation `signal` / `signal_score` are trust-layer fields only.

TE-1 `trustResponse` / `trustSupport` overlay keys are **not** Cloud columns.

## APIs (this repo)

| Route | Purpose |
|-------|---------|
| `POST /api/frappe/ensure-product-doctypes` | Idempotent create (includeTrust default true) |
| `GET /api/frappe/trust` | List observation + participation + community for the bound Customer |
| `POST /api/frappe/trust` | Upsert `kind=observation\|participation\|community\|bucket` |
| `POST /api/frappe/product-smoke` | Ops smoke for those kinds |
| `POST /api/frappe/migrate-org` | First live login also pushes local trust rows |

Empty Cloud stays empty (no demo `INC-*` bleed).

## Client behaviour

Live mode: load/save go through the BFF; local storage is a cache. Capture apply still requires human apply (no auto-save while typing). Overlay is still omitted from incident/engagement/stakeholder Cloud mappers.
