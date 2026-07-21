import Link from "next/link";
import { activityLabel, buildOpsOverview } from "@/lib/opsIntel";
import { TedsMaturityPanel } from "@/components/maturity/TedsMaturityPanel";

export const dynamic = "force-dynamic";

export default async function OpsOverviewPage() {
  const data = await buildOpsOverview();
  const activities = (
    Object.entries(data.intake.byActivity) as [keyof typeof data.intake.byActivity, number][]
  )
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command centre</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-tl-ink">
          Client & visitor activity
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          What people are doing on the platform — demos, assessments, feedback,
          contact, support. This is not the customer product desk (no projects
          or site issues).
        </p>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Generated {new Date(data.generatedAt).toLocaleString()}
        </p>
      </header>

      {!data.ok ? (
        <p className="rounded-md border border-tl-amber/40 bg-tl-amber/10 px-3 py-2 text-sm text-tl-ink">
          {data.detail || "Some intel could not be loaded."}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Activities (recent 100)" value={String(data.intake.totalRecent)} />
        <Kpi label="Demo interest" value={String(data.intake.demoLeads)} />
        <Kpi
          label="Assessments"
          value={String(data.intake.assessmentLeads)}
        />
        <Kpi
          label="Feedback / weak (≤2)"
          value={`${data.intake.feedbackRated} / ${data.intake.weakFeedback}`}
          hint={
            data.intake.feedbackAvgRating != null
              ? `Avg ${data.intake.feedbackAvgRating}/5`
              : undefined
          }
          tone={data.intake.weakFeedback > 0 ? "attention" : "default"}
        />
      </section>

      <TedsMaturityPanel
        audience="ops"
        variant="compact"
        title="Build status vs TEDS blueprint"
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="font-display text-lg font-semibold">
            Activity mix
          </h2>
          {activities.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {activities.map(([kind, count]) => (
                <li key={kind} className="flex justify-between gap-3">
                  <span>{activityLabel(kind)}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-tl-ink-muted">No activity yet.</p>
          )}
          <p className="mt-3 text-xs text-tl-ink-muted">
            Contact {data.intake.contactLeads} · Support{" "}
            {data.intake.supportTickets}
          </p>
        </div>

        <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="font-display text-lg font-semibold">Platform health</h2>
          {data.health ? (
            <ul className="mt-3 space-y-2 text-sm">
              {data.health.checks.map((c) => (
                <li key={c.label} className="flex justify-between gap-3">
                  <span>{c.label}</span>
                  <span
                    className={
                      c.ok ? "text-tl-trust-ink" : "font-medium text-tl-danger"
                    }
                  >
                    {c.ok ? "OK" : "Down"}
                    {c.ms != null ? ` · ${c.ms}ms` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-tl-ink-muted">Health unavailable.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Latest client activity
          </h2>
          <Link
            href="/ops/activity"
            className="text-xs font-medium text-tl-trust-ink underline"
          >
            Full activity feed
          </Link>
        </div>
        <ActivityTable rows={data.intake.recent.slice(0, 15)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ActionCard
          title="Client activity"
          body="Browse every visitor/client signal by type and readiness."
          href="/ops/activity"
        />
        <ActionCard
          title="Reports"
          body="Pull analysis slices for action or support packs."
          href="/ops/reports"
        />
        <ActionCard
          title="Accounts"
          body="Plan, seats, and access controls for paying clients."
          href="/ops/accounts"
        />
      </section>
    </div>
  );
}

function ActivityTable({
  rows,
}: {
  rows: Awaited<ReturnType<typeof buildOpsOverview>>["intake"]["recent"];
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
          <tr>
            <th className="py-2 pr-3 font-medium">When</th>
            <th className="py-2 pr-3 font-medium">Who</th>
            <th className="py-2 pr-3 font-medium">Activity</th>
            <th className="py-2 pr-3 font-medium">Intent / signal</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-tl-line">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="py-2.5 pr-3 text-xs text-tl-ink-muted">
                {row.modified
                  ? new Date(row.modified).toLocaleString()
                  : "—"}
              </td>
              <td className="py-2.5 pr-3">
                <p className="font-medium">{row.lead_name || row.name}</p>
                <p className="text-xs text-tl-ink-muted">
                  {[row.email, row.organization].filter(Boolean).join(" · ")}
                </p>
              </td>
              <td className="py-2.5 pr-3">{activityLabel(row.activity)}</td>
              <td className="py-2.5 pr-3 text-tl-ink-muted">
                {row.readiness
                  ? `Readiness: ${row.readiness}`
                  : row.rating != null
                    ? `Rating ${row.rating}/5`
                    : row.intent}
              </td>
              <td className="py-2.5">{row.status || "—"}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={5} className="py-6 text-tl-ink-muted">
                No client activity yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "attention";
}) {
  return (
    <div className="rounded-lg border border-tl-line bg-tl-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl font-semibold ${
          tone === "attention" ? "text-tl-amber" : "text-tl-ink"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-tl-ink-muted">{hint}</p> : null}
    </div>
  );
}

function ActionCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-tl-line bg-tl-surface p-4 hover:border-tl-trust/40"
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-tl-ink-muted">{body}</p>
    </Link>
  );
}
