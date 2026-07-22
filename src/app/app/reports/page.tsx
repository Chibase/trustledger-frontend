import { getCurrentUser } from "@/lib/auth";
import { CreateReportWizard } from "@/components/reports/CreateReportWizard";
import { FeatureGate } from "@/components/entitlements/FeatureGate";

export default async function AppReportsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <FeatureGate capability="governanceReports">
      <CreateReportWizard role={user.role} authorName={user.name} />
    </FeatureGate>
  );
}
