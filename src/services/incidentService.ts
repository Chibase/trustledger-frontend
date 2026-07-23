import { mockIncidents } from "@/data/mockIncidents";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import type {
  Incident,
  IncidentPriority,
  IncidentStatus,
} from "@/types/incident";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export type IncidentListFilters = {
  ward?: string;
  projectId?: string;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  slaBreached?: boolean;
  escalatedOnly?: boolean;
};

function filterIncidents(
  rows: Incident[],
  filters: IncidentListFilters,
): Incident[] {
  let next = [...rows];
  if (filters.ward) next = next.filter((i) => i.ward === filters.ward);
  if (filters.projectId) {
    next = next.filter((i) => i.projectId === filters.projectId);
  }
  if (filters.status) next = next.filter((i) => i.status === filters.status);
  if (filters.priority) {
    next = next.filter((i) => i.priority === filters.priority);
  }
  if (typeof filters.slaBreached === "boolean") {
    next = next.filter((i) => i.slaBreached === filters.slaBreached);
  }
  if (filters.escalatedOnly) {
    next = next.filter((i) => i.escalationLevel !== "None");
  }
  return next;
}

async function mergeLocalOverlays(seed: Incident[]): Promise<Incident[]> {
  if (typeof window === "undefined") return seed;
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  const { listDemoIncidents } = await import("@/lib/demoStore");
  const { listWorkspaceIncidents } = await import("@/lib/workspaceData");
  const { listTrialIncidents } = await import("@/lib/trialStore");

  // Paying / trial / invitee workspaces never absorb demo INC-* seed or overlays.
  if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
    const byId = new Map<string, Incident>();
    for (const row of seed) byId.set(row.id, row);
    for (const row of listWorkspaceIncidents()) byId.set(row.id, row);
    for (const row of listTrialIncidents()) byId.set(row.id, row);
    return [...byId.values()];
  }

  const byId = new Map<string, Incident>();
  for (const row of seed) byId.set(row.id, row);
  for (const row of listDemoIncidents()) byId.set(row.id, row);
  return [...byId.values()];
}

async function listDemo(filters: IncidentListFilters): Promise<Incident[]> {
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  if (readTrialModeFromDocument()) {
    const rows = await mergeLocalOverlays([]);
    return delay(filterIncidents(rows, filters));
  }
  const rows = await mergeLocalOverlays(mockIncidents);
  return delay(filterIncidents(rows, filters));
}

async function listLive(filters: IncidentListFilters): Promise<Incident[]> {
  try {
    const rows = await callFrappeMethod<Incident[]>(
      FRAPPE_METHODS.listIncidents,
      { ...filters },
    );
    // Empty Cloud list must stay empty — never substitute demo INC-*.
    const base = Array.isArray(rows) ? rows : [];
    const merged = await mergeLocalOverlays(base);
    return filterIncidents(merged, filters);
  } catch {
    const { readTrialModeFromDocument } = await import("@/lib/trial");
    const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
    if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
      return filterIncidents(await mergeLocalOverlays([]), filters);
    }
    // Demo / exploratory live only — ADR-010 mock fallback.
    return listDemo(filters);
  }
}

export const incidentService = {
  async list(filters: IncidentListFilters = {}): Promise<Incident[]> {
    return isLiveMode() ? listLive(filters) : listDemo(filters);
  },

  async get(id: string): Promise<Incident | null> {
    const rows = await this.list();
    const local = rows.find((i) => i.id === id);
    if (local) return local;

    if (isLiveMode()) {
      try {
        const row = await callFrappeMethod<Incident | null>(
          FRAPPE_METHODS.getIncident,
          { name: id },
        );
        return row ?? null;
      } catch {
        const { readTrialModeFromDocument } = await import("@/lib/trial");
        const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
        if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
          return null;
        }
        return delay(mockIncidents.find((i) => i.id === id) ?? null);
      }
    }
    return delay(mockIncidents.find((i) => i.id === id) ?? null);
  },

  async save(incident: Incident): Promise<Incident> {
    if (typeof window === "undefined") return incident;
    const { readTrialModeFromDocument } = await import("@/lib/trial");
    const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
    if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
      const { saveOrgIncident } = await import("@/lib/orgDataSpace");
      saveOrgIncident(incident);
    } else {
      const { saveDemoIncident } = await import("@/lib/demoStore");
      saveDemoIncident(incident);
    }
    return delay(incident);
  },

  async intakeQueue(): Promise<Incident[]> {
    const rows = await this.list();
    return rows
      .filter((i) => i.status === "Open" || i.status === "Escalated")
      .sort((a, b) => a.reportedAt.localeCompare(b.reportedAt));
  },

  async slaBreaches(): Promise<Incident[]> {
    return this.list({ slaBreached: true });
  },
};
