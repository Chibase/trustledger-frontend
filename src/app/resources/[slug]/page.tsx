import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeFooter } from "@/components/marketing/HomeFooter";
import { HomeHeader } from "@/components/marketing/HomeHeader";
import { ResourcePackDetail } from "@/components/resources/ResourcePackDetail";
import { RESOURCE_PACKS, resourcePackById } from "@/data/resources";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return RESOURCE_PACKS.map((pack) => ({ slug: pack.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pack = resourcePackById(slug);
  if (!pack) return { title: "Resource" };
  return {
    title: pack.title,
    description: pack.description,
    alternates: { canonical: `/resources/${pack.id}` },
  };
}

export default async function ResourcePackPage({ params }: Props) {
  const { slug } = await params;
  const pack = resourcePackById(slug);
  if (!pack) notFound();

  return (
    <>
      <HomeHeader />
      <main className="bg-tl-paper">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
          <p className="mt-2 text-xs text-tl-ink-muted">
            <Link href="/resources" className="underline underline-offset-2">
              All free resources
            </Link>
          </p>
          <ResourcePackDetail pack={pack} />
        </div>
      </main>
      <HomeFooter />
    </>
  );
}
