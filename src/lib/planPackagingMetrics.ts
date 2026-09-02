/**
 * Lightweight packaging telemetry (plan type + module only — no mailbox).
 */

import type { PlanDashboardModuleKey } from "@/types/planPackaging";

const KEY = "tl-plan-packaging-metrics";

type EventName =
  | "module_visit"
  | "executive_drill"
  | "empty_state_cta";

type Counts = Record<string, number>;

function readCounts(): Counts {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Counts;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function bump(event: EventName, moduleKey: PlanDashboardModuleKey) {
  if (typeof window === "undefined") return;
  const counts = readCounts();
  const id = `${event}:${moduleKey}`;
  counts[id] = (counts[id] || 0) + 1;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(counts));
  } catch {
    /* quota */
  }
  void fetch("/api/telemetry/plan-packaging", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, moduleKey }),
  }).catch(() => undefined);
}

export function recordModuleVisit(key: PlanDashboardModuleKey) {
  bump("module_visit", key);
}

export function recordExecutiveDrill(key: PlanDashboardModuleKey) {
  bump("executive_drill", key);
}

export function recordEmptyStateCta(key: PlanDashboardModuleKey) {
  bump("empty_state_cta", key);
}
