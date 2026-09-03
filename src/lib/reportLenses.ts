/**
 * Distinct report lenses so monthly / executive / funder packs do not
 * render the same narrative. Local evidence only — never Cloud month-end.
 */

import {
  PROCESS_STAGE_LABELS,
  ensureProcessStages,
  nextPendingStage,
  stageTimestamp,
} from "@/lib/grievanceProcess";
import type {
  ReportFormatId,
  ReportKind,
} from "@/types/activityReport";
import type { Incident, IncidentPriority } from "@/types/incident";
import type { ProjectPromise } from "@/types/project";
import type { ReportPackId } from "@/types/reportPacks";

export const REPORT_LENSES = ["monthly", "executive", "funder"] as const;
export type ReportLens = (typeof REPORT_LENSES)[number];

export type ImpactBand = "Critical" | "High" | "Medium" | "Low";

export type ExecutiveRiskRow = {
  id: string;
  issue: string;
  projectName: string;
  projectImpact: string;
  impactLevel: ImpactBand;
  impactLevelDetail: string;
  mitigation: string;
  processStage: string;
  expectedOutcome: string;
  executiveAction: string | null;
};

export type FunderMaterialItem = {
  id: string;
  line: string;
};

export type FunderSnapshot = {
  trustIndex: number;
  trustLabel: string;
  openCount: number;
  closedCount: number;
  highRiskCount: number;
  slaBreachedCount: number;
  materialItems: FunderMaterialItem[];
  asks: string[];
};

export type LensChartBar = { label: string; value: number };

export type LensChartGroup = {
  caption: string;
  bars: LensChartBar[];
  orientation: "horizontal" | "vertical";
};

const PRIORITY_BAND: Record<IncidentPriority, ImpactBand> = {
  "P1-Critical": "Critical",
  "P2-High": "High",
  "P3-Medium": "Medium",
  "P4-Low": "Low",
};

export function reportLensForKind(kind: ReportKind): ReportLens {
  if (kind === "executive_risk") return "executive";
  if (kind === "board_investor") return "funder";
  return "monthly";
}

export function reportLensForPack(packId: ReportPackId): ReportLens {
  if (packId === "executive") return "executive";
  if (packId === "board_presentation") return "funder";
  return "monthly";
}

export function defaultFormatForLens(lens: ReportLens): ReportFormatId {
  if (lens === "monthly") return "charts_details";
  return "charts";
}

export function defaultKindForPack(packId: ReportPackId): ReportKind {
  if (packId === "executive") return "executive_risk";
  if (packId === "board_presentation") return "board_investor";
  return "monthly_activity";
}

/** Executive and funder packs use a fixed brief — topic pickers must not imply otherwise. */
export function lensUsesFixedBrief(
  lens: ReportLens,
): lens is Exclude<ReportLens, "monthly"> {
  return lens === "executive" || lens === "funder";
}

export const FIXED_BRIEF_OUTLINE: Record<
  Exclude<ReportLens, "monthly">,
  string[]
> = {
  executive: [
    "Identified issues",
    "Project impact",
    "Impact level",
    "Mitigation in progress",
    "Mitigation process",
    "Expected outcome",
    "What executives can expedite",
  ],
  funder: [
    "Assurance snapshot",
    "Material items",
    "What we are asking",
  ],
};

/** True when saved markdown already matches this kind’s lens (skip recompose). */
export function savedBodyMatchesLens(kind: ReportKind, body: string): boolean {
  const text = body.trim();
  if (!text) return false;
  const lens = reportLensForKind(kind);
  if (lens === "executive") {
    return /## Identified issues/i.test(text) && /Executive action/i.test(text);
  }
  if (lens === "funder") {
    return /## Assurance snapshot/i.test(text) && /What we are asking/i.test(text);
  }
  // Monthly and other detailed kinds keep the stored narrative.
  return true;
}

/** Case ids cited in a saved or composed report body. */
export function citedIncidentIds(body: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of body.matchAll(/\bINC-[A-Z0-9-]+\b/gi)) {
    const id = match[0];
    const key = id.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(id);
  }
  return out;
}

function riskRank(incident: Incident): number {
  let n = incident.impactScore || 0;
  if (incident.priority === "P1-Critical") n += 40;
  else if (incident.priority === "P2-High") n += 25;
  else if (incident.priority === "P3-Medium") n += 10;
  if (incident.slaBreached) n += 20;
  if (incident.status === "Escalated") n += 12;
  if (incident.escalationLevel === "L3") n += 10;
  else if (incident.escalationLevel === "L2") n += 6;
  if (incident.status === "Closed") n -= 50;
  return n;
}

function uniqueIncidents(rows: Incident[]): Incident[] {
  const seen = new Set<string>();
  const out: Incident[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export function rankIncidentsForRisk(incidents: Incident[]): Incident[] {
  return uniqueIncidents(incidents).sort((a, b) => riskRank(b) - riskRank(a));
}

export function impactBandForIncident(incident: Incident): ImpactBand {
  if (incident.priority === "P1-Critical") return "Critical";
  if (incident.priority === "P2-High" || incident.slaBreached) return "High";
  if (
    incident.priority === "P3-Medium" ||
    incident.status === "Escalated" ||
    incident.escalationLevel !== "None"
  ) {
    return "Medium";
  }
  return PRIORITY_BAND[incident.priority] || "Low";
}

export function impactLevelDetail(incident: Incident): string {
  const bits: string[] = [incident.priority];
  if (incident.slaBreached) bits.push("SLA breached");
  if (incident.escalationLevel && incident.escalationLevel !== "None") {
    bits.push(`Escalation ${incident.escalationLevel}`);
  }
  bits.push(incident.status);
  return bits.join(" · ");
}

export function mitigationProcessLabel(incident: Incident): string {
  if (!incident.processStages?.reportedAt) {
    switch (incident.status) {
      case "Closed":
        return "Closed";
      case "Escalated":
        return "Escalated — senior intervention";
      case "Investigating":
        return "Investigating — mitigation in progress";
      default:
        return "Reported — awaiting resource";
    }
  }
  const stages = ensureProcessStages(incident);
  const pending = nextPendingStage(stages);
  const completedKey = (
    ["closed", "verified", "resolved", "investigated", "resource_deployed", "reported"] as const
  ).find((key) => stageTimestamp(stages, key));
  const completed = completedKey
    ? PROCESS_STAGE_LABELS[completedKey]
    : "Reported";
  if (!pending) return "Closed — verified on the ledger";
  return `${completed} complete · next: ${PROCESS_STAGE_LABELS[pending]}`;
}

function firstSentence(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const match = clean.match(/^(.+?[.!?])(\s|$)/);
  const sentence = (match?.[1] || clean).trim();
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
}

export function projectImpactLine(incident: Incident): string {
  const fromDescription = firstSentence(incident.description || "");
  const site = incident.projectName || "this project";
  const delay = incident.slaBreached
    ? " SLA is already breached, so verified close-out is slipping."
    : " Until this stage completes, verified close-out on the site is held back.";
  if (fromDescription) {
    return `${fromDescription} Affects ${site}.${delay}`;
  }
  return `Open ${incident.category || "community"} matter on ${site} (${incident.status}).${delay}`;
}

function linkedPromises(
  incident: Incident,
  promises: ProjectPromise[] | undefined,
): ProjectPromise[] {
  if (!promises?.length) return [];
  const hay = `${incident.title} ${incident.category} ${incident.nature || ""}`.toLowerCase();
  return promises.filter((p) => {
    const status = p.status || "open";
    if (status === "fulfilled") return false;
    const text = `${p.text} ${p.ownerLabel || ""}`.toLowerCase();
    return hay.split(/\s+/).some((w) => w.length > 4 && text.includes(w));
  });
}

export function mitigationInProgress(
  incident: Incident,
  promises?: ProjectPromise[],
): string {
  const linked = linkedPromises(incident, promises);
  if (linked.length) {
    return linked
      .slice(0, 2)
      .map((p) => {
        const owner = p.ownerLabel ? ` · ${p.ownerLabel}` : "";
        return `${p.text} (${p.status || "open"}${owner})`;
      })
      .join("; ");
  }
  if (incident.escalationPolicy?.reason) {
    return `${incident.ownerName} assigned. ${incident.escalationPolicy.reason}`;
  }
  return `${incident.ownerName} is working the case at ${mitigationProcessLabel(incident)}.`;
}

export function expectedOutcomeLine(incident: Incident): string {
  if (incident.status === "Closed") {
    return "Closed and verified on the ledger.";
  }
  if (incident.slaBreached || incident.priority === "P1-Critical") {
    return `Verified close-out of ${incident.id} with evidence, restoring access/service on ${incident.projectName || "site"} without a further SLA slip.`;
  }
  return `Verified close-out with evidence on the ledger; community feedback recorded against ${incident.id}.`;
}

export function executiveActionLine(incident: Incident): string | null {
  const stage = mitigationProcessLabel(incident);
  const band = impactBandForIncident(incident);
  if (incident.status === "Closed") return null;
  if (
    band === "Critical" ||
    incident.escalationLevel === "L3" ||
    incident.slaBreached
  ) {
    return `Authorise extra capacity, confirm site access, or direct the contractor/owner this week so ${incident.id} can move from “${stage}” to resolved.`;
  }
  if (band === "High" || incident.escalationLevel === "L2") {
    return `Confirm owner and unblock the next process stage on ${incident.id} this week.`;
  }
  return null;
}

export function buildExecutiveRiskRows(
  incidents: Incident[],
  options?: { promises?: ProjectPromise[]; limit?: number },
): ExecutiveRiskRow[] {
  const limit = options?.limit ?? 12;
  const ranked = rankIncidentsForRisk(incidents).filter(
    (i) => i.status !== "Closed" || impactBandForIncident(i) === "Critical",
  );
  const pool = ranked.length ? ranked : rankIncidentsForRisk(incidents);
  return pool.slice(0, limit).map((incident) => ({
    id: incident.id,
    issue: incident.title,
    projectName: incident.projectName,
    projectImpact: projectImpactLine(incident),
    impactLevel: impactBandForIncident(incident),
    impactLevelDetail: impactLevelDetail(incident),
    mitigation: mitigationInProgress(incident, options?.promises),
    processStage: mitigationProcessLabel(incident),
    expectedOutcome: expectedOutcomeLine(incident),
    executiveAction: executiveActionLine(incident),
  }));
}

export function executiveImpactChartBars(
  rows: ExecutiveRiskRow[],
): LensChartBar[] {
  const order: ImpactBand[] = ["Critical", "High", "Medium", "Low"];
  return order.map((label) => ({
    label,
    value: rows.filter((r) => r.impactLevel === label).length,
  }));
}

export function executiveStageChartBars(
  rows: ExecutiveRiskRow[],
): LensChartBar[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const short = row.processStage.split("·")[0]?.trim().slice(0, 22) || "Stage";
    counts.set(short, (counts.get(short) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .slice(0, 6);
}

export function buildFunderSnapshot(
  incidents: Incident[],
  options?: {
    trustIndex: number;
    trustLabel: string;
  },
): FunderSnapshot {
  const open = incidents.filter((i) => i.status !== "Closed");
  const closed = incidents.filter((i) => i.status === "Closed");
  const highRisk = open.filter(
    (i) =>
      i.priority === "P1-Critical" ||
      i.priority === "P2-High" ||
      i.slaBreached,
  );
  const material = rankIncidentsForRisk(open).slice(0, 5);
  const closedLead =
    material.length > 0 ? [] : rankIncidentsForRisk(closed).slice(0, 5);
  const leadForAsks = material.length ? material : closedLead;
  const asks = leadForAsks
    .map((i) => executiveActionLine(i))
    .filter((line): line is string => Boolean(line))
    .slice(0, 3);

  const materialSource = material.length ? material : closedLead;

  return {
    trustIndex: options?.trustIndex ?? 0,
    trustLabel: options?.trustLabel ?? "Watch",
    openCount: open.length,
    closedCount: closed.length,
    highRiskCount: highRisk.length,
    slaBreachedCount: open.filter((i) => i.slaBreached).length,
    materialItems: materialSource.map((i) => ({
      id: i.id,
      line: `${i.id} — ${i.title} (${impactBandForIncident(i)} on ${i.projectName || "site"})${i.status === "Closed" ? " · closed" : ""}.`,
    })),
    asks: asks.length
      ? asks
      : highRisk.length === 0
        ? ["No material asks this period — continue routine assurance."]
        : ["Confirm owners on the material items above before the next steering cycle."],
  };
}

export function funderChartGroups(snapshot: FunderSnapshot): LensChartGroup[] {
  return [
    {
      caption: "Delivery position",
      orientation: "vertical",
      bars: [
        { label: "Open", value: snapshot.openCount },
        { label: "Closed", value: snapshot.closedCount },
        { label: "High risk", value: snapshot.highRiskCount },
      ],
    },
    {
      caption: "Assurance",
      orientation: "horizontal",
      bars: [
        { label: "Trust", value: snapshot.trustIndex },
        { label: "SLA pressure", value: snapshot.slaBreachedCount },
      ],
    },
  ];
}

export function monthlyChartGroups(
  incidents: Incident[],
  categoryBars: LensChartBar[],
): LensChartGroup[] {
  const statusCounts: Record<string, number> = {};
  for (const i of incidents) {
    statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
  }
  const status = Object.entries(statusCounts).map(([label, value]) => ({
    label,
    value,
  }));
  const order = ["P1-Critical", "P2-High", "P3-Medium", "P4-Low"];
  const priority = order.map((p) => ({
    label: p.replace(/^P\d-/, ""),
    value: incidents.filter((i) => i.priority === p).length,
  }));
  const groups: LensChartGroup[] = [
    { caption: "Case status mix", orientation: "vertical", bars: status },
    { caption: "Priority mix", orientation: "horizontal", bars: priority },
  ];
  if (categoryBars.some((b) => b.value > 0)) {
    groups.push({
      caption: "Mapped category signals",
      orientation: "horizontal",
      bars: categoryBars.slice(0, 8),
    });
  }
  return groups.filter((g) => g.bars.some((b) => b.value > 0));
}

export function executiveChartGroups(
  rows: ExecutiveRiskRow[],
): LensChartGroup[] {
  const groups: LensChartGroup[] = [
    {
      caption: "Impact level",
      orientation: "vertical",
      bars: executiveImpactChartBars(rows),
    },
    {
      caption: "Mitigation process",
      orientation: "horizontal",
      bars: executiveStageChartBars(rows),
    },
  ];
  return groups.filter((g) => g.bars.some((b) => b.value > 0));
}
