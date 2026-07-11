import Link from "next/link";
import { notFound } from "next/navigation";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AppProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await projectService.get(id);
  if (!project) notFound();

  const incidents = await incidentService.list({ projectId: project.id });
  const spendPct =
    project.budgetTotal > 0
      ? Math.round((project.budgetSpent / project.budgetTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-tl-ink-muted">
          <Link href="/app/projects" className="underline">
            Projects
          </Link>{" "}
          / {project.id}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          {project.name}
        </h1>
        <p className="mt-2 text-sm text-tl-ink-muted">
          {project.status} · {project.ward} · {project.contractorName}
        </p>
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <p className="text-tl-ink-muted">{project.publicSummary}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-tl-ink-muted">Client / funder</dt>
            <dd>{project.clientFunder}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Municipality</dt>
            <dd>{project.municipality}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Budget</dt>
            <dd>{currency.format(project.budgetTotal)}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Spent ({spendPct}%)</dt>
            <dd>{currency.format(project.budgetSpent)}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Start</dt>
            <dd>{project.startDate}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Target end</dt>
            <dd>{project.targetEndDate}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <h2 className="mb-3 font-semibold">Linked incidents</h2>
        {incidents.length === 0 ? (
          <p className="text-tl-ink-muted">No incidents linked to this project.</p>
        ) : (
          <ul className="space-y-2">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link
                  href={`/app/incidents/${incident.id}`}
                  className="font-medium text-tl-trust-ink underline"
                >
                  {incident.id}
                </Link>{" "}
                {incident.title} ({incident.priority})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
