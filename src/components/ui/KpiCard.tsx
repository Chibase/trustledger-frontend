type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "attention" | "danger" | "trust";
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: KpiCardProps) {
  const valueTone =
    tone === "attention"
      ? "text-tl-amber"
      : tone === "danger"
        ? "text-tl-danger"
        : tone === "trust"
          ? "text-tl-trust-ink"
          : "text-tl-ink";

  return (
    <div className="rounded-lg border border-tl-line bg-tl-surface px-4 py-3.5">
      <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-tight ${valueTone}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-tl-ink-muted">{hint}</p> : null}
    </div>
  );
}
