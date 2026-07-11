import { mockProjects } from "@/data/mockProjects";
import type { Project, ProjectStatus } from "@/types/project";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export type ProjectListFilters = {
  ward?: string;
  status?: ProjectStatus;
  contractorName?: string;
};

export const projectService = {
  async list(filters: ProjectListFilters = {}): Promise<Project[]> {
    let rows = [...mockProjects];
    if (filters.ward) {
      rows = rows.filter((p) => p.ward === filters.ward);
    }
    if (filters.status) {
      rows = rows.filter((p) => p.status === filters.status);
    }
    if (filters.contractorName) {
      rows = rows.filter((p) => p.contractorName === filters.contractorName);
    }
    return delay(rows);
  },

  async get(id: string): Promise<Project | null> {
    return delay(mockProjects.find((p) => p.id === id) ?? null);
  },

  async portfolioTotals(): Promise<{
    projectCount: number;
    budgetTotal: number;
    budgetSpent: number;
    activeCount: number;
  }> {
    const projects = mockProjects;
    return delay({
      projectCount: projects.length,
      budgetTotal: projects.reduce((sum, p) => sum + p.budgetTotal, 0),
      budgetSpent: projects.reduce((sum, p) => sum + p.budgetSpent, 0),
      activeCount: projects.filter((p) => p.status === "Active").length,
    });
  },
};
