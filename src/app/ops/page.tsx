import Link from "next/link";
import { buildOpsOverview } from "@/lib/opsIntel";

export const dynamic = "force-dynamic";

export default async function OpsOverviewPage() {
  const data = await buildOpsOverview();
  const sources = Object.entries(data.intake.bySource).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command centre</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-tl-ink">
          Platform overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Cross-platform pulse for analysis and action. CRM remains the system
          of record for individual leads — this view aggregates what you need
          to run TrustLedger.
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
        <Kpi label="Recent intake (100)" value={String(data.intake.totalRecent)} />
        <Kpi
          label="Feedback rated"
          value={String(data.intake.feedbackRated)}
          hint={
            data.intake.feedbackAvgRating != null
              ? `Avg ${data.intake.feedbackAvgRating}/5`
              : undefined
          }
        />
        <Kpi
          label="Weak experience (≤2)"
          value={String(data.intake.weakFeedback)}
          tone={data.intake.weakFeedback > 0 ? "attention" : "default"}
        />
        <Kpi
          label="Assessments in window"
          value={String(data.intake.assessmentLeads)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
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
          <Link
            href="/status"
            className="mt-3 inline-block text-xs font-medium text-tl-trust-ink underline"
          >
            Open status page
          </Link>
        </div>

        <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="font-display text-lg font-semibold">Intake by source</h2>
          {sources.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {sources.map(([source, count]) => (
                <li key={source} className="flex justify-between gap-3">
                  <span>{source}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-tl-ink-muted">No recent CRM leads.</p>
          )}
          <p className="mt-3 text-xs text-tl-ink-muted">
            Contacts in window: {data.intake.contactLeads}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Latest visitor signals
          </h2>
          <Link
            href="/ops/reports"
            className="text-xs font-medium text-tl-trust-ink underline"
          >
            Full reports
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Signal</th>
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tl-line">
              {data.intake.recent.map((row) => (
                <tr key={row.name}>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium">{row.lead_name || row.name}</p>
                    <p className="text-xs text-tl-ink-muted">{row.email}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-tl-ink-muted">
                    {row.job_title || "—"}
                  </td>
                  <td className="py-2.5 pr-3">{row.source || "—"}</td>
                  <td className="py-2.5 pr-3">{row.status || "—"}</td>
                  <td className="py-2.5 text-xs text-tl-ink-muted">
                    {row.modified
                      ? new Date(row.modified).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
              {!data.intake.recent.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-tl-ink-muted">
                    No rows yet — submit a demo/contact/feedback lead to see
                    signals.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ActionCard
          title="Reports"
          body="Pull slices of intake, feedback, and readiness for analysis."
          href="/ops/reports"
        />
        <ActionCard
          title="Accounts"
          body="Client plans, seats, and access controls (rolling out)."
          href="/ops/accounts"
        />
        <ActionCard
          title="Cloud CRM"
          body="Open TrustLedger Cloud for full lead records and comments."
          href="https://app.trustledger.co.za"
          external
        />
      </section>
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
  external,
}: {
  title: string;
  body: string;
  href: string;
  external?: boolean;
}) {
  const className =
    "block rounded-lg border border-tl-line bg-tl-surface p-4 hover:border-tl-trust/40";
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-tl-ink-muted">{body}</p>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-tl-ink-muted">{body}</p>
    </Link>
  );
}
