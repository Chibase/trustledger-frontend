import { mockIncidents } from "@/data/mockIncidents";
import { isLiveMode } from "@/config/api";
import { omitCloudTrustOverlay } from "@/types/trustOverlay";
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

async function listFromCloudProduct(): Promise<Incident[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/frappe/product?kind=incident", {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) return [];
    if (!res.ok) return null;
    const json = (await res.json()) as { rows?: Incident[] };
    return Array.isArray(json.rows) ? json.rows : [];
  } catch {
    return null;
  }
}

async function saveToCloudProduct(row: Incident): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/frappe/product", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        kind: "incident",
        incident: omitCloudTrustOverlay(row),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function mergeIncidentCache(cloud: Incident, local: Incident): Incident {
  return {
    ...local,
    ...cloud,
    processStages: cloud.processStages || local.processStages,
    status: cloud.status || local.status,
    timeline: local.timeline?.length ? local.timeline : cloud.timeline,
    geo: local.geo || cloud.geo,
    slaDueBy: local.slaDueBy || cloud.slaDueBy,
    ownerName: local.ownerName || cloud.ownerName,
    category: local.category || cloud.category,
    nature: local.nature || cloud.nature,
    rootCause: cloud.rootCause ?? local.rootCause,
    rootCauseNote: cloud.rootCauseNote ?? local.rootCauseNote,
    reportedByRole: local.reportedByRole || cloud.reportedByRole,
    reporterName: local.reporterName ?? cloud.reporterName,
    anonymous: local.anonymous ?? cloud.anonymous,
    filedByTier: local.filedByTier || cloud.filedByTier,
    escalationLevel: local.escalationLevel || cloud.escalationLevel,
    escalationPolicy: local.escalationPolicy || cloud.escalationPolicy,
    trustResponse: local.trustResponse,
    sentimentLabel: local.sentimentLabel ?? cloud.sentimentLabel,
    sentimentScore: local.sentimentScore ?? cloud.sentimentScore,
  };
}

export function mergeCloudAndLocal(cloud: Incident[], local: Incident[]): Incident[] {
  const localById = new Map(local.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const out: Incident[] = [];
  for (const row of cloud) {
    seen.add(row.id);
    const overlay = localById.get(row.id);
    out.push(overlay ? mergeIncidentCache(row, overlay) : row);
  }
  for (const row of local) {
    if (!seen.has(row.id)) out.push(row);
  }
  return out;
}

/** Overlay local extras onto Cloud ids only. Empty Cloud stays empty. */
export function overlayLocalIncidentsOntoCloud(
  cloud: Incident[],
  local: Incident[],
): Incident[] {
  const localById = new Map(local.map((row) => [row.id, row]));
  return cloud.map((row) => {
    const overlay = localById.get(row.id);
    return overlay ? mergeIncidentCache(row, overlay) : row;
  });
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
  const cloud = await listFromCloudProduct();
  const local = await mergeLocalOverlays([]);
  if (cloud) {
    return filterIncidents(overlayLocalIncidentsOntoCloud(cloud, local), filters);
  }
  return filterIncidents(local, filters);
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
      return null;
    }
    return delay(mockIncidents.find((i) => i.id === id) ?? null);
  },

  async save(incident: Incident): Promise<Incident> {
    if (typeof window === "undefined") return incident;
    const clean = omitCloudTrustOverlay(incident);
    if (isLiveMode()) {
      const pushed = await saveToCloudProduct(clean);
      const { readTrialModeFromDocument } = await import("@/lib/trial");
      const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
      if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
        const { saveOrgIncident } = await import("@/lib/orgDataSpace");
        saveOrgIncident(clean);
      }
      if (!pushed) {
        throw new Error("Could not save on TrustLedger Cloud");
      }
      return delay(clean);
    }
    const { readTrialModeFromDocument } = await import("@/lib/trial");
    const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
    if (readTrialModeFromDocument() || isCustomerWorkspaceClient()) {
      const { saveOrgIncident } = await import("@/lib/orgDataSpace");
      saveOrgIncident(clean);
    } else {
      const { saveDemoIncident } = await import("@/lib/demoStore");
      saveDemoIncident(clean);
    }
    return delay(clean);
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
