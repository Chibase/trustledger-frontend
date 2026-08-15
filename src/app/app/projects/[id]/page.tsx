"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { listDemoProjects } from "@/lib/demoStore";
import { listTrialProjects } from "@/lib/trialStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function AppProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void (async () => {
        const remote = await projectService.get(id);
        if (cancelled) return;
        const trial = readTrialModeFromDocument();
        const customer = isCustomerWorkspaceClient();
        const local = trial
          ? listTrialProjects().find((row) => row.id === id)
          : customer
            ? undefined
            : listDemoProjects().find((row) => row.id === id);
        const resolved = local ?? remote ?? null;
        setProject(resolved);
        if (!resolved) return;
        try {
          const rows = await incidentService.list({ projectId: resolved.id });
          if (!cancelled) setIncidents(rows);
        } catch {
          if (!cancelled) setIncidents([]);
        }
      })();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [id]);

  if (project === undefined) {
    return <p className="text-sm text-tl-ink-muted">Loading project…</p>;
  }

  if (!project) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-tl-ink-muted">
          <Link href="/app/projects" className="underline">
            Projects
          </Link>
        </p>
        <h1 className="font-display text-2xl font-semibold">Project not found</h1>
        <p className="text-sm text-tl-ink-muted">
          This project is not in your workspace. It may belong to another
          organisation, or it was removed from TrustLedger Cloud.
        </p>
        <Link
          href="/app/projects"
          className="inline-block text-sm font-medium text-tl-trust-ink underline"
        >
          Back to projects
        </Link>
      </div>
    );
  }

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
          {project.status}
          {project.ward ? ` · ${project.ward}` : ""}
          {project.contractorName ? ` · ${project.contractorName}` : ""}
        </p>
      </div>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <p className="text-tl-ink-muted">
          {project.publicSummary || "No public summary yet."}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-tl-ink-muted">Client / funder</dt>
            <dd>{project.clientFunder || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Municipality</dt>
            <dd>{project.municipality || "—"}</dd>
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
            <dd>{project.startDate || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-tl-ink-muted">Target end</dt>
            <dd>{project.targetEndDate || "—"}</dd>
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
