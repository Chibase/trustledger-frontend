import { isLiveMode } from "@/config/api";
import {
  listWorkspaceIncidents,
  listWorkspaceProjects,
  preferCloudIncidentList,
  preferCloudProjectList,
} from "@/lib/workspaceData";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

/**
 * UX-1 leftover — report packs bind to live Cloud lists.
 * Empty Cloud stays empty (no demo INC-* bleed).
 */
export async function loadReportWorkspaceLists(): Promise<{
  projects: Project[];
  incidents: Incident[];
}> {
  if (isLiveMode()) {
    const [projects, incidents] = await Promise.all([
      projectService.list().catch(() => [] as Project[]),
      incidentService.list().catch(() => [] as Incident[]),
    ]);
    return {
      projects: preferCloudProjectList(projects),
      incidents: preferCloudIncidentList(incidents),
    };
  }
  return {
    projects: listWorkspaceProjects(),
    incidents: listWorkspaceIncidents(),
  };
}
