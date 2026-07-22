/**
 * Runtime mode and Frappe API configuration.
 * Demo remains default so Vercel works without Frappe Cloud.
 */

export type DataMode = "demo" | "live";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function getDataMode(): DataMode {
  const raw = (process.env.NEXT_PUBLIC_DATA_MODE ?? "demo").toLowerCase();
  return raw === "live" ? "live" : "demo";
}

export function isDemoMode(): boolean {
  return getDataMode() !== "live";
}

export function isLiveMode(): boolean {
  return getDataMode() === "live";
}

/** Whitelisted method paths expected on srm-core (Phase 2+). */
export const FRAPPE_METHODS = {
  listProjects: "/api/method/srm_core.api.projects.list_projects",
  getProject: "/api/method/srm_core.api.projects.get_project",
  listIncidents: "/api/method/srm_core.api.incidents.list_incidents",
  getIncident: "/api/method/srm_core.api.incidents.get_incident",
  listNotes: "/api/method/srm_core.api.engagements.list_meeting_notes",
  listEvidence: "/api/method/srm_core.api.incidents.list_evidence",
  suggestTriage: "/api/method/srm_core.api.ai.suggest_triage",
  suggestSentiment: "/api/method/srm_core.api.ai.suggest_sentiment",
  draftResponse: "/api/method/srm_core.api.ai.draft_response",
  // Report brief + activity compose stay local (reportComposer). Do not wire
  // these Cloud methods — Grok returns Month-End / [Insert …] sales templates.
  suggestStakeholdersFromText:
    "/api/method/srm_core.api.ai.suggest_stakeholders_from_text",
  getSession: "/api/method/srm_core.api.auth.get_session",
  listGeoPlaces: "/api/method/srm_core.api.geo.list_places",
  getGeoPlace: "/api/method/srm_core.api.geo.get_place",
  listSocioIndicators: "/api/method/srm_core.api.geo.list_indicators",
  listStakeholders: "/api/method/srm_core.api.stakeholders.list_stakeholders",
  getStakeholder: "/api/method/srm_core.api.stakeholders.get_stakeholder",
} as const;
