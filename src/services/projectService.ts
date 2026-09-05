import { mockProjects } from "@/data/mockProjects";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import { mergeProjectDossier } from "@/lib/projectDossier";
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

/** Overlay local extras onto Cloud ids only. Empty Cloud stays empty. */
export function overlayLocalProjectsOntoCloud(
  cloud: Project[],
  local: Project[],
): Project[] {
  const localById = new Map(local.map((row) => [row.id, row]));
  return cloud.map((row) => {
    const overlay = localById.get(row.id);
    if (!overlay) return row;
    return {
      ...overlay,
      ...row,
      startDate: row.startDate,
      targetEndDate: row.targetEndDate,
      dossier: overlay.dossier ?? row.dossier,
      melIndicators:
        row.melIndicators !== undefined
          ? row.melIndicators
          : overlay.melIndicators,
    };
  });
}

async function localProjectOverlays(): Promise<Project[]> {
  if (typeof window === "undefined") return [];
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  if (readTrialModeFromDocument()) {
    const { listTrialProjects } = await import("@/lib/trialStore");
    return listTrialProjects();
  }
  if (isCustomerWorkspaceClient()) {
    const { listOrgProjects } = await import("@/lib/orgDataSpace");
    return listOrgProjects();
  }
  return [];
}

function withDossierOverlay(rows: Project[]): Project[] {
  if (typeof window === "undefined") return rows;
  return rows.map(mergeProjectDossier);
}

async function listDemo(filters: ProjectListFilters): Promise<Project[]> {
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  if (readTrialModeFromDocument()) {
    return delay(filterProjects([], filters));
  }
  return delay(filterProjects(mockProjects, filters));
}

async function listFromCloudBff(): Promise<Project[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/app/projects", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) return [];
    if (!res.ok) return null;
    const json = (await res.json()) as { projects?: Project[] };
    return Array.isArray(json.projects) ? json.projects : [];
  } catch {
    return null;
  }
}

async function saveToCloudBff(project: Project): Promise<Project | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(
      `/api/app/projects/${encodeURIComponent(project.id)}`,
      {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ project }),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { project?: Project };
    const saved = json.project
      ? { ...project, ...json.project, dossier: project.dossier }
      : project;
    return saved;
  } catch {
    return null;
  }
}

async function listLive(filters: ProjectListFilters): Promise<Project[]> {
  try {
    const rows = await callFrappeMethod<Project[]>(FRAPPE_METHODS.listProjects, {
      ...filters,
    });
    if (Array.isArray(rows) && rows.length > 0) {
      const local = await localProjectOverlays();
      return filterProjects(
        withDossierOverlay(overlayLocalProjectsOntoCloud(rows, local)),
        filters,
      );
    }
  } catch {
    /* fall through to resource API / empty */
  }

  const cloud = await listFromCloudBff();
  if (cloud) {
    const local = await localProjectOverlays();
    return filterProjects(
      withDossierOverlay(overlayLocalProjectsOntoCloud(cloud, local)),
      filters,
    );
  }

  return [];
}

async function getLive(id: string): Promise<Project | null> {
  try {
    const row = await callFrappeMethod<Project | null>(
      FRAPPE_METHODS.getProject,
      { name: id },
    );
    if (row) {
      const local = await localProjectOverlays();
      const merged = overlayLocalProjectsOntoCloud([row], local)[0] || row;
      return withDossierOverlay([merged])[0] || merged;
    }
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
      if (json.project) {
        const local = await localProjectOverlays();
        const merged =
          overlayLocalProjectsOntoCloud([json.project], local)[0] ||
          json.project;
        return withDossierOverlay([merged])[0] || merged;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

async function cacheAfterCloudSave(project: Project) {
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
    const { saveOrgProject } = await import("@/lib/orgDataSpace");
    saveOrgProject(project);
  }
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

  async save(project: Project): Promise<Project> {
    if (typeof window === "undefined") return project;
    if (isLiveMode()) {
      const pushed = await saveToCloudBff(project);
      if (!pushed) {
        throw new Error("Could not save on TrustLedger Cloud");
      }
      await cacheAfterCloudSave(pushed);
      return delay(pushed);
    }
    const { readTrialModeFromDocument } = await import("@/lib/trial");
    const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
    if (readTrialModeFromDocument()) {
      const { saveTrialProject } = await import("@/lib/trialStore");
      saveTrialProject(project);
    } else if (isCustomerWorkspaceClient()) {
      const { saveOrgProject } = await import("@/lib/orgDataSpace");
      saveOrgProject(project);
    } else {
      const { saveDemoProject } = await import("@/lib/demoStore");
      saveDemoProject(project);
    }
    return delay(project);
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
