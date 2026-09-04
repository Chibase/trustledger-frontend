import { ExecutivePortfolioDashboard } from "@/components/dashboard/ExecutivePortfolioDashboard";
import { SetupChecklistBanner } from "@/components/onboarding/SetupChecklistBanner";
import { PlanOwnerMasterPanel } from "@/components/org/PlanOwnerMasterPanel";
import { getCurrentUser } from "@/lib/auth";
import { isCustomerWorkspaceUser } from "@/lib/workspaceMode";
import { isVipShowcaseWorkspace } from "@/lib/planLabel";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";

/**
 * Workspace overview — overall graphs, then project dashboards for capture and reports.
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

  const vipShowcase = isVipShowcaseWorkspace(user.mode, user.isVip, user.email);

  return (
    <div className="space-y-7">
      {isPlanOwner || vipShowcase ? (
        <SetupChecklistBanner
          planId={user.trialPlan}
          vip={Boolean(user.isVip)}
          mode={user.mode}
          email={user.email}
        />
      ) : null}
      <ExecutivePortfolioDashboard
        role={user.role}
        planId={user.trialPlan}
        isPlanOwner={isPlanOwner}
        isVip={Boolean(user.isVip)}
        mode={user.mode}
        email={user.email}
        seedIncidents={incidents}
        seedProjects={projects}
      />
      {isPlanOwner ? <PlanOwnerMasterPanel /> : null}
    </div>
  );
}
