import type { Metadata } from "next";
import { Suspense } from "react";
import { AssessmentWizard } from "@/components/assessment/AssessmentWizard";

export const metadata: Metadata = {
  title: "SRM Readiness Assessment",
  description:
    "Free 5–8 minute SRM Readiness & Risk Diagnostic. Get your readiness score, risk level, top 3 priorities, and 90-day action plan.",
  openGraph: {
    title: "SRM Readiness Assessment · TrustLedger",
    description:
      "Evaluate grievance management, community engagement, and governance reporting maturity.",
  },
};

export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            SRM Readiness &amp; Risk Diagnostic
          </h1>
          <p className="mt-3 text-sm text-tl-ink-muted">Loading assessment…</p>
        </main>
      }
    >
      <AssessmentWizard />
    </Suspense>
  );
}
