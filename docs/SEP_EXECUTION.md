# SEP execution dashboard (plan-centric)

Operator/client view for a **single** Stakeholder Engagement Plan (`EngagementPlan.id`). Not a Paystack SKU. Not the executive portfolio.

## Assumptions

- Overlay is org-scoped in the browser (`tl-sep-execution`) until a Cloud DocType exists (ADR-053). No SQL. There is **no HTTP CRUD API** in this packet — `src/lib/sepExecutionDesk.ts` is the service contract (snapshot, timeline, analytics, platform sync). Flag this if a BFF is required before go-live persistence.
- In-plan filters (date range, task, milestone, severity, outcome kind) never query another `plan_id`.
- Linked commitments seed outcome events only for overdue / broken / fulfilled. Open or in-progress promises stay on the promise board and do not inflate hurdle counts.
- `plan_id` = engagement plan id. Linked SRM rows use `applied.*Ids` and `projectId`.
- Practitioner / Plan Owner (desk rank delivery and below, or org owner) can log outcomes and mitigations. Client / Board / CEO see snapshot + charts read-only.
- Gemini still drafts the presentable document only. Activity reports stay on `reportComposer`.

## KPIs (`src/lib/sepKpis.ts`)

| Metric | Formula |
| --- | --- |
| Task completion ratio | done tasks / tasks |
| Milestone on-time rate | completed on or before due / due-or-done milestones |
| Goal attainment | 0.6 × task ratio + 0.4 × on-time rate |
| Failure/reopen ratio | open failures / failures |
| Hurdle resolution days | mean (resolvedOn − occurredOn) for closed hurdles |
| Mitigation success rate | done / (done + ineffective) |
| Schedule variance | worst days late vs milestone due |
| Completion confidence | 0.35×goal + 0.20×on-time + 0.20×tasks + 0.15×mitigation − 0.10×reopen − min(15, variance days), clamped 0–100 |

## Rollout checklist

1. Merge with green `npm run build` and `npm run test:audit`.
2. Open an existing plan → Plan dashboard (first open backfills).
3. Practitioner: log a hurdle + intervention; confirm audit row in overlay.
4. Switch desk to Client/Board: snapshot visible, Save event hidden.
5. Confirm other desks (incidents, engagements) unchanged.
6. Cloud DocType persistence is a later packet — do not promise live Frappe write for this overlay.

## Blockers

- None for trial/browser workspaces.
- Live Cloud will not persist the overlay until a DocType + BFF exists.
