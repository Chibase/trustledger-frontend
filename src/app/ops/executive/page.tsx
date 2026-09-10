import { PlatformCommandCentre } from "@/components/dashboard/PlatformCommandCentre";
import { getCurrentUser } from "@/lib/auth";
import { isCustomerWorkspaceUser } from "@/lib/workspaceMode";
import { incidentService } from "@/services/incidentService";

export const dynamic = "force-dynamic";

export default async function ExecutiveBoardPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const customer = isCustomerWorkspaceUser(user);

  const incidents = customer ? [] : await incidentService.list();

  return (
    <PlatformCommandCentre
  role={user.role}
  planId={user.trialPlan}
      isVip={Boolean(user.isVip)}
      mode={user.mode}
      email={user.email}
      userName={user.name}
      seedIncidents={incidents}
    />
  );
}