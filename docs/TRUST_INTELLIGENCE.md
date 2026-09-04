# TE-4 — Trust intelligence and recommendations

**Status:** Shipped as an **optional, rule-based** layer on TE-3. Not a pack. Not mandatory. Not autonomous.  
**Packet:** TE-4 (BUILD_PLAN).  
**Does not replace** monthly / executive / board packs, Trust pulse, incident workflow, or TE-3 proof.

Named charter files (`TRUSTLEDGER_IMPLEMENTATION_CHARTER.md` and siblings) are not in this repo yet. This packet follows `docs/BUILD_PLAN.md`, `docs/DECISIONS.md` (especially ADR-006), and `docs/PLATFORM_STRATEGIC_BRIEF.md`.

## What this is

Explainable suggestions that turn TE-3 analytics into **next steps**:

| Output | Source |
|--------|--------|
| Alerts | TE-3 risks + weak participation + unresolved open cases |
| Recommendations | Published rules in `src/lib/trust/rules.ts` |
| Response drafts | Local templates (community / internal). Not sent. |
| Advisory wording | Local rewrite of the same facts. **No remote model.** |

Every recommendation and alert carries a `trace` (`ruleId`, rule summary, observation ids, evidence ids, case ids, TE-3 risk ids). `decision` is always `suggestion_only`. `autonomous` is always `false`.

## Rules

| Rule | When | Suggestion |
|------|------|------------|
| `TR-REPAIR-DECLINING` | Dimension trend declining | Trust-repair conversation on that dimension |
| `TR-REPAIR-AT-RISK` | Level at risk (and not already declining) | Repair step |
| `TR-ENGAGE-LOW-WILLINGNESS` | Low willingness exceeds high | Listening / confirmation before asking for contributions |
| `TR-ENGAGE-NO-CAPTURE` | Observations exist, no participation rows | Optionally capture willingness next time |
| `TR-FOLLOWUP-LOW-CONFIDENCE` | Scored sample &lt; 3 | Collect more observations |
| `TR-FOLLOWUP-MISSING-EVIDENCE` | Declining / at-risk with no evidence ids | Attach evidence before using the claim in a pack |
| `TR-ESCALATE-OPEN-DECLINE` | Declining/at-risk **and** open P1/P2, SLA-breached, or escalated cases | Consider senior review — **does not change case status** |
| `TR-ALERT-WEAK-PARTICIPATION` | Weak willingness / not trust-driven | Informational alert |
| `TR-ALERT-UNRESOLVED-CONCERN` | Material open cases | Informational alert |

No predictive scores. No causal claims. No auto-escalate. No auto-send.

## AI / advisory

Advisory wording is **local rules** (`model: local-rules`, `promptVersion: te-4-local-advisory-v1`). It restates fired rules and evidence; it does not invent new actions. It does **not** call Cloud/Grok (those paths return month-end templates). Existing `aiService.draftResponse` / report composer behaviour is unchanged unless a caller already opted into TE-1 `includeTrustOverlay`.

## UI

Collapsed **Trust recommendations (optional)** on `/app/reports`, under the TE-3 proof panel. Opens on demand. Copy markdown. “Suggest wording (advisory)” reveals the local rewrite. Not in AppNav. Not in `REPORT_PACKS`.

## Compatibility

| Surface | Change |
|---------|--------|
| Packs / writer / Trust pulse | Unchanged |
| Incident status / escalation | Read-only |
| TE-1 overlay / TE-2 store | Read-only |
| TE-3 proof | Unchanged |
| Cloud DocTypes / srm-core | None |

## Next packet (not this one)

Global South adaptation or final MVP packaging — **paused** until the next approved prompt. Ledger writes stay blocked on `docs/KEY_MANAGEMENT.md`.
