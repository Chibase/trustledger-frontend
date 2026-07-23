import { mockCommitments } from "@/data/mockCommitments";
import { isLiveMode } from "@/config/api";
import type { Commitment, CommitmentStatus } from "@/types/commitment";

const STORAGE_KEY = "tl-commitments";

function delay<T>(value: T, ms = 60): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function readLocal(): Commitment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Commitment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(rows: Commitment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function mergeSeedAndLocal(local: Commitment[]): Commitment[] {
  const byId = new Map<string, Commitment>();
  for (const row of mockCommitments) byId.set(row.id, row);
  for (const row of local) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

export type CommitmentListFilters = {
  status?: CommitmentStatus | "all";
  projectId?: string;
  engagementId?: string;
  query?: string;
};

function applyFilters(
  rows: Commitment[],
  filters: CommitmentListFilters,
): Commitment[] {
  let next = rows;
  if (filters.status && filters.status !== "all") {
    next = next.filter((r) => r.status === filters.status);
  }
  if (filters.projectId) {
    next = next.filter((r) => r.projectId === filters.projectId);
  }
  if (filters.engagementId) {
    next = next.filter((r) => r.engagementId === filters.engagementId);
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    next = next.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ownerLabel.toLowerCase().includes(q) ||
        (r.evidenceNote?.toLowerCase().includes(q) ?? false),
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

async function listFromCloudSi(): Promise<Commitment[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/frappe/si?kind=commitment", {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (res.status === 404) return [];
    if (!res.ok) return null;
    const json = (await res.json()) as { rows?: Commitment[] };
    return Array.isArray(json.rows) ? json.rows : [];
  } catch {
    return null;
  }
}

async function saveToCloudSi(row: Commitment): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/frappe/si", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ kind: "commitment", commitment: row }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function createCommitmentId(): string {
  return `COM-${Date.now().toString(36).toUpperCase()}`;
}

export const commitmentService = {
  async list(filters: CommitmentListFilters = {}): Promise<Commitment[]> {
    const own = await isOwnDataWorkspace();

    if (typeof window !== "undefined" && isLiveMode()) {
      const cloud = await listFromCloudSi();
      if (cloud) {
        const local = readLocal();
        const byId = new Map<string, Commitment>();
        for (const row of cloud) byId.set(row.id, row);
        for (const row of local) byId.set(row.id, row);
        return applyFilters(
          [...byId.values()].sort((a, b) => a.dueOn.localeCompare(b.dueOn)),
          filters,
        );
      }
      if (own) {
        return delay(applyFilters(readLocal(), filters));
      }
    }

    if (own) {
      return delay(applyFilters(readLocal(), filters));
    }

    const local = typeof window !== "undefined" ? readLocal() : [];
    return delay(applyFilters(mergeSeedAndLocal(local), filters));
  },

  async get(id: string): Promise<Commitment | null> {
    const rows = await this.list();
    return rows.find((r) => r.id === id) ?? null;
  },

  async save(row: Commitment): Promise<Commitment> {
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
