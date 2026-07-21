import Link from "next/link";
import { getCurrentUser, type UserRole } from "@/lib/auth";
import { ReportBriefAssist } from "@/components/ai/ReportBriefAssist";
import { ClientPortfolioDashboard } from "@/components/client/ClientPortfolioDashboard";
import { DeskWorkspacePanels } from "@/components/desk/DeskWorkspacePanels";
import { IncidentTable } from "@/components/ui/IncidentTable";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectStatusChip } from "@/components/ui/StatusChip";
import { buildClientPortfolioBrief } from "@/lib/clientPortfolioIntel";
import { incidentService } from "@/services/incidentService";
import { noteService } from "@/services/noteService";
import { projectService } from "@/services/projectService";

async function CommunityHome() {
  const [projects, incidents, notes] = await Promise.all([
    projectService.list({ ward: "Ward 12" }),
    incidentService.list({ ward: "Ward 12" }),
    noteService.list({ ward: "Ward 12" }),
  ]);
  const openMine = incidents.filter((i) => i.status !== "Closed");
  const highPriority = openMine.filter(
    (i) => i.priority === "P1-Critical" || i.priority === "P2-High",
  );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="CLO / community workspace"
        title="Field desk"
        description="Report concerns linked to a project. Capture hub feeds the demo stakeholder registry."
        actions={
          <>
            <Link
              href="/app/issues/report"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Report an issue
            </Link>
            <Link
              href="/app/capture"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Capture hub
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Open concerns" value={String(openMine.length)} />
        <KpiCard
          label="High priority"
          value={String(highPriority.length)}
          tone={highPriority.length > 0 ? "attention" : "default"}
        />
        <KpiCard label="Meeting notes" value={String(notes.length)} />
      </div>

      <DeskWorkspacePanels
        role="community"
        seedIncidents={incidents}
        seedProjects={projects}
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-tl-ink">Open concerns</h2>
        <IncidentTable
          incidents={openMine}
          emptyLabel="No open concerns in Ward 12."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-tl-ink">Meeting notes</h2>
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-tl-line bg-tl-surface px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-tl-ink">{n.title}</p>
                <p className="text-xs text-tl-ink-muted">{n.heldOn}</p>
              </div>
              <p className="mt-1 text-xs text-tl-ink-muted">{n.attendeesLabel}</p>
              <p className="mt-2 text-tl-ink-muted">{n.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function ContractorHome() {
  const [projects, incidents] = await Promise.all([
    projectService.list({ contractorName: "Thari Civils" }),
    incidentService.list({ projectId: "PRJ-001" }),
  ]);
  const open = incidents.filter((i) => i.status !== "Closed");
  const breached = open.filter((i) => i.slaBreached);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Site workspace"
        title="Site foreman / manager desk"
        description="Assigned sites, open incidents, and delivery windows."
        actions={
          <Link
            href="/app/issues/report"
            className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Log a field concern
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Assigned projects" value={String(projects.length)} />
        <KpiCard label="Open incidents" value={String(open.length)} />
        <KpiCard
          label="SLA breaches"
          value={String(breached.length)}
          tone={breached.length > 0 ? "attention" : "default"}
        />
      </div>

      <DeskWorkspacePanels
        role="contractor"
        seedIncidents={incidents}
        seedProjects={projects}
        showProjectList={false}
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Assigned projects</h2>
        <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-sm"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="mt-0.5 text-tl-ink-muted">
                  Target end {p.targetEndDate}
                </p>
              </div>
              <ProjectStatusChip status={p.status} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Site incidents</h2>
        <IncidentTable incidents={open} emptyLabel="No open site incidents." />
      </section>
    </div>
  );
}

async function ClientHome() {
  const brief = await buildClientPortfolioBrief();
  return <ClientPortfolioDashboard brief={brief} />;
}

async function AdminHome() {
  const [queue, breaches, escalated, all, projects] = await Promise.all([
    incidentService.intakeQueue(),
    incidentService.slaBreaches(),
    incidentService.list({ escalatedOnly: true }),
    incidentService.list(),
    projectService.list(),
  ]);
  const open = all.filter((i) => i.status !== "Closed");

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Supervisor / admin workspace"
        title="Supervisor desk"
        description="Ranked junior filings, SLA pressure, and visibility controls in Settings."
        actions={
          <>
            <Link
              href="/app/issues/report"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              New intake
            </Link>
            <Link
              href="/app/settings"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Visibility controls
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open cases" value={String(open.length)} />
        <KpiCard label="Intake queue" value={String(queue.length)} />
        <KpiCard
          label="SLA breaches"
          value={String(breaches.length)}
          tone={breaches.length > 0 ? "attention" : "default"}
        />
        <KpiCard
          label="Escalated"
          value={String(escalated.length)}
          tone={escalated.length > 0 ? "danger" : "default"}
        />
      </div>

      <DeskWorkspacePanels
        role="admin"
        seedIncidents={all}
        seedProjects={projects}
      />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Escalations</h2>
        <IncidentTable
          incidents={escalated}
          emptyLabel="No escalated cases."
        />
      </section>

      <ReportBriefAssist />
    </div>
  );
}

const HOME: Record<UserRole, () => Promise<React.ReactNode>> = {
  community: CommunityHome,
  contractor: ContractorHome,
  client: ClientHome,
  admin: AdminHome,
};

export default async function AppDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const Home = HOME[user.role];
  return <Home />;
}
