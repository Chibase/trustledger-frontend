"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import {
  descriptorForPath,
  isPathEntitledForPlan,
  packagingPlanId,
} from "@/lib/planPackaging";

type Props = {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
  children: ReactNode;
};

/**
 * Blocks module URLs that are not in this plan's TIER_FLOW sequence.
 * Settings / guide / intake stay reachable (not packaged desks).
 */
export function PlanDashboardAccessGate({
  planId = null,
  vip = false,
  mode = null,
  children,
}: Props) {
  const pathname = usePathname() || "/app/dashboard";
  const resolvedPlan = packagingPlanId({ planId, vip, mode });
  const current = useMemo(() => descriptorForPath(pathname), [pathname]);
  const entitled = isPathEntitledForPlan(pathname, resolvedPlan);

  if (!current || entitled) return <>{children}</>;

  return (
    <FeatureGate
      capability={current.capability}
      planId={resolvedPlan}
      fallback="upsell"
      lockedBody={
        <p className="mt-2 text-sm text-tl-ink-muted">
          This desk is not in the {resolvedPlan} sequence. Return to the
          executive dashboard and open an included module.
        </p>
      }
    >
      {null}
    </FeatureGate>
  );
}
