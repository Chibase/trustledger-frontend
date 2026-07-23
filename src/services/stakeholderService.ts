import { mockStakeholders } from "@/data/mock/stakeholders";
import { isLiveMode } from "@/config/api";
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

async function isOwnDataWorkspace(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { readTrialModeFromDocument } = await import("@/lib/trial");
  const { isCustomerWorkspaceClient } = await import("@/lib/workspaceMode");
  return readTrialModeFromDocument() || isCustomerWorkspaceClient();
}

async function listFromCloudSi(): Promise<Stakeholder[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/frappe/si?kind=stakeholder", {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) return [];
    if (!res.ok) return null;
    const json = (await res.json()) as { rows?: Stakeholder[] };
    return Array.isArray(json.rows) ? json.rows : [];
  } catch {
    return null;
  }
}

async function saveToCloudSi(row: Stakeholder): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/frappe/si", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ kind: "stakeholder", stakeholder: row }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function createStakeholderId(): string {
  return `STK-${Date.now().toString(36).toUpperCase()}`;
}

export const stakeholderService = {
  /** Server-safe list for dashboards/reports (Cloud SI → empty/own; never seed for customers). */
  async listServer(
    filters: StakeholderListFilters = {},
  ): Promise<Stakeholder[]> {
    // RSC / server: no browser Cloud session — return empty (no seed bleed).
    return delay(applyFilters([], filters));
  },

  async list(filters: StakeholderListFilters = {}): Promise<Stakeholder[]> {
    if (typeof window === "undefined") {
      return this.listServer(filters);
    }

    const own = await isOwnDataWorkspace();

    if (isLiveMode()) {
      const cloud = await listFromCloudSi();
      if (cloud) {
        const local = readLocal().filter((r) => r.source !== "seed");
        const byId = new Map<string, Stakeholder>();
        for (const row of cloud) byId.set(row.id, row);
        for (const row of local) byId.set(row.id, row);
        return delay(
          applyFilters(
            [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
            filters,
          ),
        );
      }
      if (own) {
        return delay(applyFilters(readLocal().filter((r) => r.source !== "seed"), filters));
      }
    }

    if (own) {
      return delay(applyFilters(readLocal().filter((r) => r.source !== "seed"), filters));
    }

    return delay(applyFilters(mergeSeedAndLocal(readLocal()), filters));
  },

  async get(id: string): Promise<Stakeholder | null> {
    const rows = await this.list();
    return rows.find((r) => r.id === id) ?? null;
  },

  async save(input: Stakeholder): Promise<Stakeholder> {
    const next: Stakeholder = {
      ...input,
      source:
        input.source === "seed"
          ? "seed"
          : isLiveMode()
            ? "live"
            : input.source ?? "trial",
      updatedAt: new Date().toISOString(),
      createdAt: input.createdAt ?? new Date().toISOString(),
    };

    if (typeof window !== "undefined" && isLiveMode()) {
      const pushed = await saveToCloudSi(next);
      if (pushed) {
        const local = readLocal().filter((r) => r.id !== next.id);
        writeLocal(local);
        return delay({ ...next, source: "live" });
      }
    }

    const local = readLocal().filter((r) => r.id !== next.id);
    local.unshift(next);
    writeLocal(local);
    return delay(next);
  },
};
