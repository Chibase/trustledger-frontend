export type DonutSlice = { label: string; value: number; color?: string };

const SLICE_COLORS = [
  "var(--tl-trust)",
  "var(--tl-demo)",
  "var(--tl-amber)",
  "var(--tl-danger)",
  "var(--tl-ink-muted)",
];

type Props = {
  slices: DonutSlice[];
  centerLabel?: string;
  empty?: string;
};

/**
 * Mix chart for SRM dashboards. Field-ledger slice colours only.
 */
export function DonutChart({
  slices,
  centerLabel,
  empty = "No mix on file yet.",
}: Props) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
  if (!slices.length || total <= 0) {
    return <p className="text-sm text-tl-ink-muted">{empty}</p>;
  }

  const r = 36;
  const c = 2 * Math.PI * r;
  const rings = slices.flatMap((slice, index) => {
    const value = Math.max(0, slice.value);
    if (value === 0) return [];
    const dash = (value / total) * c;
    return [
      {
        label: slice.label,
        value,
        dash,
        gap: c - dash,
        color: slice.color || SLICE_COLORS[index % SLICE_COLORS.length],
      },
    ];
  });
  const ringsWithOffset = rings.map((ring, index) => ({
    ...ring,
    offset: rings.slice(0, index).reduce((sum, item) => sum + item.dash, 0),
  }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg
        viewBox="0 0 100 100"
        className="h-40 w-40 shrink-0"
        role="img"
        aria-label={centerLabel ? `${centerLabel}: ${total}` : `Total ${total}`}
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--tl-line)"
          strokeWidth="12"
        />
        {ringsWithOffset.map((ring) => (
          <circle
            key={`${ring.label}-${ring.offset}`}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={ring.color}
            strokeWidth="12"
            strokeDasharray={`${ring.dash} ${ring.gap}`}
            strokeDashoffset={-ring.offset}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
          >
            <title>
              {ring.label}: {ring.value}
            </title>
          </circle>
        ))}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          fill="var(--tl-ink)"
          fontSize="14"
          fontWeight="600"
        >
          {total.toLocaleString("en-ZA")}
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill="var(--tl-ink-muted)"
          fontSize="7"
        >
          {centerLabel || "Total"}
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {ringsWithOffset.map((ring) => {
          const pct = Math.round((ring.value / total) * 100);
          return (
            <li
              key={`${ring.label}-${ring.offset}`}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: ring.color }}
                  aria-hidden
                />
                <span className="truncate text-tl-ink">{ring.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-tl-ink-muted">
                {ring.value.toLocaleString("en-ZA")} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
