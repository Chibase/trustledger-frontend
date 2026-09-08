# Current TrustLedger Task

Status: IN PROGRESS

Assigned Agent: Cursor

## Title

V-02 — Core Product Integrity Verification

## Objective

Produce an evidence-based integrity assessment of the TrustLedger operational chain **Organisation → Project → Geographic Area → Stakeholders → Engagements → Commitments → Grievances → Reporting** after V-01 CLOSED / EMPTY, so ChatGPT/owner can independently verify product truth against the repository, Frappe Cloud integration, and available production/runtime evidence.

## Scope

* Verification-only. No product development. No new product packet. Do not fix, redesign, refactor, or start another packet.
* Inspect the operational chain in application code, BFF/API routes, Frappe Cloud integration (DocTypes, persist, empty-Cloud-stays-empty), and available production/runtime evidence.
* Classify each chain area as exactly one of: **implemented/verified**, **implemented but runtime-dependent**, **partial**, **blocked/operator-dependent**, **demo/local-only**, or **missing**.
* Record concrete evidence (file paths, routes, DocTypes, Git SHAs, HTTP probes) and risks in `.ai/HANDOFF.md`.
* Do not modify application code (`src/`).
* Do not modify `srm-core`.
* Do not modify locked product documents (`docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`).
* Do not start Packet 24c, HS-3/HS-4, lint remediation, or any other product-development packet.
* Do not set VERIFIED or CLOSED (ChatGPT / owner only).

## Acceptance criteria

1. `.ai/TASK.md` contains this V-02 assignment and ends at Status **COMPLETE**.
2. `.ai/HANDOFF.md` is replaced with the V-02 integrity assessment using the required eight-section structure (Task, Findings, Changes, Validation, Behaviour, Risks, Git Status, Remaining Work).
3. The handoff identifies Cursor as the executing agent.
4. Each operational-chain area is classified with evidence. Findings are evidence-based (Git SHAs, file paths, routes, DocTypes, production probes).
5. Application source code is untouched.
6. `srm-core` is untouched.
7. `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/DESIGN_SYSTEM.md` are untouched.
8. Changes are committed and pushed. Working tree is clean after completion.

## Execution rules

* This TASK is the only current implementation assignment.
* Follow `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/DESIGN_SYSTEM.md`.
* Stop if the task conflicts with a locked decision.
* Do not perform any additional cleanup or product work.
* When verification is complete, set Status **COMPLETE** and write `.ai/HANDOFF.md`.
