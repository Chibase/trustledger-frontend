# TE-2 — Parallel trust-native layer

**Status:** Shipped as a **parallel trust layer**. Browser cache + TE-7 Cloud SoT. No new screens, nav, or mandatory forms.  
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
Trust pulse widget            not wired to overlay                   TE-3 optional proof panel (not a pack)
```

- **SRM stays the system of record** for cases, people, promises, and files.
- **TE-1** still annotates those records optionally.
- **TE-2** stores first-class trust rows in a **separate** browser key (`tl-trust-layer`) and, in live mode, in Cloud DocTypes (TE-7). Saving trust rows never writes `tl-org-data`.
- Derivation (`deriveTrustLayer`) **reads** optional TE-1 overlay fields, evidence `trustSupport`, and commitment kept/broken. It does **not** mutate SRM objects, does **not** auto-save, and does **not** treat generic SRM sentiment as a trust observation.
- TE-3 may **read** the store and derived rows for an optional proof panel. It still does not write SRM data.
- TE-5 adds optional Global South context fields on the same rows (`docs/TRUST_GLOBAL_SOUTH.md`). They stay optional.
- TE-8 **apply** of an engagement writes one participation row (upsert by engagement id) and, when a human applied an overlay, trust observations. Overlay is optional. SRM sentiment is never copied.
- TE-9 **reads** stored participation as a quality mix (`trust` / `obligation` / `livelihood` / `mixed` / `unknown`). Mixed is not weak. Attendance is not consent. The mix is not Trust pulse.
- TE-10 **reads** trust claims as unevidenced / evidenced / verified. Linked evidence is not verification. Attendance does not verify. Human apply writes a stamp.
- TE-11 persists those stamps on Cloud for live customer/trial workspaces. Local `tl-trust-claim-verifications` is a cache. Not a sealed ledger.

## What it can store

| Structure | Fields |
|-----------|--------|
| Dimensions | `project`, `implementing_entity`, `process`, `people`, `fairness`, `concerns_acted_upon` (blueprint six). Stored `intentions` aliases to `concerns_acted_upon`. |
| Observation | signal, date, source + sourceId, project, community place, evidence ids, note. **Not** SRM `sentimentLabel` / `sentimentScore`. |
| Status | per-dimension `level` (strong / watch / at_risk / unknown), `trend`, sample size, rationale |
| Participation | willingness to participate / contribute, `trustDriven`; optional motivation / presence / response (TE-5) |
| Community context | place / ward / municipality, community ref, notes, barriers, sensitivity; optional history, power structure, barrier tags, language, oral source (TE-5) |

Status rules (keep explainable): scored signals map to +1 / 0 / −1; mean ≥ 0.34 → strong; ≤ −0.34 → at risk; else watch. Trend compares later half vs earlier half of the time-ordered scores.

## Cloud / API

TE-7 ships Frappe DocTypes + BFF (`docs/TRUST_DOCTYPES.md`). Live customer/trial workspaces use Cloud as SoT; `tl-trust-layer` is a cache. TE-11 adds claim-verification stamps to that SoT. Do not POST TE-1 overlay keys. Do not copy SRM sentiment into observations.

## Participation-quality reading (TE-9)

`classifyParticipationQuality` / `summarizeParticipationQuality` read stored `motivation` as the class. They do **not** infer trust from attendance, presence, or high willingness. Mixed / obligation / livelihood is **not** weak. Consent is never implied from presence (in-person, proxy, or household). The index is **counts by class**, not a composite score and not Trust pulse.

Proof, intelligence, community profiles, and the dashboard hub surface the mix. Capture stays optional. No new DocType.

## Trust-claim verification (TE-10 / TE-11)

`classifyClaimVerification` reads scored proof claims. Linked `evidenceIds` → **evidenced**, not verified. **Verified** only after human apply on a matching fingerprint. Attendance, participation quality, and Trust pulse never verify. Live SoT is `TL Trust Claim Verification` (TE-11). Local `tl-trust-claim-verifications` is a cache / demo store. Stamps are not SI overlay posts and not a sealed ledger.

Proof, intelligence, and the dashboard hub surface the mix. Apply stays suggestion → human apply → save.

## Next packet (not this one)

TE-11 is shipped. Further trust packets wait on the next approved prompt. Ledger writes stay blocked on `docs/KEY_MANAGEMENT.md`.
