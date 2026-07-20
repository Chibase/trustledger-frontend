type Step = { label: string; value: number };

export function FunnelChart({ steps }: { steps: Step[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => {
        const widthPct = Math.max(28, Math.round((step.value / max) * 100));
        return (
          <li key={step.label} className="flex items-center gap-3">
            <span className="w-6 shrink-0 text-xs text-tl-ink-muted">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className="flex items-center justify-between gap-3 rounded-md bg-tl-trust px-3 py-2 text-sm text-white"
                style={{ width: `${widthPct}%`, minWidth: "9rem" }}
              >
                <span className="truncate font-medium">{step.label}</span>
                <span className="tabular-nums">{step.value}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
