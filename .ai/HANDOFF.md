# AI Engineering Handoff

Task: RPT-03 — Connect CreateReportWizard to client-ready report presentation

Status: COMPLETE

## 1. Task

Connect the existing `/app/reports` `CreateReportWizard` flow to the already-implemented `ReportPresentationView` so a generated report can be viewed in full-screen presentation, downloaded as PDF, and printed. Reuse the existing report presentation/export architecture without creating another reporting or PDF system. Ensure saved reports reach the same presentation/export path where applicable. Investigate the observed behaviour where the UI says `Saved as RPT-...` but the Report Library immediately says `No saved reports yet` and implement the minimum necessary integration fix.

## 2. Findings

- `CreateReportWizard` previously drafted reports into state and textarea editor but lacked integration with `ReportPresentationView`, format selection, PDF export, and print capabilities.
- `ProjectReportStudio` already established the canonical pattern for computing lens data (`riskRows`, `funderSnapshot`, `chartGroups`, `kindChartBars`), binding `ReportPresentationView`, and posting to `/api/app/reports/pdf`.
- When `CreateReportWizard` saved reports using `saveAuthoredReport()`, `ReportsLibrary` sitting below it did not update because it only read localStorage once on component mount. Because `window.localStorage.setItem` does not emit `storage` events to the calling window, `ReportsLibrary` remained stagnant, leading to the reported "No saved reports yet" bug.

## 3. Changes

- `src/components/reports/CreateReportWizard.tsx`:
  - Added format selection (`charts`, `details`, `charts_details`) defaulting according to the active report lens.
  - Wired `ReportPresentationView` with report title, project context, lens calculations, chart bars, and narrative body.
  - Added "View report", "Download PDF", and "Print" actions to the action toolbar.
  - Added a "Saved on this project" section listing saved reports with View, Download PDF, and Print actions.
  - Connected `savedId` display with a quick-action link to view the saved report in the presentation view.
- `src/lib/reportStore.ts`:
  - Added window event dispatch (`"tl-reports-changed"`) on `saveAuthoredReport()` and `clearAllSavedReports()`.
- `src/components/reports/ReportsLibrary.tsx`:
  - Added listener for `"tl-reports-changed"` (and `"storage"`) to dynamically refresh saved reports without requiring a page reload.
- `tests/ts/CreateReportWizard.test.tsx`:
  - Added focused unit tests verifying report generation, presentation dialog opening, PDF download to `/api/app/reports/pdf`, saved report presentation reopening, and event synchronization.
- `jest.ui.config.cjs`:
  - Registered `tests/ts/CreateReportWizard.test.tsx` in `testMatch`.
- `docs/CHANGELOG_INTERNAL.md` and `.ai/TASK.md`:
  - Documented changes and moved status to `COMPLETE`.

## 4. Validation

- `npm run test:audit -- --runTestsByPath tests/ts/reportNarrative.test.tsx tests/ts/CreateReportWizard.test.tsx tests/ts/ProjectReportStudio.test.tsx tests/ts/ReportsHub.test.tsx` — **pass** (4 suites, 10 tests passed)
- `npx eslint src/components/reports/CreateReportWizard.tsx src/components/reports/ReportsLibrary.tsx src/lib/reportStore.ts tests/ts/CreateReportWizard.test.tsx` — **pass** (0 errors)
- `npx tsc --noEmit` — **pass** (0 type errors after build fix)
- `npm run build` — **pass** (110 pages, TypeScript clean, 0 errors)
- Verified `srm-core/` is completely untouched.

## 5. Behaviour

- Authors generating reports via `/app/reports` now immediately see the client-ready presentation view and can reopen it using "View report".
- Users can download client-ready PDFs via the existing `/api/app/reports/pdf` endpoint or trigger browser print from both the wizard toolbar and the presentation view header.
- Saved project reports are listed with "View", "Download PDF", and "Print" actions.
- Newly saved reports immediately reflect in the report library below without requiring a page refresh.

## 6. Risks

- None identified within the reporting subsystem. Server PDF export depends on authenticated user session and plan capabilities as enforced by the existing `/api/app/reports/pdf` route.

## 7. Git Status

- Branch: `copilot/rpt-03-connect-createreportwizard`
- `srm-core/` untouched.
- Build fix: `funderSnapshot` guarded at both `funderChartGroups` call sites in `CreateReportWizard.tsx` (returns `[]` when undefined; no type weakening).

## 8. Remaining Work

- Owner/ChatGPT to independently verify the implementation and decide VERIFIED → CLOSED.

