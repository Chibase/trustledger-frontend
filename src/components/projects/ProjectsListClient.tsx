"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listDemoProjects } from "@/lib/demoStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import { listTrialProjects } from "@/lib/trialStore";
import { projectService } from "@/services/projectService";
import type { Project } from "@/types/project";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

export function ProjectsListClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    projectService.list().then((rows) => {
      if (cancelled) return;
      const trial = readTrialModeFromDocument();
      const local = trial ? listTrialProjects() : listDemoProjects();
      const byId = new Map<string, Project>();
      for (const p of [...local, ...rows]) byId.set(p.id, p);
      setProjects([...byId.values()]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-tl-ink-muted">Loading projects…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
      <table className="min-w-full text-sm">
        <thead className="border-b border-tl-line bg-tl-paper text-tl-ink-muted">
          <tr>
            <th className="p-3 text-left font-medium">ID</th>
            <th className="p-3 text-left font-medium">Name</th>
            <th className="p-3 text-left font-medium">Client/Funder</th>
            <th className="p-3 text-left font-medium">Budget</th>
            <th className="p-3 text-left font-medium">Spent</th>
            <th className="p-3 text-left font-medium">Ward</th>
            <th className="p-3 text-left font-medium">Contractor</th>
            <th className="p-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-t border-tl-line">
              <td className="p-3">
                <Link
                  href={`/app/projects/${p.id}`}
                  className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
                >
                  {p.id}
                </Link>
              </td>
              <td className="p-3">{p.name}</td>
              <td className="p-3">{p.clientFunder || "—"}</td>
              <td className="p-3">{currency.format(p.budgetTotal)}</td>
              <td className="p-3">{currency.format(p.budgetSpent)}</td>
              <td className="p-3">{p.ward || "—"}</td>
              <td className="p-3">{p.contractorName || "—"}</td>
              <td className="p-3">{p.status}</td>
            </tr>
          ))}
          {projects.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="p-4 text-tl-ink-muted"
              >
                No projects yet — create one when reporting an issue.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
