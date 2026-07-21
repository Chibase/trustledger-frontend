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

async function listDemo(filters: IncidentListFilters): Promise<Incident[]> {
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  if (readTrialModeFromDocument()) {
    return delay(filterIncidents([], filters));
  }
  return delay(filterIncidents(mockIncidents, filters));
}

async function listLive(filters: IncidentListFilters): Promise<Incident[]> {
  try {
    const rows = await callFrappeMethod<Incident[]>(
      FRAPPE_METHODS.listIncidents,
      { ...filters },
    );
    return Array.isArray(rows) ? filterIncidents(rows, filters) : [];
  } catch {
    return listDemo(filters);
  }
}

export const incidentService = {
  async list(filters: IncidentListFilters = {}): Promise<Incident[]> {
    return isLiveMode() ? listLive(filters) : listDemo(filters);
  },

  async get(id: string): Promise<Incident | null> {
    if (isLiveMode()) {
      try {
        const row = await callFrappeMethod<Incident | null>(
          FRAPPE_METHODS.getIncident,
          { name: id },
        );
        return row ?? null;
      } catch {
        return delay(mockIncidents.find((i) => i.id === id) ?? null);
      }
    }
    const { readTrialModeFromDocument } = await import("@/lib/trial");
    if (readTrialModeFromDocument()) {
      return delay(null);
    }
    return delay(mockIncidents.find((i) => i.id === id) ?? null);
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
