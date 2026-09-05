import { isLiveMode } from "@/config/api";
import {
  listWorkspaceIncidents,
  listWorkspaceProjects,
  preferCloudIncidentList,
  preferCloudProjectList,
} from "@/lib/workspaceData";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";
import { commitmentService } from "@/services/commitmentService";
import type { Commitment } from "@/types/commitment";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

/**
 * UX-1 leftover — report packs bind to live Cloud lists.
 * Empty Cloud stays empty (no demo INC-* bleed).
 */
export async function loadReportWorkspaceLists(): Promise<{
  projects: Project[];
  incidents: Incident[];
  commitments: Commitment[];
}> {
  if (isLiveMode()) {
    const [projects, incidents, commitments] = await Promise.all([
      projectService.list().catch(() => [] as Project[]),
      incidentService.list().catch(() => [] as Incident[]),
      commitmentService.list().catch(() => [] as Commitment[]),
    ]);
    return {
      projects: preferCloudProjectList(projects),
      incidents: preferCloudIncidentList(incidents),
      commitments,
    };
  }
  const commitments = await commitmentService.list().catch(() => [] as Commitment[]);
  return {
    projects: listWorkspaceProjects(),
    incidents: listWorkspaceIncidents(),
    commitments,
  };
}
