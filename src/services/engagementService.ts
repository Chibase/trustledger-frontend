import { mockEngagements } from "@/data/mockEngagements";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
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

export function createEngagementId(): string {
  return `ENG-${Date.now().toString(36).toUpperCase()}`;
}

export const engagementService = {
  async list(filters: EngagementListFilters = {}): Promise<Engagement[]> {
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<Engagement[]>(
          FRAPPE_METHODS.listEngagements,
          {
            projectId: filters.projectId,
            ward: filters.ward,
            query: filters.query,
          },
        );
        if (Array.isArray(rows) && rows.length) {
          const local = typeof window !== "undefined" ? readLocal() : [];
          return applyFilters(mergeSeedAndLocal([...rows, ...local]), filters);
        }
      } catch {
        /* seed + local */
      }
    }
    const local = typeof window !== "undefined" ? readLocal() : [];
    return delay(applyFilters(mergeSeedAndLocal(local), filters));
  },

  async get(id: string): Promise<Engagement | null> {
    const rows = await this.list();
    return rows.find((r) => r.id === id) ?? null;
  },

  async save(row: Engagement): Promise<Engagement> {
    const local = readLocal().filter((r) => r.id !== row.id);
    local.push(row);
    writeLocal(local);
    return delay(row);
  },
};
