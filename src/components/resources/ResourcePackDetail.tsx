"use client";

import Link from "next/link";
import { useState } from "react";
import { RESOURCE_PACKS, type ResourcePack } from "@/data/resources";
import { fieldTemplateById } from "@/data/fieldTemplates";
import { ResourceDownloadForm } from "@/components/resources/ResourceDownloadForm";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

export function ResourcePackDetail({ pack }: { pack: ResourcePack }) {
  const [open, setOpen] = useState(false);
  const others = RESOURCE_PACKS.filter((p) => p.id !== pack.id);
  const field = fieldTemplateById(pack.id);

  return (
    <>
      <h1 className="mt-3 font-display text-3xl font-semibold text-tl-ink sm:text-4xl">
        {pack.title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-tl-ink-muted">
        {pack.description}
      </p>
      <p className="mt-2 text-xs text-tl-ink-muted">
        {pack.pagesHint} · v{pack.version} · {pack.audience}
      </p>
      <p className="mt-2 text-xs text-tl-ink-muted">
        This download is this pack only — not a combined toolkit.
      </p>
      {field ? (
        <ul className="mt-3 list-disc pl-5 text-sm text-tl-ink-muted">
          {field.mapsTo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => {
          trackMarketingEvent("resource_download_click", {
            pack: pack.id,
            from: "detail",
          });
          setOpen(true);
        }}
        className="mt-6 inline-flex rounded-md bg-tl-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink"
      >
        Download {pack.shortTitle.toLowerCase()}
      </button>

      <div className="mt-10 space-y-8">
        {pack.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-lg font-semibold text-tl-ink">
              {section.title}
            </h2>
            {section.intro ? (
              <p className="mt-1 text-sm text-tl-ink-muted">{section.intro}</p>
            ) : null}
            <ul className="mt-3 space-y-2 text-sm text-tl-ink">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-tl-ink-muted" aria-hidden="true">
                    ☐
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {others.length > 0 ? (
        <nav
          className="mt-10 border-t border-tl-line pt-8"
          aria-label="Other resource packs"
        >
          <h2 className="font-display text-lg font-semibold text-tl-ink">
            Other packs
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Each PDF is separate. Switch if you need a different toolkit.
          </p>
          <ul className="mt-4 space-y-2">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/resources/${other.id}`}
                  className="text-sm font-medium text-tl-trust-ink underline underline-offset-2"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {open ? (
        <ResourceDownloadForm pack={pack} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
