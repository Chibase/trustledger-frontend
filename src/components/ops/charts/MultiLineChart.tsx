type Series = {
  id: string;
  label: string;
  color: string;
  values: number[];
};

type Props = {
  labels: string[];
  series: Series[];
  height?: number;
  empty?: string;
};

/**
 * Multi-series trend for the executive overview.
 * Field-ledger colours only (trust / demo / danger / amber).
 */
export function MultiLineChart({
  labels,
  series,
  height = 200,
  empty = "No trend on file for this period.",
}: Props) {
  const hasValue = series.some((s) => s.values.some((v) => v > 0));
  if (!labels.length || !series.length || !hasValue) {
    return <p className="text-sm text-tl-ink-muted">{empty}</p>;
  }

  const width = 640;
  const padX = 28;
  const padY = 22;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2 - 14;
  const step = labels.length > 1 ? innerW / (labels.length - 1) : 0;

  function pathFor(values: number[]): string {
    return values
      .map((value, i) => {
        const x = padX + i * step;
        const y = padY + innerH - (value / max) * innerH;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Engagement trend"
      >
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padY + innerH - frac * innerH;
          return (
            <line
              key={frac}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="var(--tl-line)"
              strokeWidth="1"
            />
          );
        })}
        {series.map((s) => (
          <path
            key={s.id}
            d={pathFor(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {labels.map((label, i) => (
          <text
            key={`${label}-${i}`}
            x={padX + i * step}
            y={height - 4}
            textAnchor="middle"
            fontSize="10"
            fill="var(--tl-ink-muted)"
          >
            {label}
          </text>
        ))}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tl-ink-muted">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
