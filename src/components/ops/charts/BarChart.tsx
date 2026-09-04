type Bar = { label: string; value: number };

function axisLabel(label: string, barCount: number): string {
  const max = barCount > 6 ? 8 : barCount > 4 ? 12 : 16;
  if (label.length <= max) return label;
  return `${label.slice(0, Math.max(1, max - 1))}…`;
}

export function HorizontalBarChart({
  bars,
  maxHeight = 220,
}: {
  bars: Bar[];
  maxHeight?: number;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  if (!bars.length) {
    return (
      <p className="text-sm text-tl-ink-muted" style={{ minHeight: maxHeight }}>
        No data yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3" style={{ minHeight: maxHeight / 2 }}>
      {bars.map((bar, index) => {
        const pct = Math.round((bar.value / max) * 100);
        return (
          <li key={`${index}-${bar.label}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{bar.label}</span>
              <span className="font-medium tabular-nums">{bar.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-sm bg-tl-paper">
              <div
                className="h-full rounded-sm bg-tl-trust"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function VerticalBarChart({ bars }: { bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const height = 160;
  const width = 420;
  const padX = 24;
  const padY = 16;
  const gap = 12;
  const innerW = width - padX * 2;
  const barW =
    bars.length > 0 ? (innerW - gap * (bars.length - 1)) / bars.length : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height + 24}`}
      className="h-auto w-full"
      role="img"
      aria-label="Distribution chart"
    >
      {bars.map((bar, i) => {
        const h = (bar.value / max) * (height - padY);
        const x = padX + i * (barW + gap);
        const y = height - h;
        return (
          <g key={`${i}-${bar.label}`}>
            <title>{bar.label}</title>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="3"
              fill="var(--tl-trust)"
            />
            <text
              x={x + barW / 2}
              y={height + 14}
              textAnchor="middle"
              fontSize="11"
              fill="var(--tl-ink-muted)"
            >
              {axisLabel(bar.label, bars.length)}
            </text>
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="11"
              fill="var(--tl-ink)"
            >
              {bar.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
