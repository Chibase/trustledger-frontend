"use client";

import { useState } from "react";
import type { ResourcePack } from "@/data/resources";
import { ResourceDownloadForm } from "@/components/resources/ResourceDownloadForm";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

export function ResourcePackDetail({ pack }: { pack: ResourcePack }) {
  const [open, setOpen] = useState(false);

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
        Download PDF
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

      {open ? (
        <ResourceDownloadForm pack={pack} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
