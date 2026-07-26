"use client";

import Link from "next/link";
import { VIP_VIEWER_COPY } from "@/lib/vipAccess";

export function VipViewerBanner() {
  return (
    <div
      role="status"
      className="border-b border-tl-amber/40 bg-tl-amber/15 px-4 py-2 text-sm text-tl-ink"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-semibold text-tl-amber">VIP guest · </span>
          {VIP_VIEWER_COPY}
        </p>
        <Link
          href="/app/comments"
          className="shrink-0 font-medium text-tl-trust-ink underline underline-offset-2"
        >
          Open comments
        </Link>
      </div>
    </div>
  );
}
