import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  active?: "compare" | "guides" | "faq" | "product" | "legal";
};

export function MarketingChrome({ children, active }: Props) {
  return (
    <div className="min-h-full bg-gradient-to-b from-[#e8eef2] via-tl-paper to-tl-paper">
      <header className="border-b border-tl-line/80 bg-tl-surface/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:max-w-4xl sm:px-6">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-tl-ink"
          >
            TrustLedger
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/compare"
              className={
                active === "compare"
                  ? "font-semibold text-tl-trust-ink"
                  : "font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              }
            >
              Compare
            </Link>
            <Link
              href="/guides/ess10-ifc-grievance"
              className={
                active === "guides"
                  ? "font-semibold text-tl-trust-ink"
                  : "font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              }
            >
              ESS10 / IFC
            </Link>
            <Link
              href="/faq"
              className={
                active === "faq"
                  ? "font-semibold text-tl-trust-ink"
                  : "font-medium text-tl-trust-ink underline-offset-2 hover:underline"
              }
            >
              FAQ
            </Link>
            <Link
              href="/trial"
              className="rounded-md bg-tl-trust px-3 py-1.5 font-medium text-white hover:bg-tl-trust-ink"
            >
              Start trial
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
