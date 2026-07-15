import Link from "next/link";
import { ShellSignOut } from "@/components/shell/ShellSignOut";

const NAV = [
  { href: "/ops", label: "Overview" },
  { href: "/ops/reports", label: "Reports" },
  { href: "/ops/accounts", label: "Accounts" },
  { href: "/app/dashboard", label: "Product (live)" },
];

type OpsShellProps = {
  operatorName: string;
  operatorEmail: string;
  children: React.ReactNode;
};

export function OpsShell({
  operatorName,
  operatorEmail,
  children,
}: OpsShellProps) {
  return (
    <div className="min-h-full bg-tl-paper text-tl-ink">
      <div className="border-b border-tl-ink bg-tl-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              TrustLedger Ops
            </p>
            <p className="text-xs text-white/55">
              Platform command centre · not CRM
            </p>
          </div>
          <div className="text-right text-xs text-white/70">
            <p className="font-medium text-white">{operatorName}</p>
            <p>{operatorEmail}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 md:px-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="space-y-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-2.5 py-2 text-tl-ink hover:bg-tl-surface"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-tl-line pt-4">
            <ShellSignOut variant="light" />
          </div>
          <p className="mt-4 text-xs text-tl-ink-muted">
            Deep lead work stays in{" "}
            <a
              href="https://app.trustledger.co.za"
              className="font-medium text-tl-trust-ink underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              TrustLedger Cloud CRM
            </a>
            .
          </p>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
