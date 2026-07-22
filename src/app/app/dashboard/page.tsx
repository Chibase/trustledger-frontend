import { ActivityDashboard } from "@/components/dashboard/ActivityDashboard";
import { PlanOwnerMasterPanel } from "@/components/org/PlanOwnerMasterPanel";
import { getCurrentUser } from "@/lib/auth";
import { isCustomerWorkspaceUser } from "@/lib/workspaceMode";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";

/**
 * Activity dashboard — overall navigation + project activity pulse.
 * Customer/trial workspaces get empty RSC seeds (no demo contamination).
 */
export default async function AppDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const customer = isCustomerWorkspaceUser(user);
  const [incidents, projects] = customer
    ? [[], []]
    : await Promise.all([incidentService.list(), projectService.list()]);

  const isPlanOwner =
    user.isPlanOwner === true ||
    (user.role === "admin" && (user.mode === "trial" || Boolean(user.orgId)));

  return (
    <div className="space-y-7">
      {isPlanOwner ? <PlanOwnerMasterPanel /> : null}
      <ActivityDashboard
        role={user.role}
        planId={user.trialPlan}
        isPlanOwner={isPlanOwner}
        seedIncidents={incidents}
        seedProjects={projects}
      />
    </div>
  );
}
