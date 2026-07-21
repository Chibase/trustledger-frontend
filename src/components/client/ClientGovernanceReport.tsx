import Link from "next/link";
import { ReportBriefAssist } from "@/components/ai/ReportBriefAssist";
import { PrintReportButton } from "@/components/client/PrintReportButton";
import { IncidentTable } from "@/components/ui/IncidentTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { TrustPulse } from "@/components/trust/TrustPulse";
import type { ClientPortfolioBrief } from "@/lib/clientPortfolioIntel";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type ClientGovernanceReportProps = {
  brief: ClientPortfolioBrief;
};

/** Client reports — board-ready pack from the same backend-shaped services. */
export function ClientGovernanceReport({ brief }: ClientGovernanceReportProps) {
  const { kpis, trust } = brief;

  return (
    <div className="space-y-8 print:space-y-6">
      <header className="border-b border-tl-line pb-6">
        <p className="text-sm font-medium text-tl-trust">Governance report</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-tl-ink">
          Portfolio trust brief
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          {brief.dataSourceNote}
        </p>
        <p className="mt-2 text-xs text-tl-ink-muted">
          As of {new Date(brief.generatedAt).toLocaleString()} · Mode{" "}
          {brief.dataMode}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <Link
            href="/app/dashboard"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
          >
            Dashboard
          </Link>
          <PrintReportButton />
        </div>
      </header>

      <TrustPulse
        incidents={brief.incidents}
        levelLabel="Client portfolio"
        avgTatHours={trust.avgTatHours}
        openOverTarget={trust.openOverTarget}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects" value={String(kpis.projects)} />
        <KpiCard label="Open grievances" value={String(kpis.openIncidents)} />
        <KpiCard
          label="SLA breaches"
          value={String(kpis.slaBreaches)}
          tone={kpis.slaBreaches > 0 ? "danger" : "default"}
        />
        <KpiCard label="CRM stakeholders" value={String(kpis.stakeholders)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Budget" value={currency.format(kpis.budgetTotal)} />
        <KpiCard label="Spent" value={currency.format(kpis.budgetSpent)} />
        <KpiCard
          label="High priority"
          value={String(kpis.highPriority)}
          tone={kpis.highPriority > 0 ? "attention" : "default"}
        />
        <KpiCard
          label="High-influence CRM"
          value={String(kpis.highInfluenceStakeholders)}
        />
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h2 className="text-base font-semibold text-tl-ink">Talking points</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-tl-ink-muted">
          {brief.talkingPoints.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-tl-ink">
          Risk register — high priority open
        </h2>
        <IncidentTable
          incidents={brief.openRisk}
          emptyLabel="No high-priority open grievances."
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="text-base font-semibold text-tl-ink">
            Stakeholder composition
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {brief.stakeholdersByKind.map((row) => (
              <li key={row.kind} className="flex justify-between gap-3">
                <span>{row.label}</span>
                <span className="font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <h2 className="text-base font-semibold text-tl-ink">
            High-influence stakeholders
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {brief.highInfluence.map((s) => (
              <li key={s.id}>
                <span className="font-medium text-tl-ink">{s.name}</span>
                <span className="text-tl-ink-muted">
                  {" "}
                  · {s.kind.replaceAll("_", " ")}
                  {s.placeId ? ` · ${s.placeId}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="print:hidden">
        <h2 className="text-base font-semibold text-tl-ink">
          AI governance brief (suggest → review)
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Uses the same incident set as this report. Apply only after human
          review.
        </p>
        <div className="mt-4">
          <ReportBriefAssist />
        </div>
      </section>
    </div>
  );
}
