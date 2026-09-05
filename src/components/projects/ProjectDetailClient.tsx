"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ProjectWorkspaceDashboard } from "@/components/projects/ProjectWorkspaceDashboard";
import { isLiveMode } from "@/config/api";
import { listDemoProjects } from "@/lib/demoStore";
import {
  mergeProjectDossier,
} from "@/lib/projectDossier";
import { listTrialProjects } from "@/lib/trialStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import { listWorkspaceProjects } from "@/lib/workspaceData";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";
import type { PlanId } from "@/config/plans";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { UserRole } from "@/types/rbac";

type Props = {
  params: Promise<{ id: string }>;
  role: UserRole;
  authorName: string;
  planId?: PlanId | null;
};

export function ProjectDetailClient({ params, role, authorName, planId = null }: Props) {
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
        if (isLiveMode() && customer && !trial) {
          const resolved = remote ? mergeProjectDossier(remote) : null;
          setProject(resolved);
          if (!resolved) return;
          try {
            const rows = await incidentService.list({ projectId: resolved.id });
            if (!cancelled) {
              const scoped = rows.filter((r) => r.projectId === resolved.id);
              setIncidents(scoped.length ? scoped : rows);
            }
          } catch {
            if (!cancelled) setIncidents([]);
          }
          return;
        }
        const fromWorkspace = listWorkspaceProjects().find(
          (row) => row.id === id,
        );
        const local = trial
          ? listTrialProjects().find((row) => row.id === id)
          : customer
            ? undefined
            : listDemoProjects().find((row) => row.id === id);
        const base = fromWorkspace ?? local ?? remote ?? null;
        if (!base) {
          setProject(null);
          return;
        }
        const resolved = mergeProjectDossier(base);
        setProject(resolved);
        try {
          const rows = await incidentService.list({ projectId: resolved.id });
          if (!cancelled) {
            const scoped = rows.filter((r) => r.projectId === resolved.id);
            setIncidents(scoped.length ? scoped : rows);
          }
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
          <Link href="/app/dashboard" className="underline">
            Executive portfolio
          </Link>
        </p>
        <h1 className="font-display text-2xl font-semibold">
          Project not found
        </h1>
        <p className="text-sm text-tl-ink-muted">
          This project is not in your workspace. It may belong to another
          organisation, or it was removed from TrustLedger Cloud.
        </p>
        <Link
          href="/app/dashboard"
          className="inline-block text-sm font-medium text-tl-trust-ink underline"
        >
          Back to portfolio
        </Link>
      </div>
    );
  }

  return (
    <ProjectWorkspaceDashboard
      project={project}
      incidents={incidents}
      role={role}
      authorName={authorName}
      planId={planId}
      onProjectSaved={setProject}
    />
  );
}
