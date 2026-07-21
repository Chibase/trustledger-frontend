import { getCurrentUser } from "@/lib/auth";
import { buildClientPortfolioBrief } from "@/lib/clientPortfolioIntel";
import { ClientGovernanceReport } from "@/components/client/ClientGovernanceReport";
import { ReportBriefAssist } from "@/components/ai/ReportBriefAssist";

export default async function AppReportsPage() {
  const user = await getCurrentUser();
  const isClientFacing =
    user?.role === "client" || user?.role === "admin";

  if (isClientFacing) {
    const brief = await buildClientPortfolioBrief();
    return <ClientGovernanceReport brief={brief} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Draft governance briefs from workspace incident data. Review before
          sharing.
        </p>
      </div>
      <ReportBriefAssist />
    </div>
  );
}
