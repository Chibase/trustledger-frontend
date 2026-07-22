"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { hasCapability } from "@/lib/entitlements";
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
 * Soft gate for plan/add-on capabilities. Demo uses Project lens by default.
 */
export function FeatureGate({
  capability,
  planId,
  children,
  fallback = "upsell",
}: FeatureGateProps) {
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    setAllowed(hasCapability(capability, planId));
  }, [capability, planId]);

  if (allowed) return <>{children}</>;
  if (fallback === "hide") return null;

  return (
    <div className="rounded-lg border border-dashed border-tl-line bg-tl-paper/60 p-4 text-sm">
      <p className="font-medium text-tl-ink">
        {CAPABILITY_LABELS[capability]} is not on this plan
      </p>
      <p className="mt-1 text-tl-ink-muted">
        Capabilities can be bundled into plans or sold as add-ons. Preview
        switches live in Settings (admin).
      </p>
      <Link
        href="/app/settings"
        className="mt-3 inline-block text-sm font-medium text-tl-trust-ink underline"
      >
        Review entitlements
      </Link>
    </div>
  );
}
