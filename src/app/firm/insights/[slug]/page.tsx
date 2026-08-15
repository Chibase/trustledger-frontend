import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { FIRM_INSIGHTS, insightBySlug } from "@/lib/chibase/insights";
import { firmPath, isChibaseHost } from "@/lib/security/hosts";

export function generateStaticParams() {
  return FIRM_INSIGHTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = insightBySlug(slug);
  if (!post) return { title: "Insights" };
  return { title: post.title, description: post.summary };
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = insightBySlug(slug);
  if (!post) notFound();
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
        {post.kicker}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        {post.title}
      </h1>
      {post.body.map((para) => (
        <p
          key={para.slice(0, 40)}
          className="mt-4 text-base leading-relaxed text-tl-ink-muted"
        >
          {para}
        </p>
      ))}
      <p className="mt-10">
        <Link
          href={firmPath(chibaseHost, "/insights")}
          className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          All notes
        </Link>
      </p>
    </article>
  );
}
