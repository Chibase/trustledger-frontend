# TrustLedger AI Engineering Workflow

## Authority Chain

1. `AGENTS.md` is the binding engineering constitution.
2. `docs/BUILD_PLAN.md` defines the active implementation packet.
3. `docs/DECISIONS.md` contains locked architectural decisions.
4. `docs/DESIGN_SYSTEM.md` governs the design system.
5. `.ai/TASK.md` contains the current implementation assignment.
6. `.ai/HANDOFF.md` contains Codex's post-execution report.

## Operating Cycle

DESIGN  ASSIGN  EXECUTE  VERIFY  DOCUMENT  REPEAT

### DESIGN

ChatGPT and the product owner define the requirement, scope, behaviour and acceptance criteria.

### ASSIGN

The agreed implementation task is recorded in `.ai/TASK.md`.

### EXECUTE

Codex inspects the repository, implements only the authorised scope, runs appropriate validation and reports what happened.

### VERIFY

The result is checked against the acceptance criteria and the existing architecture.

### DOCUMENT

The result and important decisions are reflected in the appropriate project documentation.

## Rules

* Read `AGENTS.md` before implementation.
* Read `docs/BUILD_PLAN.md`, `docs/DECISIONS.md`, and any task-specific documentation before coding.
* Implement only the active authorised scope.
* Prefer the smallest compatible patch.
* Do not re-architect the platform unless explicitly authorised.
* Never modify `srm-core/` unless the task explicitly authorises backend work.
* Never expose secrets or API keys.
* Do not claim completion without running the required validation.
* When blocked, report the exact blocker rather than inventing a workaround.
