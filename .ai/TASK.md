# Current TrustLedger Task

Status: COMPLETE

Task: RPT-03 — Connect CreateReportWizard to client-ready report presentation

Objective:
Connect the existing `/app/reports` CreateReportWizard flow to the already-implemented ReportPresentationView so a generated report can be viewed, downloaded as PDF, and printed. Reuse the existing report presentation/export architecture. Do not create another reporting or PDF system.

Scope:
- Primary product file: `src/components/reports/CreateReportWizard.tsx`.
- Add or update only the minimum focused test file needed for this flow.
- Use `src/components/reports/ProjectReportStudio.tsx` as the implementation reference.
- Connect the existing generated report body, project, report kind, audience, period, format, and evidence context to `ReportPresentationView`.
- Required user flow:
  Generate report → View report → Download PDF / Print.
- Ensure a saved report can reach the same presentation/export path where applicable.
- Investigate the observed behaviour where the UI says `Saved as RPT-...` but the Report Library immediately says `No saved reports yet`.
- If that library issue is confirmed, fix only the minimum store/library integration necessary.
- Preserve all existing evidence validation and report-generation behaviour.

Do NOT modify:
- `src/components/reports/ReportPresentationView.tsx`
- `src/lib/reportPdf.ts`
- `src/app/api/app/reports/pdf/route.ts`
- `src/lib/reportComposer.ts`
- report lenses/layout architecture
- AI generation logic
- dashboard layout
- tenancy/security architecture
- `srm-core`

Do not create a second PDF/reporting engine.
Do not weaken or bypass evidence validation.
Do not redesign the Reports Library.
Do not perform unrelated refactoring.

Acceptance Criteria:
1. A report generated from `/app/reports` can open the existing client-ready ReportPresentationView.
2. The presentation provides the existing Download PDF and Print actions.
3. PDF export uses the existing `/api/app/reports/pdf` endpoint.
4. The PDF represents the currently generated/viewed report.
5. Existing report generation and evidence validation remain unchanged.
6. A saved report can be opened through the same presentation/export path where applicable.
7. Investigate the `Saved as RPT-...` versus `No saved reports yet` behaviour and make only the minimum necessary integration fix if required.
8. Focused tests pass.
9. No `srm-core` changes.
10. No unrelated product changes.

Implementation Guidance:
- Reuse existing functions and data structures wherever possible.
- Follow the existing `ProjectReportStudio` → `ReportPresentationView` pattern.
- Do not duplicate report composition, evidence gathering, PDF rendering, or report-lens logic.
- Keep Markdown as the internal report representation; do not expose raw Markdown as the client-facing export.
- Keep the implementation small and surgical because this is an integration task, not a new reporting feature.

Validation:
- Run the focused test covering CreateReportWizard presentation/export behaviour.
- Run lint if practical, but do not spend excessive agent usage repeatedly analysing known unrelated lint failures.
- Run build only if required by the repository workflow; report any pre-existing/environmental failure.
- Confirm `srm-core` is untouched.

Handoff:
- Update `.ai/HANDOFF.md` with:
  - findings
  - files changed
  - implementation summary
  - tests/validation performed
  - runtime behaviour
  - known limitations
- Update `docs/CHANGELOG_INTERNAL.md`.
- Commit and push the implementation.
- Open a PR against `master`.
- Report the PR number and commit SHA.
- Do NOT mark VERIFIED or CLOSED.

Owner/ChatGPT will independently verify the implementation and decide VERIFIED → CLOSED.

Workflow Rule:
Implementation agent executes only while Status is ASSIGNED or IN PROGRESS.

EMPTY TASK = STOP.
