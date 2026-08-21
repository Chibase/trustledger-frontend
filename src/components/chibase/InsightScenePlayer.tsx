"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CockroachTheoryScene } from "@/components/chibase/scenes/CockroachTheoryScene";

export type InsightSceneCue = {
  id: string;
  startMs: number;
  endMs: number;
};

/** Scene 1 only. Later explainer beats append here (id, startMs, endMs). */
export const COCKROACH_THEORY_SCENES: InsightSceneCue[] = [
  { id: "cockroach-theory", startMs: 0, endMs: 45_000 },
];

export const COCKROACH_THEORY_DURATION_MS = 45_000;

function formatTimecode(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function cueProgress(elapsedMs: number, cue: InsightSceneCue): number {
  const span = cue.endMs - cue.startMs;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (elapsedMs - cue.startMs) / span));
}

function activeCue(
  elapsedMs: number,
  scenes: InsightSceneCue[],
): InsightSceneCue | undefined {
  return (
    scenes.find((s) => elapsedMs >= s.startMs && elapsedMs < s.endMs) ??
    scenes[scenes.length - 1]
  );
}

function SceneFrame({
  elapsedMs,
  scenes,
}: {
  elapsedMs: number;
  scenes: InsightSceneCue[];
}) {
  const cue = activeCue(elapsedMs, scenes);
  if (!cue) return null;
  const progress = cueProgress(elapsedMs, cue);
  if (cue.id === "cockroach-theory") {
    return <CockroachTheoryScene progress={progress} />;
  }
  return null;
}

export function InsightScenePlayer({
  durationMs = COCKROACH_THEORY_DURATION_MS,
  scenes = COCKROACH_THEORY_SCENES,
}: {
  durationMs?: number;
  scenes?: InsightSceneCue[];
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [clockEpoch, setClockEpoch] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const elapsedAtPlayRef = useRef(0);

  const finished = elapsedMs >= durationMs;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const originElapsed = elapsedAtPlayRef.current;
    const originWall = performance.now();

    const tick = (now: number) => {
      const next = Math.min(durationMs, originElapsed + (now - originWall));
      setElapsedMs(next);
      if (next >= durationMs) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clockEpoch, durationMs]);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === stageRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const play = useCallback(() => {
    const start = elapsedMs >= durationMs ? 0 : elapsedMs;
    elapsedAtPlayRef.current = start;
    setElapsedMs(start);
    setPlaying(true);
    setClockEpoch((n) => n + 1);
  }, [elapsedMs, durationMs]);

  const pause = useCallback(() => {
    setPlaying(false);
  }, []);

  const replay = useCallback(() => {
    elapsedAtPlayRef.current = 0;
    setElapsedMs(0);
    setPlaying(true);
    setClockEpoch((n) => n + 1);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await stage.requestFullscreen();
      }
    } catch {
      /* user cancelled or the API is unavailable */
    }
  }, []);

  const barPct = durationMs <= 0 ? 0 : (elapsedMs / durationMs) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={stageRef}
        className={`w-full bg-tl-paper ${
          fullscreen
            ? "h-full overflow-hidden rounded-none border-0"
            : "min-h-[22rem] overflow-hidden rounded-lg border border-tl-line md:aspect-video"
        }`}
      >
        <div className="h-full min-h-[22rem] md:min-h-0">
          <SceneFrame elapsedMs={elapsedMs} scenes={scenes} />
        </div>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-tl-line"
        role="progressbar"
        aria-label="Scene progress"
        aria-valuemin={0}
        aria-valuemax={Math.round(durationMs / 1000)}
        aria-valuenow={Math.floor(elapsedMs / 1000)}
        aria-valuetext={`${formatTimecode(elapsedMs)} of ${formatTimecode(durationMs)}`}
      >
        <div
          className="h-full bg-tl-trust"
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {playing ? (
          <button
            type="button"
            onClick={pause}
            className="rounded-md bg-tl-trust px-3.5 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={finished ? replay : play}
            className="rounded-md bg-tl-trust px-3.5 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
          >
            {finished ? "Replay" : "Play"}
          </button>
        )}
        <button
          type="button"
          onClick={replay}
          className="rounded-md border border-tl-line bg-tl-surface px-3.5 py-2 text-sm font-semibold text-tl-ink hover:border-tl-trust/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
        >
          Replay
        </button>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="rounded-md border border-tl-line bg-tl-surface px-3.5 py-2 text-sm font-semibold text-tl-ink hover:border-tl-trust/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
        >
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
        <p className="ml-auto text-sm tabular-nums text-tl-ink-muted">
          {formatTimecode(elapsedMs)} / {formatTimecode(durationMs)}
        </p>
      </div>
    </div>
  );
}
