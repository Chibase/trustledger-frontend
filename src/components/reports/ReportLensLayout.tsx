"use client";

import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { KpiCard } from "@/components/ui/KpiCard";
import type { ExecutiveRiskRow, FunderSnapshot, LensChartGroup } from "@/lib/reportLenses";

function ChartGroupGrid({ groups }: { groups: LensChartGroup[] }) {
  if (!groups.length) {
    return (
      <p className="text-sm text-tl-ink-muted">
        No chart values for this pack yet — capture cases or category data, then
        reopen.
      </p>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {groups.map((group) => (
        <figure
          key={group.caption}
          className="rounded-lg border border-tl-line bg-tl-surface p-4 print:break-inside-avoid"
        >
          <figcaption className="mb-3 text-sm font-medium text-tl-ink-muted">
            {group.caption}
          </figcaption>
          {group.orientation === "vertical" ? (
            <VerticalBarChart bars={group.bars} />
          ) : (
            <HorizontalBarChart bars={group.bars} maxHeight={220} />
          )}
        </figure>
      ))}
    </div>
  );
}

const IMPACT_TONE: Record<ExecutiveRiskRow["impactLevel"], string> = {
  Critical: "text-tl-danger",
  High: "text-tl-amber",
  Medium: "text-tl-ink",
  Low: "text-tl-ink-muted",
};

export function ExecutiveRiskRegister({
  rows,
  emptyLabel = "No open issues in this scope.",
}: {
  rows: ExecutiveRiskRow[];
  emptyLabel?: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-tl-ink-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-lg border border-tl-line bg-tl-surface p-4 print:break-inside-avoid"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-display text-base font-semibold text-tl-ink">
              {row.id} — {row.issue}
            </h4>
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${IMPACT_TONE[row.impactLevel]}`}
            >
              {row.impactLevel}
            </span>
          </div>
          <p className="mt-1 text-xs text-tl-ink-muted">
            {row.projectName} · {row.impactLevelDetail}
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-tl-ink">Project impact</dt>
              <dd className="text-tl-ink-muted">{row.projectImpact}</dd>
            </div>
            <div>
              <dt className="font-medium text-tl-ink">Mitigation in progress</dt>
              <dd className="text-tl-ink-muted">{row.mitigation}</dd>
            </div>
            <div>
              <dt className="font-medium text-tl-ink">Mitigation process</dt>
              <dd className="text-tl-ink-muted">{row.processStage}</dd>
            </div>
            <div>
              <dt className="font-medium text-tl-ink">Expected outcome</dt>
              <dd className="text-tl-ink-muted">{row.expectedOutcome}</dd>
            </div>
          </dl>
          {row.executiveAction ? (
            <p className="mt-3 rounded-md border border-tl-amber/40 bg-tl-amber/10 px-3 py-2 text-sm text-tl-ink">
              <span className="font-medium">Executive action: </span>
              {row.executiveAction}
            </p>
          ) : (
            <p className="mt-3 text-xs text-tl-ink-muted">
              No executive action required this cycle.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ExecutiveRiskLayout({
  rows,
  trustIndex,
  trustLabel,
  chartGroups,
  showCharts,
  showDetails,
  bodyMarkdown,
}: {
  rows: ExecutiveRiskRow[];
  trustIndex: number;
  trustLabel?: string;
  chartGroups: LensChartGroup[];
  showCharts: boolean;
  showDetails: boolean;
  bodyMarkdown?: string;
}) {
  const asks = rows.filter((r) => r.executiveAction);
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Identified issues"
          value={String(rows.length)}
          tone={rows.length > 0 ? "attention" : "default"}
        />
        <KpiCard
          label="Need executive action"
          value={String(asks.length)}
          tone={asks.length > 0 ? "attention" : "default"}
        />
        <KpiCard
          label={trustLabel ? `Trust · ${trustLabel}` : "Portfolio trust"}
          value={`${trustIndex}`}
        />
      </div>
      {showCharts ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-tl-ink">
            Impact and process
          </h3>
          <ChartGroupGrid groups={chartGroups} />
        </section>
      ) : null}
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-tl-ink">
          Identified issues — impact, mitigation, expected outcome
        </h3>
        <ExecutiveRiskRegister rows={rows} />
      </section>
      {asks.length ? (
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h3 className="text-sm font-semibold text-tl-ink">
            What executives can expedite
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-tl-ink">
            {asks.map((r) => (
              <li key={r.id}>
                <span className="font-medium">{r.id}:</span> {r.executiveAction}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {showDetails && bodyMarkdown?.trim() ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-tl-ink">
            Brief (narrative)
          </h3>
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-base leading-relaxed text-tl-ink sm:prose-base">
            {bodyMarkdown}
          </article>
        </section>
      ) : null}
    </div>
  );
}

export function FunderAssuranceLayout({
  snapshot,
  chartGroups,
  showCharts,
  showDetails,
  bodyMarkdown,
}: {
  snapshot: FunderSnapshot;
  chartGroups: LensChartGroup[];
  showCharts: boolean;
  showDetails: boolean;
  bodyMarkdown?: string;
}) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-tl-ink-muted">
        High-level client / funder assurance — not the monthly activity dump.
      </p>
      {showCharts ? (
        <div className="grid gap-4 md:grid-cols-2">
          <article className="flex min-h-[14rem] flex-col justify-between rounded-lg border border-tl-line bg-tl-surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
              Assurance position
            </p>
            <div>
              <p className="font-display text-3xl font-semibold text-tl-ink">
                Trust {snapshot.trustIndex}/100
              </p>
              <p className="mt-2 text-sm text-tl-ink-muted">
                {snapshot.trustLabel} · {snapshot.openCount} open ·{" "}
                {snapshot.closedCount} closed · {snapshot.highRiskCount}{" "}
                material high-risk
              </p>
            </div>
          </article>
          {chartGroups.map((group) => (
            <article
              key={group.caption}
              className="rounded-lg border border-tl-line bg-tl-surface p-6"
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                {group.caption}
              </p>
              {group.orientation === "vertical" ? (
                <VerticalBarChart bars={group.bars} />
              ) : (
                <HorizontalBarChart bars={group.bars} maxHeight={220} />
              )}
            </article>
          ))}
          <article className="rounded-lg border border-tl-line bg-tl-surface p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
              Material items
            </p>
            <ul className="space-y-2 text-sm text-tl-ink">
              {snapshot.materialItems.length === 0 ? (
                <li className="text-tl-ink-muted">
                  No material open items this period.
                </li>
              ) : (
                snapshot.materialItems.map((item) => (
                  <li key={item.id}>{item.line}</li>
                ))
              )}
            </ul>
          </article>
          <article className="rounded-lg border border-tl-line bg-tl-surface p-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
              What we are asking
            </p>
            <ul className="space-y-2 text-sm text-tl-ink">
              {snapshot.asks.map((ask) => (
                <li key={ask}>{ask}</li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}
      {showDetails && bodyMarkdown?.trim() ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-tl-ink">
            Funder brief
          </h3>
          <article className="prose prose-sm max-w-none whitespace-pre-wrap text-base leading-relaxed text-tl-ink sm:prose-base">
            {bodyMarkdown}
          </article>
        </section>
      ) : null}
    </div>
  );
}

export function MonthlyOpsLayout({
  chartGroups,
  showCharts,
  showDetails,
  bodyMarkdown,
}: {
  chartGroups: LensChartGroup[];
  showCharts: boolean;
  showDetails: boolean;
  bodyMarkdown?: string;
}) {
  return (
    <div className="space-y-8">
      {showCharts ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-tl-ink">
            Monthly operational charts
          </h3>
          <ChartGroupGrid groups={chartGroups} />
        </section>
      ) : null}
      {showDetails ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-tl-ink">
            Detailed monthly narrative
          </h3>
          {bodyMarkdown?.trim() ? (
            <article className="prose prose-sm max-w-none whitespace-pre-wrap text-base leading-relaxed text-tl-ink sm:prose-base">
              {bodyMarkdown}
            </article>
          ) : (
            <p className="text-sm text-tl-ink-muted">
              Details could not be composed — capture category data or cases,
              then reopen.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
