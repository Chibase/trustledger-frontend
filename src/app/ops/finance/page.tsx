import Link from "next/link";
import { PillarBanner } from "@/components/ops/PillarBanner";
import { buildFinanceOverview } from "@/lib/commandCentreIntel";

export const dynamic = "force-dynamic";

export default function OpsFinancePage() {
  const data = buildFinanceOverview();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command control</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Finance</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Budget and resource utilisation across the platform — not customer
          project costing.
        </p>
      </header>

      <PillarBanner status={data.status}>{data.summary}</PillarBanner>

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
