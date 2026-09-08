# TrustLedger AI Engineering Workflow

**Locked.** ChatGPT, Cursor, Codex, and any other authorised AI implementation agent use this repository-controlled process. Do not invent a parallel workflow.

## Authority Chain

1. `AGENTS.md` — binding engineering constitution.
2. `docs/BUILD_PLAN.md` — packet roadmap, locked delivery rules, product scope. **Not an assignment.**
3. `docs/DECISIONS.md` — locked architectural decisions.
4. `docs/DESIGN_SYSTEM.md` — design system.
5. `.ai/TASK.md` — **current implementation assignment** and **hard execution gate**.
6. `.ai/HANDOFF.md` — latest **completed** execution handoff (history of the last closed task).

GitHub is the shared source of truth for source code, engineering authority, task state, handoffs, decisions, and implementation history.

## Permanent operating cycle

```
DESIGN
  ↓
ASSIGN
  ↓
EXECUTE
  ↓
HANDOFF
  ↓
VERIFY
  ↓
CLOSE
  ↓
EMPTY
  ↓
NEXT TASK
```

**EMPTY TASK = STOP.**

Do not infer a task from an **ACTIVE** heading, Planned row, or phase label in `docs/BUILD_PLAN.md`. The current `.ai/TASK.md` is the only authorised implementation assignment.

## Task lifecycle

`.ai/TASK.md` `Status` is exactly one of:

```
EMPTY → ASSIGNED → IN PROGRESS → COMPLETE → VERIFIED → CLOSED
```

After **CLOSED**, `.ai/TASK.md` is reset to **EMPTY**. The closed task remains permanently recorded in `.ai/HANDOFF.md` (not in TASK). TASK cannot hold history and EMPTY at the same time.

| Status | Meaning | Authority | Implementation execution |
|--------|---------|-----------|--------------------------|
| **EMPTY** | No task is authorised. | ChatGPT / owner (idle / after close) | **STOP.** |
| **ASSIGNED** | ChatGPT / owner has assigned the task. Execution has not started. | ChatGPT / owner | Named agent may start (set **IN PROGRESS**). |
| **IN PROGRESS** | Assigned implementation agent has started. | Assigned implementation agent | **Authorised** for that agent, TASK scope only. |
| **COMPLETE** | Implementation agent has finished and produced HANDOFF. | Assigned implementation agent | **STOP.** Do not re-execute. |
| **VERIFIED** | ChatGPT / owner has independently reviewed and accepted the result. | ChatGPT / owner **only** | **STOP.** |
| **CLOSED** | ChatGPT / owner has formally closed the task. | ChatGPT / owner **only** | **STOP.** Then reset TASK to **EMPTY**. |

No AI implementation agent may set **VERIFIED** or **CLOSED**, unless ChatGPT / owner explicitly instructs them to record an owner closure (as in workflow lock). They must never declare their own work VERIFIED or CLOSED.

## Hard execution gate

Implementation agents may execute **ONLY** when Status is **ASSIGNED** or **IN PROGRESS**.

They must **STOP** when Status is **EMPTY**, **COMPLETE**, **VERIFIED**, or **CLOSED**.

**EMPTY TASK = STOP.**

## Handoff reset rule

`.ai/HANDOFF.md` contains the **latest completed execution handoff**.

* The assigned agent writes/updates HANDOFF when setting Status **COMPLETE**.
* After ChatGPT / owner **CLOSES** the task, that HANDOFF is the preserved record.
* Replace or rewrite HANDOFF for a **new** task only after the **current** task is **CLOSED**.
* Do not erase a closed handoff while TASK is EMPTY awaiting the next assignment.

Required HANDOFF fields: Task, Assigned Agent, Status, Findings, Changes, Validation, Behaviour, Risks, Git Status, Remaining Work.

Shape: header **Task**, **Assigned Agent**, **Status**, then:

1. Task
2. Findings
3. Changes
4. Validation
5. Behaviour
6. Risks
7. Git Status
8. Remaining Work

## Roles

### ChatGPT / owner

Responsible for:

* product and engineering design;
* task definition;
* assignment (Status **ASSIGNED**, named agent);
* interpretation of requirements;
* independent verification (Status **VERIFIED**);
* task closure (Status **CLOSED**, then TASK → **EMPTY**);
* deciding when the next task may begin.

### Implementation agent

May be **Cursor**, **Codex**, or **another explicitly authorised AI agent**. The repository does not assume a permanent executor.

Responsible for:

* repository inspection;
* executing **only** the assigned TASK;
* respecting `AGENTS.md` and project authority (BUILD_PLAN, DECISIONS, DESIGN_SYSTEM);
* making the smallest compatible changes;
* validation;
* producing HANDOFF and setting **COMPLETE**;
* reporting blockers instead of inventing workarounds;
* **never** declaring its own work VERIFIED or CLOSED.

### GitHub

Shared source of truth for:

* source code;
* engineering authority (`AGENTS.md`, `docs/`);
* task state (`.ai/TASK.md`);
* handoffs (`.ai/HANDOFF.md`);
* decisions;
* implementation history (git).

## Interruption / takeover

If an implementation agent becomes unavailable, another authorised agent may take over **only after**:

1. reading the current TASK;
2. reading the latest HANDOFF;
3. verifying Git state (`git fetch origin master`, clean vs remote);
4. confirming the current task status;
5. continuing **only** within the existing authorised scope.

An unavailable agent does **not** cancel the task.

## Stale checkout

Agents on a potentially stale checkout (including Cloud Agent snapshots) must:

* `git fetch origin master` before relying on `.ai` state;
* never conclude that `.ai` is missing until the remote has been checked;
* never overwrite newer remote work with stale local state.

## Cycle steps

### DESIGN

ChatGPT / owner define requirement, scope, behaviour, and acceptance criteria.

### ASSIGN

ChatGPT / owner write `.ai/TASK.md` with Status **ASSIGNED** and **Assigned Agent**.

### EXECUTE

Assigned agent sets **IN PROGRESS**, implements only the TASK scope, validates.

### HANDOFF

Assigned agent writes `.ai/HANDOFF.md` and sets **COMPLETE**.

### VERIFY

ChatGPT / owner independently review and set **VERIFIED**.

### CLOSE

ChatGPT / owner set **CLOSED**, then reset `.ai/TASK.md` to **EMPTY**. Closed work stays in `.ai/HANDOFF.md`.

### EMPTY

**EMPTY TASK = STOP.** Wait for ChatGPT / owner to ASSIGN the next task.

### NEXT TASK

Only ChatGPT / owner may create the next assignment.

## Rules

* Read `AGENTS.md`, `.ai/TASK.md`, and `.ai/HANDOFF.md` before implementation.
* **EMPTY TASK = STOP.** Also stop on COMPLETE, VERIFIED, CLOSED.
* Never infer a packet from BUILD_PLAN ACTIVE headers.
* Read BUILD_PLAN, DECISIONS, DESIGN_SYSTEM, and task-specific docs before coding.
* Implement only the authorised TASK scope. Smallest compatible patch.
* Do not re-architect unless the TASK authorises it.
* Never modify `srm-core/` unless the TASK explicitly authorises backend work.
* Never expose secrets or API keys.
* Do not claim completion without the required validation.
* When blocked, report the exact blocker.

## Observations (not assignments)

Recorded so agents do not invent a product packet from BUILD_PLAN. **Do not resolve these here. Do not choose an active product packet from them.**

* BUILD_PLAN has several **ACTIVE** section headers while most listed packets are **Done**. Remaining Planned engineering packets include HS-3 / HS-4 (deferred until Production smoke). That is not an implementation assignment.
* `AGENTS.md` current-phase wording (GO LIVE Done + Cloud Stakeholder Intelligence deepening) differs from the BUILD_PLAN Phase 6 header. That is not an assignment.
* BUILD_PLAN still lists `/demo` as a demo URL; ADR-033 retired public sample demo to `/product`. Product docs were not changed in this workflow normalisation.

Phase 5 Real Task Handoff Test has been executed by Cursor.

Phase 6 End-to-End Integration Test completion marker: executed by Cursor.
