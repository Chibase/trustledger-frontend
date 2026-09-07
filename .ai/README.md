# TrustLedger AI Engineering Workflow

## Authority Chain

1. `AGENTS.md` is the binding engineering constitution.
2. `docs/BUILD_PLAN.md` defines packet roadmap, locked delivery rules, and product scope.
3. `docs/DECISIONS.md` contains locked architectural decisions.
4. `docs/DESIGN_SYSTEM.md` governs the design system.
5. `.ai/TASK.md` is the **current implementation assignment** and the **hard execution gate**.
6. `.ai/HANDOFF.md` is the **AI Engineering Handoff** — the assigned agent's post-execution report.

BUILD_PLAN, DECISIONS, and DESIGN_SYSTEM remain binding. They do **not** authorise product work when `.ai/TASK.md` is EMPTY, COMPLETE, VERIFIED, or CLOSED.

## Task lifecycle

`.ai/TASK.md` `Status` must be exactly one of:

```
EMPTY → ASSIGNED → IN PROGRESS → COMPLETE → VERIFIED → CLOSED
```

| Status | Meaning | Who sets it | Execution |
|--------|---------|-------------|-----------|
| **EMPTY** | No implementation task is assigned. | ChatGPT / owner | **Not authorised.** Do not implement product changes. Do not infer a packet from BUILD_PLAN. |
| **ASSIGNED** | A task has been formally assigned. Execution has not started. | ChatGPT / owner | The named agent may start by setting **IN PROGRESS**. No other agent may execute. |
| **IN PROGRESS** | The assigned agent is executing the authorised TASK scope. | Assigned implementation agent | **Authorised** for that agent only, within TASK scope. |
| **COMPLETE** | The assigned agent has finished the work and written `.ai/HANDOFF.md`. | Assigned implementation agent | **Not authorised.** Do not re-execute. Wait for verification. |
| **VERIFIED** | ChatGPT / owner has independently reviewed the result and accepted it. | ChatGPT / owner only | **Not authorised.** |
| **CLOSED** | The task is formally finished. No further execution should occur. | ChatGPT / owner only | **Not authorised.** |

The assigned implementation agent must **not** set VERIFIED or CLOSED.

## Assignment gate

`.ai/TASK.md` is the only authorised current implementation assignment.

* **EMPTY** = no implementation is authorised.
* **ASSIGNED** or **IN PROGRESS** = the TASK body is the only authorised current implementation assignment. Execute only that task and its explicitly required supporting changes.
* **COMPLETE**, **VERIFIED**, or **CLOSED** = do not implement further changes for this TASK.
* The assigned agent must still obey `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/DESIGN_SYSTEM.md`.
* Cloud Agent checkouts may lag `origin/master`. Fetch the branch tip before concluding that `.ai/` files are missing.

## Operating Cycle

DESIGN → ASSIGN → EXECUTE → HANDOFF → VERIFY → CLOSE

### DESIGN

ChatGPT and the product owner define the requirement, scope, behaviour and acceptance criteria.

### ASSIGN

The agreed implementation task is recorded in `.ai/TASK.md` with Status **ASSIGNED** and an **Assigned Agent**. The agent may be Cursor, Codex, or another authorised AI implementation agent — do not assume one vendor.

### EXECUTE

The assigned agent sets Status **IN PROGRESS**, inspects the repository, implements only the authorised TASK scope, and runs appropriate validation.

### HANDOFF

The assigned agent writes `.ai/HANDOFF.md` and sets Status **COMPLETE**.

`.ai/HANDOFF.md` must record:

* Task
* Assigned Agent
* Status
* Findings
* Changes
* Validation
* Behaviour
* Risks
* Git Status
* Remaining Work

Use this shape: header fields **Task**, **Assigned Agent**, and **Status**, then the eight sections below.

1. Task
2. Findings
3. Changes
4. Validation
5. Behaviour
6. Risks
7. Git Status
8. Remaining Work

### VERIFY

ChatGPT / owner checks the result against acceptance criteria and architecture, then sets Status **VERIFIED**.

### CLOSE

ChatGPT / owner sets Status **CLOSED**. The cycle may then DESIGN / ASSIGN a new TASK.

## Rules

* Read `AGENTS.md`, `.ai/TASK.md`, and `.ai/HANDOFF.md` before implementation.
* If Status is EMPTY, COMPLETE, VERIFIED, or CLOSED, stop. Do not implement product changes.
* Read `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, and any task-specific documentation before coding.
* Implement only the active authorised TASK scope.
* Prefer the smallest compatible patch.
* Do not re-architect the platform unless explicitly authorised.
* Never modify `srm-core/` unless the task explicitly authorises backend work.
* Never expose secrets or API keys.
* Do not claim completion without running the required validation.
* When blocked, report the exact blocker rather than inventing a workaround.
* Remain **agent-neutral** in workflow docs: name the assigned agent on the TASK, do not hard-code a single implementation vendor.

## Observations (not assignments)

Recorded so agents do not invent a product packet from BUILD_PLAN. **Do not resolve these here. Do not choose an active product packet from them.**

* BUILD_PLAN has several **ACTIVE** section headers while most listed packets are **Done**. Remaining Planned engineering packets include HS-3 / HS-4 (deferred until Production smoke). That is not an implementation assignment.
* `AGENTS.md` current-phase wording (GO LIVE Done + Cloud Stakeholder Intelligence deepening) differs from the BUILD_PLAN Phase 6 header. That is not an assignment.
* BUILD_PLAN still lists `/demo` as a demo URL; ADR-033 retired public sample demo to `/product`. Product docs were not changed in this workflow normalisation.

Phase 5 Real Task Handoff Test has been executed by Cursor.

Phase 6 End-to-End Integration Test completion marker: executed by Cursor.
