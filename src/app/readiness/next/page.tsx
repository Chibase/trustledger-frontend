import type { Metadata } from "next";
import { Suspense } from "react";
import { ReadinessHub } from "@/components/readiness/ReadinessHub";

export const metadata: Metadata = {
  title: "Readiness next steps",
  description:
    "Choose how to close your SRM gaps — view your report, explore TrustLedger, start a trial, or request a walkthrough.",
  robots: { index: false, follow: false },
};

export default function ReadinessNextPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-4 py-14">
          <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
          <p className="mt-3 text-sm text-tl-ink-muted">Loading hub…</p>
        </main>
      }
    >
      <ReadinessHub />
    </Suspense>
  );
}
