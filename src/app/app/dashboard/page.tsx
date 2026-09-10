import { ExecutivePortfolioDashboard } from "@/components/dashboard/ExecutivePortfolioDashboard";
import { PlatformCommandCentre } from "@/components/dashboard/PlatformCommandCentre";
import { SetupChecklistBanner } from "@/components/onboarding/SetupChecklistBanner";
import { getCurrentUser } from "@/lib/auth";
import { isCustomerWorkspaceUser } from "@/lib/workspaceMode";
import { isVipShowcaseWorkspace } from "@/lib/planLabel";
import { incidentService } from "@/services/incidentService";
import { projectService } from "@/services/projectService";

/**
 * Workspace overview — routes plan owners to the Platform Command Centre (RPT-04)
 * and all other users to the Executive Portfolio Dashboard.
 * Dashboard separation (owner / org / project / QA) is maintained.
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

  // Plan Owner — Platform Command Centre (RPT-04)
  if (isPlanOwner) {
    return (
      <div className="space-y-7">
        {vipShowcase ? (
          <SetupChecklistBanner
            planId={user.trialPlan}
            vip={Boolean(user.isVip)}
            mode={user.mode}
            email={user.email}
          />
        ) : null}
        <PlatformCommandCentre
          role={user.role}
          planId={user.trialPlan}
          isPlanOwner={isPlanOwner}
          isVip={Boolean(user.isVip)}
          mode={user.mode}
          email={user.email}
          userName={user.name}
          seedIncidents={incidents}
        />
      </div>
    );
  }

  // Organisation / project users — existing dashboard unchanged
  return (
    <div className="space-y-7">
      <ExecutivePortfolioDashboard
        role={user.role}
        planId={user.trialPlan}
        isPlanOwner={isPlanOwner}
        isVip={Boolean(user.isVip)}
        mode={user.mode}
        email={user.email}
        userName={user.name}
        seedIncidents={incidents}
        seedProjects={projects}
      />
    </div>
  );
}
