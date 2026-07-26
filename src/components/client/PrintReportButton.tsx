"use client";

import { clientIsVipViewer } from "@/lib/vipAccess";
import { useToast } from "@/components/ui/Toast";

export function PrintReportButton() {
  const { pushToast } = useToast();

  return (
    <button
      type="button"
      onClick={() => {
        if (clientIsVipViewer()) {
          pushToast(
            "Printing is disabled for VIP guest seats (view and comment only).",
            "error",
          );
          return;
        }
        window.print();
      }}
      className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
    >
      Print / PDF
    </button>
  );
}
