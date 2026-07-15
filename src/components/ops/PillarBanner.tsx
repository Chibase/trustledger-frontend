import { pillarStatusLabel, type PillarStatus } from "@/lib/commandCentreIntel";

export function PillarBanner({
  status,
  children,
}: {
  status: PillarStatus;
  children: React.ReactNode;
}) {
  return (
    <p className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink-muted">
      <span className="mr-2 inline-block rounded-sm bg-tl-paper px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-tl-ink">
        {pillarStatusLabel(status)}
      </span>
      {children}
    </p>
  );
}
