import { mockIncidents } from "@/data/mockIncidents";
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

export const incidentService = {
  async list(filters: IncidentListFilters = {}): Promise<Incident[]> {
    let rows = [...mockIncidents];
    if (filters.ward) rows = rows.filter((i) => i.ward === filters.ward);
    if (filters.projectId) {
      rows = rows.filter((i) => i.projectId === filters.projectId);
    }
    if (filters.status) rows = rows.filter((i) => i.status === filters.status);
    if (filters.priority) {
      rows = rows.filter((i) => i.priority === filters.priority);
    }
    if (typeof filters.slaBreached === "boolean") {
      rows = rows.filter((i) => i.slaBreached === filters.slaBreached);
    }
    if (filters.escalatedOnly) {
      rows = rows.filter((i) => i.escalationLevel !== "None");
    }
    return delay(rows);
  },

  async get(id: string): Promise<Incident | null> {
    return delay(mockIncidents.find((i) => i.id === id) ?? null);
  },

  async intakeQueue(): Promise<Incident[]> {
    return this.list({}).then((rows) =>
      rows
        .filter((i) => i.status === "Open" || i.status === "Escalated")
        .sort((a, b) => a.reportedAt.localeCompare(b.reportedAt)),
    );
  },

  async slaBreaches(): Promise<Incident[]> {
    return this.list({ slaBreached: true });
  },
};
