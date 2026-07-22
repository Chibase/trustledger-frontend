import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { ReportsHub } from "@/components/reports/ReportsHub";
import { getCurrentUser } from "@/lib/auth";

export default async function AppReportsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const isPlanOwner =
    user.isPlanOwner === true ||
    (user.role === "admin" && (user.mode === "trial" || Boolean(user.orgId)));

  return (
    <FeatureGate capability="governanceReports">
      <ReportsHub
        role={user.role}
        authorName={user.name}
        planId={user.trialPlan}
        isPlanOwner={isPlanOwner}
      />
    </FeatureGate>
  );
}
