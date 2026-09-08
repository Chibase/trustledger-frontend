# P-01 — Stakeholder Intelligence & Decision Workspace

**Status:** Shipped as the first productisation vertical slice of I-01–I-06.  
**Packet:** P-01.  
**Depends on:** I-01–I-06 contracts and helpers.  
**Does not replace** Stakeholder CRM, `/app/intelligence` ESG briefs, TE-4 Trust recommendations, Cloud DocTypes, or `srm-core`.

Integrated trail on the stakeholder record:

Stakeholder → Context → Evidence → Signals → Interpretations → Intelligence → Recommendations → Human Decision → Action / Outcome

## What this is

| Piece | Path |
|--------|------|
| View model | `src/types/stakeholderIntelligenceWorkspace.ts` |
| Composer | `src/lib/intelligence/stakeholderWorkspace.ts` |
| Browser store | `src/lib/intelligence/stakeholderWorkspaceStore.ts` (`tl-stakeholder-intelligence-workspace`) |
| UI | `src/components/intelligence/StakeholderIntelligenceWorkspace.tsx` on `/app/stakeholders/[id]` |

Authorised users open a stakeholder, see operating context and attributable activity, view or record I-03–I-06 rows, then record a **distinct human decision**. Recommendations remain ADR-006 `suggestion_only`. Review-state `accepted` on a recommendation is still not a decision.

## Rules

- Reuse I-01–I-06 assemblers. Classification, hypothesis, synthesis, and suggestion text are caller-supplied — never inferred from influence, engagement counts, or BAU.
- Recommendation ≠ Human Decision. `recordHumanDecision` creates a new record.
- Customer / trial / live workspaces never receive `seed_demo` chains or INC-* showcase bleed. Demo sample text is labelled and opt-in.
- Linked engagements/commitments require recorded `stakeholderIds`. Shared-project cases appear only when the stakeholder has `projectIds`.
- Local store only. No new DocTypes. No Cloud persistence redesign.

## Compatibility

| Surface | Change |
|---------|--------|
| Stakeholder CRM card | Unchanged; workspace is added below |
| `/app/intelligence` | Pointer only; ESG briefs unchanged |
| I-01–I-06 contracts | Unchanged |
| Cloud / `srm-core` | None |

## Known gaps

Documented in `.ai/HANDOFF.md`. Do not treat them as authorisation to redesign the foundation.
