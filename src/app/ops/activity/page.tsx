import Link from "next/link";
import { activityLabel, buildOpsOverview, type OpsActivityKind } from "@/lib/opsIntel";

export const dynamic = "force-dynamic";

const FILTERS: Array<OpsActivityKind | "all"> = [
  "all",
  "demo",
  "assessment",
  "feedback",
  "contact",
  "support",
  "other",
];

type PageProps = {
  searchParams?: Promise<{ type?: string }>;
};

export default async function OpsActivityPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const typeRaw = (params.type || "all").toLowerCase();
  const type = (
    FILTERS.includes(typeRaw as OpsActivityKind | "all") ? typeRaw : "all"
  ) as OpsActivityKind | "all";

  const data = await buildOpsOverview();
  const rows =
    type === "all"
      ? data.intake.recent
      : data.intake.recent.filter((r) => r.activity === type);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command centre</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Client activity
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Platform-wide visitor and client signals only — demos, readiness,
          feedback, enquiries, support. Not project or incident workloads.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((key) => {
          const href = key === "all" ? "/ops/activity" : `/ops/activity?type=${key}`;
          const active = type === key;
          const label =
            key === "all" ? "All" : activityLabel(key as OpsActivityKind);
          return (
            <Link
              key={key}
              href={href}
              className={
                active
                  ? "rounded-md bg-tl-trust px-3 py-1.5 font-medium text-white"
                  : "rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 hover:bg-tl-paper"
              }
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Intent / readiness</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tl-line">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 text-xs text-tl-ink-muted">
                  {row.modified
                    ? new Date(row.modified).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.lead_name || row.name}</p>
                  <p className="text-xs text-tl-ink-muted">
                    {[row.email, row.organization].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-3">{activityLabel(row.activity)}</td>
                <td className="px-4 py-3 text-tl-ink-muted">
                  {row.readiness
                    ? `Readiness: ${row.readiness}`
                    : row.rating != null
                      ? `Rating ${row.rating}/5 · ${row.intent}`
                      : row.intent}
                </td>
                <td className="px-4 py-3">{row.source || "—"}</td>
                <td className="px-4 py-3">{row.status || "—"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-tl-ink-muted">
                  No rows for this filter.
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
      </p>
    </div>
  );
}
