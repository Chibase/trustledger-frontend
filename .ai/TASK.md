# Current TrustLedger Task

Status: COMPLETE

Assigned Agent: Cursor

## Title

I-04 — Explainable Interpretation Foundation

## Objective

Implement the minimum reusable Explainable Interpretation Foundation for:

Evidence → Context → Signal → Interpretation → Intelligence

## Scope

Establish reusable interpretation contracts/types/helpers supporting:

- interpretation identity/domain
- explicit signal, context and evidence inputs
- hypothesis/interpretation
- rationale/reasoning
- alternative explanations
- confidence/uncertainty
- limitations/missing evidence
- temporal validity
- provenance
- methodology identity/version as a reference only
- professional/human judgement and review state
- strict separation from Intelligence, Recommendation, Decision and Action

Reuse I-01, I-02 and I-03 structures. Preserve existing TrustLedger entities and behaviour.

Interpretation must remain a reasoned hypothesis, NOT an established truth. Multiple plausible interpretations must be supportable. Confidence must not become predictive probability or scoring.

## Out of scope

- No dashboards/UI
- No AI/LLM
- No predictive models
- No probability models
- No risk/stakeholder scoring
- No methodology engine/registry/marketplace
- No Intelligence synthesis
- No recommendations or automated actions
- No graph/network engine
- No BAU module
- No GIS engine
- No new DocTypes
- No Cloud persistence
- No unrelated refactors
- Do not touch `srm-core/`
- Do not start I-05
- Do not set VERIFIED or CLOSED

## Acceptance criteria

1. Interpretation contracts exist and stay distinguishable from intelligence, recommendation, decision, and action.
2. Hypotheses can coexist as alternatives; confidence is the I-01 vocabulary, not a probability.
3. Existing SRM entities, I-01–I-03, UI, APIs, and `srm-core/` behaviour are unchanged.
4. Focused tests and documentation.
5. `docs/CHANGELOG_INTERNAL.md` updated.
6. Relevant foundation tests pass. `npm run build` passes. Lint: document only the existing global exception; do not expand it.
7. `.ai/HANDOFF.md` with required sections plus implementation, files changed, tests, build/lint, scope compliance, limitations, verification notes.
8. `.ai/TASK.md` ends at Status **COMPLETE**. VERIFIED / CLOSED not set.
9. PR opened against master.

## Execution rules

* This TASK is the only current implementation assignment.
* Follow `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/DESIGN_SYSTEM.md`.
* When implementation is complete, set Status **COMPLETE** and write `.ai/HANDOFF.md`.
