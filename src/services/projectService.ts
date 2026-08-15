import { mockProjects } from "@/data/mockProjects";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import type { Project, ProjectStatus } from "@/types/project";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export type ProjectListFilters = {
  ward?: string;
  status?: ProjectStatus;
  contractorName?: string;
};

function filterProjects(
  rows: Project[],
  filters: ProjectListFilters,
): Project[] {
  let next = [...rows];
  if (filters.ward) next = next.filter((p) => p.ward === filters.ward);
  if (filters.status) next = next.filter((p) => p.status === filters.status);
  if (filters.contractorName) {
    next = next.filter((p) => p.contractorName === filters.contractorName);
  }
  return next;
}

async function listDemo(filters: ProjectListFilters): Promise<Project[]> {
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  if (readTrialModeFromDocument()) {
    return delay(filterProjects([], filters));
  }
  return delay(filterProjects(mockProjects, filters));
}

async function listLive(filters: ProjectListFilters): Promise<Project[]> {
  try {
    const rows = await callFrappeMethod<Project[]>(FRAPPE_METHODS.listProjects, {
      ...filters,
    });
    if (Array.isArray(rows) && rows.length > 0) {
      return filterProjects(rows, filters);
    }
  } catch {
    /* fall through to resource API / empty */
  }

  try {
    const res = await fetch("/api/app/projects", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as { projects?: Project[] };
      if (Array.isArray(json.projects)) {
        return filterProjects(json.projects, filters);
      }
    }
  } catch {
    /* ignore */
  }

  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
    return [];
  }
  return listDemo(filters);
}

async function getLive(id: string): Promise<Project | null> {
  try {
    const row = await callFrappeMethod<Project | null>(
      FRAPPE_METHODS.getProject,
      { name: id },
    );
    if (row) return row;
  } catch {
    /* fall through to Cloud resource API */
  }

  try {
    const res = await fetch(`/api/app/projects/${encodeURIComponent(id)}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json()) as { project?: Project };
      if (json.project) return json.project;
    }
  } catch {
    /* ignore */
  }

  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
    return null;
  }
  return delay(mockProjects.find((p) => p.id === id) ?? null);
}

export const projectService = {
  async list(filters: ProjectListFilters = {}): Promise<Project[]> {
    return isLiveMode() ? listLive(filters) : listDemo(filters);
  },

  async get(id: string): Promise<Project | null> {
    if (isLiveMode()) {
      return getLive(id);
    }
    const { readTrialModeFromDocument } = await import("@/lib/trial");
    if (readTrialModeFromDocument()) {
      return delay(null);
    }
    return delay(mockProjects.find((p) => p.id === id) ?? null);
  },

  async portfolioTotals(): Promise<{
    projectCount: number;
    budgetTotal: number;
    budgetSpent: number;
    activeCount: number;
  }> {
    const projects = await this.list();
    return {
      projectCount: projects.length,
      budgetTotal: projects.reduce((sum, p) => sum + p.budgetTotal, 0),
      budgetSpent: projects.reduce((sum, p) => sum + p.budgetSpent, 0),
      activeCount: projects.filter((p) => p.status === "Active").length,
    };
  },
};
