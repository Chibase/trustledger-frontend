import type { ReactNode } from "react";

type Props = {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
};

/** Product overview chart card — TrustLedger tokens, not generic SaaS chrome. */
export function OverviewChartCard({ title, hint, action, children }: Props) {
  return (
    <section className="rounded-xl border border-tl-line bg-tl-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-tl-ink">{title}</h2>
          {hint ? (
            <p className="mt-1 text-xs text-tl-ink-muted">{hint}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
