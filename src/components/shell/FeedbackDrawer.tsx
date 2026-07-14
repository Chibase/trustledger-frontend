"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ExperienceFeedbackForm } from "@/components/forms/ExperienceFeedbackForm";

type FeedbackDrawerProps = {
  variant?: "ink" | "light";
};

export function FeedbackDrawer({ variant = "light" }: FeedbackDrawerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [defaultEmail, setDefaultEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDefaultEmail(window.localStorage.getItem("tl-lead-email") || "");
  }, [open]);

  const triggerClass =
    variant === "ink"
      ? "w-full rounded-md border border-white/15 px-2.5 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
      : "w-full rounded-md border border-tl-line px-2.5 py-2 text-left text-sm text-tl-ink hover:bg-tl-paper";

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)}>
        Feedback
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="flex h-full w-full max-w-md flex-col border-l border-tl-line bg-tl-paper shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-tl-line bg-tl-surface px-4 py-3">
              <div>
                <h2
                  id="feedback-title"
                  className="font-display text-lg font-semibold"
                >
                  Product feedback
                </h2>
                <p className="text-xs text-tl-ink-muted">
                  Launch readiness · experience notes
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-tl-line px-2 py-1 text-sm"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ExperienceFeedbackForm
                contextPath={pathname || "/app"}
                defaultEmail={defaultEmail}
                compact
                onSubmitted={() => {
                  window.setTimeout(() => setOpen(false), 1200);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
