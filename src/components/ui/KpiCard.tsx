type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  /** Optional movement line — never invent a percentage. */
  delta?: string;
  tone?: "default" | "attention" | "danger" | "trust";
  /**
   * Soft Field-ledger wash. Defaults from `tone`.
   * Trust / amber / demo / paper only — not a pastel SaaS rainbow.
   */
  wash?: "trust" | "amber" | "demo" | "paper";
};

const WASH: Record<NonNullable<KpiCardProps["wash"]>, string> = {
  trust: "bg-tl-trust/[0.09]",
  amber: "bg-tl-amber/[0.12]",
  demo: "bg-tl-demo/[0.10]",
  paper: "bg-tl-paper",
};

function washForTone(
  tone: KpiCardProps["tone"],
  wash?: KpiCardProps["wash"],
): NonNullable<KpiCardProps["wash"]> {
  if (wash) return wash;
  if (tone === "attention") return "amber";
  if (tone === "danger") return "paper";
  if (tone === "trust") return "trust";
  return "trust";
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  tone = "default",
  wash,
}: KpiCardProps) {
  const fill = washForTone(tone, wash);
  const accent =
    tone === "attention"
      ? "border-l-tl-amber"
      : tone === "danger"
        ? "border-l-tl-danger"
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
      className={`rounded-xl border border-tl-line border-l-4 px-4 py-5 shadow-sm ${WASH[fill]} ${accent}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight ${valueTone}`}
      >
        {value}
      </p>
      {delta ? (
        <p className="mt-1 text-xs font-medium text-tl-trust-ink">{delta}</p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-tl-ink-muted">{hint}</p> : null}
    </div>
  );
}
