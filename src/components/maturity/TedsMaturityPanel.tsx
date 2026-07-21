import Link from "next/link";
import {
  buildTedsMaturityReport,
  maturityStatusLabel,
  type MaturityAudience,
  type MaturityStatus,
} from "@/lib/tedsMaturity";

function statusClass(status: MaturityStatus): string {
  switch (status) {
    case "live":
      return "bg-tl-trust/15 text-tl-trust-ink";
    case "seeded":
      return "bg-tl-trust/10 text-tl-trust-ink";
    case "partial":
      return "bg-tl-amber/15 text-tl-ink";
    case "not_started":
      return "bg-tl-danger/10 text-tl-danger";
    default:
      return "bg-tl-paper text-tl-ink-muted";
  }
}

type TedsMaturityPanelProps = {
  audience: MaturityAudience;
  /** compact = KPI + top gaps; full = full domain table */
  variant?: "compact" | "full";
  title?: string;
};

export function TedsMaturityPanel({
  audience,
  variant = "compact",
  title = "Blueprint maturity (TEDS)",
}: TedsMaturityPanelProps) {
  const report = buildTedsMaturityReport();
  const domains =
    audience === "public"
      ? report.domains.filter((d) =>
          ["geo", "stakeholders", "grievances", "reporting", "commercial"].includes(
            d.id,
          ),
        )
      : report.domains;

  return (
    <section
      className="rounded-lg border border-tl-line bg-tl-surface p-4 print:break-inside-avoid"
      aria-labelledby="teds-maturity-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Version {report.productVersion} → {report.nextVersion}
          </p>
          <h2
            id="teds-maturity-title"
            className="mt-1 font-display text-lg font-semibold text-tl-ink"
          >
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-tl-ink-muted">
            {report.summary}
          </p>
        </div>
        <div className="rounded-md border border-tl-line bg-tl-paper px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            MVP progress
          </p>
          <p className="font-display text-3xl font-semibold text-tl-ink">
            {report.mvpProgressPct}%
          </p>
        </div>
      </div>

      {variant === "compact" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-tl-ink">Priority next</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-tl-ink-muted">
              {report.priorityNext.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-tl-ink">Domain pulse</h3>
            <ul className="mt-2 space-y-1.5">
              {domains.slice(0, 6).map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-tl-ink">{d.tedsName}</span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusClass(d.status)}`}
                  >
                    {maturityStatusLabel(d.status)} · {d.score}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
                <th className="py-2 pr-3 font-semibold">TEDS domain</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold">Available now</th>
                <th className="py-2 font-semibold">Still needed</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} className="border-b border-tl-line align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-tl-ink">{d.tedsName}</p>
                    <p className="text-xs text-tl-ink-muted">{d.tedsChapter}</p>
                    {d.href ? (
                      <Link
                        href={d.href}
                        className="mt-1 inline-block text-xs text-tl-trust-ink underline"
                      >
                        Open
                      </Link>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusClass(d.status)}`}
                    >
                      {maturityStatusLabel(d.status)} · {d.score}%
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-tl-ink-muted">{d.availableNow}</td>
                  <td className="py-3 text-tl-ink-muted">
                    <ul className="list-disc space-y-0.5 pl-4">
                      {d.stillNeeded.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-tl-ink-muted">
        Source: TrustLedger Engineering Documentation Series (TEDS) Vol.1 vs
        product as of {new Date(report.generatedAt).toLocaleString()}. Detail:{" "}
        <span className="font-mono">docs/TEDS_MATURITY_REPORT.md</span>
      </p>
    </section>
  );
}
