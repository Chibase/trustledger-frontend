import type { Metadata } from "next";
import { Suspense } from "react";
import { ReadinessReport } from "@/components/readiness/ReadinessReport";

export const metadata: Metadata = {
  title: "Your SRM readiness report",
  description:
    "Score overview, dimension detail, and TrustLedger turnaround timeframes for your SRM readiness diagnostic.",
  robots: { index: false, follow: false },
};

export default function ReadinessReportPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-14">
          <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
          <p className="mt-3 text-sm text-tl-ink-muted">Loading report…</p>
        </main>
      }
    >
      <ReadinessReport />
    </Suspense>
  );
}
