import Link from "next/link";

/**
 * Operator entry to the Engagement plan desk (not a commercial plan module).
 * /ops/executive is the C-suite home — this card is the findable module, not TEDS row 4.
 */
export function OpsEngagementPlanPanel() {
  return (
    <section
      id="engagement-plans"
      aria-labelledby="ops-sep-heading"
      className="rounded-lg border border-tl-trust/30 bg-tl-paper p-4 print:break-inside-avoid"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Stakeholder Intelligence
          </p>
          <h2
            id="ops-sep-heading"
            className="mt-1 font-display text-lg font-semibold text-tl-ink"
          >
            Stakeholder engagement plan
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Map an RFP, tender, or briefing from inception to close-out. Output
            is a process dashboard plus a presentable SEP. After approval, a
            human applies the suggestion to the SRM (registry, engagements,
            commitments). This composer is **operator-desk only** until it
            matches the product vision — it is not on commercial plans.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link
            href="/app/engagement-plan"
            className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Open engagement plan
          </Link>
          <Link
            href="/app/engagement-plan/new"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            New from briefing
          </Link>
        </div>
      </div>
    </section>
  );
}
