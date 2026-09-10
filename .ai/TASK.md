# Current TrustLedger Task

Status: ASSIGNED

Task: RPT-04 — TrustLedger Dashboard Redesign

Authoritative Design:
`docs/RPT-04_DASHBOARD_DESIGN_SPECIFICATION.md`

## Objective

Redesign the TrustLedger dashboard experience in accordance with the RPT-04 specification.

The primary dashboard is the **TrustLedger Platform Command Centre** for the platform owner.

It must focus on:

- Build progress and module progress
- Plans and commercial position
- Platform issues
- Platform health
- Items requiring owner attention

It must not become a customer/project operational dashboard.

## Mandatory UX Hierarchy

Implement:

**CHARTS → SUMMARY → DETAILS → ACTION**

Charts remain prominent.

Interaction model:

**See → Understand → Investigate → Act**

Details should be accessible through appropriate chart, window, indicator or button interactions rather than overwhelming the initial view.

## Dashboard Separation

Preserve four distinct dashboard concepts:

1. Platform Command Centre — owner
2. Organisation Dashboard — customer
3. Project Dashboard — project team
4. Testing & QA Dashboard — engineering only

Testing and QA functionality must not be incorporated into the product dashboard or customer plans.

## Personalisation

The dashboard must use the authenticated user's actual identity.

Example:

`Good morning, Thozamile`

Do not hard-code the user's name.

## Design Direction

Create a sophisticated, spacious, modern, calm and executive interface using TrustLedger's established visual language.

Avoid:

- dashboard clutter
- excessive KPI cards
- duplicated information
- cramped tables
- excessive borders
- giant headings
- generic AI/SaaS dashboard aesthetics

The sidebar should provide navigation to deeper information. Do not duplicate the sidebar's information architecture in the central dashboard.

## Engineering Constraints

Before changing code:

1. Inspect the existing dashboard architecture and components.
2. Identify reusable components and existing functionality.
3. Identify the smallest safe implementation.
4. Preserve working functionality unless the specification explicitly requires change.

Do not:

- rebuild the dashboard architecture unnecessarily
- introduce predictive AI
- introduce autonomous AI
- introduce new scoring methodology
- introduce public sharing
- change tenancy, authentication or authorization architecture
- modify `srm-core`
- refactor unrelated systems
- create a separate dashboard framework

Reuse existing TrustLedger dashboard components wherever practical.

## Scope

The primary implementation target is the existing Platform Command Centre/dashboard.

Existing Organisation and Project dashboards should not be redesigned unless strictly necessary to maintain the dashboard separation defined in the specification.

The Testing & QA dashboard remains separate.

## Validation

After implementation:

- run focused dashboard tests
- run changed-file lint
- run `npm run build`
- manually verify affected UI behaviour where appropriate
- confirm `srm-core/` is untouched
- confirm no unrelated files were modified

Report:

- files changed
- functionality changed
- tests/checks performed
- build result
- remaining risks
- Git status
- PR number and branch

## Stop Conditions

STOP and report before implementing if:

- the existing architecture conflicts with the specification
- a backend/API change appears necessary
- authentication or authorization changes appear necessary
- the requested implementation requires modifying `srm-core`
- the scope cannot be achieved safely through the existing frontend architecture

Do not expand scope without Product Owner approval.

## Completion Rule

Implementation agent must NOT mark the task VERIFIED or CLOSED.

When implementation is complete:

`Status: COMPLETE`

Update:

- `.ai/HANDOFF.md`
- `docs/CHANGELOG_INTERNAL.md`

Commit, push and open the PR.

Owner/ChatGPT will independently verify the implementation and determine:

`VERIFIED → CLOSED`

## Workflow Rule

Implementation agent executes only while Status is ASSIGNED or IN PROGRESS.

EMPTY TASK = STOP.