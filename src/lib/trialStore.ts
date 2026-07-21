import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

const INCIDENTS_KEY = "tl-trial-incidents";
const EVIDENCE_KEY = "tl-trial-evidence";
const PROJECTS_KEY = "tl-trial-projects";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listTrialIncidents(): Incident[] {
  return readJson<Incident[]>(INCIDENTS_KEY, []);
}

export function saveTrialIncident(incident: Incident) {
  const rows = listTrialIncidents().filter((i) => i.id !== incident.id);
  rows.unshift(incident);
  writeJson(INCIDENTS_KEY, rows);
}

export function listTrialEvidence(incidentId?: string): EvidenceStub[] {
  const rows = readJson<EvidenceStub[]>(EVIDENCE_KEY, []);
  if (!incidentId) return rows;
  return rows.filter((e) => e.incidentId === incidentId);
}

export function saveTrialEvidence(file: EvidenceStub) {
  const rows = listTrialEvidence();
  rows.unshift(file);
  writeJson(EVIDENCE_KEY, rows);
}

export function listTrialProjects(): Project[] {
  return readJson<Project[]>(PROJECTS_KEY, []);
}

export function saveTrialProject(project: Project) {
  const rows = listTrialProjects().filter((p) => p.id !== project.id);
  rows.unshift(project);
  writeJson(PROJECTS_KEY, rows);
}

export function createTrialIncidentId(): string {
  return `INC-T${Date.now().toString().slice(-6)}`;
}

export function ensureTrialSeedProject(): Project {
  const existing = listTrialProjects();
  if (existing[0]) return existing[0];
  const today = new Date().toISOString().slice(0, 10);
  const project: Project = {
    id: "PRJ-TRIAL",
    name: "My first project",
    clientFunder: "",
    budgetTotal: 0,
    budgetSpent: 0,
    ward: "",
    municipality: "",
    status: "Active",
    contractorName: "",
    startDate: today,
    targetEndDate: today,
    publicSummary: "Add your project details — this workspace starts empty.",
  };
  saveTrialProject(project);
  return project;
}
