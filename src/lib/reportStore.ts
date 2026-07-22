/**
 * Persist authored reports (demo/trial browser store).
 */

import type { SavedReport } from "@/types/activityReport";

const KEY = "tl-authored-reports";

function readJson<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(value));
}

export function listSavedReports(): SavedReport[] {
  return readJson<SavedReport[]>([]).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function saveAuthoredReport(report: SavedReport) {
  const rows = listSavedReports().filter((r) => r.id !== report.id);
  rows.unshift(report);
  writeJson(rows);
}

export function getSavedReport(id: string): SavedReport | null {
  return listSavedReports().find((r) => r.id === id) ?? null;
}

export function createReportId(): string {
  return `RPT-${Date.now().toString().slice(-6)}`;
}
