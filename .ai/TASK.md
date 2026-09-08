# Current TrustLedger Task

Status: COMPLETE

Assigned Agent: Cursor

## Title

I-03 — Explainable Signal Foundation

## Objective

Implement the minimum reusable Explainable Signal Foundation for:

Evidence → Context → Signal → Interpretation

## Scope

Establish reusable signal contracts/types/helpers supporting:

- observable signal/observation
- signal identity/domain/classification/state
- subject and related entity references
- temporal information
- evidence/context linkage
- provenance and explainability
- methodology-agnostic signal representation
- strict separation from interpretation, intelligence, recommendation, decision and action

Reuse I-01 and I-02 structures. Preserve all existing TrustLedger entities and behaviour. Signal classification must remain descriptive, not scoring/predictive.

## Out of scope

- No dashboards
- No AI/LLM
- No predictive models
- No risk/stakeholder scoring
- No methodology engine
- No graph
- No BAU module
- No GIS engine
- No automated recommendations/actions
- No new DocTypes
- No Cloud persistence
- No unrelated refactors
- Do not touch `srm-core/`
- Do not start I-04
- Do not close the task

## Acceptance criteria

1. Explainable signal contracts exist and stay distinguishable from later lifecycle stages.
2. Classification is descriptive; no scoring or prediction.
3. Existing SRM entities, I-01, I-02, UI, APIs, and `srm-core/` behaviour are unchanged.
4. Focused tests and documentation.
5. `docs/CHANGELOG_INTERNAL.md` updated.
6. `npm run build` passes. Lint: document only the existing global exception; do not expand it.
7. `.ai/HANDOFF.md` with the eight required sections plus implementation, files changed, tests, build/lint, scope compliance, known limitations, verification notes.
8. `.ai/TASK.md` ends at Status **COMPLETE**. VERIFIED / CLOSED not set.
9. PR opened against master.

## Execution rules

* This TASK is the only current implementation assignment.
* Follow `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/DESIGN_SYSTEM.md`.
* When implementation is complete, set Status **COMPLETE** and write `.ai/HANDOFF.md`.
