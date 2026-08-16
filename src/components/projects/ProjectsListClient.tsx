"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { guideRequestsNewTask } from "@/config/onboardingSteps";
import { listDemoProjects } from "@/lib/demoStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import {
  listTrialProjects,
  saveTrialProject,
} from "@/lib/trialStore";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import { projectService } from "@/services/projectService";
import type { Project } from "@/types/project";

function newTrialProjectId(): string {
  return `PRJ-T${Date.now().toString().slice(-6)}`;
}

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type ProjectsListClientProps = {
  /** Live / trial Owners may create projects. */
  canCreate?: boolean;
};

export function ProjectsListClient({ canCreate = true }: ProjectsListClientProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [clientFunder, setClientFunder] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(() => {
    if (typeof window === "undefined" || !canCreate) return false;
    return guideRequestsNewTask(window.location.search);
  });

  useEffect(() => {
    if (!openForm) return;
    const t = window.setTimeout(() => {
      document.getElementById("project-name")?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [openForm]);

  async function refresh() {
    const rows = await projectService.list();
    const trial = readTrialModeFromDocument();
    const customer = isCustomerWorkspaceClient();
    const local = trial
      ? listTrialProjects()
      : customer
        ? []
        : listDemoProjects();
    const byId = new Map<string, Project>();
    for (const p of [...local, ...rows]) byId.set(p.id, p);
    setProjects([...byId.values()]);
  }

  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void refresh().finally(() => {
        if (!cancelled) setLoading(false);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter a project name (at least 2 characters).");
      return;
    }
    setPending(true);
    try {
      const trial = readTrialModeFromDocument();
      if (trial) {
        const today = new Date().toISOString().slice(0, 10);
        const project: Project = {
          id: newTrialProjectId(),
          name: trimmed,
          clientFunder: clientFunder.trim(),
          budgetTotal: 0,
          budgetSpent: 0,
          ward: "",
          municipality: "",
          status: "Active",
          contractorName: "",
          startDate: today,
          targetEndDate: today,
          publicSummary: "",
        };
        saveTrialProject(project);
        setName("");
        setClientFunder("");
        setOpenForm(false);
        await refresh();
        return;
      }

      const res = await fetch("/api/app/projects", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: trimmed,
          clientFunder: clientFunder.trim(),
        }),
      });
      const json = (await res.json()) as { error?: string; project?: Project };
      if (!res.ok) {
        setError(json.error || "Could not create project.");
        return;
      }
      setName("");
      setClientFunder("");
      setOpenForm(false);
      await refresh();
    } catch {
      setError("Network error creating project.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-tl-ink-muted">Loading projects…</p>;
  }

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-tl-ink-muted">
            Add programmes or sites for your package — VIP and paid plans use
            TrustLedger Cloud.
          </p>
          <button
            type="button"
            onClick={() => setOpenForm((v) => !v)}
            className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            {openForm ? "Cancel" : "Add project"}
          </button>
        </div>
      ) : null}

      {canCreate && openForm ? (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <div>
            <label htmlFor="project-name" className="mb-1 block text-sm font-medium">
              Project name
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="Site or programme name"
              required
              minLength={2}
            />
          </div>
          <div>
            <label
              htmlFor="project-client"
              className="mb-1 block text-sm font-medium"
            >
              Client / funder (optional)
            </label>
            <input
              id="project-client"
              value={clientFunder}
              onChange={(e) => setClientFunder(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              placeholder="Organisation funding the work"
            />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save project"}
          </button>
        </form>
      ) : null}

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
                <td colSpan={8} className="p-4 text-tl-ink-muted">
                  {canCreate
                    ? "No projects yet — use Add project to create your first site or programme."
                    : "No projects yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
