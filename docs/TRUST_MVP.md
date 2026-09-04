# TE-6 — TrustLedger MVP packaging and readiness

**Status:** Internal presentation posture for the TE-1…TE-5 stack. **Not** a claim of full TEDS / ESIP completeness. **Not** a public version bump.  
**Packet:** TE-6 (BUILD_PLAN).  
**Does not add** a new trust model, DocType, nav item, or pack.

Named charter files (`TRUSTLEDGER_IMPLEMENTATION_CHARTER.md` and siblings) are not in this repo yet. This packet follows `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/PLATFORM_STRATEGIC_BRIEF.md`.

Public voice stays **Trust**. UI product name stays **TrustLedger**. Do not name Frappe / Vercel / HubSpot / Version 001–002 / TEDS on customer or marketing surfaces (ADR-039, ADR-044).

## What “MVP-ready” means here

**Yes:** the SRM desk plus the optional trust overlay, parallel layer, proof, recommendations, and Global South context can be **shown together** as a coherent, explainable, suggestion-only stack.

**No:** this is not full TEDS MVP, not production ledger, and not autonomous AI.

This inventory is the **authoritative current-state** for the frontend trust stack (TE-1…TE-12, including TE-2b / TE-3b / TE-3c / TE-5b). `docs/BUILD_PLAN.md` packet table matches. Named charter files (`TRUSTLEDGER_PLATFORM_BLUEPRINT.md`, `engagements.py`, `serializers.py`) are **not** in this repo.

## Semantic gap audit

Verdicts are for **this frontend + SI-Cloud + TE-7 trust Cloud path**. Production ledger remains future.

| Claimed gap | Verdict | Honest limit |
|-------------|---------|--------------|
| Sentiment / incident priority are not trust measurement; need dimensions + observations | **Fixed** | Six blueprint dimensions; `deriveTrustLayer` does not copy SRM `sentimentLabel` / `sentimentScore`. **TE-7** persists observations on Cloud for live customer/trial workspaces. **TE-8** writes overlay observations only when a human applies an overlay — never from note sentiment. |
| No willingness / participation-quality model (voluntary vs incentive / pressure) | **Fixed** | `TrustParticipationRecord`: willingness, `trustDriven`, motivation (`trust` / `obligation` / `livelihood` / `mixed`), `attendanceDoesNotEqualConsent`. **TE-8** writes/upserts participation on engagement apply (`sourceId` = engagement id). **TE-9** reads a class mix from stored motive (counts, not a 0–100 score). Mixed motive does **not** invent weak-participation alerts. Attendance is never read as consent. |
| Evidence attached to incidents, not trust claims; no claim↔evidence or trust verification | **Partial** | Observations and proof claims carry `evidenceIds`; overlay `trustSupport.supportsTrustClaim` can create observations. **TE-10** reads unevidenced / evidenced / verified (linked evidence is not verification; human apply required). **TE-11** persists those stamps on Cloud for live customer/trial workspaces. SRM evidence still also attaches to cases. Not a sealed ledger. |
| No longitudinal trust (latest sentiment only; no growth / decline / mixed / causality) | **Partial** | `compareTrustPeriods` later vs earlier mean; overall movement improving / declining / stable / mixed / insufficient. Hub charts that period. **TE-12** lists later-half companions (co-occurrence, **not** statistical causality). Cloud “latest linked score” (`serializers.py`) is not this repo. Trust pulse is a different formula and must stay unchanged. |
| Reporting is not a proof layer (empty workspace, heuristic briefs, no dashboards / comparisons / packs) | **Partial** | Trust proof workspace on `/app/dashboard` and the desk: cards, period trend, all-axis comparison, dimension bars, risks, narrative, shortcuts. Optional proof / recs on `/app/reports`. **Not** a monthly / executive / board pack. **No** community-facing summaries. Activity reports still `reportComposer`. Impact-trend / SLA charts still deferred. |
| AI is advisory but not TrustLedger-intelligent (keyword heuristics, not traced to trust state) | **Split** | TE-4: published `ruleId` traces from trust state + evidence ids; `suggestion_only`. Generic `aiService` triage / sentiment / draft remain local heuristics. No remote model on this proof / recs path. |
| Engagement hole (`list_meeting_notes` returns `[]` until Engagement DocType) | **Fixed in this product** | Live desk uses SI Engagement via `/api/frappe/si?kind=engagement`. `noteService` still tries legacy `list_meeting_notes`, then falls through to engagements. Named `engagements.py` is not in this repo. |
| Documentation drift (BUILD_PLAN vs changelog vs API) | **Mostly fixed** | BUILD_PLAN packet table lists TE-1…TE-12 / 2b / 3b / 3c / 5b **Done**. This file is the living inventory. `FRAPPE_API_CONTRACT.md` still lists `list_meeting_notes` as a **legacy** srm-core alias. |
| Readiness / tests / API contracts = TrustLedger MVP complete | **Still true (by design)** | Health, hardening, and TE-6 packaging mean the stack can be **shown together**. They do **not** equal full TEDS MVP, production ledger, or autonomous AI. |

## Gap review

### Complete (in this stack)

| Item | Where |
|------|--------|
| SRM modules (projects, cases, people, engagements, promises, evidence, reports) | `/app/*` |
| Optional TE-1 overlay | `trustResponse` / `trustSupport` — omitted from Cloud mappers |
| TE-2 parallel layer | `tl-trust-layer`; `deriveTrustLayer` is read-only; six blueprint dimensions; SRM sentiment is not an observation |
| TE-3 proof | `composeTrustProofReport` / `buildTrustProofFromSrm`; workspace hub on `/app/dashboard` + desk; optional panel on `/app/reports` |
| TE-4 recommendations | Published `ruleId` traces; `suggestion_only`; local advisory only |
| TE-5 / TE-5b Global South extras | Optional capture + community profiles + participation fields; no single template |
| TE-7 Cloud trust SoT | `TL Trust Observation` / Participation / Community Context; `GET|POST /api/frappe/trust`; overlay and SRM sentiment omitted |
| TE-8 engagement apply | Capture/desk human apply writes participation (upsert by engagement id) + optional overlay observations; sentiment assist does not |
| TE-9 participation-quality reading | Class mix from stored motive; mixed ≠ weak; attendance ≠ consent; not Trust pulse; capture stays optional |
| TE-10 trust-claim verification | Unevidenced / evidenced / verified; linked evidence is not verification; attendance does not verify; human apply |
| TE-11 Cloud verification stamps | `TL Trust Claim Verification`; live SoT; human apply still required; not a sealed ledger |
| TE-12 movement companions | Later-half co-occurrence with movement; not statistical causality; attendance and mixed motive are not causes |

Constants in code: `TRUST_MVP_COMPLETE` (`src/lib/trust/mvpReadiness.ts`).

### Partial

| Item | Honest limit |
|------|----------------|
| Proof / recs UI | Hub always on dashboard + desk; optional panels on `/app/reports`. Not a monthly / executive / board pack or community-facing summary |
| Participation quality | Class mix is **counts** of stored motive, not a composite 0–100 score or Trust pulse |
| Claim ↔ evidence | TE-10 class mix (unevidenced / evidenced / verified) with TE-11 Cloud SoT for stamps. Not a sealed ledger |
| Longitudinal trust | Later vs earlier mean; mixed when dimensions disagree. TE-12 companions are co-occurrence, not statistical causality |
| Field extras | Persist on Capture **engagement apply** (participation `sourceId` = engagement id); local drafts while typing. Not auto-saved |
| Language | Structures and hints only — no product i18n |
| Authority | Derived from existing `kind` + tags |
| Cloud SI / trust | Registry / engagements / commitments / trust observation-participation-context usable on Cloud; overlay still omitted from incident mappers |
| TEDS domains | Weighted maturity remains a **partial** TEDS picture (`docs/TEDS_MATURITY_REPORT.md`) |

### Future-only

Production ledger writes (`docs/KEY_MANAGEMENT.md`), live Grok for proof/recs, extra national geo packs, full UI translation, auto-save of field extras without apply, community-facing summaries / monthly proof packs.

### Do not promise yet

See `TRUST_MVP_DO_NOT_PROMISE`: autonomous apply, sealed ledger claims, full TEDS, uniform community behaviour, attendance = consent, English as the working language, remote-model trust reports, demo `INC-*` in customer workspaces.

## Proof package path

One composer, existing math:

```text
SRM records (+ optional TE-1)
        → deriveTrustLayer (read-only)
        → composeTrustProofReport     → trends, claims, history, community slices, evidence ids
        → composeTrustIntelligence    → alerts, recs, drafts (suggestion only)
        → composeTrustMvpPackage      → one internal markdown (does not persist)
```

| Need | Path |
|------|------|
| Trust proof reports | `/app/dashboard` + desk hub; `/app/reports` → **Trust proof (optional)** or `composeTrustProofReport` |
| Evidence-backed summaries | Proof claims / history `evidenceIds`; overlay `trustSupport.supportsTrustClaim` |
| Trust trend views | `/app/dashboard` + desk **Trust proof workspace**; proof period + dimension trend (later half vs earlier half, ±0.34) |
| Community / context views | Proof `comparisons.community`; TE-5 hints when context rows exist |
| Recommendation outputs | `/app/reports` → **Trust recommendations (optional)** or TE-4 `composeTrustIntelligence` |

`composeTrustMvpPackage` / `buildTrustMvpPackageFromSrm` only concatenate those outputs. They **do not** change Trust pulse (`trustIndexFromIncidents`) and **do not** write `tl-org-data`.

Readiness flags describe **this run** (history present, evidence ids, scored trend, community context, fired recs). An empty workspace is reported as `no` — the composer existing is not the same as having proof.

## Cross-module validation (this packet)

| Check | Expected |
|------|----------|
| SRM save paths | Unchanged |
| TE-1 overlay | Still optional; Cloud mappers still omit overlay keys |
| Evidence | Claims stay empty unless evidence ids (or TE-1 support) are present |
| Analytics vs inputs | MVP package movement matches standalone TE-3 proof |
| Recommendations | Every item `suggestion_only`, `autonomous: false`, published `ruleId` |
| Global South | Mixed motivation does not invent weak-participation alerts |
| Legacy packs | Monthly / executive / board / `reportComposer` unchanged |

## Readiness checklist

- [x] Proof markdown can be produced without an LLM
- [x] Trend / comparison / risk rules remain the TE-2/TE-3 ±0.34 rules
- [x] Recommendations remain explainable and non-autonomous
- [x] Global South fields remain optional
- [x] Trust pulse formula unchanged
- [x] Report AI for activity/compliance still uses `reportComposer` (not Frappe/Grok templates)
- [x] TE-1…TE-8 (including TE-2b / TE-3b / TE-3c / TE-5b) merged to `master`
- [x] Cloud trust DocTypes + BFF (TE-7)
- [x] Engagement apply writes participation + optional overlay observations (TE-8)
- [x] Participation-quality reading (TE-9)
- [x] Trust-claim verification reading + human apply (TE-10)
- [x] Cloud SoT for claim-verification stamps (TE-11)
- [x] Trust-movement companion reading (TE-12)
- [ ] Ledger production signing (blocked)
- [ ] Community-facing summaries / monthly packs (not started)

## Residual risk

| Risk | Handling |
|------|----------|
| Inventory treated as TEDS / ledger complete | TE-6 packaging is presentation posture only — see semantic gap audit |
| Empty evidence | Proof still runs; claims are not “backed” — say so |
| Low sample | TE-3 low-confidence flags; TE-4 follow-up suggestion |
| Field extras | Persist only on Capture apply; typing drafts stay local |
| Live data fallback to mock | Never for customer/trial workspaces (no demo bleed) |
| TEDS % vs this MVP | Do not equate this packet with TEDS completeness |

Future phases: only a **new approved prompt** for ledger, community-facing summaries, or packaging beyond this stack.

## Compatibility

| Surface | Change in TE-6 |
|---------|----------------|
| Incident / engagement / commitment save | None |
| Trust pulse | None |
| TE-3 / TE-4 math | None (reused) |
| Capture UI | None |
| AppNav / packs | None |
| Frappe / srm-core | None |

## Next (stop)

TE-12 is shipped. Further trust packets wait on the next approved prompt. Ledger writes stay blocked on `docs/KEY_MANAGEMENT.md`.
