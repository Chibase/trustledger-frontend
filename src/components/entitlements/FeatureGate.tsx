"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  hasCapability,
  upgradeHrefForCapability,
} from "@/lib/entitlements";
import type { PlanId } from "@/config/plans";
import {
  CAPABILITY_LABELS,
  type CapabilityId,
} from "@/types/entitlements";

type FeatureGateProps = {
  capability: CapabilityId;
  planId?: PlanId | null;
  children: ReactNode;
  /** When locked, show a compact upsell instead of hiding. */
  fallback?: "hide" | "upsell";
};

/**
 * Soft gate for plan capabilities. Demo uses Project lens by default.
 */
export function FeatureGate({
  capability,
  planId,
  children,
  fallback = "upsell",
}: FeatureGateProps) {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAllowed(hasCapability(capability, planId));
    });
    return () => cancelAnimationFrame(frame);
  }, [capability, planId]);

  if (allowed) return <>{children}</>;
  if (fallback === "hide") return null;

  return (
    <div className="rounded-lg border border-dashed border-tl-line bg-tl-paper/60 p-4 text-sm">
      <p className="font-medium text-tl-ink">
        {CAPABILITY_LABELS[capability]} is not on this plan
      </p>
      <p className="mt-1 text-tl-ink-muted">
        Your Plan Owner can review the full module list in Settings. Features
        above the current plan stay locked until you upgrade.
      </p>
      <Link
        href={upgradeHrefForCapability(capability)}
        className="mt-3 inline-block text-sm font-medium text-tl-trust-ink underline"
      >
        Upgrade plan
      </Link>
    </div>
  );
}
