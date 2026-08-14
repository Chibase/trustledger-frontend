import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { FirmPackageCheckout } from "@/components/chibase/FirmPackageCheckout";
import {
  formatChibasePackagePrice,
  getChibasePackages,
} from "@/lib/chibase/packages";
import { paystackConfigured } from "@/lib/paystackServer";
import { firmPath, isChibaseHost } from "@/lib/security/hosts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Packages",
  description:
    "Chibase Consulting packages — facilitation, MEL, IKS, and field intervention. Listed starter fees, separate from TrustLedger software plans.",
};

export default async function FirmPackagesPage() {
  const chibaseHost = isChibaseHost((await headers()).get("host"));
  const packages = getChibasePackages();
  const configured = paystackConfigured();

  return (
    <article className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-tl-trust">Packages</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Consulting packages. Own pricing. Not a software seat.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-tl-ink-muted">
        Chibase Consulting is an independent practice. These are listed starter
        engagements — one programme or site, ZAR excl. VAT — not monthly
        TrustLedger seats. They sit beside any software plan at your request
        and do not unlock desk modules. Larger or multi-site work is scoped
        when you request the package.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {packages.map((pkg) => {
          const requestHref = firmPath(
            chibaseHost,
            `/contact?package=${pkg.id}`,
          );
          return (
            <section
              key={pkg.id}
              id={pkg.id}
              className="flex flex-col rounded-xl border border-tl-line bg-tl-surface p-6"
            >
              <h2 className="font-display text-xl font-semibold text-tl-ink">
                {pkg.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                {pkg.summary}
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-tl-ink-muted">
                {pkg.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-5 font-display text-2xl font-semibold tabular-nums text-tl-ink">
                {formatChibasePackagePrice(pkg)}
              </p>
              <p className="mt-1 text-xs text-tl-ink-muted">
                Listed starter · {pkg.starter} · excl. VAT
              </p>
              <div className="mt-6 flex flex-1 flex-col justify-end gap-3">
                <Link
                  href={requestHref}
                  className="inline-flex justify-center rounded-md bg-tl-trust px-4 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink"
                >
                  Request this package
                </Link>
                {pkg.selfServe ? (
                  <details className="rounded-md border border-tl-line bg-tl-paper p-3">
                    <summary className="cursor-pointer text-sm font-medium text-tl-ink">
                      Pay this package now
                    </summary>
                    <FirmPackageCheckout pkg={pkg} configured={configured} />
                  </details>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-tl-ink-muted">
        Already on TrustLedger? Ask for any of these as an add-on to your
        current plan. The desk subscription and the consulting engagement stay
        on separate invoices. The listed fee is the starter; travel, extra
        sites, and longer deployments are quoted on request.{" "}
        <Link
          href={firmPath(chibaseHost, "/trustledger")}
          className="font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          How the two fit
        </Link>
        .
      </p>
    </article>
  );
}
