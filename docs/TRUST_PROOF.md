# TE-3 — Trust analytics and proof reporting

**Status:** Shipped as an **optional, explainable** layer on TE-2. Not a report pack. Not mandatory.  
**Packet:** TE-3 (BUILD_PLAN).  
**Does not replace** monthly / executive / board packs, the incident Trust pulse, or SRM records.

Named charter files (`TRUSTLEDGER_IMPLEMENTATION_CHARTER.md` and siblings) are not in this repo yet. This packet follows `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/PLATFORM_STRATEGIC_BRIEF.md`.

## What this is

Deterministic analytics and a markdown proof summary built from:

| Input | Used for |
|-------|----------|
| TE-2 `TrustObservation` (derived from SRM + optional TE-1 overlay, plus any rows already in `tl-trust-layer`) | Trends, comparisons, claims, history |
| TE-2 `TrustDimensionStatus` (same ±0.34 rules as TE-2) | Per-dimension level / trend / rationale |
| TE-2 `TrustParticipationRecord` | Willingness to participate / contribute |
| TE-2 `TrustCommunityContext` + stakeholder `kind` | Community, location, and group slices |
| Evidence ids on observations | Proof links — claims stay empty when none are cited |

Nothing here calls an LLM. Nothing writes `tl-org-data`. Derivation still does not mutate incidents, engagements, commitments, or evidence.

## How trust is measured (explainable)

Scored signals map to **+1 / 0 / −1**. Unknown is dropped.

| Output | Rule |
|--------|------|
| Level | Mean ≥ **0.34** → strong; ≤ **−0.34** → at risk; else watch (unknown if no scored rows) |
| Period / trend | Later half vs earlier half (or an explicit split date). Improving ≥ **+0.34** delta; declining ≤ **−0.34**; else stable. Need scores on **both** sides or the movement is **insufficient**. |
| Overall movement | **mixed** when one dimension improves and another declines (or the overall period conflicts with a dimension). Otherwise improving / declining / stable / insufficient. |
| Low confidence | Scored sample **below 3** — still shown, never hidden |

This is **not** `trustIndexFromIncidents()` (Trust pulse on the monthly pack). Proof output states that explicitly.

## Comparison axes

| Axis | Bucket |
|------|--------|
| Community | `communityPlaceId` → community context `communityRef` / place label; else “Unspecified community” |
| Location | Municipality, then ward, then place label; else “Unspecified location” |
| Stakeholder group | Linked stakeholder `kind`; else “Ungrouped” |
| Project phase | **Proxy from observation source** — case → resolution, engagement → engagement, commitment → delivery, evidence → assurance. Not a project status field. |

## Risk flags

| Kind | When |
|------|------|
| `declining_trust` | Dimension trend is declining |
| `at_risk_level` | Dimension level is at risk |
| `low_confidence` | Dimension or community slice scored sample &lt; 3 |
| `insufficient_evidence` | Declining / at-risk dimension with no evidence ids, or a community slice with scores but no evidence ids |

## Proof outputs

`composeTrustProofReport` / `buildTrustProofFromSrm` return structured fields **and** markdown:

1. Overall movement + narrative (why, which signals, which evidence)
2. Claims by dimension (level, trend, evidence ids, supporting signals)
3. Trust history (chronological observations)
4. Participation / willingness counts
5. Comparison slices
6. Risk flags
7. Sources (SRM modules, whether TE-1 overlay notes were present, trust pulse **not** used)

`buildTrustProofFromSrm` derives TE-2 rows from SRM, optionally merges stored `tl-trust-layer` rows by id, and **does not persist**.

## UI

Collapsed **Trust proof (optional)** on `/app/reports` (`TrustProofPanel`). Opens on demand. Copy / download markdown. Not in AppNav. Not in `REPORT_PACKS` / the evidence writer.

**Trust proof workspace** (`TrustWorkspaceHub`) on `/app/dashboard` and desk workspace panels: number cards (movement, scored observations, risk flags, evidence-backed claims), **period trend** (earlier vs later), **comparison** across community / location / stakeholder group / phase proxy, six-dimension bars, risk list, proof narrative, and shortcuts to reports / cases / engagements / capture. Chart scale is mean −1…+1 mapped 0–100 — not Trust pulse. Always visible (empty state still has cards + links). Does **not** add impact-trend or SLA charts. Frappe Desk workspace JSON is not in this repo.

Customer / trial workspaces use `listWorkspaceIncidents` / `listWorkspaceEvidence` and own-data service lists — no demo `INC-*` bleed.

## Compatibility

| Surface | Change |
|---------|--------|
| Monthly / executive / board packs | Unchanged |
| Evidence writer / `reportComposer` | Unchanged |
| Trust pulse KPI | Unchanged (`trustIndexFromIncidents`) |
| TE-1 overlay / TE-2 layer store | Read-only here |
| Cloud DocTypes / srm-core | None |

## Next packet (not this one)

TE-4 ships optional, suggestion-only recommendations (`docs/TRUST_INTELLIGENCE.md`) on top of these proof outputs. TE-5 adds optional Global South field/context (`docs/TRUST_GLOBAL_SOUTH.md`). TE-6 packages the stack for MVP presentation (`docs/TRUST_MVP.md`). Ledger writes stay blocked on `docs/KEY_MANAGEMENT.md`.
