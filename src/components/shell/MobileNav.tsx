"use client";

import { useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/shell/AppNav";
import { ShellSignOut } from "@/components/shell/ShellSignOut";
import type { UserRole } from "@/types/rbac";

type MobileNavProps = {
  role: UserRole;
  userName: string;
};

export function MobileNav({ role, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-tl-line bg-tl-surface md:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <Link
            href="/app/dashboard"
            className="font-display text-lg font-semibold tracking-tight"
          >
            TrustLedger
          </Link>
          <p className="text-xs text-tl-ink-muted">
            {userName} · {role}
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium text-tl-ink hover:bg-tl-paper"
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div id="mobile-nav-panel" className="space-y-3 px-2 pb-4">
          <AppNav role={role} />
          <div className="border-t border-tl-line px-2 pt-3">
            <ShellSignOut />
          </div>
        </div>
      ) : null}
    </div>
  );
}
