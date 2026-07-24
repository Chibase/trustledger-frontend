/**
 * T3 — org-scoped data space (browser until Frappe SoT / T5).
 * Isolates customer projects, cases, evidence from demo seed.
 */

import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Stakeholder } from "@/types/stakeholder";
import type { SavedReport } from "@/types/activityReport";
import { getActiveOrgId } from "@/lib/orgStore";
import {
  listTrialEvidence,
  listTrialIncidents,
  listTrialProjects,
  saveTrialEvidence,
  saveTrialIncident,
  saveTrialProject,
} from "@/lib/trialStore";

const ROOT_KEY = "tl-org-data";

export type OrgDataBucket = {
  orgId: string;
  projects: Project[];
  incidents: Incident[];
  evidence: EvidenceStub[];
  stakeholders: Stakeholder[];
  updatedAt: string;
};

function readRoot(): Record<string, OrgDataBucket> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, OrgDataBucket>;
  } catch {
    return {};
  }
}

function writeRoot(map: Record<string, OrgDataBucket>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROOT_KEY, JSON.stringify(map));
}

function emptyBucket(orgId: string): OrgDataBucket {
  return {
    orgId,
    projects: [],
    incidents: [],
    evidence: [],
    stakeholders: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Resolve active org bucket; migrate legacy tl-trial-* once. */
export function getOrgDataBucket(orgId?: string | null): OrgDataBucket | null {
  const id = orgId || getActiveOrgId();
  if (!id) return null;
  const root = readRoot();
  if (root[id]) return root[id];

  // One-time migrate flat trial keys into this org.
  const migrated = emptyBucket(id);
  migrated.projects = listTrialProjects().map((p) => ({ ...p, orgId: id }) as Project & {
    orgId?: string;
  });
  migrated.incidents = listTrialIncidents().map((i) => ({
    ...i,
    orgId: id,
  }) as Incident & { orgId?: string });
  migrated.evidence = listTrialEvidence();
  migrated.updatedAt = new Date().toISOString();
  root[id] = migrated;
  writeRoot(root);
  return migrated;
}

function saveBucket(bucket: OrgDataBucket) {
  const root = readRoot();
  bucket.updatedAt = new Date().toISOString();
  root[bucket.orgId] = bucket;
  writeRoot(root);
}

export function listOrgProjects(orgId?: string | null): Project[] {
  return getOrgDataBucket(orgId)?.projects ?? [];
}

export function listOrgIncidents(orgId?: string | null): Incident[] {
  return getOrgDataBucket(orgId)?.incidents ?? [];
}

export function listOrgEvidence(
  incidentId?: string,
  orgId?: string | null,
): EvidenceStub[] {
  const rows = getOrgDataBucket(orgId)?.evidence ?? [];
  if (!incidentId) return rows;
  return rows.filter((e) => e.incidentId === incidentId);
}

export function listOrgStakeholders(orgId?: string | null): Stakeholder[] {
  return getOrgDataBucket(orgId)?.stakeholders ?? [];
}

export function saveOrgProject(project: Project, orgId?: string | null) {
  const id = orgId || getActiveOrgId();
  if (!id) {
    saveTrialProject(project);
    return;
  }
  const bucket = getOrgDataBucket(id) || emptyBucket(id);
  const stamped = { ...project, orgId: id } as Project & { orgId?: string };
  bucket.projects = [
    stamped,
    ...bucket.projects.filter((p) => p.id !== project.id),
  ];
  saveBucket(bucket);
  // Keep trial mirror for older readers until fully cut over.
  saveTrialProject(stamped);
}

export function saveOrgIncident(incident: Incident, orgId?: string | null) {
  const id = orgId || getActiveOrgId();
  if (!id) {
    saveTrialIncident(incident);
    return;
  }
  const bucket = getOrgDataBucket(id) || emptyBucket(id);
  const stamped = { ...incident, orgId: id } as Incident & { orgId?: string };
  bucket.incidents = [
    stamped,
    ...bucket.incidents.filter((i) => i.id !== incident.id),
  ];
  saveBucket(bucket);
  saveTrialIncident(stamped);
}

export function saveOrgEvidence(file: EvidenceStub, orgId?: string | null) {
  const id = orgId || getActiveOrgId();
  if (!id) {
    saveTrialEvidence(file);
    return;
  }
  const bucket = getOrgDataBucket(id) || emptyBucket(id);
  bucket.evidence = [file, ...bucket.evidence.filter((e) => e.id !== file.id)];
  saveBucket(bucket);
  saveTrialEvidence(file);
}

export function saveOrgStakeholder(
  row: Stakeholder,
  orgId?: string | null,
) {
  const id = orgId || getActiveOrgId();
  if (!id) return;
  const bucket = getOrgDataBucket(id) || emptyBucket(id);
  const stamped = { ...row, source: "trial" as const };
  bucket.stakeholders = [
    stamped,
    ...bucket.stakeholders.filter((s) => s.id !== row.id),
  ];
  saveBucket(bucket);
}

export function orgDataSummary(orgId?: string | null): {
  projects: number;
  incidents: number;
  evidence: number;
  stakeholders: number;
} {
  const b = getOrgDataBucket(orgId);
  return {
    projects: b?.projects.length ?? 0,
    incidents: b?.incidents.length ?? 0,
    evidence: b?.evidence.length ?? 0,
    stakeholders: b?.stakeholders.length ?? 0,
  };
}

export function clearOrgData(orgId?: string | null) {
  const id = orgId || getActiveOrgId();
  if (!id) return;
  const root = readRoot();
  root[id] = emptyBucket(id);
  writeRoot(root);
}

export function createOrgProjectId(): string {
  return `PRJ-${Date.now().toString().slice(-6)}`;
}

export function createOrgIncidentId(): string {
  return `INC-${Date.now().toString().slice(-6)}`;
}

/** Parse simple CSV (header row). Returns objects keyed by header. */
export function parseCsvObjects(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export type ImportResult = {
  projects: number;
  incidents: number;
  errors: string[];
};

/**
 * Import customer CSV into the active org data space.
 * Projects headers: name, client/funder, ward, municipality, contractor, summary
 * Incidents headers: title, description, project, ward, priority, status
 */
export function importOrgCsv(input: {
  projectsCsv?: string;
  incidentsCsv?: string;
  orgId?: string | null;
}): ImportResult {
  const errors: string[] = [];
  let projects = 0;
  let incidents = 0;
  const id = input.orgId || getActiveOrgId();
  const projectByName = new Map<string, Project>();

  for (const p of listOrgProjects(id)) {
    projectByName.set(p.name.toLowerCase(), p);
  }

  if (input.projectsCsv?.trim()) {
    const rows = parseCsvObjects(input.projectsCsv);
    if (!rows.length) errors.push("Projects CSV needs a header row and data.");
    for (const row of rows) {
      const name =
        row.name || row.project || row.project_name || row["project name"];
      if (!name) {
        errors.push("Skipped project row without name.");
        continue;
      }
      const today = new Date().toISOString().slice(0, 10);
      const project: Project = {
        id: createOrgProjectId(),
        name,
        clientFunder: row.client || row.funder || row.client_funder || "",
        budgetTotal: Number(row.budget || row.budget_total || 0) || 0,
        budgetSpent: Number(row.spent || row.budget_spent || 0) || 0,
        ward: row.ward || "",
        municipality: row.municipality || row.muni || "",
        status: "Active",
        contractorName: row.contractor || "",
        startDate: row.start || row.start_date || today,
        targetEndDate: row.end || row.target_end || today,
        publicSummary: row.summary || row.description || "",
      };
      saveOrgProject(project, id);
      projectByName.set(name.toLowerCase(), project);
      projects += 1;
    }
  }

  if (input.incidentsCsv?.trim()) {
    const rows = parseCsvObjects(input.incidentsCsv);
    if (!rows.length) errors.push("Incidents CSV needs a header row and data.");
    const defaultProject =
      listOrgProjects(id)[0] ||
      ([...projectByName.values()][0] ?? null);
    for (const row of rows) {
      const title = row.title || row.issue || row.case;
      if (!title) {
        errors.push("Skipped incident row without title.");
        continue;
      }
      const projectName =
        row.project || row.project_name || row["project name"] || "";
      const project =
        (projectName && projectByName.get(projectName.toLowerCase())) ||
        defaultProject;
      if (!project) {
        errors.push(`No project for incident “${title}” — import projects first.`);
        continue;
      }
      const priority = parsePriority(row.priority);
      const status = parseStatus(row.status);
      const now = new Date().toISOString();
      const incident: Incident = {
        id: createOrgIncidentId(),
        title,
        description: row.description || row.detail || "",
        ward: row.ward || project.ward || "",
        geographicArea: row.area || project.municipality || "",
        status,
        priority,
        projectId: project.id,
        projectName: project.name,
        reportedByRole: "admin",
        reportedAt: now,
        slaDueBy: now,
        slaBreached: false,
        escalationLevel: status === "Escalated" ? "L1" : "None",
        ownerName: row.owner || "Plan Owner",
        category: row.category || "General",
        impactScore: 50,
        sentimentScore: null,
        timeline: [
          {
            id: `evt-${Date.now()}`,
            type: "created",
            summary: "Imported into org data space",
            at: now,
          },
        ],
      };
      saveOrgIncident(incident, id);
      incidents += 1;
    }
  }

  return { projects, incidents, errors };
}

function parsePriority(raw?: string): Incident["priority"] {
  const v = (raw || "P3").toUpperCase();
  if (v.includes("1") || v.includes("CRIT")) return "P1-Critical";
  if (v.includes("2") || v.includes("HIGH")) return "P2-High";
  if (v.includes("4") || v.includes("LOW")) return "P4-Low";
  return "P3-Medium";
}

function parseStatus(raw?: string): Incident["status"] {
  const v = (raw || "Open").toLowerCase();
  if (v.includes("escalat")) return "Escalated";
  if (v.includes("clos")) return "Closed";
  if (v.includes("invest")) return "Investigating";
  return "Open";
}
