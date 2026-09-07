# TrustLedger AI Engineering Workflow

## Authority Chain

1. `AGENTS.md` is the binding engineering constitution.
2. `docs/BUILD_PLAN.md` defines packet roadmap, locked delivery rules, and product scope.
3. `docs/DECISIONS.md` contains locked architectural decisions.
4. `docs/DESIGN_SYSTEM.md` governs the design system.
5. `.ai/TASK.md` is the **current implementation assignment** and the **hard execution gate**.
6. `.ai/HANDOFF.md` is the **AI Engineering Handoff** — the assigned agent's post-execution report.

BUILD_PLAN, DECISIONS, and DESIGN_SYSTEM remain binding. They do **not** authorise product work when `.ai/TASK.md` is EMPTY.

## Assignment gate

`.ai/TASK.md` is the only authorised current implementation assignment.

* **EMPTY TASK = do not implement product changes.** Do not infer a packet from BUILD_PLAN phase headers, Planned rows, or “ACTIVE” section titles.
* A **non-empty TASK** is the only authorised current implementation assignment. Execute only that task and its explicitly required supporting changes.
* The assigned agent must still obey `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and `docs/DESIGN_SYSTEM.md`.
* Cloud Agent checkouts may lag `origin/master`. Fetch the branch tip before concluding that `.ai/` files are missing.

## Operating Cycle

DESIGN  ASSIGN  EXECUTE  VERIFY  DOCUMENT  REPEAT

### DESIGN

ChatGPT and the product owner define the requirement, scope, behaviour and acceptance criteria.

### ASSIGN

The agreed implementation task is recorded in `.ai/TASK.md`. The assigned AI implementation agent is named there when a task is active.

### EXECUTE

The assigned AI implementation agent (Cursor, Codex, or another authorised agent) inspects the repository, implements only the authorised TASK scope, runs appropriate validation, and reports what happened.

### VERIFY

The result is checked against the acceptance criteria and the existing architecture.

### DOCUMENT

The result and important decisions are reflected in the appropriate project documentation. The assigned agent writes `.ai/HANDOFF.md` when the TASK is complete.

## Rules

* Read `AGENTS.md`, `.ai/TASK.md`, and `.ai/HANDOFF.md` before implementation.
* If `.ai/TASK.md` is EMPTY, stop. Do not implement product changes.
* Read `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, and any task-specific documentation before coding.
* Implement only the active authorised TASK scope.
* Prefer the smallest compatible patch.
* Do not re-architect the platform unless explicitly authorised.
* Never modify `srm-core/` unless the task explicitly authorises backend work.
* Never expose secrets or API keys.
* Do not claim completion without running the required validation.
* When blocked, report the exact blocker rather than inventing a workaround.

## Observations (not assignments)

Recorded so agents do not invent a product packet from BUILD_PLAN. **Do not resolve these here. Do not choose an active product packet from them.**

* BUILD_PLAN has several **ACTIVE** section headers while most listed packets are **Done**. Remaining Planned engineering packets include HS-3 / HS-4 (deferred until Production smoke). That is not an implementation assignment.
* `AGENTS.md` current-phase wording (GO LIVE Done + Cloud Stakeholder Intelligence deepening) differs from the BUILD_PLAN Phase 6 header. That is not an assignment.
* BUILD_PLAN still lists `/demo` as a demo URL; ADR-033 retired public sample demo to `/product`. Product docs were not changed in this workflow normalisation.

Phase 5 Real Task Handoff Test has been executed by Cursor.
