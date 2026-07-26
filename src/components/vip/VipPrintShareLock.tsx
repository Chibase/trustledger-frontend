"use client";

import { useEffect } from "react";
import { clientIsVipViewer } from "@/lib/vipAccess";

/**
 * Soft-blocks print for VIP viewers (buttons also gated).
 * Sharing via OS still possible — banner states the policy.
 */
export function VipPrintShareLock({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active && !clientIsVipViewer()) return;

    document.documentElement.classList.add("tl-vip-viewer");
    document.documentElement.dataset.tlAccess = "vip_viewer";

    const onBeforePrint = (event: Event) => {
      event.preventDefault();
      window.alert(
        "Printing and PDF export are disabled for VIP guest seats. You may view and leave a comment only.",
      );
    };
    window.addEventListener("beforeprint", onBeforePrint);

    return () => {
      document.documentElement.classList.remove("tl-vip-viewer");
      delete document.documentElement.dataset.tlAccess;
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, [active]);

  return null;
}
