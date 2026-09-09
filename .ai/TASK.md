# Current TrustLedger Task

Status: IN PROGRESS

Task: RPT-01 — Fix Reports Create Report button

Objective:
Fix the Reports page "Create Report" button so the existing report-generation workflow can be invoked successfully.

Scope:
- Trace button → handler → report-generation flow.
- Identify the smallest root cause.
- Fix only that root cause.
- Preserve existing workspace case/evidence validation.

Acceptance:
- Create Report responds and invokes the intended existing report-generation flow.
- Do not remove or weaken evidence validation.
- No report redesign.
- No intelligence-foundation changes.
- No unrelated refactor.
- No srm-core changes.
- Run relevant tests/checks.

Do not mark VERIFIED or CLOSED. Owner/ChatGPT will verify and close this task.
