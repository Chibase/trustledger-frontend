import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { FIRM_INSIGHTS } from "@/lib/chibase/insights";
import { firmPath, isChibaseHost } from "@/lib/security/hosts";

export const metadata: Metadata = {
  title: "Insights",
  description: "Short notes on facilitation, social licence, and field practice.",
};

export default async function InsightsIndexPage() {
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-tl-ink">
        Insights
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Two notes. Not a magazine.
      </p>
      <ul className="mt-10 space-y-8">
        {FIRM_INSIGHTS.map((post) => (
          <li key={post.slug}>
            <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
              {post.kicker}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-tl-ink">
              <Link
                href={firmPath(chibaseHost, `/insights/${post.slug}`)}
                className="hover:text-tl-trust-ink"
              >
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
              {post.summary}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
