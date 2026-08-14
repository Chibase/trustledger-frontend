import Link from "next/link";
import { CHIBASE_EMAIL } from "@/lib/chibase/content";
import { firmPath, trustLedgerAbsolute } from "@/lib/security/hosts";

export function FirmFooter({ chibaseHost }: { chibaseHost: boolean }) {
  return (
    <footer className="border-t border-tl-line bg-tl-ink text-tl-paper">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold text-white">
            Chibase Consulting
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Mother body for social facilitation, MEL, and Social Licence to
            Build. TrustLedger is the SRM desk this practice built.
          </p>
          <p className="mt-4 text-sm text-white/70">
            <a
              href={`mailto:${CHIBASE_EMAIL}`}
              className="underline underline-offset-2 hover:text-white"
            >
              {CHIBASE_EMAIL}
            </a>
            <span className="block mt-1 text-xs text-white/50">
              Mail stays on the existing host. This site is the public brochure.
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Firm</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link href={firmPath(chibaseHost, "/practice")} className="hover:text-white">
                Practice
              </Link>
            </li>
            <li>
              <Link href={firmPath(chibaseHost, "/packages")} className="hover:text-white">
                Packages
              </Link>
            </li>
            <li>
              <Link href={firmPath(chibaseHost, "/about")} className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href={firmPath(chibaseHost, "/contact")} className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link href={firmPath(chibaseHost, "/trustledger")} className="hover:text-white">
                TrustLedger overview
              </Link>
            </li>
            <li>
              <a
                href={trustLedgerAbsolute("/product?utm_source=chibase&utm_medium=footer")}
                className="hover:text-white"
              >
                Product
              </a>
            </li>
            <li>
              <a
                href={trustLedgerAbsolute("/trial?utm_source=chibase&utm_medium=footer")}
                className="hover:text-white"
              >
                14-day trial
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto max-w-5xl border-t border-white/10 px-4 py-6 text-xs text-white/50 sm:px-6">
        © {new Date().getFullYear()} Chibase Consulting. TrustLedger is a
        Chibase product.
      </p>
    </footer>
  );
}
