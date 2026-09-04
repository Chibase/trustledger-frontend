# TE-6 — TrustLedger MVP packaging and readiness

**Status:** Internal presentation posture for the TE-1…TE-5 stack. **Not** a claim of full TEDS / ESIP completeness. **Not** a public version bump.  
**Packet:** TE-6 (BUILD_PLAN).  
**Does not add** a new trust model, DocType, nav item, or pack.

Named charter files (`TRUSTLEDGER_IMPLEMENTATION_CHARTER.md` and siblings) are not in this repo yet. This packet follows `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/PLATFORM_STRATEGIC_BRIEF.md`.

Public voice stays **Trust**. UI product name stays **TrustLedger**. Do not name Frappe / Vercel / HubSpot / Version 001–002 / TEDS on customer or marketing surfaces (ADR-039, ADR-044).

## What “MVP-ready” means here

**Yes:** the SRM desk plus the optional trust overlay, parallel layer, proof, recommendations, and Global South context can be **shown together** as a coherent, explainable, suggestion-only stack.

**No:** this is not full TEDS MVP, not production ledger, not autonomous AI, and not a promise that TE-4/TE-5 are already on `master` until those merges happen.

`origin/master` at packaging time had TE-1…TE-3. TE-4 and TE-5 live on the presentation line (`cursor/te4-trust-intelligence-b381` after #214 / #215). Treat merge-to-master as a release step, not as already done.

## Gap review

### Complete (in this stack)

| Item | Where |
|------|--------|
| SRM modules (projects, cases, people, engagements, promises, evidence, reports) | `/app/*` |
| Optional TE-1 overlay | `trustResponse` / `trustSupport` — omitted from Cloud mappers |
| TE-2 parallel layer | `tl-trust-layer`; `deriveTrustLayer` is read-only |
| TE-3 proof | `composeTrustProofReport` / `buildTrustProofFromSrm`; collapsed panel on `/app/reports` |
| TE-4 recommendations | Published `ruleId` traces; `suggestion_only`; local advisory only |
| TE-5 Global South extras | Optional capture + community/participation fields; no single template |

Constants in code: `TRUST_MVP_COMPLETE` (`src/lib/trust/mvpReadiness.ts`).

### Partial

| Item | Honest limit |
|------|----------------|
| Proof / recs UI | On-demand, not a monthly / executive / board pack |
| Field extras | Preamble + drafts; **not** auto-saved to `tl-trust-layer` |
| Language | Structures and hints only — no product i18n |
| Authority | Derived from existing `kind` + tags |
| Cloud SI | Registry / engagements / commitments usable; trust layer is frontend-only |
| TEDS domains | Weighted maturity remains a **partial** TEDS picture (`docs/TEDS_MATURITY_REPORT.md`) |

### Future-only

Cloud trust DocTypes, production ledger writes (`docs/KEY_MANAGEMENT.md`), live Grok for proof/recs, extra national geo packs, full UI translation, default persistence of field extras.

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
| Trust proof reports | `/app/reports` → **Trust proof (optional)** or `composeTrustProofReport` |
| Evidence-backed summaries | Proof claims / history `evidenceIds`; overlay `trustSupport.supportsTrustClaim` |
| Trust trend views | Proof period + dimension trend (later half vs earlier half, ±0.34) |
| Community / context views | Proof `comparisons.community`; TE-5 hints when context rows exist |
| Recommendation outputs | `/app/reports` → **Trust recommendations (optional)** or TE-4 `composeTrustIntelligence` |

`composeTrustMvpPackage` / `buildTrustMvpPackageFromSrm` only concatenate those outputs. They **do not** change Trust pulse (`trustIndexFromIncidents`) and **do not** write `tl-org-data`.

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
- [ ] TE-4 / TE-5 / TE-6 merged to `master` (release step)
- [ ] Ledger production signing (blocked)
- [ ] Cloud trust DocTypes (not started)

## Residual risk

| Risk | Handling |
|------|----------|
| Stacked PRs not on `master` | Do not tell buyers the live site already includes TE-4+ until merged |
| Empty evidence | Proof still runs; claims are not “backed” — say so |
| Low sample | TE-3 low-confidence flags; TE-4 follow-up suggestion |
| Field extras not persisted | Operators must copy notes / opt in later |
| Live data fallback to mock | Never for customer/trial workspaces (no demo bleed) |
| TEDS % vs this MVP | Do not equate this packet with TEDS completeness |

Future phases (after this pause): merge the presentation line; then only a **new approved prompt** for Cloud trust persistence, ledger, or packaging beyond this stack.

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

**Pause.** Do not start further product work from this packet. Ledger writes stay blocked on `docs/KEY_MANAGEMENT.md`.
