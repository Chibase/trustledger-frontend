import Link from "next/link";
import { PillarBanner } from "@/components/ops/PillarBanner";
import { buildStaffOverview } from "@/lib/commandCentreIntel";

export const dynamic = "force-dynamic";

export default function OpsStaffPage() {
  const data = buildStaffOverview();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command control</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Staff</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Capacity, performance signals, and capability gaps for the platform
          team — separate from customer org seats.
        </p>
      </header>

      <PillarBanner status={data.status}>
        Staff control is scaffolded for hiring readiness. Live HR metrics are
        not connected yet.
      </PillarBanner>

      <section className="grid gap-6 lg:grid-cols-3">
        <SignalPanel title="Capacity" rows={data.capacity} />
        <SignalPanel title="Performance" rows={data.performance} />
        <SignalPanel title="Capability gaps" rows={data.capabilityGaps} />
      </section>

      <section className="rounded-lg border border-dashed border-tl-amber/50 bg-tl-amber/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-tl-amber">
          Deferred — later implementation
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold">
          {data.wellbeing.headline}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          {data.wellbeing.note}
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-tl-ink-muted sm:grid-cols-3">
          {[
            "Workload / burnout flags",
            "Check-in cadence",
            "Support & leave pressure",
          ].map((item) => (
            <li
              key={item}
              className="rounded-md border border-tl-line/80 bg-tl-surface px-3 py-2"
            >
              {item}
              <span className="mt-1 block text-[11px] uppercase tracking-wide text-tl-amber">
                Placeholder
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link
          href="/ops/executive"
          className="font-medium text-tl-trust-ink underline"
        >
          Back to Executive Board
        </Link>
      </p>
    </div>
  );
}

function SignalPanel({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; state: string; note: string }[];
}) {
  return (
    <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="border-b border-tl-line pb-3 last:border-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{row.label}</span>
              <span className="text-xs text-tl-ink-muted">{row.state}</span>
            </div>
            <p className="mt-1 text-tl-ink-muted">{row.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
