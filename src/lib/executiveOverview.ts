/**
 * Derived executive overview — layout of the SRM reference mock,
 * values from workspace lists only. Never invent last-period %.
 */

import {
  latestPackCapture,
  listCaptureRecords,
} from "@/lib/captureStore";
import type { Engagement } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project, ProjectStatus } from "@/types/project";

export type MonthBucket = {
  key: string;
  label: string;
  startMs: number;
  endMs: number;
};

export type EngagementTrendPoint = {
  label: string;
  engagements: number;
  stakeholdersReached: number;
  grievances: number;
};

export type ProjectHealthMix = {
  onTrack: number;
  atRisk: number;
  delayed: number;
  total: number;
};

export type SocialImpactTotals = {
  localHireActual: number | null;
  localSuppliers: number | null;
  csiProgrammes: number | null;
  trainingDays: number | null;
};

export type OverviewActivity = {
  id: string;
  kind: "engagement" | "grievance" | "capture";
  title: string;
  at: string;
  href: string;
};

export type UpcomingEngagement = {
  id: string;
  title: string;
  heldOn: string;
  place: string;
  href: string;
};

export function welcomeFirstName(fullName: string | null | undefined): string | null {
  const first = (fullName || "").trim().split(/\s+/).filter(Boolean)[0];
  return first || null;
}

export function userInitials(fullName: string | null | undefined): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function isActiveDeliveryStatus(status: ProjectStatus): boolean {
  return status === "Active" || status === "Approved";
}

export function countActiveProjects(projects: Project[]): number {
  return projects.filter((p) => isActiveDeliveryStatus(p.status)).length;
}

export function countOpenCases(incidents: Incident[]): number {
  return incidents.filter((row) => row.status !== "Closed").length;
}

export function countHeldEngagements(
  engagements: Engagement[],
  startMs?: number,
  endMs?: number,
): number {
  return engagements.filter((row) => {
    if (row.status !== "held" && row.status !== "closed") return false;
    if (startMs == null || endMs == null) return true;
    const t = Date.parse(row.heldOn);
    if (!Number.isFinite(t)) return false;
    return t >= startMs && t <= endMs;
  }).length;
}

export function grievanceStatusSlices(incidents: Incident[]): Array<{
  label: string;
  value: number;
  color: string;
}> {
  let resolved = 0;
  let inProgress = 0;
  let open = 0;
  for (const row of incidents) {
    if (row.status === "Closed") resolved += 1;
    else if (row.status === "Open") open += 1;
    else inProgress += 1;
  }
  return [
    { label: "Resolved", value: resolved, color: "var(--tl-trust)" },
    { label: "In progress", value: inProgress, color: "var(--tl-amber)" },
    { label: "Open", value: open, color: "var(--tl-danger)" },
  ].filter((s) => s.value > 0);
}

function isDelayed(project: Project, nowMs: number): boolean {
  if (!isActiveDeliveryStatus(project.status)) return false;
  const end = Date.parse(project.targetEndDate || "");
  if (!Number.isFinite(end)) return false;
  return end < nowMs;
}

export function projectHealthMix(
  projects: Project[],
  nowMs = Date.now(),
): ProjectHealthMix {
  let onTrack = 0;
  let atRisk = 0;
  let delayed = 0;
  for (const project of projects) {
    if (project.status === "Completed" || project.status === "Closed") continue;
    if (project.status === "OnHold") {
      atRisk += 1;
      continue;
    }
    if (isDelayed(project, nowMs)) {
      delayed += 1;
      continue;
    }
    if (isActiveDeliveryStatus(project.status) || project.status === "Draft") {
      onTrack += 1;
    }
  }
  return {
    onTrack,
    atRisk,
    delayed,
    total: onTrack + atRisk + delayed,
  };
}

export function lastMonthBuckets(count = 6, now = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const y = now.getFullYear();
  const m = now.getMonth();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(y, m - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    buckets.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      label: start.toLocaleString("en-ZA", { month: "short" }),
      startMs: start.getTime(),
      endMs: end.getTime(),
    });
  }
  return buckets;
}

export function engagementTrendSeries(
  engagements: Engagement[],
  incidents: Incident[],
  buckets: MonthBucket[],
): EngagementTrendPoint[] {
  return buckets.map((bucket) => {
    const held = engagements.filter((row) => {
      const t = Date.parse(row.heldOn);
      return Number.isFinite(t) && t >= bucket.startMs && t <= bucket.endMs;
    });
    const reached = new Set<string>();
    for (const row of held) {
      for (const id of row.stakeholderIds) {
        if (id) reached.add(id);
      }
    }
    const grievances = incidents.filter((row) => {
      const t = Date.parse(row.reportedAt);
      return Number.isFinite(t) && t >= bucket.startMs && t <= bucket.endMs;
    }).length;
    return {
      label: bucket.label,
      engagements: held.length,
      stakeholdersReached: reached.size,
      grievances,
    };
  });
}

export function socialImpactFromPacks(projects: Project[]): SocialImpactTotals {
  let hire = 0;
  let hireOnFile = false;
  let suppliers = 0;
  let suppliersOnFile = false;
  let programmes = 0;
  let programmesOnFile = false;
  let training = 0;
  let trainingOnFile = false;

  for (const project of projects) {
    const emp = latestPackCapture(project.id, "employment");
    if (emp?.structured?.pack === "employment") {
      const actual = emp.structured.data.localHireActual;
      if (typeof actual === "number") {
        hire += actual;
        hireOnFile = true;
      }
      const days = emp.structured.data.trainingDays;
      if (typeof days === "number") {
        training += days;
        trainingOnFile = true;
      }
    }
    const bb = latestPackCapture(project.id, "bbbee");
    if (bb?.structured?.pack === "bbbee") {
      const n = bb.structured.data.localSupplierCount;
      if (typeof n === "number") {
        suppliers += n;
        suppliersOnFile = true;
      }
    }
    const csi = latestPackCapture(project.id, "csi");
    if (csi?.structured?.pack === "csi") {
      programmesOnFile = true;
      if (
        csi.structured.data.programmeName?.trim() ||
        typeof csi.structured.data.beneficiariesReached === "number"
      ) {
        programmes += 1;
      }
    }
  }

  return {
    localHireActual: hireOnFile ? hire : null,
    localSuppliers: suppliersOnFile ? suppliers : null,
    csiProgrammes: programmesOnFile ? programmes : null,
    trainingDays: trainingOnFile ? training : null,
  };
}

export function recentOverviewActivity(input: {
  incidents: Incident[];
  engagements: Engagement[];
  limit?: number;
}): OverviewActivity[] {
  const rows: OverviewActivity[] = [];
  for (const row of input.incidents) {
    rows.push({
      id: `inc:${row.id}`,
      kind: "grievance",
      title: row.title || row.id,
      at: row.reportedAt,
      href: `/app/incidents/${encodeURIComponent(row.id)}`,
    });
  }
  for (const row of input.engagements) {
    rows.push({
      id: `eng:${row.id}`,
      kind: "engagement",
      title: row.title || row.id,
      at: row.createdAt || row.heldOn,
      href: `/app/engagements/${encodeURIComponent(row.id)}`,
    });
  }
  for (const row of listCaptureRecords()) {
    rows.push({
      id: `cap:${row.id}`,
      kind: "capture",
      title: row.title || row.id,
      at: row.createdAt,
      href: "/app/capture",
    });
  }
  return rows
    .filter((row) => Boolean(row.at))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, input.limit ?? 6);
}

export function upcomingEngagements(
  engagements: Engagement[],
  nowMs = Date.now(),
  limit = 4,
): UpcomingEngagement[] {
  const today = new Date(nowMs);
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();
  return engagements
    .filter((row) => {
      if (row.status === "closed") return false;
      const t = Date.parse(row.heldOn);
      if (!Number.isFinite(t)) return false;
      return t >= start || row.status === "draft" || row.status === "follow_up";
    })
    .sort((a, b) => a.heldOn.localeCompare(b.heldOn))
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      title: row.title,
      heldOn: row.heldOn,
      place: row.placeLabel || row.ward || "Place not set",
      href: `/app/engagements/${encodeURIComponent(row.id)}`,
    }));
}

export function projectPlaceLabels(projects: Project[], limit = 6): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const project of projects) {
    const label =
      project.dossier?.geo?.wardName ||
      project.ward ||
      project.municipality ||
      "";
    const next = label.trim();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    labels.push(next);
    if (labels.length >= limit) break;
  }
  return labels;
}

export function formatRelativeDeskTime(
  iso: string,
  nowMs = Date.now(),
): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso || "—";
  const delta = nowMs - t;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return "Just now";
  if (delta < hour) return `${Math.floor(delta / minute)} min ago`;
  if (delta < day) return `${Math.floor(delta / hour)} h ago`;
  if (delta < 7 * day) return `${Math.floor(delta / day)} d ago`;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
  }).format(new Date(t));
}

export function formatDayBlock(iso: string): { day: string; month: string } {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return { day: "—", month: "" };
  const d = new Date(t);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString("en-ZA", { month: "short" }).toUpperCase(),
  };
}

export function formatPeriodLabel(buckets: MonthBucket[]): string {
  if (!buckets.length) return "On file";
  const first = new Date(buckets[0].startMs);
  const last = new Date(buckets[buckets.length - 1].endMs);
  const fmt = (d: Date) =>
    d.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(first)} – ${fmt(last)}`;
}

/** Display helper — never invent a count. */
export function countOrDash(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-ZA");
}
