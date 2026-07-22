/**
 * Unified workspace lists — customer mode never includes demo seed.
 */

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
import {
  listTrialEvidence,
  listTrialIncidents,
  listTrialProjects,
} from "@/lib/trialStore";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

function mergeById<T extends { id: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of rows) map.set(row.id, row);
  return [...map.values()];
}

/** Projects for the current browser workspace. */
export function listWorkspaceProjects(seed: Project[] = []): Project[] {
  if (isCustomerWorkspaceClient()) {
    const orgId = getActiveOrgId();
    return mergeById([...listOrgProjects(orgId), ...listTrialProjects()]);
  }
  return mergeById([...mockProjects, ...seed, ...listDemoProjects()]);
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
