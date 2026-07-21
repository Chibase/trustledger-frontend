"use client";

import Link from "next/link";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "How it works" },
      { href: "#sectors", label: "Sectors" },
      { href: "#pricing", label: "Pricing" },
      { href: "/assessment", label: "Readiness assessment" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "https://chibaseconsulting.co.za", label: "Chibase Consulting", external: true },
      { href: "/contact", label: "Contact" },
      { href: "https://trustledger.co.za/privacy/", label: "Privacy", external: true },
      { href: "https://trustledger.co.za/terms/", label: "Terms", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "#resources", label: "Guides" },
      { href: "#faq", label: "FAQ" },
      { href: "/status", label: "System status" },
      { href: "/pay", label: "Subscribe (Paystack)" },
      { href: "/trial?utm_campaign=trial_14day", label: "Start 14-day trial" },
    ],
  },
] as const;

export function HomeFooter() {
  return (
    <footer className="border-t border-tl-line bg-tl-ink text-tl-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-xl font-semibold text-white">
              TrustLedger
            </p>
            <p className="mt-2 max-w-xs text-sm text-white/70">
              Stakeholder trust you can operationalise — from community intake
              to governance-grade reporting.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-tl-trust">
              Version 001 live · Version 002 in build
            </p>
            <p className="mt-4 text-sm text-white/70">
              <a
                href="mailto:info@trustledger.co.za"
                className="underline underline-offset-2 hover:text-white"
              >
                info@trustledger.co.za
              </a>
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title} id={col.title === "Resources" ? "resources" : undefined}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-white/70 hover:text-white"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-white/70 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          id="pricing-footer"
          className="mt-12 scroll-mt-24 rounded-lg border border-white/10 px-4 py-3 text-sm text-white/70"
        >
          <p className="font-medium text-white">Checkout</p>
          <p className="mt-1">
            Practitioner and Project checkout on{" "}
            <Link href="/pay" className="underline underline-offset-2 hover:text-white">
              Paystack
            </Link>
            . Institutional is sales-led via{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-white">
              contact
            </Link>
            .
          </p>
        </div>

        <div
          id="faq"
          className="mt-8 scroll-mt-24 border-t border-white/10 pt-8 text-sm text-white/70"
        >
          <p className="font-medium text-white">FAQ</p>
          <p className="mt-2 max-w-2xl">
            Preview needs no signup. Email is only required to save or export
            full results. Live admin access is separate from the public
            walkthrough.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55">
          <p>© {new Date().getFullYear()} TrustLedger · Chibase Consulting</p>
          <Link
            href="/login/live?utm_source=home&utm_medium=footer&utm_campaign=admin_login"
            onClick={() =>
              trackMarketingEvent("admin_login_click", { location: "footer" })
            }
            className="underline underline-offset-2 hover:text-white"
          >
            Admin login
          </Link>
        </div>
      </div>
    </footer>
  );
}
