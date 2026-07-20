"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const NAV = [
  { href: "#solutions", label: "Solutions" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#sectors", label: "Sectors" },
  { href: "#pricing", label: "Pricing" },
  { href: "#resources", label: "Resources" },
  { href: "#faq", label: "FAQ" },
] as const;

export function HomeHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-tl-line/80 bg-tl-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
          aria-label="TrustLedger home"
        >
          <Image
            src="/marketing/trustledger-logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
          <span className="font-display text-lg font-semibold tracking-tight text-tl-ink">
            TrustLedger
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 lg:flex"
          aria-label="Primary"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-tl-ink-muted transition-colors hover:text-tl-trust focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="/login/live?utm_source=home&utm_medium=nav&utm_campaign=admin_login"
            onClick={() => trackMarketingEvent("admin_login_click", { location: "header" })}
            className="text-sm text-tl-ink-muted underline-offset-2 hover:text-tl-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
          >
            Admin login
          </Link>
          <Link
            href="/contact?utm_source=home&utm_medium=nav&utm_campaign=book_walkthrough"
            onClick={() =>
              trackMarketingEvent("nav_book_walkthrough_click", { location: "header" })
            }
            className="rounded-md border border-tl-line bg-tl-surface px-3.5 py-2 text-sm font-semibold text-tl-ink transition-colors hover:border-tl-trust hover:text-tl-trust-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
          >
            Book walkthrough
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-tl-line text-tl-ink lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="text-lg leading-none">
            {open ? "×" : "☰"}
          </span>
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-tl-line bg-tl-surface px-4 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-tl-ink"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/contact?utm_source=home&utm_medium=nav&utm_campaign=book_walkthrough"
              onClick={() => {
                trackMarketingEvent("nav_book_walkthrough_click", {
                  location: "mobile_nav",
                });
                setOpen(false);
              }}
              className="mt-2 rounded-md border border-tl-line px-3 py-2 text-center text-sm font-semibold"
            >
              Book walkthrough
            </Link>
            <Link
              href="/login/live?utm_source=home&utm_medium=nav&utm_campaign=admin_login"
              onClick={() => {
                trackMarketingEvent("admin_login_click", { location: "mobile_nav" });
                setOpen(false);
              }}
              className="text-center text-sm text-tl-ink-muted underline"
            >
              Admin login
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
