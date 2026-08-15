"use client";

import Link from "next/link";
import { useState } from "react";
import { RESOURCE_PACKS, type ResourcePack } from "@/data/resources";
import { ResourceDownloadForm } from "@/components/resources/ResourceDownloadForm";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

function PackRow({
  pack,
  onDownload,
}: {
  pack: ResourcePack;
  onDownload: (pack: ResourcePack) => void;
}) {
  return (
    <article className="border-b border-tl-line py-8 first:pt-0 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-tl-trust">
        {pack.pagesHint} · v{pack.version}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-tl-ink">
        {pack.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tl-ink-muted sm:text-base">
        {pack.description}
      </p>
      <p className="mt-3 text-xs text-tl-ink-muted">For: {pack.audience}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-tl-ink">
        {pack.sections.slice(0, 3).map((section) => (
          <li key={section.title}>· {section.title.replace(/^\d+\.\s*/, "")}</li>
        ))}
        {pack.sections.length > 3 ? (
          <li className="text-tl-ink-muted">
            · +{pack.sections.length - 3} more sections
          </li>
        ) : null}
      </ul>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => {
            trackMarketingEvent("resource_download_click", { pack: pack.id });
            onDownload(pack);
          }}
          className="inline-flex justify-center rounded-md bg-tl-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink"
        >
          Download PDF
        </button>
        <Link
          href={`/resources/${pack.id}`}
          className="inline-flex justify-center rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Preview contents
        </Link>
      </div>
    </article>
  );
}

export function ResourcesLibrary() {
  const [active, setActive] = useState<ResourcePack | null>(null);

  return (
    <>
      <div className="mt-10 divide-y-0">
        {RESOURCE_PACKS.map((pack) => (
          <PackRow key={pack.id} pack={pack} onDownload={setActive} />
        ))}
      </div>

      <section className="mt-6 border-t border-tl-line pt-10">
        <h2 className="font-display text-xl font-semibold text-tl-ink">
          After you download
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Use the packs offline, then close the gaps with a scored readiness
          check, a 14-day own-data trial, or a short walkthrough.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/assessment?utm_source=resources&utm_medium=cta&utm_campaign=after_download"
            className="inline-flex justify-center rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            SRM readiness check
          </Link>
          <Link
            href="/trial?utm_source=resources&utm_medium=cta&utm_campaign=after_download"
            className="inline-flex justify-center rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-sm font-medium text-tl-ink hover:bg-tl-paper"
          >
            Start 14-day trial
          </Link>
          <Link
            href="/quote?utm_source=resources&utm_medium=cta&utm_campaign=after_download"
            className="inline-flex justify-center rounded-md border border-tl-line px-4 py-2.5 text-sm font-medium text-tl-ink hover:bg-tl-paper"
          >
            Request walkthrough
          </Link>
        </div>
      </section>

      {active ? (
        <ResourceDownloadForm pack={active} onClose={() => setActive(null)} />
      ) : null}
    </>
  );
}
