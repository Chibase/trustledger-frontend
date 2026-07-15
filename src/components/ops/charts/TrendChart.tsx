type Point = { label: string; value: number };

export function TrendChart({
  points,
  height = 180,
}: {
  points: Point[];
  height?: number;
}) {
  const width = 560;
  const padX = 28;
  const padY = 20;
  const max = Math.max(1, ...points.map((p) => p.value));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padX + i * step;
    const y = padY + innerH - (p.value / max) * innerH;
    return { x, y, ...p };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area =
    coords.length > 0
      ? `${line} L ${coords[coords.length - 1].x} ${padY + innerH} L ${coords[0].x} ${padY + innerH} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Weekly activity trend"
    >
      <line
        x1={padX}
        y1={padY + innerH}
        x2={width - padX}
        y2={padY + innerH}
        stroke="var(--tl-line)"
        strokeWidth="1"
      />
      {area ? (
        <path d={area} fill="var(--tl-trust)" fillOpacity="0.12" />
      ) : null}
      {line ? (
        <path
          d={line}
          fill="none"
          stroke="var(--tl-trust)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {coords.map((c) => (
        <g key={c.label}>
          <circle cx={c.x} cy={c.y} r="3.5" fill="var(--tl-trust-ink)" />
          <text
            x={c.x}
            y={height - 4}
            textAnchor="middle"
            fontSize="10"
            fill="var(--tl-ink-muted)"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
