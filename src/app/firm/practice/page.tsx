import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { IKS_PAPER } from "@/lib/chibase/content";
import { firmPath, isChibaseHost } from "@/lib/security/hosts";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Social facilitation, MEL, IKS, and short-cycle field intervention — the Chibase method.",
};

const BLOCKS = [
  {
    title: "Social facilitation",
    body: "Meetings with a purpose, a RACI, and a commitment log. Traditional authorities and community representatives are named counterparts, not an audience.",
  },
  {
    title: "MEL that can be defended",
    body: "Indicators sit next to lived experience. We score intake, ownership, field practice, engagement, reporting, and assurance — then keep a trail so boards are not briefed from memory.",
  },
  {
    title: "Indigenous Knowledge Systems",
    body: "IKS is a methodological input for participation and M&E. Place, customary structures, and community-defined outcomes belong in the register — not a footnote.",
  },
  {
    title: "Short-cycle field intervention",
    body: "When a site is already in friction, we diagnose and de-escalate with people on the ground. That is a consulting deployment, not a software ‘division’.",
  },
] as const;

export default async function PracticePage() {
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-tl-trust">Practice</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Method first. Desk second.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
        We do not sell generic public relations. We design participation so
        infrastructure can move — and so what was heard can still be shown six
        months later.
      </p>
      <div className="mt-10 space-y-8">
        {BLOCKS.map((b) => (
          <section key={b.title}>
            <h2 className="text-lg font-semibold text-tl-ink">{b.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
              {b.body}
            </p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm leading-relaxed text-tl-ink-muted">
        Research foundation: {IKS_PAPER.citation}{" "}
        <a
          href={IKS_PAPER.doi}
          className="text-tl-trust-ink underline underline-offset-2"
          rel="noopener noreferrer"
        >
          DOI
        </a>
        .
      </p>
      <p className="mt-8">
        <Link
          href={firmPath(chibaseHost, "/packages")}
          className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          Request a consulting package
        </Link>
        {" · "}
        <Link
          href={firmPath(chibaseHost, "/contact")}
          className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          Discuss a programme
        </Link>
      </p>
    </article>
  );
}
