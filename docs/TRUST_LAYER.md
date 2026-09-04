# TE-2 — Parallel trust-native layer

**Status:** Shipped as a **parallel frontend layer**. No new Frappe DocTypes. No new screens, nav, or mandatory forms.  
**Packet:** TE-2 (BUILD_PLAN).  
**Does not replace** SRM records (projects, incidents, engagements, commitments, evidence) or the TE-1 overlay.

Named charter files (`TRUSTLEDGER_IMPLEMENTATION_CHARTER.md` and siblings) are not in this repo yet. This packet follows `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/PLATFORM_STRATEGIC_BRIEF.md`.

## How the layers coexist

```
SRM (canonical desk)          TE-1 overlay (optional fields)         TE-2 trust layer (new)
─────────────────────         ──────────────────────────────         ─────────────────────
TL Incident / Engagement      trustResponse / trustSupport           TrustObservation
sentimentScore (unchanged)    composeTrustSignals()                  TrustDimensionStatus
tl-org-data                   omitted from Cloud mappers             tl-trust-layer (separate key)
Trust pulse widget            not wired to UI                        not wired to UI
```

- **SRM stays the system of record** for cases, people, promises, and files.
- **TE-1** still annotates those records optionally.
- **TE-2** stores first-class trust rows in a **separate** browser key (`tl-trust-layer`). Saving trust rows never writes `tl-org-data`.
- Derivation (`deriveTrustLayer`) **reads** SRM + TE-1 fields and returns new rows. It does **not** mutate SRM objects and does **not** auto-save.
- Nothing in `/app` imports the store yet, so current users see no new forms.

## What it can store

| Structure | Fields |
|-----------|--------|
| Dimensions | `project`, `implementing_entity`, `process`, `people`, `intentions` |
| Observation | signal, date, source + sourceId, project, community place, evidence ids, note |
| Status | per-dimension `level` (strong / watch / at_risk / unknown), `trend`, sample size, rationale |
| Participation | willingness to participate / contribute, `trustDriven` |
| Community context | place / ward / municipality, community ref, notes, barriers, sensitivity notes |

Status rules (keep explainable): scored signals map to +1 / 0 / −1; mean ≥ 0.34 → strong; ≤ −0.34 → at risk; else watch. Trend compares later half vs earlier half of the time-ordered scores.

## Cloud / API

No new srm-core methods. No new DocTypes. Do not POST TE-2 rows to Frappe until a later packet defines a contract.

## Next packet (not this one)

TE-3 may **opt-in display** of dimension status (product-owner copy sign-off) still without changing Trust pulse math, without analytics dashboards, and without making capture mandatory. Ledger writes stay blocked on `docs/KEY_MANAGEMENT.md`.
