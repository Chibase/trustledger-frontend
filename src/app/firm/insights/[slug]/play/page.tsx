import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { InsightScenePlayer } from "@/components/chibase/InsightScenePlayer";
import { insightBySlug } from "@/lib/chibase/insights";
import { firmPath, isChibaseHost } from "@/lib/security/hosts";

const PLAYABLE_SLUG = "cockroach-theory";

export function generateStaticParams() {
  return [{ slug: PLAYABLE_SLUG }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = insightBySlug(slug);
  if (!post || slug !== PLAYABLE_SLUG) return { title: "Insights" };
  return {
    title: `${post.title} · 45-second scene`,
    description: post.summary,
  };
}

export default async function InsightPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== PLAYABLE_SLUG) notFound();
  const post = insightBySlug(slug);
  if (!post) notFound();
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  const articleHref = firmPath(chibaseHost, `/insights/${post.slug}`);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-5xl flex-col px-4 py-6 sm:px-6">
      <p>
        <Link
          href={articleHref}
          className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          Back to the article
        </Link>
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-tl-trust">
        {post.kicker}
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-tl-ink sm:text-3xl">
        {post.title}
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">45-second scene</p>
      <div className="mt-6 flex-1">
        <InsightScenePlayer />
      </div>
    </div>
  );
}
