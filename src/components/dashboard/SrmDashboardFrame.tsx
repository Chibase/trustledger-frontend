import type { ReactNode } from "react";

type Props = {
  header: ReactNode;
  kpis: ReactNode;
  recent: ReactNode;
  sidebar: ReactNode;
  children?: ReactNode;
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
  children,
}: Props) {
  return (
    <div className="space-y-6">
      {header}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{kpis}</div>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">{recent}</div>
        <div className="space-y-4">{sidebar}</div>
      </div>
      {children}
    </div>
  );
}
