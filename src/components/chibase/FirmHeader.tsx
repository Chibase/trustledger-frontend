import Link from "next/link";
import { firmPath } from "@/lib/security/hosts";

const NAV = [
  { path: "/packages", label: "Packages" },
  { path: "/practice", label: "Practice" },
  { path: "/trustledger", label: "TrustLedger" },
  { path: "/insights", label: "Insights" },
  { path: "/about", label: "About" },
] as const;

export function FirmHeader({ chibaseHost }: { chibaseHost: boolean }) {
  const home = firmPath(chibaseHost, "/");
  return (
    <header className="sticky top-0 z-40 border-b border-tl-line/80 bg-tl-surface/95 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={home}
            className="font-display text-lg font-semibold tracking-tight text-tl-ink"
          >
            Chibase Consulting
          </Link>
          <Link
            href={firmPath(chibaseHost, "/contact")}
            className="shrink-0 rounded-md bg-tl-trust px-3.5 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink"
          >
            Talk to us
          </Link>
        </div>
        <nav
          className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
          aria-label="Firm"
        >
          {NAV.map((item) => (
            <Link
              key={item.path}
              href={firmPath(chibaseHost, item.path)}
              className="font-medium text-tl-ink-muted hover:text-tl-trust"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
