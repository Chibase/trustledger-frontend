"use client";

import type { SepTimelineEvent } from "@/types/sepExecution";

function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-ZA");
}

export function SepRoadmap({
  events,
  submittedAt,
}: {
  events: SepTimelineEvent[];
  submittedAt: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  if (!events.length) {
    return (
      <p className="text-sm text-tl-ink-muted">
        No implementation events yet. The roadmap starts on{" "}
        {fmt(submittedAt)}. Today is {fmt(today)}.
      </p>
    );
  }

  return (
    <ol className="relative space-y-3 border-l border-tl-line pl-4">
      {events.map((ev) => {
        const day = ev.at.slice(0, 10);
        const isToday = ev.kind === "today" || day === today;
        return (
          <li key={ev.id} className="relative">
            <span
              className={
                isToday
                  ? "absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-tl-amber"
                  : "absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-tl-trust"
              }
              aria-hidden
            />
            <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
              {fmt(ev.at)}
              {isToday ? " · today" : ""}
              {" · "}
              {ev.kind}
            </p>
            <p className="text-sm font-medium text-tl-ink">{ev.title}</p>
            <p className="text-sm text-tl-ink-muted">{ev.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}
