import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { firmPath, isChibaseHost, trustLedgerAbsolute } from "@/lib/security/hosts";

export const metadata: Metadata = {
  title: "TrustLedger",
  description:
    "TrustLedger is the SRM software Chibase Consulting built so programmes keep an auditable trail.",
};

export default async function FirmTrustLedgerPage() {
  const chibaseHost = isChibaseHost((await headers()).get("host"));
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
        <li>Need people on a live site? Talk to Chibase — request a consulting package.</li>
        <li>Need the trail those people keep? Use TrustLedger.</li>
        <li>
          Consulting is available as an add-on to any TrustLedger plan at your
          request, on Chibase’s own pricing. It is not a fifth software column
          and does not unlock desk modules.
        </li>
      </ul>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={firmPath(chibaseHost, "/packages")}
          className="inline-flex rounded-md bg-tl-trust px-5 py-3 text-sm font-semibold text-white hover:bg-tl-trust-ink"
        >
          Consulting packages
        </Link>
        <a
          href={trustLedgerAbsolute(
            "/product?utm_source=chibase&utm_medium=trustledger_page",
          )}
          className="inline-flex rounded-md border border-tl-line px-5 py-3 text-sm font-semibold text-tl-ink hover:border-tl-trust"
        >
          Product overview
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
