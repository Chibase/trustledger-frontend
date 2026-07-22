import Link from "next/link";
import { ConfirmEftPaidForm } from "@/components/ops/ConfirmEftPaidForm";
import { PillarBanner } from "@/components/ops/PillarBanner";
import { buildFinanceOverview } from "@/lib/commandCentreIntel";
import { listRecentPayments } from "@/lib/paymentIntel";

export const dynamic = "force-dynamic";

export default async function OpsFinancePage() {
  const data = buildFinanceOverview();
  const payments = await listRecentPayments(25);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command control</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Finance</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Trial card authorizations, opt-outs, EFT confirms, and Paystack
          charges. Day-14 collection uses charge-due when still scheduled.
          CRM Customer / Plan Owner stay manual while lockdown is on.
        </p>
      </header>

      <PillarBanner status={payments.total > 0 ? "partial" : data.status}>
        {payments.total > 0
          ? `${payments.total} payment signal(s) in the latest CRM window (EFT + Paystack).`
          : data.summary}
      </PillarBanner>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <h2 className="font-display text-lg font-semibold">
          Confirm EFT paid
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          After bank clearance on a quote / invoice, log it here. Creates a CRM
          Lead (`EFT Payment`) for Executive + Finance. Does{" "}
          <strong>not</strong> auto-create Plan Owner logins.
        </p>
        <div className="mt-4">
          <ConfirmEftPaidForm />
        </div>
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Payment notifications
          </h2>
          <div className="flex flex-wrap gap-3 text-xs font-medium">
            <Link href="/quote" className="text-tl-trust-ink underline">
              Quote form
            </Link>
            <Link href="/pay" className="text-tl-trust-ink underline">
              Paystack checkout
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-tl-ink-muted">
          EFT (operator confirm) and Paystack (`/pay`). Next: update CRM Customer
          / Plan Owner manually when lockdown allows.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">Who</th>
                <th className="py-2 pr-3 font-medium">Plan</th>
                <th className="py-2 pr-3 font-medium">Amount</th>
                <th className="py-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tl-line">
              {payments.recent.map((row) => (
                <tr key={row.name}>
                  <td className="py-2.5 pr-3 text-xs text-tl-ink-muted">
                    {row.modified
                      ? new Date(row.modified).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium">{row.person}</p>
                    <p className="text-xs text-tl-ink-muted">
                      {[row.email, row.organization].filter(Boolean).join(" · ") ||
                        "—"}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3">{row.planLabel}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{row.amountLabel}</td>
                  <td className="py-2.5 break-all text-xs">
                    {row.reference || "—"}
                  </td>
                </tr>
              ))}
              {!payments.recent.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-tl-ink-muted">
                    No EFT or Paystack payments logged yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.lines.map((line) => (
          <div
            key={line.label}
            className="rounded-lg border border-tl-line bg-tl-surface px-4 py-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
              {line.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
              {line.utilisedLabel}
              <span className="text-base font-normal text-tl-ink-muted">
                {" "}
                / {line.budgetLabel}
              </span>
            </p>
            <p className="mt-1 text-xs text-tl-ink-muted">{line.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <h2 className="font-display text-lg font-semibold">Wiring next</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-tl-ink-muted">
          {data.nextWire.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link
          href="/ops/executive"
          className="font-medium text-tl-trust-ink underline"
        >
          Back to Executive Board
        </Link>
      </p>
    </div>
  );
}
