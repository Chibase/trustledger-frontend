import Link from "next/link";
import { HorizontalBarChart } from "@/components/ops/charts/BarChart";
import { PillarBanner } from "@/components/ops/PillarBanner";
import { buildIssuesOverview } from "@/lib/commandCentreIntel";

export const dynamic = "force-dynamic";

export default async function OpsIssuesPage() {
  const data = await buildIssuesOverview();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command control</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Issues control
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Client-reported platform issues, resolution turnaround, and how
          clients feel after the activity — not customer project incidents.
        </p>
      </header>

      <PillarBanner status={data.status}>
        Support Ticket CRM signals are live where present. SLA clocks and
        post-resolve feeling still need workflow fields.
      </PillarBanner>

      <section className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Support signals" value={String(data.totalSupport)} />
        <Kpi label="Open (proxy)" value={String(data.openCount)} />
        <Kpi
          label="Avg age (open)"
          value={data.avgAgeHours != null ? `${data.avgAgeHours}h` : "—"}
          hint="Temporary proxy until resolve timestamps exist"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
          <h2 className="font-display text-lg font-semibold">By category</h2>
          <div className="mt-4">
            <HorizontalBarChart
              bars={
                data.byCategory.length
                  ? data.byCategory
                  : [{ label: "No tickets yet", value: 0 }]
              }
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              Turnaround time
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted">{data.tatNote}</p>
          </div>
          <div className="rounded-lg border border-dashed border-tl-amber/50 bg-tl-amber/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-tl-amber">
              Later — client feeling
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold">
              After resolution pulse
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted">{data.feelingNote}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <h2 className="font-display text-lg font-semibold">Recent issues</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">Who</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tl-line">
              {data.recent.map((row) => (
                <tr key={row.name}>
                  <td className="py-2.5 pr-3 text-xs text-tl-ink-muted">
                    {row.modified
                      ? new Date(row.modified).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium">{row.person}</p>
                    <p className="text-xs text-tl-ink-muted">
                      {row.organization || "—"}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3">{row.category}</td>
                  <td className="py-2.5 pr-3">{row.status}</td>
                  <td className="py-2.5">
                    {row.ageHours != null ? `${row.ageHours}h` : "—"}
                  </td>
                </tr>
              ))}
              {!data.recent.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-tl-ink-muted">
                    No support tickets in the latest CRM window.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-tl-line bg-tl-surface px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-tl-ink-muted">{hint}</p> : null}
    </div>
  );
}
