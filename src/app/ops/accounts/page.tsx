import Link from "next/link";

export default function OpsAccountsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command centre</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Accounts</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Control client accounts, plan entitlements, seats, and access —
          separate from CRM lead work. Packet 23c.
        </p>
      </header>

      <div className="rounded-lg border border-tl-line bg-tl-surface p-5 text-sm text-tl-ink-muted">
        <p>
          Until entitlements ship, manage paid customers manually in TrustLedger
          Cloud after Paystack marks an invoice Paid (see{" "}
          <code className="text-tl-ink">docs/ACCESS_MODEL.md</code>).
        </p>
        <p className="mt-3">
          This panel will list Customers with plan, status, Owner email, and
          suspend / reopen actions.
        </p>
      </div>

      <p className="text-sm">
        <Link href="/ops" className="font-medium text-tl-trust-ink underline">
          Back to overview
        </Link>
      </p>
    </div>
  );
}