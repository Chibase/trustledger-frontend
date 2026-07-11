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
  const accent =
    tone === "attention"
      ? "border-l-tl-amber"
      : tone === "danger"
        ? "border-l-tl-danger"
        : tone === "trust"
          ? "border-l-tl-trust"
          : "border-l-tl-trust";

  const valueTone =
    tone === "attention"
      ? "text-tl-amber"
      : tone === "danger"
        ? "text-tl-danger"
        : tone === "trust"
          ? "text-tl-trust-ink"
          : "text-tl-ink";

  return (
    <div
      className={`rounded-lg border border-tl-line border-l-4 bg-tl-surface px-4 py-4 shadow-sm ${accent}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight ${valueTone}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-tl-ink-muted">{hint}</p> : null}
    </div>
  );
}
