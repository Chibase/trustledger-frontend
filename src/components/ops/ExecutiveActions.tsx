"use client";

import { useState } from "react";

export function ExecutiveActions({ talkingPoints }: { talkingPoints: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copyPoints() {
    const text = talkingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
      >
        Print board brief
      </button>
      <button
        type="button"
        onClick={copyPoints}
        className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
      >
        {copied ? "Copied" : "Copy talking points"}
      </button>
    </div>
  );
}
