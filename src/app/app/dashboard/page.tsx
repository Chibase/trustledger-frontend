import Link from "next/link";
import { getCurrentUser, type UserRole } from "@/lib/auth";
import { ReportBriefAssist } from "@/components/ai/ReportBriefAssist";
import { incidentService } from "@/services/incidentService";
import { noteService } from "@/services/noteService";
import { projectService } from "@/services/projectService";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-tl-line bg-tl-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-tl-ink">{value}</p>
    </div>
  );
}

async function CommunityHome() {
  const [projects, incidents, notes] = await Promise.all([
    projectService.list({ ward: "Ward 12" }),
    incidentService.list({ ward: "Ward 12" }),
    noteService.list({ ward: "Ward 12" }),
  ]);
  const openMine = incidents.filter((i) => i.status !== "Closed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Community home</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Ward 12 public status, your concerns, and recent meeting notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/issues/report"
          className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Report an issue
        </Link>
        <Link
          href="/app/incidents"
          className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
        >
          View all concerns
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Projects in your ward</h2>
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{p.name}</p>
                <span className="text-tl-ink-muted">{p.status}</span>
              </div>
              <p className="mt-1 text-tl-ink-muted">{p.publicSummary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Open concerns</h2>
        {openMine.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">No open concerns in Ward 12.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {openMine.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/app/incidents/${i.id}`}
                  className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
                >
                  {i.id}
                </Link>
                <span className="text-tl-ink-muted">
                  {" "}
                  — {i.title} ({i.priority})
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Meeting notes</h2>
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
            >
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-xs text-tl-ink-muted">
                {n.heldOn} · {n.attendeesLabel}
              </p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Contractor desk</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Assigned sites, open incidents, and delivery windows.
        </p>
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Assigned projects</h2>
        <ul className="space-y-3 text-sm">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-lg border border-tl-line bg-tl-surface p-4"
            >
              <p className="font-medium">{p.name}</p>
              <p className="mt-1 text-tl-ink-muted">
                Target end {p.targetEndDate} · {p.status}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Site incidents</h2>
        <ul className="space-y-2 text-sm">
          {open.map((i) => (
            <li key={i.id}>
              <Link
                href={`/app/incidents/${i.id}`}
                className="font-medium text-tl-trust-ink underline"
              >
                {i.id}
              </Link>{" "}
              {i.title}
              {i.slaBreached ? (
                <span className="ml-2 text-tl-amber">SLA breached</span>
              ) : null}
            </li>
          ))}
        </ul>
        <Link
          href="/app/issues/report"
          className="mt-4 inline-block text-sm font-medium text-tl-trust-ink underline"
        >
          Log a field concern
        </Link>
      </section>
    </div>
  );
}

async function ClientHome() {
  const [totals, breaches, incidents] = await Promise.all([
    projectService.portfolioTotals(),
    incidentService.slaBreaches(),
    incidentService.list(),
  ]);
  const openRisk = incidents.filter(
    (i) => i.priority === "P1-Critical" || i.priority === "P2-High",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Client portfolio</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Spend, open risk, and compliance assist.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Projects" value={String(totals.projectCount)} />
        <Kpi label="Active" value={String(totals.activeCount)} />
        <Kpi label="Budget" value={currency.format(totals.budgetTotal)} />
        <Kpi label="Spent" value={currency.format(totals.budgetSpent)} />
      </div>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="mb-2 font-semibold">Open high-priority incidents</h2>
        <ul className="space-y-2">
          {openRisk.map((i) => (
            <li key={i.id}>
              <Link
                href={`/app/incidents/${i.id}`}
                className="font-medium text-tl-trust-ink underline"
              >
                {i.id}
              </Link>{" "}
              {i.title} ({i.priority})
            </li>
          ))}
        </ul>
        <p className="mt-3 text-tl-ink-muted">
          SLA breaches: {breaches.length}
        </p>
      </section>
      <ReportBriefAssist />
    </div>
  );
}

async function AdminHome() {
  const [queue, breaches, escalated] = await Promise.all([
    incidentService.intakeQueue(),
    incidentService.slaBreaches(),
    incidentService.list({ escalatedOnly: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin desk</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Intake queue, SLA pressure, and escalations.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Intake queue" value={String(queue.length)} />
        <Kpi label="SLA breaches" value={String(breaches.length)} />
        <Kpi label="Escalated" value={String(escalated.length)} />
      </div>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="mb-3 font-semibold">Intake queue</h2>
        <ul className="space-y-2">
          {queue.map((i) => (
            <li key={i.id}>
              <Link
                href={`/app/incidents/${i.id}`}
                className="font-medium text-tl-trust-ink underline"
              >
                {i.id}
              </Link>{" "}
              {i.title} · {i.priority} · owner {i.ownerName}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="mb-3 font-semibold">Escalations</h2>
        <ul className="space-y-2">
          {escalated.map((i) => (
            <li key={i.id}>
              {i.id} — {i.escalationLevel} — {i.title}
            </li>
          ))}
        </ul>
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
