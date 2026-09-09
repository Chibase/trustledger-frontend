RPT-04 — TrustLedger Dashboard Design Specification

Status: Blueprint for implementation
Purpose: Establish the dashboard architecture, hierarchy, content boundaries and interaction model before implementation.

1. Dashboard Purpose

The main dashboard is the TrustLedger Platform Command Centre for the platform owner.

It must answer:

“How is TrustLedger itself doing, what is progressing, what is commercially important, and what requires my attention?”

It is not a customer/project dashboard and must not become a repository of all project or stakeholder information.

2. Dashboard Hierarchy

The fundamental information hierarchy is:

CHARTS → SUMMARY → DETAILS → ACTION

This hierarchy is mandatory.

Charts: The primary visual information layer. Users should immediately see what is happening.
Brief Summary: A concise interpretation beside or immediately below the chart.
Details: Additional information revealed when the user clicks the chart, summary, indicator or relevant button.
Action: Where appropriate, provide a clear route to resolve, investigate, manage or follow up.

Interaction philosophy:

See → Understand → Investigate → Act

Do not hide important information behind summary cards merely to make the dashboard look simple. Charts remain prominent.

3. Platform Owner Dashboard Content

The owner dashboard should focus only on information requiring platform-level attention.

A. Build Progress

Show the development status of TrustLedger and its major modules.

Examples:

Module/build progress
Completed vs outstanding development
Current development focus
Overall platform progress

Modules should primarily show build progress — not expose all their operational data.

B. Plans & Commercial Position

Show:

Paying plans
Trial plans
VIP arrangements
Plan movement/status
Items requiring owner attention
C. Platform Issues

Show issues relevant to the owner, such as:

Logged platform issues
Outstanding problems
High-priority issues
Issues requiring intervention
D. Platform Health

Show concise indicators of:

Platform/system status
Important operational conditions
Development/production concerns
Other matters requiring owner awareness
E. Attention

A focused area for things requiring action or review.

4. What Does NOT Belong on the Owner Dashboard

Do not turn the owner dashboard into a customer/project intelligence dashboard.

Therefore, detailed:

customer portfolios
project information
stakeholder records
engagements
grievances
commitments
community intelligence
project-level charts
operational case details

belong in the appropriate Organisation / Project workspaces, not the owner Command Centre.

5. Dashboard Types — Keep Them Separate

TrustLedger must maintain four distinct dashboard concepts:

Dashboard	Primary Purpose
Platform Command Centre	Owner: health, build, commercial position, attention
Organisation Dashboard	Customer: organisation/portfolio overview
Project Dashboard	Project team: project/stakeholder operational intelligence
Testing & QA Dashboard	Engineering/testing only
Critical rule

The Testing & QA Dashboard is completely separate from the main product dashboard.

Testing tools, QA information and engineering diagnostics must not become part of customer/owner dashboard design or plans.

6. Higher-Tier Dashboard Principle

Higher plans should feel more tactical and elevated, not simply more crowded.

Higher-tier users should receive:

better executive summaries
stronger visual intelligence
more strategic interpretation
clearer priorities
access to deeper information when required

The principle is:

Show more intelligence, not merely more data.

Users click a chart, window, indicator or button to reveal the underlying information when needed.

7. Navigation & Duplication Rule

The left navigation panel is the gateway to deeper information.

The central dashboard should not duplicate the sidebar's information architecture.

Use the dashboard to show:

what matters now
what has changed
what requires attention
where the user should go next

Use navigation/workspaces to provide:

full records
detailed operational information
management tools
deeper investigation.
8. Visual Design Direction

The dashboard should feel:

Sophisticated · Spacious · Modern · Calm · Executive · Data-driven · Trustworthy

Visual direction:

TrustLedger branding
restrained green/blue/white/grey palette
strong typography
generous whitespace
clear visual hierarchy
prominent charts
elegant, purposeful cards/panels
minimal visual noise

Avoid:

dozens of tiny KPI cards
cramped tables
excessive borders
repetitive information
giant headings
dashboard clutter
generic “AI SaaS” aesthetics
decorative elements without informational value.
9. Personalisation

The dashboard must recognise the currently logged-in user dynamically.

Example:

Good morning, Thozamile

The name must come from the authenticated user context — never hard-coded.

The same principle applies to organisation, plan and role information.

10. Engineering Boundaries

RPT-04 should reuse existing TrustLedger architecture and components where appropriate, rather than creating unnecessary parallel systems.

Do not use the redesign to introduce:

predictive AI
autonomous AI
new intelligence architecture
new scoring methodology
public sharing
new tenancy architecture
unrelated refactoring
changes to srm-core.

The redesign is primarily a presentation, information architecture and interaction improvement.

Success criterion

When the redesigned dashboard opens, the user should immediately understand:

What is happening with TrustLedger → what it means → what needs attention → where to go next.