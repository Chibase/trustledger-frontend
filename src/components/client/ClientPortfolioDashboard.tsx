import Link from "next/link";
import { IncidentTable } from "@/components/ui/IncidentTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeskWorkspacePanels } from "@/components/desk/DeskWorkspacePanels";
import { OverviewChartCard } from "@/components/dashboard/OverviewChartCard";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardRecentCases } from "@/components/dashboard/DashboardRecentCases";
import { SrmDashboardFrame } from "@/components/dashboard/SrmDashboardFrame";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { DonutChart } from "@/components/ops/charts/DonutChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import {
  budgetMixBars,
  incidentPriorityBars,
  incidentStatusFunnel,
  namedShareBars,
  positiveShares,
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
  const mixSlices = positiveShares(statusBars).length
    ? positiveShares(statusBars)
    : positiveShares(funnel);

  return (
    <SrmDashboardFrame
      header={
        <PageHeader
          eyebrow="Overview"
          title="Workspace health"
          description={`${brief.dataSourceNote} Track cases · Monitor progress · Improve outcomes.`}
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
      }
      kpis={
        <>
          <KpiCard
            label="Projects"
            value={String(kpis.projects)}
            hint="On file"
            wash="trust"
          />
          <KpiCard
            label="Open grievances"
            value={String(kpis.openIncidents)}
            hint="On file"
            wash="amber"
            tone={kpis.openIncidents > 0 ? "attention" : "default"}
          />
          <KpiCard
            label="SLA breaches"
            value={String(kpis.slaBreaches)}
            hint="On file"
            wash="paper"
            tone={kpis.slaBreaches > 0 ? "danger" : "default"}
          />
          <KpiCard
            label="Budget spent"
            value={currency.format(kpis.budgetSpent)}
            hint="On file"
            wash="demo"
          />
        </>
      }
      recent={
        <DashboardRecentCases
          incidents={brief.incidents}
          empty="No cases on file yet."
        />
      }
      sidebar={
        <>
          <OverviewChartCard title="Portfolio mix" hint="Status">
            <DonutChart
              slices={mixSlices}
              centerLabel="Total"
              empty="No mix on file yet."
            />
          </OverviewChartCard>
          <DashboardQuickActions
            actions={[
              { href: "/app/reports", label: "Generate report", icon: "report" },
              {
                href: "/app/stakeholders",
                label: "Stakeholders",
                icon: "people",
              },
              { href: "/app/issues/report", label: "Log issue", icon: "case" },
              { href: "/app/incidents", label: "Open cases", icon: "add" },
            ]}
          />
        </>
      }
    >

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
        {budgetBars.length ? (
          <OverviewChartCard title="Budget mix" hint="Budget, spent, available">
            <HorizontalBarChart bars={budgetBars} maxHeight={160} />
          </OverviewChartCard>
        ) : (
          <OverviewChartCard
            title="Stakeholder mix"
            hint="By kind — not a budget series"
          >
            {mixBars.length ? (
              <HorizontalBarChart bars={mixBars} maxHeight={160} />
            ) : (
              <p className="text-sm text-tl-ink-muted">
                No budget figures or stakeholder mix yet.
              </p>
            )}
          </OverviewChartCard>
        )}
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
    </SrmDashboardFrame>
  );
}
