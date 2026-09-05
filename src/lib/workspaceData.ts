/**
 * Unified workspace lists — customer mode never includes demo seed.
 */

import { isLiveMode } from "@/config/api";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import {
  listDemoEvidence,
  listDemoIncidents,
  listDemoProjects,
} from "@/lib/demoStore";
import {
  listOrgEvidence,
  listOrgIncidents,
  listOrgProjects,
} from "@/lib/orgDataSpace";
import { getActiveOrgId } from "@/lib/orgStore";
import { readTrialModeFromDocument } from "@/lib/trial";
import {
  listTrialEvidence,
  listTrialIncidents,
  listTrialProjects,
} from "@/lib/trialStore";
import { mergeProjectsWithDossiers } from "@/lib/projectDossier";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

function mergeById<T extends { id: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) map.set(row.id, row);
  return [...map.values()];
}

/** Live customer workspace (not trial) — Cloud list is source of record. */
export function isLiveCustomerClient(): boolean {
  return (
    isLiveMode() &&
    isCustomerWorkspaceClient() &&
    !readTrialModeFromDocument()
  );
}

/**
 * Use the Cloud/BFF list as-is for live customers (empty stays empty).
 * Trial and demo still merge the local workspace store.
 */
export function preferCloudProjectList(cloud: Project[]): Project[] {
  if (isLiveCustomerClient()) return cloud;
  return listWorkspaceProjects(cloud);
}

/**
 * Use the Cloud/BFF incident list as-is for live customers (empty stays empty).
 * Trial and demo still merge the local workspace store.
 */
export function preferCloudIncidentList(cloud: Incident[]): Incident[] {
  if (isLiveCustomerClient()) return cloud;
  return listWorkspaceIncidents(cloud);
}

/** Projects for the current browser workspace (with dossier overlay). */
export function listWorkspaceProjects(seed: Project[] = []): Project[] {
  const rows = isCustomerWorkspaceClient()
    ? mergeById([...listOrgProjects(getActiveOrgId()), ...listTrialProjects()])
    : mergeById([...mockProjects, ...seed, ...listDemoProjects()]);
  return mergeProjectsWithDossiers(rows);
}

/** Incidents for the current browser workspace. */
export function listWorkspaceIncidents(seed: Incident[] = []): Incident[] {
  if (isCustomerWorkspaceClient()) {
    const orgId = getActiveOrgId();
    return mergeById([...listOrgIncidents(orgId), ...listTrialIncidents()]);
  }
  return mergeById([...mockIncidents, ...seed, ...listDemoIncidents()]);
}

export function listWorkspaceEvidence(incidentId?: string): EvidenceStub[] {
  if (isCustomerWorkspaceClient()) {
    const orgId = getActiveOrgId();
    return mergeById([
      ...listOrgEvidence(incidentId, orgId),
      ...listTrialEvidence(incidentId),
    ]);
  }
  return listDemoEvidence(incidentId);
}
