/**
 * Browser store for Stakeholder Engagement Plans (trial / live until a Cloud DocType exists).
 */

import type { EngagementPlan } from "@/types/engagementPlan";
import { getActiveOrgId } from "@/lib/orgStore";

const ROOT_KEY = "tl-engagement-plans";

type Root = Record<string, EngagementPlan[]>;

function scopeKey(): string {
  return getActiveOrgId() || "session";
}

function readRoot(): Root {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Root;
  } catch {
    return {};
  }
}

function writeRoot(root: Root) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROOT_KEY, JSON.stringify(root));
}

export function listEngagementPlans(): EngagementPlan[] {
  try {
    const rows = readRoot()[scopeKey()] || [];
    return [...rows].sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || ""),
    );
  } catch {
    return [];
  }
}

export function getEngagementPlan(id: string): EngagementPlan | null {
  return listEngagementPlans().find((row) => row.id === id) || null;
}

export function saveEngagementPlan(plan: EngagementPlan): EngagementPlan {
  const next: EngagementPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };
  const root = readRoot();
  const key = scopeKey();
  const rows = (root[key] || []).filter((row) => row.id !== next.id);
  rows.unshift(next);
  root[key] = rows.slice(0, 40);
  writeRoot(root);
  return next;
}

export function deleteEngagementPlan(id: string) {
  const root = readRoot();
  const key = scopeKey();
  root[key] = (root[key] || []).filter((row) => row.id !== id);
  writeRoot(root);
}
