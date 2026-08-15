import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { IKS_PAPER } from "@/lib/chibase/content";
import { firmPath, isChibaseHost } from "@/lib/security/hosts";

export const metadata: Metadata = {
  title: "About",
  description:
    "Chibase Consulting — social scientists and development practitioners for infrastructure social licence.",
};

export default async function AboutPage() {
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-tl-trust">About</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        The mother body
      </h1>
      <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
        Chibase Consulting is directed by social scientists and development
        practitioners. We work with contractors, municipalities, implementing
        agents, and funders who need community participation that can survive
        contact with a live site.
      </p>
      <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
        Managing Director Thozamile Ngcozela leads work on Indigenous Knowledge
        Systems, critical involvement, and social performance. TrustLedger is
        the software product of this house — not a second consulting brand.
      </p>
      <p className="mt-8 text-sm leading-relaxed text-tl-ink-muted">
        {IKS_PAPER.citation}{" "}
        <a
          href={IKS_PAPER.doi}
          className="text-tl-trust-ink underline underline-offset-2"
          rel="noopener noreferrer"
        >
          DOI
        </a>
      </p>
      <p className="mt-8">
        <Link
          href={firmPath(chibaseHost, "/contact")}
          className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          Contact
        </Link>
      </p>
    </article>
  );
}
