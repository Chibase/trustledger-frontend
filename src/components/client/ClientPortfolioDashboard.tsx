import Link from "next/link";
import { IncidentTable } from "@/components/ui/IncidentTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import type { ClientPortfolioBrief } from "@/lib/clientPortfolioIntel";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type ClientPortfolioDashboardProps = {
  brief: ClientPortfolioBrief;
};

/** Client home — mirrors backend domains: portfolio, risk, CRM, geo. */
export function ClientPortfolioDashboard({
  brief,
}: ClientPortfolioDashboardProps) {
  const { kpis } = brief;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Client workspace"
        title="Governance portfolio"
        description={`${brief.dataSourceNote} Dashboards and reports use the same project, grievance, stakeholder, and geography services as the Frappe contract.`}
        actions={
          <>
            <Link
              href="/app/reports"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Governance reports
            </Link>
            <Link
              href="/app/stakeholders"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Stakeholder CRM
            </Link>
          </>
        }
      />

      <p className="text-xs text-tl-ink-muted">
        Mode: <span className="font-medium capitalize">{brief.dataMode}</span> ·
        Generated {new Date(brief.generatedAt).toLocaleString()}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects" value={String(kpis.projects)} />
        <KpiCard
          label="Active projects"
          value={String(kpis.activeProjects)}
          tone="trust"
        />
        <KpiCard label="Budget" value={currency.format(kpis.budgetTotal)} />
        <KpiCard label="Spent" value={currency.format(kpis.budgetSpent)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open grievances"
          value={String(kpis.openIncidents)}
          tone={kpis.openIncidents > 0 ? "attention" : "default"}
        />
        <KpiCard
          label="High priority"
          value={String(kpis.highPriority)}
          tone={kpis.highPriority > 0 ? "attention" : "default"}
        />
        <KpiCard
          label="SLA breaches"
          value={String(kpis.slaBreaches)}
          tone={kpis.slaBreaches > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Stakeholders (CRM)"
          value={String(kpis.stakeholders)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Provinces (pack)" value={String(kpis.provinces)} />
        <KpiCard label="Wards (pack)" value={String(kpis.wards)} />
        <KpiCard
          label="Traditional councils"
          value={String(kpis.traditionalCouncils)}
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-tl-ink">
            Open high-priority grievances
          </h2>
          <Link
            href="/app/incidents"
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            All incidents
          </Link>
        </div>
        <IncidentTable
          incidents={brief.openRisk}
          emptyLabel="No open high-priority grievances."
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-tl-ink">
              Portfolio projects
            </h2>
            <Link
              href="/app/projects"
              className="text-xs font-medium text-tl-trust-ink hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-tl-line">
            {brief.projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <Link
                    href={`/app/projects/${p.id}`}
                    className="font-medium text-tl-ink hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-tl-ink-muted">
                    {p.ward} · {p.clientFunder}
                  </p>
                </div>
                <ProjectStatusChip status={p.status} />
              </li>
            ))}
            {brief.projects.length === 0 ? (
              <li className="py-4 text-sm text-tl-ink-muted">
                No projects in this workspace yet.
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-tl-ink">
              Stakeholder CRM mix
            </h2>
            <Link
              href="/app/stakeholders"
              className="text-xs font-medium text-tl-trust-ink hover:underline"
            >
              Open CRM
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {brief.stakeholdersByKind.map((row) => (
              <li key={row.kind} className="flex justify-between gap-3">
                <span className="text-tl-ink">{row.label}</span>
                <span className="font-medium text-tl-ink">{row.count}</span>
              </li>
            ))}
            {brief.stakeholdersByKind.length === 0 ? (
              <li className="text-tl-ink-muted">No stakeholders loaded.</li>
            ) : null}
          </ul>
          <h3 className="mt-4 text-sm font-semibold text-tl-ink">
            High-influence contacts
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            {brief.highInfluence.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app/stakeholders/${s.id}`}
                  className="font-medium text-tl-trust-ink hover:underline"
                >
                  {s.name}
                </Link>
                <span className="text-tl-ink-muted">
                  {" "}
                  · {s.kind.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-tl-ink-muted">
            <Link href="/app/geo" className="text-tl-trust-ink underline">
              Browse geography pack
            </Link>{" "}
            — same place ids used on stakeholder and case records.
          </p>
        </section>
      </div>
    </div>
  );
}
