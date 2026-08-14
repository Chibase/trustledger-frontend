import Link from "next/link";
import { headers } from "next/headers";
import {
  CHIBASE_DEFINITION,
  CHIBASE_TAGLINE,
  SERVICES,
} from "@/lib/chibase/content";
import { FIRM_INSIGHTS } from "@/lib/chibase/insights";
import { firmPath, isChibaseHost, trustLedgerAbsolute } from "@/lib/security/hosts";

export default async function FirmHomePage() {
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  return (
    <>
      <section className="bg-gradient-to-b from-tl-surface to-tl-paper">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold text-tl-trust">
            Chibase Consulting
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
            {CHIBASE_TAGLINE}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-tl-ink-muted sm:text-lg">
            {CHIBASE_DEFINITION}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={firmPath(chibaseHost, "/contact")}
              className="inline-flex rounded-md bg-tl-trust px-5 py-3 text-sm font-semibold text-white hover:bg-tl-trust-ink"
            >
              Book an alignment conversation
            </Link>
            <a
              href={trustLedgerAbsolute(
                "/product?utm_source=chibase&utm_medium=hero&utm_campaign=see_desk",
              )}
              className="inline-flex rounded-md border border-tl-line bg-tl-surface px-5 py-3 text-sm font-semibold text-tl-ink hover:border-tl-trust"
            >
              See TrustLedger
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-tl-ink">
          Three ways we work
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {SERVICES.map((s) => (
            <article
              key={s.name}
              className="rounded-xl border border-tl-line bg-tl-surface p-5"
            >
              <h3 className="font-semibold text-tl-ink">{s.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                {s.body}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-6">
          <Link
            href={firmPath(chibaseHost, "/practice")}
            className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
          >
            How the practice runs
          </Link>
        </p>
      </section>

      <section className="border-y border-tl-line bg-tl-surface">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-tl-ink">
            The desk we built
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-tl-ink-muted">
            TrustLedger is Chibase’s SRM software: grievance desk, stakeholder
            registry, engagements, commitments, and evidence packs. Consulting
            is people and method. The product is the trail those people keep.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={firmPath(chibaseHost, "/trustledger")}
              className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
            >
              How the two fit
            </Link>
            <a
              href={trustLedgerAbsolute(
                "/trial?utm_source=chibase&utm_medium=home&utm_campaign=trial",
              )}
              className="text-sm font-semibold text-tl-ink underline-offset-2 hover:underline"
            >
              Start a 14-day own-data trial
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-tl-ink">
          Short notes
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FIRM_INSIGHTS.map((post) => (
            <article
              key={post.slug}
              className="rounded-xl border border-tl-line bg-tl-surface p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
                {post.kicker}
              </p>
              <h3 className="mt-2 font-semibold text-tl-ink">{post.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                {post.summary}
              </p>
              <Link
                href={firmPath(chibaseHost, `/insights/${post.slug}`)}
                className="mt-3 inline-block text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
              >
                Read
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
