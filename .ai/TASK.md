# Current TrustLedger Task

Status: COMPLETE

Task: RPT-02 — Client-Ready Report Presentation & Export

Objective:
Improve the existing TrustLedger report output so that generated reports can be viewed, printed and downloaded as professional client-ready documents.

Scope:
- Reuse the existing ReportPresentationView.
- Reuse the existing ProjectReportStudio workflow.
- Reuse the existing report lenses/layouts.
- Make the on-screen report presentation clean and client-facing.
- Preserve and improve the existing print output.
- Replace the current Markdown/text download as the primary report download with a professional PDF output.
- Keep Markdown as an internal intermediate representation only.
- Ensure the report content presented to clients does not expose internal engineering terminology, raw Markdown, composer terminology, implementation classifications or unexplained technical machinery.
- Preserve existing evidence grounding and case/evidence validation.
- Preserve the existing report-generation/composer logic.
- Keep the existing Charts, Details and Charts + Details presentation options where practical.
- Add focused tests for the changed report presentation/export behaviour.

PDF:
- The PDF must represent the professional report currently displayed to the user.
- Prefer reuse of the existing presentation DOM/layout rather than creating a second report-rendering system.
- Include the report title, relevant project/report context, narrative content and appropriate charts/details.
- Ensure page layout is suitable for client sharing and printing.
- Do not expose raw Markdown or internal technical implementation details.

Share:
- Do not introduce public share URLs, anonymous access or a new permissions/tenancy system.
- If an existing browser/system sharing mechanism can be safely supported without changing the security model, it may be retained or exposed.
- Otherwise leave secure sharing for a later task.

Acceptance:
- A generated report can be viewed in the existing presentation interface.
- A generated report can be printed as a professional document.
- A generated report can be downloaded as a client-ready PDF.
- The PDF reflects the report being viewed.
- Markdown remains an internal representation and is not the primary client-facing download.
- Client-facing output uses professional TrustLedger/report language rather than engineering terminology.
- Existing evidence validation is preserved and not weakened.
- Existing report-generation logic remains intact.
- No dashboard redesign.
- No intelligence-foundation changes.
- No predictive or autonomous AI.
- No new public sharing/access-control architecture.
- No unrelated refactor.
- No srm-core changes.
- Run relevant focused tests.
- Run npm run lint.
- Run npm run build.
- Document any pre-existing or environment-specific check failures.

Do not:
- Modify reportComposer.ts unless strictly necessary for presentation compatibility.
- Change evidence-grounding rules.
- Remove existing report lenses.
- Replace the existing report workflow with a new architecture.
- Build a separate reporting engine.
- Add LLM/API functionality.
- Add public report URLs.
- Touch srm-core.

Handoff:
When implementation is complete:
1. Update .ai/HANDOFF.md with the implementation summary, files changed, tests/checks run and any known limitations.
2. Update docs/CHANGELOG_INTERNAL.md.
3. Commit the changes.
4. Push the branch.
5. Open a PR against master.
6. Report the PR number and verification status.

Do not mark VERIFIED or CLOSED. Owner/ChatGPT will independently verify and close this task.
