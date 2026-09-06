import Link from "next/link";
import {
  countOrDash,
  formatDayBlock,
  formatRelativeDeskTime,
  type OverviewActivity,
  type ProjectHealthMix,
  type SocialImpactTotals,
  type UpcomingEngagement,
} from "@/lib/executiveOverview";

export function ExecutiveWelcome({
  firstName,
  periodLabel,
}: {
  firstName: string | null;
  periodLabel: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="max-w-xl text-sm text-tl-ink-muted">
          Here is what is on file for your projects and stakeholders.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <p className="max-w-xs text-sm italic text-tl-ink-muted">
          Resolution you can audit.
        </p>
        <p className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-xs font-medium text-tl-ink">
          {periodLabel}
        </p>
      </div>
    </header>
  );
}

export function SocialImpactStrip({
  impact,
}: {
  impact: SocialImpactTotals;
}) {
  const items = [
    { label: "Local hire (actual)", value: impact.localHireActual },
    { label: "Local suppliers", value: impact.localSuppliers },
    { label: "CSI programmes", value: impact.csiProgrammes },
    { label: "Training days", value: impact.trainingDays },
  ];
  return (
    <section className="rounded-xl border border-tl-line bg-tl-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-tl-ink">Social impact</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        From Capture packs on file — not a last-period estimate.
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
              {item.label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-tl-ink">
              {countOrDash(item.value)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProjectHealthBars({ mix }: { mix: ProjectHealthMix }) {
  const rows = [
    {
      label: "On track",
      value: mix.onTrack,
      className: "bg-tl-trust",
    },
    {
      label: "At risk",
      value: mix.atRisk,
      className: "bg-tl-amber",
    },
    {
      label: "Delayed",
      value: mix.delayed,
      className: "bg-tl-danger",
    },
  ];
  const max = Math.max(1, mix.total);
  return (
    <section className="rounded-xl border border-tl-line bg-tl-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-tl-ink">Project health</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Open delivery only. Delayed = target end date has passed.
      </p>
      {mix.total === 0 ? (
        <p className="mt-3 text-sm text-tl-ink-muted">No open projects on file.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => {
            const pct = Math.round((row.value / max) * 100);
            return (
              <li key={row.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-tl-ink">{row.label}</span>
                  <span className="tabular-nums text-tl-ink-muted">
                    {row.value} ({pct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-tl-paper">
                  <div
                    className={`h-full rounded-full ${row.className}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const KIND_LABEL: Record<OverviewActivity["kind"], string> = {
  engagement: "Engagement",
  grievance: "Case",
  capture: "Capture",
};

export function OverviewActivityFeed({
  rows,
}: {
  rows: OverviewActivity[];
}) {
  return (
    <section className="rounded-xl border border-tl-line bg-tl-surface p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-tl-ink">Recent activity</h2>
        <Link
          href="/app/incidents"
          className="text-xs font-medium text-tl-trust-ink hover:underline"
        >
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-tl-ink-muted">
          No activity on file yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-tl-line">
          {rows.map((row) => (
            <li key={row.id} className="py-2.5 first:pt-0 last:pb-0">
              <Link href={row.href} className="block hover:bg-tl-paper">
                <p className="text-sm font-medium text-tl-ink">{row.title}</p>
                <p className="mt-0.5 flex flex-wrap gap-2 text-xs text-tl-ink-muted">
                  <span>{formatRelativeDeskTime(row.at)}</span>
                  <span className="rounded-md border border-tl-line px-1.5 py-0.5 text-tl-ink">
                    {KIND_LABEL[row.kind]}
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function UpcomingEngagementsCard({
  rows,
}: {
  rows: UpcomingEngagement[];
}) {
  return (
    <section className="rounded-xl border border-tl-line bg-tl-surface p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-tl-ink">Upcoming engagements</h2>
        <Link
          href="/app/engagements"
          className="text-xs font-medium text-tl-trust-ink hover:underline"
        >
          View calendar
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-tl-ink-muted">
          No upcoming engagements on file.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => {
            const block = formatDayBlock(row.heldOn);
            return (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex gap-3 rounded-md hover:bg-tl-paper"
                >
                  <span className="w-12 shrink-0 text-center">
                    <span className="block text-lg font-semibold tabular-nums text-tl-ink">
                      {block.day}
                    </span>
                    <span className="block text-[0.65rem] font-medium uppercase tracking-wide text-tl-ink-muted">
                      {block.month}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-tl-ink">
                      {row.title}
                    </span>
                    <span className="block text-xs text-tl-ink-muted">
                      {row.place}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function ProjectPlacesCard({ places }: { places: string[] }) {
  return (
    <section className="rounded-xl border border-tl-line bg-tl-surface p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-tl-ink">Project places</h2>
        <Link
          href="/app/geo"
          className="text-xs font-medium text-tl-trust-ink hover:underline"
        >
          View map
        </Link>
      </div>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Wards and municipalities on file. This is not a GIS map.
      </p>
      {places.length === 0 ? (
        <p className="mt-3 text-sm text-tl-ink-muted">
          No places on projects yet.
        </p>
      ) : (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-tl-ink">
          {places.map((place) => (
            <li key={place}>{place}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
