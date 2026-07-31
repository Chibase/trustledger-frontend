"use client";

import Link from "next/link";
import {
  INSTITUTIONAL_PACK_IDS,
  INSTITUTIONAL_PACKS,
  quoteHrefForPack,
} from "@/config/institutionalPacks";

/**
 * Institutional sector packs — quote-only lenses under Institutional (ADR-042).
 */
export function HomeInstitutionalPacks() {
  return (
    <div className="mt-12 border-t border-tl-line pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="font-display text-xl font-semibold text-tl-ink">
          Institutional programmes — quote-based
        </h3>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Municipal, housing, infrastructure, and renewable programmes all run
          on the Institutional plan. Pricing is scoped by quote — not a public
          list price.
        </p>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {INSTITUTIONAL_PACK_IDS.map((id) => {
          const pack = INSTITUTIONAL_PACKS[id];
          return (
            <li
              key={id}
              className="flex flex-col rounded-lg border border-tl-line bg-tl-paper p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
                Institutional · {pack.shortName}
              </p>
              <h4 className="mt-1 font-display text-lg font-semibold text-tl-ink">
                {pack.name}
              </h4>
              <p className="mt-2 flex-1 text-sm text-tl-ink-muted">
                {pack.sellLine}
              </p>
              <Link
                href={quoteHrefForPack(id)}
                className="mt-4 inline-flex justify-center rounded-md border border-tl-line px-4 py-2.5 text-sm font-medium text-tl-ink hover:bg-tl-surface"
              >
                Request {pack.shortName.toLowerCase()} quote
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
