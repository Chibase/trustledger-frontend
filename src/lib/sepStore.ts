/**
 * Browser store for Stakeholder Engagement Plans.
 * Trial / VIP seed stay here. Live entitled workspaces use `sepPersist`
 * (Cloud SoT, this key is a cache). Empty Cloud stays empty.
 */

import type { EngagementPlan } from "@/types/engagementPlan";
import { TL_ORG_ID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { getActiveOrgId } from "@/lib/orgStore";

const ROOT_KEY = "tl-engagement-plans";

type Root = Record<string, EngagementPlan[]>;

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

function scopeKey(): string {
  const org =
    getActiveOrgId()?.trim() || readCookie(TL_ORG_ID_COOKIE)?.trim();
  if (org) return `org:${org}`;
  const email = readCookie(TL_USER_EMAIL_COOKIE)?.trim().toLowerCase();
  if (email) return `email:${email}`;
  return "local";
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

export function listEngagementPlansForProject(
  projectId: string,
): EngagementPlan[] {
  const id = projectId.trim();
  if (!id) return [];
  return listEngagementPlans().filter((row) => row.projectId === id);
}

export function saveEngagementPlan(plan: EngagementPlan): EngagementPlan {
  const next: EngagementPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
  };
  cacheEngagementPlan(next);
  return next;
}

/** Write a plan into the local cache without bumping updatedAt (Cloud hydrate). */
export function cacheEngagementPlan(plan: EngagementPlan) {
  if (typeof window === "undefined") return;
  const root = readRoot();
  const key = scopeKey();
  const rows = (root[key] || []).filter((row) => row.id !== plan.id);
  rows.unshift(plan);
  root[key] = rows.slice(0, 40);
  writeRoot(root);
}

export function deleteEngagementPlan(id: string) {
  const root = readRoot();
  const key = scopeKey();
  root[key] = (root[key] || []).filter((row) => row.id !== id);
  writeRoot(root);
}
