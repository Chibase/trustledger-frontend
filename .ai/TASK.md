# Current TrustLedger Task

Status: COMPLETE

Assigned Agent: Cursor

## Title

I-01 — Common Intelligence Foundation

## Objective

Establish the minimum reusable foundation for this TrustLedger intelligence lifecycle:

Evidence → Context → Signal → Interpretation → Intelligence → Recommendation → Human Decision → Action → Outcome → Learning

## Scope

1. Inspect the existing implementation first. Reuse what already exists; do not duplicate existing structures.
2. Implement only the minimum common contracts/types/helpers needed to support the lifecycle consistently across future intelligence capabilities.
3. Preserve existing product behaviour and stable entities.
4. Keep evidence, provenance, context, signals, interpretations, intelligence and recommendations explicitly distinguishable.
5. Keep machine-generated suggestions separate from human decisions and actions.
6. Design for future methodologies and intelligence domains without hard-coding a particular methodology.
7. Do not introduce premature product features.

## Out of scope

- No new dashboard
- No predictive model
- No LLM integration
- No methodology engine or marketplace
- No stakeholder graph
- No BAU module
- No unrelated refactoring
- Do not touch `srm-core/`
- Do not redesign stable product entities

## Acceptance criteria

1. Shared lifecycle contracts exist and keep each stage distinguishable.
2. Suggestions remain `suggestion_only` / non-autonomous; human decisions are a separate stage.
3. Existing SRM entities, Trust layer, UI, APIs, and `srm-core/` are unchanged in behaviour.
4. No dashboard, LLM, methodology engine, graph, or BAU work.
5. `docs/CHANGELOG_INTERNAL.md` updated.
6. `npm run lint` and `npm run build` pass.
7. `.ai/HANDOFF.md` written with the eight required sections.
8. `.ai/TASK.md` ends at Status **COMPLETE**. VERIFIED / CLOSED not set.
9. Changes committed and a PR to master opened.

## Execution rules

* This TASK is the only current implementation assignment.
* Follow `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/DESIGN_SYSTEM.md`.
* Stop if the task conflicts with a locked decision.
* Do not perform any additional cleanup or product work.
* When implementation is complete, set Status **COMPLETE** and write `.ai/HANDOFF.md`.
