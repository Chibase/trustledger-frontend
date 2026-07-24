"use client";

import { useSyncExternalStore } from "react";
import { formatUtmSummary, readUtm } from "@/lib/utm";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return formatUtmSummary(readUtm());
}

function getServerSnapshot() {
  return "None";
}

export function SettingsUtmRow() {
  const label = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tl-ink-muted">Campaign (UTM)</dt>
      <dd className="text-right">{label}</dd>
    </div>
  );
}
