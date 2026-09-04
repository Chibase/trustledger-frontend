# TE-5 — Global South operating adaptations

**Status:** Shipped as **additive, optional** field and trust-layer context. No new DocTypes. No new nav. Existing SRM workflows unchanged.  
**Packet:** TE-5 (BUILD_PLAN).  
**Does not replace** TE-1 overlay, TE-2 layer, TE-3 proof, or TE-4 recommendations.

Named charter files (`TRUSTLEDGER_IMPLEMENTATION_CHARTER.md` and siblings) are not in this repo yet. This packet follows `docs/BUILD_PLAN.md`, `docs/DECISIONS.md` (ADR-045), and `docs/PLATFORM_STRATEGIC_BRIEF.md`.

## Why this packet

TrustLedger is used in community environments that are not Western, high-bandwidth, or uniform. Attendance is not consent. People show up for mixed reasons. Authority is both formal and informal. Notes are often oral and not in the desk language.

This packet makes those facts **capturable and readable** by later analytics — without forcing one template on every community, and without changing Trust pulse or case workflow.

## What was added

| Area | What | Required? |
|------|------|-----------|
| Community context | Optional history, power-structure, sensitivity, barrier tags, language, oral-source flags on `TrustCommunityContext` | No |
| Field capture | Collapsed **Field context (optional)** on `/app/capture` (rapid / oral / low-connectivity, languages, context notes) | No |
| Language readiness | `TrustNarrativeCapture` helpers; language hints (not a product i18n pack); working language is **not** defaulted to English | No |
| Authority | `authorityRoleFromStakeholder` from existing `kind` + tags: traditional, community leader, ward structure, informal influencer, institutional | No new CRM kind |
| Participation realism | Optional motivation, presence, response pattern, attendance≠consent. **Does not** change `participationLooksTrustDriven` | No |

Draft helpers (`fieldNoteToCommunityDraft`, `fieldNoteToParticipationDraft`) **do not auto-save** into `tl-trust-layer`. Capture still writes the same SRM path; extras ride in the notes preamble when filled.

## How this supports existing trust work

- TE-3 comparisons still group by place / kind. Extra context is available on the same community rows.
- TE-4 alerts and recommendation **rules are unchanged**. Mixed motivation and unknown willingness do not invent a weak-participation alert.
- When optional context *is* present, TE-4 advisory `supportNotes` may include local-context hints (history, barriers, oral source, mixed motives). Suggestion only. Nothing is sent or applied.
- Cloud mappers still post explicit SRM fields only. New keys stay on the parallel trust layer / capture preamble.

## What this does not do

- Does not invent national geo packs (ADR-045 / ADR-040). ZA place packs stay the SA baseline.
- Does not assume every community behaves the same, or that high influence = informal influencer.
- Does not add `imbizo` as a required engagement kind (walkabout / meeting already exist).
- Does not ship full UI translation.
- Does not persist field extras until a later packet opts in.

## Compatibility

| Surface | Effect |
|---------|--------|
| Incident / engagement / commitment save | Unchanged |
| Trust pulse (`trustIndexFromIncidents`) | Unchanged |
| TE-4 rules / alerts | Unchanged unless optional context is passed into intelligence |
| Capture dropdowns | Unchanged; extras are collapsed |
| Frappe DocTypes / srm-core | None |

## Next packet (not this one)

Final MVP packaging / release-readiness — **paused** until the next approved prompt. Ledger writes stay blocked on `docs/KEY_MANAGEMENT.md`.
