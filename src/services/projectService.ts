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
  const { isTrialWorkspaceSession } = await import("@/lib/auth");
  if (await isTrialWorkspaceSession()) {
    return delay(filterProjects([], filters));
  }
  return delay(filterProjects(mockProjects, filters));
}

async function listLive(filters: ProjectListFilters): Promise<Project[]> {
  try {
    const rows = await callFrappeMethod<Project[]>(FRAPPE_METHODS.listProjects, {
      ...filters,
    });
    return Array.isArray(rows) ? rows : [];
  } catch {
    return listDemo(filters);
  }
}

export const projectService = {
  async list(filters: ProjectListFilters = {}): Promise<Project[]> {
    return isLiveMode() ? listLive(filters) : listDemo(filters);
  },

  async get(id: string): Promise<Project | null> {
    if (isLiveMode()) {
      try {
        const row = await callFrappeMethod<Project | null>(
          FRAPPE_METHODS.getProject,
          { name: id },
        );
        return row ?? null;
      } catch {
        return delay(mockProjects.find((p) => p.id === id) ?? null);
      }
    }
    const { isTrialWorkspaceSession } = await import("@/lib/auth");
    if (await isTrialWorkspaceSession()) {
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
