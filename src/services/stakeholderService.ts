import { mockStakeholders } from "@/data/mock/stakeholders";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import type {
  Stakeholder,
  StakeholderKind,
  StakeholderStatus,
} from "@/types/stakeholder";

const STORAGE_KEY = "tl-crm-stakeholders";

function delay<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function readLocal(): Stakeholder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Stakeholder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: Stakeholder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function mergeSeedAndLocal(local: Stakeholder[]): Stakeholder[] {
  const byId = new Map<string, Stakeholder>();
  for (const row of mockStakeholders) byId.set(row.id, row);
  for (const row of local) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type StakeholderListFilters = {
  kind?: StakeholderKind | "all";
  status?: StakeholderStatus | "all";
  placeId?: string;
  countryCode?: string;
  query?: string;
};

function applyFilters(
  rows: Stakeholder[],
  filters: StakeholderListFilters,
): Stakeholder[] {
  let next = rows;
  if (filters.kind && filters.kind !== "all") {
    next = next.filter((r) => r.kind === filters.kind);
  }
  if (filters.status && filters.status !== "all") {
    next = next.filter((r) => r.status === filters.status);
  }
  if (filters.placeId) {
    next = next.filter((r) => r.placeId === filters.placeId);
  }
  if (filters.countryCode) {
    next = next.filter((r) => r.countryCode === filters.countryCode);
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    next = next.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.organisation?.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.interests.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return next;
}

export const stakeholderService = {
  /** Server-safe list for dashboards/reports (Frappe live → seed). */
  async listServer(
    filters: StakeholderListFilters = {},
  ): Promise<Stakeholder[]> {
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<Stakeholder[]>(
          FRAPPE_METHODS.listStakeholders,
          {
            placeId: filters.placeId,
            kind: filters.kind === "all" ? undefined : filters.kind,
            countryCode: filters.countryCode,
            query: filters.query,
          },
        );
        if (Array.isArray(rows) && rows.length) {
          return applyFilters(rows, filters);
        }
      } catch {
        /* seed */
      }
    }
    return delay(applyFilters(mergeSeedAndLocal([]), filters));
  },

  async list(filters: StakeholderListFilters = {}): Promise<Stakeholder[]> {
    if (typeof window === "undefined") {
      return this.listServer(filters);
    }
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<Stakeholder[]>(
          FRAPPE_METHODS.listStakeholders,
          {
            placeId: filters.placeId,
            kind: filters.kind === "all" ? undefined : filters.kind,
            countryCode: filters.countryCode,
            query: filters.query,
          },
        );
        if (Array.isArray(rows) && rows.length) {
          const local = readLocal();
          return delay(
            applyFilters(mergeSeedAndLocal([...rows, ...local]), filters),
          );
        }
      } catch {
        /* local+seed */
      }
    }
    return delay(applyFilters(mergeSeedAndLocal(readLocal()), filters));
  },

  async get(id: string): Promise<Stakeholder | null> {
    if (isLiveMode()) {
      try {
        const row = await callFrappeMethod<Stakeholder | null>(
          FRAPPE_METHODS.getStakeholder,
          { name: id },
        );
        if (row) return row;
      } catch {
        /* seed */
      }
    }
    const rows = await this.list();
    return rows.find((r) => r.id === id) ?? null;
  },

  async save(input: Stakeholder): Promise<Stakeholder> {
    const local = readLocal().filter((r) => r.id !== input.id);
    const next = {
      ...input,
      source: input.source ?? "trial",
      updatedAt: new Date().toISOString(),
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    local.unshift(next);
    writeLocal(local);
    return delay(next);
  },
};
