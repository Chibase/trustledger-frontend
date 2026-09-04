"use client";

import Link from "next/link";
import { createContext, useContext, type ReactNode } from "react";

const SepDeskContext = createContext(false);

export function SepDeskProvider({
  allowed,
  children,
}: {
  allowed: boolean;
  children: ReactNode;
}) {
  return (
    <SepDeskContext.Provider value={allowed}>{children}</SepDeskContext.Provider>
  );
}

/** True on the operator / VIP desk only. Default false outside the shell. */
export function useSepDesk(): boolean {
  return useContext(SepDeskContext);
}

/**
 * Hide SEP UI when the module is off this desk. No upgrade card — the
 * composer is not a commercial SKU yet.
 */
export function SepDeskGate({ children }: { children: ReactNode }) {
  const allowed = useSepDesk();
  if (!allowed) return null;
  return <>{children}</>;
}

export function SepDeskLink({
  href = "/app/engagement-plan",
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  const allowed = useSepDesk();
  if (!allowed) return null;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
