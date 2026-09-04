/**
 * Overall chart series for product dashboards.
 * Portfolio / workspace totals only — not row-level operational tables.
 */

import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import { PROJECT_STATUS_OPTIONS, type ProjectStatus } from "@/types/project";
import type { Engagement } from "@/types/engagement";

export type OverviewBar = { label: string; value: number };

const PRIORITY_ORDER = [
  "P1-Critical",
  "P2-High",
  "P3-Medium",
  "P4-Low",
] as const;

const PRIORITY_LABEL: Record<(typeof PRIORITY_ORDER)[number], string> = {
  "P1-Critical": "P1",
  "P2-High": "P2",
  "P3-Medium": "P3",
  "P4-Low": "P4",
};

const STATUS_FUNNEL = ["Open", "Investigating", "Escalated", "Closed"] as const;

export function projectStatusBars(projects: Project[]): OverviewBar[] {
  const counts = new Map<ProjectStatus, number>();
  for (const status of PROJECT_STATUS_OPTIONS) counts.set(status, 0);
  for (const project of projects) {
    counts.set(project.status, (counts.get(project.status) ?? 0) + 1);
  }
  return PROJECT_STATUS_OPTIONS.map((status) => ({
    label: status === "OnHold" ? "On hold" : status,
    value: counts.get(status) ?? 0,
  })).filter((row) => row.value > 0);
}

export function incidentPriorityBars(incidents: Incident[]): OverviewBar[] {
  const open = incidents.filter((row) => row.status !== "Closed");
  const counts = new Map<string, number>();
  for (const key of PRIORITY_ORDER) counts.set(key, 0);
  for (const row of open) {
    counts.set(row.priority, (counts.get(row.priority) ?? 0) + 1);
  }
  return PRIORITY_ORDER.map((key) => ({
    label: PRIORITY_LABEL[key],
    value: counts.get(key) ?? 0,
  })).filter((row) => row.value > 0);
}

export function incidentStatusFunnel(incidents: Incident[]): OverviewBar[] {
  const counts = new Map<string, number>();
  for (const status of STATUS_FUNNEL) counts.set(status, 0);
  for (const row of incidents) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return STATUS_FUNNEL.map((status) => ({
    label: status,
    value: counts.get(status) ?? 0,
  }));
}

export function budgetMixBars(input: {
  budget: number;
  spent: number;
  available: number;
}): OverviewBar[] {
  const bars = [
    { label: "Budget", value: Math.max(0, Math.round(input.budget)) },
    { label: "Spent", value: Math.max(0, Math.round(input.spent)) },
    { label: "Available", value: Math.max(0, Math.round(input.available)) },
  ];
  return bars.some((row) => row.value > 0) ? bars : [];
}

export function namedShareBars(
  rows: Array<{ label: string; count: number }>,
): OverviewBar[] {
  return rows
    .filter((row) => row.count > 0)
    .map((row) => ({ label: row.label, value: row.count }));
}

export function engagementSentimentBars(engagements: Engagement[]): OverviewBar[] {
  const counts = { positive: 0, neutral: 0, negative: 0 };
  for (const row of engagements) {
    if (row.sentimentLabel === "positive") counts.positive += 1;
    else if (row.sentimentLabel === "neutral") counts.neutral += 1;
    else if (row.sentimentLabel === "negative") counts.negative += 1;
  }
  return (
    [
      { label: "Positive", value: counts.positive },
      { label: "Neutral", value: counts.neutral },
      { label: "Negative", value: counts.negative },
    ] as OverviewBar[]
  ).filter((row) => row.value > 0);
}
