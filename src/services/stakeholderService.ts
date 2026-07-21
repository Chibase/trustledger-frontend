import { mockStakeholders } from "@/data/mock/stakeholders";
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

function mergeAll(local: Stakeholder[]): Stakeholder[] {
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

export const stakeholderService = {
  async list(filters: StakeholderListFilters = {}): Promise<Stakeholder[]> {
    const local = typeof window !== "undefined" ? readLocal() : [];
    let rows = mergeAll(local);
    if (filters.kind && filters.kind !== "all") {
      rows = rows.filter((r) => r.kind === filters.kind);
    }
    if (filters.status && filters.status !== "all") {
      rows = rows.filter((r) => r.status === filters.status);
    }
    if (filters.placeId) {
      rows = rows.filter((r) => r.placeId === filters.placeId);
    }
    if (filters.countryCode) {
      rows = rows.filter((r) => r.countryCode === filters.countryCode);
    }
    if (filters.query?.trim()) {
      const q = filters.query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.organisation?.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.interests.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return delay(rows);
  },

  async get(id: string): Promise<Stakeholder | null> {
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
