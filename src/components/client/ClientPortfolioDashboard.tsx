import Link from "next/link";
import { IncidentTable } from "@/components/ui/IncidentTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeskWorkspacePanels } from "@/components/desk/DeskWorkspacePanels";
import { OverviewChartCard } from "@/components/dashboard/OverviewChartCard";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import {
  budgetMixBars,
  incidentPriorityBars,
  incidentStatusFunnel,
  namedShareBars,
  projectStatusBars,
} from "@/lib/dashboardOverview";
import type { ClientPortfolioBrief } from "@/lib/clientPortfolioIntel";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type ClientPortfolioDashboardProps = {
  brief: ClientPortfolioBrief;
};

/** Client home — overall graphs for the governance portfolio. */
export function ClientPortfolioDashboard({
  brief,
}: ClientPortfolioDashboardProps) {
  const { kpis } = brief;
  const budgetBars = budgetMixBars({
    budget: kpis.budgetTotal,
    spent: kpis.budgetSpent,
    available: Math.max(0, kpis.budgetTotal - kpis.budgetSpent),
  });
  const statusBars = projectStatusBars(brief.projects);
  const priorityBars = incidentPriorityBars(brief.incidents);
  const funnel = incidentStatusFunnel(brief.incidents);
  const mixBars = namedShareBars(
    brief.stakeholdersByKind.map((row) => ({
      label: row.label,
      count: row.count,
    })),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Workspace health"
        description={`${brief.dataSourceNote} Overall graphs for this portfolio.`}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects" value={String(kpis.projects)} />
        <KpiCard
          label="Open grievances"
          value={String(kpis.openIncidents)}
          tone={kpis.openIncidents > 0 ? "attention" : "default"}
        />
        <KpiCard
          label="SLA breaches"
          value={String(kpis.slaBreaches)}
          tone={kpis.slaBreaches > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Budget spent"
          value={currency.format(kpis.budgetSpent)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewChartCard title="Project status" hint="Portfolio mix">
          {statusBars.length ? (
            <VerticalBarChart bars={statusBars} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No projects yet.</p>
          )}
        </OverviewChartCard>
        <OverviewChartCard title="Case pipeline" hint="Open through closed">
          {brief.incidents.length ? (
            <FunnelChart steps={funnel} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No cases yet.</p>
          )}
        </OverviewChartCard>
        <OverviewChartCard title="Open cases by priority" hint="P1–P4">
          {priorityBars.length ? (
            <VerticalBarChart bars={priorityBars} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No open cases.</p>
          )}
        </OverviewChartCard>
        <OverviewChartCard title="Budget mix" hint="Budget, spent, available">
          {budgetBars.length ? (
            <HorizontalBarChart bars={budgetBars} maxHeight={160} />
          ) : mixBars.length ? (
            <HorizontalBarChart bars={mixBars} maxHeight={160} />
          ) : (
            <p className="text-sm text-tl-ink-muted">No budget figures yet.</p>
          )}
        </OverviewChartCard>
      </div>

      <DeskWorkspacePanels
        role="client"
        seedIncidents={brief.incidents}
        seedProjects={brief.projects}
        showProjectList={false}
        showGraphs={false}
      />

      <details className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-tl-ink">
          High-priority grievances
        </summary>
        <div className="mt-3">
          <IncidentTable
            incidents={brief.openRisk}
            emptyLabel="No open high-priority grievances."
          />
        </div>
      </details>
    </div>
  );
}
