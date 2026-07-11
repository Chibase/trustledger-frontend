import { ReportBriefAssist } from "@/components/ai/ReportBriefAssist";

export default function AppReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Draft governance briefs from demo incident data. Review before sharing.
        </p>
      </div>
      <ReportBriefAssist />
    </div>
  );
}
