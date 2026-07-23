import { mockCommitments } from "@/data/mockCommitments";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
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

export function createCommitmentId(): string {
  return `COM-${Date.now().toString(36).toUpperCase()}`;
}

export const commitmentService = {
  async list(filters: CommitmentListFilters = {}): Promise<Commitment[]> {
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<Commitment[]>(
          FRAPPE_METHODS.listCommitments,
          {
            projectId: filters.projectId,
            engagementId: filters.engagementId,
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

  async get(id: string): Promise<Commitment | null> {
    const rows = await this.list();
    return rows.find((r) => r.id === id) ?? null;
  },

  async save(row: Commitment): Promise<Commitment> {
    const local = readLocal().filter((r) => r.id !== row.id);
    local.push(row);
    writeLocal(local);
    return delay(row);
  },
};
