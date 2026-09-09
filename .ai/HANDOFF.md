# AI Engineering Handoff

Task: RPT-01 — Fix Reports Create Report button

Assigned Agent: Codex

Status: COMPLETE

## 1. Task

Fix the Reports page "Create Report" control so it actually enters the existing report-generation flow on `/app/reports`, without redesigning Reports, changing the composer, weakening evidence validation, touching intelligence foundations, or modifying `srm-core`.

## 2. Findings

- On `/app/reports`, the visible **Create a report** control lived inside `ReportsLibrary`.
- That control linked to `/app/reports`, which is the page already being viewed, so clicking it caused no local state change.
- The actual report-generation flow is already implemented behind `ReportsHub` → `writeMode` → `CreateReportWizard` → `handleCompose`.

## 3. Changes

- `src/components/reports/ReportsHub.tsx` — added a small `openWriter()` handler that enables the existing writer flow.
- `src/components/reports/ReportsLibrary.tsx` — let the library render the existing create-report control as a button callback when used inside the Reports page, instead of self-linking back to the same route.
- `tests/ts/ReportsHub.test.tsx` — added coverage that the Reports page create-report control opens the existing writer flow.
- `docs/CHANGELOG_INTERNAL.md` — logged the fix.
- `.ai/TASK.md` — moved the task to `COMPLETE`.

## 4. Validation

- `npm run test:audit -- --runTestsByPath tests/ts/ReportsHub.test.tsx` — **pass**
- `npm run lint` — **fails on pre-existing unrelated repo errors** (`react-hooks/set-state-in-effect` plus 2 unused-var warnings); RPT-01 did not add new lint failures
- `npm run build` — **fails in sandbox because Next.js cannot fetch Google Fonts** (`Source Sans 3`, `Source Serif 4`) during `next build`

## 5. Behaviour

- Clicking **Create a report** on `/app/reports` now opens the existing writer flow on the same page.
- Existing project selection and workspace case/evidence validation in `CreateReportWizard` are unchanged.

## 6. Risks

- No known functional risk beyond the existing page-local toggle; the change only swaps a self-navigation control for the existing writer-open action on the Reports page.

## 7. Git Status

- Branch for PR: `rpt-01-fix-report-button`
- No `srm-core` changes

## 8. Remaining Work

- Owner/ChatGPT to verify and close the task.
