"use client";

import { useEffect, useRef } from "react";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const STEPS = [
  {
    n: "1",
    title: "Preview walkthrough",
    desc: "Open the live product path on sample data — no signup required.",
  },
  {
    n: "2",
    title: "Run your scenario",
    desc: "Walk intake, resolution, and reporting the way your teams actually work.",
  },
  {
    n: "3",
    title: "Save / export report",
    desc: "Email is only asked when you want to keep or export full results.",
  },
] as const;

export function HomeHowItWorks() {
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-hiw-step]");
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const step = entry.target.getAttribute("data-hiw-step");
          if (!step || seen.current.has(step)) continue;
          seen.current.add(step);
          trackMarketingEvent("how_it_works_step_view", { step });
        }
      },
      { threshold: 0.45 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      className="bg-tl-paper"
      aria-labelledby="how-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-tl-trust">
            How it works
          </p>
          <h2
            id="how-title"
            className="mt-2 font-display text-2xl font-semibold text-tl-ink sm:text-3xl"
          >
            A clear path from preview to proof
          </h2>
          <p className="mt-3 text-base text-tl-ink-muted">
            Know exactly what happens after each click — preview first, commit
            only when you need the output.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.n}
              data-hiw-step={step.n}
              className="rounded-xl border border-tl-line bg-tl-surface p-6"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tl-trust text-sm font-bold text-white">
                {step.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-tl-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
