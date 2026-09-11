import { PrestigeFounderCommandCentre } from "@/components/ops/PrestigeFounderCommandCentre";
import { getCurrentUser } from "@/lib/auth";
import { isCustomerWorkspaceUser } from "@/lib/workspaceMode";
import { incidentService } from "@/services/incidentService";
import { buildExecutiveBrief } from "@/lib/executiveIntel";
import { listRecentPayments } from "@/lib/paymentIntel";
import { buildOpsOverview } from "@/lib/opsIntel";

export const dynamic = "force-dynamic";

export default async function ExecutiveBoardPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const customer = isCustomerWorkspaceUser(user);

  const [brief, payments, incidents, opsOverview] = await Promise.all([
    buildExecutiveBrief(),
    listRecentPayments(10),
    customer ? [] : incidentService.list(),
    buildOpsOverview(),
  ]);

  return (
    <PrestigeFounderCommandCentre
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        mode: user.mode,
        trialPlan: user.trialPlan,
        isVip: Boolean(user.isVip),
        orgId: user.orgId,
      }}
      brief={brief}
      payments={payments}
      seedIncidents={incidents}
      opsOverview={opsOverview}
    />
  );
}