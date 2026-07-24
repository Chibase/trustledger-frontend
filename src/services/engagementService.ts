import { mockEngagements } from "@/data/mockEngagements";
import { isLiveMode } from "@/config/api";
import type {
  Engagement,
  EngagementKind,
  EngagementStatus,
} from "@/types/engagement";

const STORAGE_KEY = "tl-engagements";

function delay<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function readLocal(): Engagement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Engagement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: Engagement[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function mergeSeedAndLocal(local: Engagement[]): Engagement[] {
  const byId = new Map<string, Engagement>();
  for (const row of mockEngagements) byId.set(row.id, row);
  for (const row of local) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => b.heldOn.localeCompare(a.heldOn));
}

export type EngagementListFilters = {
  kind?: EngagementKind | "all";
  status?: EngagementStatus | "all";
  projectId?: string;
  ward?: string;
  query?: string;
};

function applyFilters(
  rows: Engagement[],
  filters: EngagementListFilters,
): Engagement[] {
  let next = rows;
  if (filters.kind && filters.kind !== "all") {
    next = next.filter((r) => r.kind === filters.kind);
  }
  if (filters.status && filters.status !== "all") {
    next = next.filter((r) => r.status === filters.status);
  }
  if (filters.projectId) {
    next = next.filter((r) => r.projectId === filters.projectId);
  }
  if (filters.ward) {
    next = next.filter((r) => r.ward === filters.ward);
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    next = next.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.ward.toLowerCase().includes(q) ||
        r.attendeesLabel.toLowerCase().includes(q) ||
        (r.placeLabel?.toLowerCase().includes(q) ?? false),
    );
  }
  return next;
}

async function isOwnDataWorkspace(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  return readTrialModeFromDocument() || isCustomerWorkspaceClient();
}

async function listFromCloudSi(): Promise<Engagement[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/frappe/si?kind=engagement", {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) return [];
    if (!res.ok) return null;
    const json = (await res.json()) as { rows?: Engagement[] };
    return Array.isArray(json.rows) ? json.rows : [];
  } catch {
    return null;
  }
}

async function saveToCloudSi(row: Engagement): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/frappe/si", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ kind: "engagement", engagement: row }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function createEngagementId(): string {
  return `ENG-${Date.now().toString(36).toUpperCase()}`;
}

export const engagementService = {
  async list(filters: EngagementListFilters = {}): Promise<Engagement[]> {
    const own = await isOwnDataWorkspace();

    if (typeof window !== "undefined" && isLiveMode()) {
      const cloud = await listFromCloudSi();
      if (cloud) {
        const local = readLocal().filter((r) => r.source !== "seed");
        const byId = new Map<string, Engagement>();
        for (const row of cloud) byId.set(row.id, row);
        for (const row of local) byId.set(row.id, row);
        return applyFilters(
          [...byId.values()].sort((a, b) => b.heldOn.localeCompare(a.heldOn)),
          filters,
        );
      }
      if (own) {
        return delay(
          applyFilters(
            readLocal().filter((r) => r.source !== "seed"),
            filters,
          ),
        );
      }
    }

    if (own) {
      return delay(
        applyFilters(readLocal().filter((r) => r.source !== "seed"), filters),
      );
    }

    const local = typeof window !== "undefined" ? readLocal() : [];
    return delay(applyFilters(mergeSeedAndLocal(local), filters));
  },

  async get(id: string): Promise<Engagement | null> {
    const rows = await this.list();
    return rows.find((r) => r.id === id) ?? null;
  },

  async save(row: Engagement): Promise<Engagement> {
    if (typeof window !== "undefined" && isLiveMode()) {
      const pushed = await saveToCloudSi(row);
      if (pushed) {
        const local = readLocal().filter((r) => r.id !== row.id);
        writeLocal(local);
        return delay(row);
      }
    }
    const local = readLocal().filter((r) => r.id !== row.id);
    local.push(row);
    writeLocal(local);
    return delay(row);
  },
};
