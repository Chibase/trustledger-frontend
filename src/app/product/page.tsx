import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/aeo/jsonLd";
import {
  PRODUCT_DEFINITION,
  PRODUCT_TAGLINE,
  SITE_URL,
} from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: "Product — TrustLedger Stakeholder Intelligence",
  description: PRODUCT_DEFINITION,
  alternates: { canonical: "/product" },
  openGraph: {
    title: "TrustLedger — Product & onboarding",
    description: PRODUCT_DEFINITION,
    url: `${SITE_URL}/product`,
    siteName: "TrustLedger",
    locale: "en_ZA",
    type: "website",
  },
};

const FEATURES = [
  {
    title: "Stakeholder registry",
    body: "People, organisations, traditional authorities, government, and civil society — influence, interests, and place — so every engagement has a named counterpart.",
  },
  {
    title: "Engagements",
    body: "Meetings, consultations, walkabouts, and briefings with attendance, minutes, and action items. Capture once; link to stakeholders and projects.",
  },
  {
    title: "Field templates",
    body: "Minutes, attendance registers, and field notes with labeled fields. Paste or upload rough notes (.txt / .md / .csv / .pdf), arrange into the form, then Suggest → Apply. Late handover after an on-site meeting is supported. Bundled on Project and Institutional; also free on /resources.",
  },
  {
    title: "Commitments",
    body: "Promises with owners and due dates. Promote from engagement actions; track open → fulfilled or broken with evidence notes.",
  },
  {
    title: "Grievance resolution desk",
    body: "Intake, priority, verification, and close — the trust trail operators already run in production.",
  },
  {
    title: "Evidence & reports",
    body: "Files and registers against cases; Activity and executive packs for board and funder reporting.",
  },
  {
    title: "Geo context",
    body: "Place context ships with every plan. South African municipalities, wards, and traditional councils (where packed) are included baseline for SA programmes. Other Global South countries use the same place model — you add the project and situation; we do not invent unshipped national maps.",
  },
] as const;

const STEPS = [
  {
    n: "1",
    title: "Start a trial or subscribe",
    body: "Open your own workspace. South African plans include ZA place intel; other Global South programmes add the project and situation on the same place model. No sample INC-* cases — add your projects and people only.",
    href: "/trial",
    cta: "Start 14-day trial",
  },
  {
    n: "2",
    title: "Follow the setup wizard",
    body: "On first entry, TrustLedger opens a plan-aware setup wizard: seed Project → people → contact → promises → cases → reports. Reopen anytime from Guide.",
    href: "/trial",
    cta: "Start trial & setup",
  },
  {
    n: "3",
    title: "Sign in live on Cloud",
    body: "After provision, use live login for multi-device durable ops on TrustLedger Cloud. Guide stays in the nav.",
    href: "/login/live",
    cta: "Live sign-in",
  },
  {
    n: "4",
    title: "Build Stakeholder Intelligence",
    body: "Add stakeholders, log engagements, track commitments — the SRM engine without which there is no programme trust.",
    href: "/app/stakeholders",
    cta: "Open CRM (after sign-in)",
  },
] as const;

type PageProps = {
  searchParams?: Promise<{ retired?: string }>;
};

export default async function ProductPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const retired = params.retired === "1";

  return (
    <div className="min-h-full bg-gradient-to-b from-[#e8eef2] via-tl-paper to-tl-paper">
      <JsonLd
        data={[
          softwareApplicationJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Product", path: "/product" },
          ]),
        ]}
      />
      <header className="border-b border-tl-line/80 bg-tl-surface/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-tl-ink"
          >
            TrustLedger
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/faq"
              className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
            >
              FAQ
            </Link>
            <Link
              href="/trial"
              className="rounded-md bg-tl-trust px-3 py-1.5 font-medium text-white hover:bg-tl-trust-ink"
            >
              Start trial
            </Link>
            <Link
              href="/login/live"
              className="font-medium text-tl-trust-ink underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(14,124,102,0.18), transparent), radial-gradient(ellipse 60% 40% at 90% 20%, rgba(18,32,42,0.08), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            {retired ? (
              <p
                className="mb-6 max-w-2xl animate-[tl-banner-in_280ms_ease-out] rounded-md border border-tl-line bg-tl-surface px-4 py-3 text-sm text-tl-ink"
                role="status"
              >
                The sample preview workspace is retired. Use this page to learn
                the product, then start a trial or sign in live with your own
                data.
              </p>
            ) : null}
            <p className="animate-[tl-banner-in_320ms_ease-out] text-sm font-semibold text-tl-trust">
              TrustLedger · {PRODUCT_TAGLINE}
            </p>
            <h1 className="mt-3 max-w-3xl animate-[tl-banner-in_400ms_ease-out] font-display text-4xl font-semibold tracking-tight text-tl-ink sm:text-5xl">
              Stakeholder Intelligence for durable SRM
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-tl-ink sm:text-lg">
              {PRODUCT_DEFINITION}
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-tl-ink-muted">
              Registry, engagements, and commitments are the engine of the
              platform. Without them there is no Stakeholder Relationship
              Management — only a case list. TrustLedger runs that engine on
              Cloud for paying operators.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/trial?utm_source=product&utm_medium=hero&utm_campaign=trial_14day"
                className="inline-flex rounded-md bg-tl-trust px-5 py-3 text-sm font-semibold text-white hover:bg-tl-trust-ink"
              >
                Start 14-day trial
              </Link>
              <Link
                href="/pay?utm_source=product&utm_medium=hero&utm_campaign=subscribe"
                className="inline-flex rounded-md border border-tl-line bg-tl-surface px-5 py-3 text-sm font-semibold text-tl-ink hover:border-tl-trust"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-tl-line/80 bg-tl-surface/40">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-tl-ink">
              What the product is for
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-tl-ink-muted sm:text-base">
              Field teams and Plan Owners run grievance resolution and
              governance-grade evidence where social licence decides whether
              projects move — then prove it to boards and funders.
            </p>
            <ul className="mt-10 grid gap-8 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="max-w-md">
                  <h3 className="font-display text-lg font-semibold text-tl-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                    {feature.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-tl-line/80">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-tl-ink">
              How to get on board
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-tl-ink-muted sm:text-base">
              No fictional sample desk. Your workspace starts empty — then you
              build the register that SRM depends on.
            </p>
            <ol className="mt-10 space-y-8">
              {STEPS.map((step) => (
                <li key={step.n} className="flex gap-4 sm:gap-6">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tl-ink font-display text-sm font-semibold text-white"
                    aria-hidden
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-tl-ink">
                      {step.title}
                    </h3>
                    <p className="mt-1 max-w-xl text-sm text-tl-ink-muted">
                      {step.body}
                    </p>
                    <Link
                      href={step.href}
                      className="mt-3 inline-block text-sm font-semibold text-tl-trust-ink underline underline-offset-2"
                    >
                      {step.cta}
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-tl-line/80 bg-tl-ink text-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-display text-xl font-semibold">
                Ready when you are
              </p>
              <p className="mt-1 text-sm text-white/75">
                Questions on plans or pilots — talk to us.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-tl-ink hover:bg-tl-paper"
              >
                Contact
              </Link>
              <Link
                href="/quote"
                className="rounded-md border border-white/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Request a quote
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
