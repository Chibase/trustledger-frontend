"use client";

import { formatUtmSummary, readUtm } from "@/lib/utm";
import { useEffect, useState } from "react";

export function SettingsUtmRow() {
  const [label, setLabel] = useState("Loading…");

  useEffect(() => {
    setLabel(formatUtmSummary(readUtm()));
  }, []);

  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tl-ink-muted">Campaign (UTM)</dt>
      <dd className="text-right">{label}</dd>
    </div>
  );
}
