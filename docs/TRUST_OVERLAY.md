# TE-1 — Trust overlay (frontend-only)

**Status:** Shipped as a **non-breaking overlay**. No new DocTypes. No workflow or Trust pulse formula change.  
**Packet:** TE-1 (BUILD_PLAN).  
**Do not** wire these helpers into customer UI until a later approved packet.

Named charter files (`TRUSTLEDGER_IMPLEMENTATION_CHARTER.md` and siblings) are not in this repo yet. TE-1 follows `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/PLATFORM_STRATEGIC_BRIEF.md`.

## What this is

Additive TypeScript fields and helpers on top of the existing SRM desk:

| Layer | Overlay | Canonical (unchanged) |
|-------|---------|------------------------|
| Measurement | `composeTrustSignals()` | `trustIndexFromIncidents()` / Trust pulse widget |
| Response | optional `trustResponse` on incident / engagement / stakeholder | `sentimentLabel` / `sentimentScore` |
| Evidence | optional `trustSupport` on `EvidenceStub` | classification, primary flag, upload workflow |
| Segmentation | `trustPulseByPlace`, `stakeholdersByKind/Place` | `/app/geo`, cascade pickers, geo list APIs |
| AI | opt-in `includeTrustOverlay` + `omitTrustOverlayFlag` | existing mock/Cloud suggestions |

## Cloud / API

`trustResponse` and `trustSupport` are **not** Frappe columns. Resource mappers in `productCloud` / `siCloud` use explicit field lists and omit them. `includeTrustOverlay` is stripped before `srm-core` AI method calls.

## Entitlements

`composeTrustSignals` skips relationship / promise slices when those arrays are omitted or when `includeRelationshipHealth` / `includePromiseHealth` is `false` (Solo). It never folds those slices into the incident trust index.

## Next packet (not this one)

TE-2 may *display* overlay hints (product-owner sign-off) still without new DocTypes or formula changes. Ledger `create_entry` and KMS signing stay out until `docs/KEY_MANAGEMENT.md` is approved.

**Shipped next:** TE-2 parallel trust-native layer — `docs/TRUST_LAYER.md`.
