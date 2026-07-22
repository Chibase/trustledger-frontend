import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

const INCIDENTS_KEY = "tl-demo-incidents";
const EVIDENCE_KEY = "tl-demo-evidence";
const PROJECTS_KEY = "tl-demo-projects";

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

export function listDemoIncidents(): Incident[] {
  return readJson<Incident[]>(INCIDENTS_KEY, []);
}

export function saveDemoIncident(incident: Incident) {
  const rows = listDemoIncidents().filter((i) => i.id !== incident.id);
  rows.unshift(incident);
  writeJson(INCIDENTS_KEY, rows);
}

export function listDemoEvidence(incidentId?: string): EvidenceStub[] {
  const rows = readJson<EvidenceStub[]>(EVIDENCE_KEY, []);
  if (!incidentId) return rows;
  return rows.filter((e) => e.incidentId === incidentId);
}

export function saveDemoEvidence(file: EvidenceStub) {
  const rows = listDemoEvidence();
  rows.unshift(file);
  writeJson(EVIDENCE_KEY, rows);
}

export function createDemoIncidentId(): string {
  return `INC-D${Date.now().toString().slice(-6)}`;
}

export function listDemoProjects(): Project[] {
  return readJson<Project[]>(PROJECTS_KEY, []);
}

export function saveDemoProject(project: Project) {
  const rows = listDemoProjects().filter((p) => p.id !== project.id);
  rows.unshift(project);
  writeJson(PROJECTS_KEY, rows);
}

export function createDemoProjectId(): string {
  return `PRJ-D${Date.now().toString().slice(-6)}`;
}
