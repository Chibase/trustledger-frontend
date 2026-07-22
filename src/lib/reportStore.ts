/**
 * Persist authored reports (demo/trial browser store).
 */

import { looksLikeReportTemplateGuide } from "@/lib/reportComposer";
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

function isTemplateGuideReport(report: SavedReport): boolean {
  const blob = `${report.title}\n${report.bodyMarkdown}`;
  return looksLikeReportTemplateGuide(blob);
}

/**
 * Drop Month-End / placeholder drafts left over from Cloud LLM experiments.
 * Returns how many rows were removed.
 */
export function purgeTemplateGuideReports(): number {
  const rows = readJson<SavedReport[]>([]);
  const kept = rows.filter((r) => !isTemplateGuideReport(r));
  const removed = rows.length - kept.length;
  if (removed > 0) writeJson(kept);
  return removed;
}

export function clearAllSavedReports(): void {
  writeJson([]);
}

export function listSavedReports(): SavedReport[] {
  purgeTemplateGuideReports();
  return readJson<SavedReport[]>([]).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function saveAuthoredReport(report: SavedReport) {
  if (isTemplateGuideReport(report)) {
    throw new Error(
      "Refusing to save a fill-in-the-blank template. Re-run AI write with the evidence writer.",
    );
  }
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
