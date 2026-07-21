import { getDataMode } from "@/config/api";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import { averageTatHours, countOverStageTarget } from "@/lib/tatMetrics";
import { geoService } from "@/services/geoService";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";
import { stakeholderService } from "@/services/stakeholderService";
import { STAKEHOLDER_KIND_LABELS } from "@/types/stakeholder";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Stakeholder } from "@/types/stakeholder";

export type ClientPortfolioBrief = {
  generatedAt: string;
  dataMode: "demo" | "live";
  dataSourceNote: string;
  trust: {
    trustIndex: number;
    avgSentiment: number | null;
    sampleSize: number;
    label: "Strong" | "Watch" | "At risk" | "Unknown";
    avgTatHours: number | null;
    openOverTarget: number;
  };
  kpis: {
    projects: number;
    activeProjects: number;
    budgetTotal: number;
    budgetSpent: number;
    openIncidents: number;
    highPriority: number;
    slaBreaches: number;
    stakeholders: number;
    highInfluenceStakeholders: number;
    provinces: number;
    wards: number;
    traditionalCouncils: number;
  };
  openRisk: Incident[];
  projects: Project[];
  stakeholdersByKind: { kind: string; label: string; count: number }[];
  highInfluence: Stakeholder[];
  talkingPoints: string[];
  /** All incidents for TrustPulse / stage views. */
  incidents: Incident[];
};

/**
 * Client-facing portfolio + governance intel from the same services
 * the backend contract exposes (mock seed today; Frappe when live).
 */
export async function buildClientPortfolioBrief(): Promise<ClientPortfolioBrief> {
  const dataMode = getDataMode();
  const [totals, incidents, projects, stakeholders, geoCounts, pack] =
    await Promise.all([
      projectService.portfolioTotals(),
      incidentService.list(),
      projectService.list(),
      stakeholderService.listServer(),
      geoService.countsByLevel(),
      geoService.getPack(),
    ]);

  const open = incidents.filter((i) => i.status !== "Closed");
  const highPriority = open.filter(
    (i) => i.priority === "P1-Critical" || i.priority === "P2-High",
  );
  const slaBreaches = open.filter((i) => i.slaBreached);
  const highInfluence = stakeholders.filter(
    (s) => s.influence === "high" && s.status === "active",
  );
  const trustBase = trustIndexFromIncidents(incidents);
  const avgTat = averageTatHours(incidents);
  const overTarget = countOverStageTarget(open);

  const kindMap = new Map<string, number>();
  for (const s of stakeholders) {
    kindMap.set(s.kind, (kindMap.get(s.kind) ?? 0) + 1);
  }
  const stakeholdersByKind = [...kindMap.entries()]
    .map(([kind, count]) => ({
      kind,
      label:
        STAKEHOLDER_KIND_LABELS[kind as keyof typeof STAKEHOLDER_KIND_LABELS] ??
        kind,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const talkingPoints = [
    `Trust index ${trustBase.trustIndex}/100 (${trustBase.label}) from ${trustBase.sampleSize} sentiment-scored cases.`,
    `${totals.projectCount} projects in portfolio (${totals.activeCount} active).`,
    `${open.length} open grievances; ${highPriority.length} high priority; ${slaBreaches.length} SLA breaches; ${overTarget} over stage TAT.`,
    avgTat !== null
      ? `Average turnaround ${avgTat}h (reported → resolved/closed where completed).`
      : "Turnaround averages appear once cases reach resolved/closed.",
    `${stakeholders.length} stakeholders in CRM (${highInfluence.length} high influence).`,
    pack
      ? `Geography pack “${pack.pack.label}”: ${geoCounts.ward ?? 0} wards, ${geoCounts.traditional_council ?? 0} traditional councils.`
      : "No geography pack loaded.",
    dataMode === "live"
      ? "Data mode: live (Frappe) with seed fallback if methods are unavailable."
      : "Data mode: demo/seed — same shapes as Frappe contract for go-live.",
  ];

  return {
    generatedAt: new Date().toISOString(),
    dataMode,
    dataSourceNote:
      dataMode === "live"
        ? "Live Frappe methods when available; otherwise Version 002 seed packs (geo + CRM) and mock portfolio."
        : "Demo seed mirrors backend contract (projects, incidents, geo pack, stakeholder CRM).",
    trust: {
      ...trustBase,
      avgTatHours: avgTat,
      openOverTarget: overTarget,
    },
    kpis: {
      projects: totals.projectCount,
      activeProjects: totals.activeCount,
      budgetTotal: totals.budgetTotal,
      budgetSpent: totals.budgetSpent,
      openIncidents: open.length,
      highPriority: highPriority.length,
      slaBreaches: slaBreaches.length,
      stakeholders: stakeholders.length,
      highInfluenceStakeholders: highInfluence.length,
      provinces: geoCounts.province ?? 0,
      wards: geoCounts.ward ?? 0,
      traditionalCouncils: geoCounts.traditional_council ?? 0,
    },
    openRisk: highPriority.slice(0, 8),
    projects: projects.slice(0, 8),
    stakeholdersByKind,
    highInfluence: highInfluence.slice(0, 6),
    talkingPoints,
    incidents,
  };
}
