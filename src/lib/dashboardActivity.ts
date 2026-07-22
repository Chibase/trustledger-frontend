/**
 * Shared metrics for Activity + Reports dashboards (demo/workspace seed).
 */

import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

export type ProjectActivityRow = {
  project: Project;
  open: number;
  escalated: number;
  breached: number;
  highRisk: number;
  trustIndex: number;
  trustLabel: string;
};

export function buildProjectActivity(
  projects: Project[],
  incidents: Incident[],
): ProjectActivityRow[] {
  return projects.map((project) => {
    const rows = incidents.filter((i) => i.projectId === project.id);
    const open = rows.filter((i) => i.status !== "Closed");
    const escalated = open.filter(
      (i) => i.status === "Escalated" || i.escalationLevel !== "None",
    );
    const breached = open.filter((i) => i.slaBreached);
    const highRisk = open.filter(
      (i) => i.priority === "P1-Critical" || i.priority === "P2-High",
    );
    const pulse = trustIndexFromIncidents(rows);
    return {
      project,
      open: open.length,
      escalated: escalated.length,
      breached: breached.length,
      highRisk: highRisk.length,
      trustIndex: pulse.trustIndex,
      trustLabel: pulse.label,
    };
  });
}

export function statusBars(incidents: Incident[]) {
  const counts: Record<string, number> = {};
  for (const i of incidents) {
    counts[i.status] = (counts[i.status] || 0) + 1;
  }
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

export function priorityBars(incidents: Incident[]) {
  const order = ["P1-Critical", "P2-High", "P3-Medium", "P4-Low"];
  return order.map((label) => ({
    label: label.replace(/^P\d-/, ""),
    value: incidents.filter((i) => i.priority === label).length,
  }));
}

export function projectOpenBars(rows: ProjectActivityRow[]) {
  return rows
    .map((r) => ({
      label: r.project.name.split("—")[0]?.trim().slice(0, 18) || r.project.id,
      value: r.open,
    }))
    .filter((b) => b.value > 0)
    .slice(0, 6);
}
