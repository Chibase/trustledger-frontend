import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomeFooter } from "@/components/marketing/HomeFooter";
import { HomeHeader } from "@/components/marketing/HomeHeader";

export const metadata: Metadata = {
  title: "SRM Readiness Check",
  description:
    "Know your stakeholder relationship management risk in under 8 minutes. Free TrustLedger readiness diagnostic with score, priorities, and a clear turnaround path.",
  alternates: { canonical: "/readiness" },
  openGraph: {
    title: "SRM Readiness Check · TrustLedger",
    description:
      "Score grievance intake, ownership, field practice, engagement, reporting, and assurance — then choose how to close the gaps.",
  },
};

export default function ReadinessPromoPage() {
  return (
    <>
      <HomeHeader />
      <main>
        <section
          className="relative min-h-[min(100svh,52rem)] overflow-hidden bg-gradient-to-br from-[#0a3d36] via-[#0e7c66] to-[#12202a]"
          aria-labelledby="readiness-hero-title"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 50% at 70% 20%, rgba(255,255,255,0.18), transparent), radial-gradient(ellipse 60% 40% at 10% 80%, rgba(18,32,42,0.45), transparent)",
            }}
          />
          <div className="relative mx-auto flex min-h-[min(100svh,52rem)] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:px-8 lg:pb-24 lg:pt-24">
            <p className="animate-[tl-banner-in_400ms_ease-out] font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              TrustLedger
            </p>
            <h1
              id="readiness-hero-title"
              className="mt-4 max-w-xl animate-[tl-banner-in_500ms_ease-out] font-display text-2xl font-semibold leading-snug text-white/95 sm:text-3xl"
            >
              Know your SRM risk in under 8 minutes
            </h1>
            <p className="mt-4 max-w-lg animate-[tl-banner-in_600ms_ease-out] text-base leading-relaxed text-white/80 sm:text-lg">
              A free readiness check for grievance intake, ownership, community
              trust, and board-ready reporting — then a clear path to close the
              gaps.
            </p>
            <div className="mt-8 animate-[tl-banner-in_700ms_ease-out]">
              <Link
                href="/assessment?utm_source=readiness&utm_medium=hero&utm_campaign=start_check"
                className="inline-flex w-full items-center justify-center rounded-md bg-white px-6 py-3.5 text-base font-semibold text-tl-trust-ink transition-colors hover:bg-tl-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Start the readiness check
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 right-0 hidden w-[48%] max-w-xl opacity-30 lg:block">
            <Image
              src="/marketing/trustledger-hero-dashboard.png"
              alt=""
              width={1536}
              height={1024}
              className="h-auto w-full object-contain object-bottom"
              priority
            />
          </div>
        </section>

        <section className="border-t border-tl-line bg-tl-paper px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-semibold text-tl-ink">
              What you get
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted sm:text-base">
              After the questions and email confirmation, you choose how to move
              forward — report, product intro, trial, or walkthrough.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-tl-ink sm:text-base">
              <li>
                <span className="font-medium">Score &amp; risk band</span> —
                six governance dimensions, not a vanity quiz.
              </li>
              <li>
                <span className="font-medium">Actionable plan</span> — DIY steps
                plus honest TrustLedger turnaround lanes (stabilize →
                operationalize → govern).
              </li>
              <li>
                <span className="font-medium">Your next step</span> — open the
                report, explore the product, start a 14-day trial, or request a
                walkthrough.
              </li>
            </ul>
            <p className="mt-10">
              <Link
                href="/assessment?utm_source=readiness&utm_medium=body&utm_campaign=start_check"
                className="text-sm font-medium text-tl-trust-ink underline underline-offset-4"
              >
                Begin the diagnostic
              </Link>
            </p>
          </div>
        </section>
      </main>
      <HomeFooter />
    </>
  );
}
