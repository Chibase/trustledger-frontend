import Link from "next/link";
import { activityLabel, buildOpsOverview, type OpsActivityKind } from "@/lib/opsIntel";
import { filterOpsActivityRows } from "@/lib/opsReports";

export const dynamic = "force-dynamic";

const FILTERS: Array<OpsActivityKind | "all"> = [
  "all",
  "demo",
  "assessment",
  "feedback",
  "contact",
  "quote",
  "support",
  "other",
];

type PageProps = {
  searchParams?: Promise<{ type?: string; source?: string; q?: string }>;
};

export default async function OpsReportsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const typeRaw = (params.type || "all").toLowerCase();
  const type = (
    FILTERS.includes(typeRaw as OpsActivityKind | "all") ? typeRaw : "all"
  ) as OpsActivityKind | "all";
  const source = (params.source || "").trim();
  const q = (params.q || "").trim();

  const data = await buildOpsOverview();
  const rows = filterOpsActivityRows(data.intake.recent, {
    activity: type,
    source,
    q,
  });
  const sources = Object.keys(data.intake.bySource).sort();
  const csvHref = `/api/ops/reports.csv?type=${encodeURIComponent(type)}${
    source ? `&source=${encodeURIComponent(source)}` : ""
  }${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command centre</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Reports</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Filterable intake, feedback, readiness, quote, and support signals
          with CSV export. Not project or issue reports. Support slice is the
          23d pack: export tickets for a person or organisation.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-2 text-sm" method="get">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-tl-ink-muted">
            Activity
          </span>
          <select
            name="type"
            defaultValue={type}
            className="rounded-md border border-tl-line bg-tl-surface px-2 py-1.5"
          >
            {FILTERS.map((key) => (
              <option key={key} value={key}>
                {key === "all" ? "All" : activityLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-tl-ink-muted">
            Source
          </span>
          <select
            name="source"
            defaultValue={source}
            className="rounded-md border border-tl-line bg-tl-surface px-2 py-1.5"
          >
            <option value="">All sources</option>
            {sources.map((name) => (
              <option key={name} value={name}>
                {name} ({data.intake.bySource[name]})
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-tl-ink-muted">
            Search
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Name, email, organisation"
            className="rounded-md border border-tl-line bg-tl-surface px-2 py-1.5"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-tl-trust px-3 py-1.5 text-xs font-semibold text-white hover:bg-tl-trust-ink"
        >
          Apply
        </button>
        <a
          href={csvHref}
          className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-semibold text-tl-ink hover:bg-tl-paper"
        >
          Download CSV
        </a>
      </form>

      {!data.ok ? (
        <p className="rounded-md border border-tl-amber/40 bg-tl-amber/10 px-3 py-2 text-sm text-tl-ink">
          {data.detail || "Some intel could not be loaded."}
        </p>
      ) : null}

      <p className="text-xs text-tl-ink-muted">
        Showing {rows.length} of {data.intake.recent.length} recent CRM Lead
        rows.
      </p>

      <div className="overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Intent</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tl-line">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-2.5 text-xs text-tl-ink-muted">
                  {row.modified ? new Date(row.modified).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-medium">{row.lead_name || row.name}</p>
                  <p className="text-xs text-tl-ink-muted">
                    {[row.email, row.organization].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-2.5">{activityLabel(row.activity)}</td>
                <td className="px-4 py-2.5 text-tl-ink-muted">
                  {row.readiness
                    ? `Readiness: ${row.readiness}`
                    : row.rating != null
                      ? `Rating ${row.rating}/5`
                      : row.intent}
                </td>
                <td className="px-4 py-2.5">{row.source || "—"}</td>
                <td className="px-4 py-2.5">{row.status || "—"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-tl-ink-muted">
                  No matching activity.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-sm">
        <Link href="/ops" className="font-medium text-tl-trust-ink underline">
          Back to overview
        </Link>
        {" · "}
        <Link
          href="/ops/activity"
          className="font-medium text-tl-trust-ink underline"
        >
          Activity feed
        </Link>
      </p>
    </div>
  );
}
