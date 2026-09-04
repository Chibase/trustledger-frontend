import type { ReactNode } from "react";

type Props = {
  title: string;
  hint?: string;
  children: ReactNode;
};

/** Product overview chart card — TrustLedger tokens, not generic SaaS chrome. */
export function OverviewChartCard({ title, hint, children }: Props) {
  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-tl-ink">{title}</h2>
      {hint ? (
        <p className="mt-1 text-xs text-tl-ink-muted">{hint}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
