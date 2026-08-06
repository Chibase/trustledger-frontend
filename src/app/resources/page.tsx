import type { Metadata } from "next";
import Link from "next/link";
import { HomeFooter } from "@/components/marketing/HomeFooter";
import { HomeHeader } from "@/components/marketing/HomeHeader";
import { ResourcesLibrary } from "@/components/resources/ResourcesLibrary";

export const metadata: Metadata = {
  title: "Free SRM resources",
  description:
    "Download free TrustLedger toolkits — grievance checklists, SRM readiness planners, and community engagement packs for teams building audit-ready trust.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Free SRM resources · TrustLedger",
    description:
      "Practical checklists and frameworks for grievance management, readiness planning, and community engagement.",
  },
};

export default function ResourcesPage() {
  return (
    <>
      <HomeHeader />
      <main>
        <section
          className="relative overflow-hidden bg-gradient-to-br from-[#0a3d36] via-[#0e7c66] to-[#12202a]"
          aria-labelledby="resources-hero-title"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 50% at 80% 10%, rgba(255,255,255,0.16), transparent), radial-gradient(ellipse 50% 40% at 0% 90%, rgba(18,32,42,0.5), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <p className="animate-[tl-banner-in_400ms_ease-out] font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              TrustLedger
            </p>
            <h1
              id="resources-hero-title"
              className="mt-4 max-w-xl animate-[tl-banner-in_500ms_ease-out] font-display text-2xl font-semibold leading-snug text-white/95 sm:text-3xl"
            >
              Free tools for audit-ready trust
            </h1>
            <p className="mt-4 max-w-lg animate-[tl-banner-in_600ms_ease-out] text-base leading-relaxed text-white/80 sm:text-lg">
              Checklists, planners, and engagement packs you can use today —
              then close the gaps with TrustLedger when you are ready.
            </p>
          </div>
        </section>

        <section className="bg-tl-paper px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm text-tl-ink-muted">
              Work email unlocks each printable pack. Prefer a scored diagnostic
              first?{" "}
              <Link
                href="/assessment?utm_source=resources&utm_medium=hero&utm_campaign=readiness"
                className="font-medium text-tl-trust-ink underline underline-offset-2"
              >
                Take the SRM readiness check
              </Link>
              .
            </p>
            <ResourcesLibrary />
          </div>
        </section>
      </main>
      <HomeFooter />
    </>
  );
}
