# Current TrustLedger Task

Status: COMPLETE

Assigned Agent: Cursor

## Title

I-06 — Explainable Recommendation Foundation

## Objective

Implement the minimum reusable Recommendation Foundation for:

Evidence → Context → Signal → Interpretation → Intelligence → Recommendation → Human Decision → Action → Outcome → Learning

## Scope

- recommendation identity/domain/subject
- explicit intelligence references
- recommendation statement
- rationale/reasoning
- intended objective/outcome
- alternatives, including no-action
- risks, constraints, dependencies and missing evidence
- existing non-probabilistic confidence/uncertainty
- temporal validity
- provenance/evidence traceability
- methodology identity/version as reference only
- human review state: proposed/reviewed/accepted/rejected/withdrawn

Preserve: Recommendation → Intelligence → Interpretation → Signal → Context → Evidence

Reuse I-01–I-05. ADR-006: suggestion_only, never a decision.

## Out of scope

- No AI/LLM
- No prediction/probability
- No scoring
- No automated actions
- No decision workflow
- No UI/dashboard
- No methodology engine
- No graph
- No BAU module
- No GIS
- No social-media monitoring
- No new DocTypes
- No Cloud persistence
- No entity redesign
- No unrelated refactors
- Do not touch `srm-core/`
- Do not start I-07
- Do not set VERIFIED or CLOSED

## Acceptance criteria

1. Focused tests and living documentation.
2. Changelog convention.
3. `npm run build` and lint; preserve existing global lint exception.
4. `.ai/TASK.md` = COMPLETE. `.ai/HANDOFF.md` completed.
5. PR against master. VERIFIED / CLOSED not set.
