import type { ReactNode } from "react";

type Props = {
  header: ReactNode;
  kpis: ReactNode;
  recent?: ReactNode;
  sidebar?: ReactNode;
  /** Replaces the recent + sidebar row (executive overview deepening). */
  overview?: ReactNode;
  children?: ReactNode;
  /** Fifth derived KPI may wrap — activity/client/reports stay four-up. */
  kpiWrap?: boolean;
};

/**
 * Shared SRM overview layout: KPI row, recent ledger + mix/actions column.
 * Field-ledger tokens only — not a beneficiary-app skin.
 */
export function SrmDashboardFrame({
  header,
  kpis,
  recent,
  sidebar,
  overview,
  children,
  kpiWrap = false,
}: Props) {
  return (
    <div className="space-y-6">
      {header}
      <div
        className={
          kpiWrap
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        }
      >
        {kpis}
      </div>
      {overview ? (
        <div className="space-y-6">{overview}</div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">{recent}</div>
          <div className="space-y-4">{sidebar}</div>
        </div>
      )}
      {children}
    </div>
  );
}
