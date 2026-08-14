import type { Metadata } from "next";
import { trustLedgerAbsolute } from "@/lib/security/hosts";

export const metadata: Metadata = {
  title: "TrustLedger",
  description:
    "TrustLedger is the SRM software Chibase Consulting built so programmes keep an auditable trail.",
};

export default function FirmTrustLedgerPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-tl-trust">Product</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        TrustLedger — the desk beside the practice
      </h1>
      <p className="mt-4 text-base leading-relaxed text-tl-ink-muted">
        Chibase Consulting is the mother body: facilitation, MEL, IKS, advisory.
        TrustLedger is the Stakeholder Relationship Management software that
        practice needed — grievance desk, registry, engagements, commitments,
        reports. Two sites, one establishment. Neither replaces the other.
      </p>
      <ul className="mt-8 list-disc space-y-2 pl-5 text-sm leading-relaxed text-tl-ink-muted">
        <li>Need people on a live site? Talk to Chibase.</li>
        <li>Need the trail those people keep? Use TrustLedger.</li>
        <li>
          Institutional work can bundle both. Self-serve trial stays on
          TrustLedger.
        </li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={trustLedgerAbsolute(
            "/product?utm_source=chibase&utm_medium=trustledger_page",
          )}
          className="inline-flex rounded-md bg-tl-trust px-5 py-3 text-sm font-semibold text-white hover:bg-tl-trust-ink"
        >
          Product overview
        </a>
        <a
          href={trustLedgerAbsolute(
            "/trial?utm_source=chibase&utm_medium=trustledger_page",
          )}
          className="inline-flex rounded-md border border-tl-line px-5 py-3 text-sm font-semibold text-tl-ink hover:border-tl-trust"
        >
          14-day trial
        </a>
        <a
          href={trustLedgerAbsolute(
            "/assessment?utm_source=chibase&utm_medium=trustledger_page",
          )}
          className="inline-flex rounded-md border border-tl-line px-5 py-3 text-sm font-semibold text-tl-ink hover:border-tl-trust"
        >
          SRM readiness check
        </a>
      </div>
    </article>
  );
}
