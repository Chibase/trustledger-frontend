import type { IndicatorBriefSuggestion } from "@/types/ai";

export type SavedIndicatorBrief = {
  id: string;
  placeId: string;
  placeName: string;
  title: string;
  executiveSummary: string;
  watchpoints: string[];
  recommendedActions: string[];
  indicatorKeys: string[];
  model: string;
  promptVersion: string;
  createdAt: string;
};

const STORAGE_KEY = "tl-esg-briefs";

function readAll(): SavedIndicatorBrief[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedIndicatorBrief[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: SavedIndicatorBrief[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function listIndicatorBriefs(placeId?: string): SavedIndicatorBrief[] {
  const rows = readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!placeId) return rows;
  return rows.filter((r) => r.placeId === placeId);
}

export function saveIndicatorBrief(input: {
  placeId: string;
  placeName: string;
  suggestion: IndicatorBriefSuggestion;
}): SavedIndicatorBrief {
  const row: SavedIndicatorBrief = {
    id: `ESG-${Date.now().toString(36).toUpperCase()}`,
    placeId: input.placeId,
    placeName: input.placeName,
    title: input.suggestion.title,
    executiveSummary: input.suggestion.executiveSummary,
    watchpoints: input.suggestion.watchpoints,
    recommendedActions: input.suggestion.recommendedActions,
    indicatorKeys: input.suggestion.indicatorKeys,
    model: input.suggestion.model,
    promptVersion: input.suggestion.promptVersion,
    createdAt: new Date().toISOString(),
  };
  writeAll([row, ...readAll()]);
  return row;
}
