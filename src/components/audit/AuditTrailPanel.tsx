"use client";

import { AuditTrailViewer } from "@/components/audit/AuditTrailViewer";

type AuditTrailPanelProps = {
  entityType: string;
  entityId: string;
  defaultOpen?: boolean;
  summaryLabel?: string;
};

/**
 * Collapsible mount for Incident / Evidence desks.
 * Placement is proposed pending UX sign-off (see docs/AuditTrail_UI_README.md).
 */
export function AuditTrailPanel({
  entityType,
  entityId,
  defaultOpen = false,
  summaryLabel = "Audit trail / verification",
}: AuditTrailPanelProps) {
  return (
    <details
      className="rounded-lg border border-tl-line bg-tl-surface p-4"
      open={defaultOpen || undefined}
    >
      <summary className="cursor-pointer list-none font-semibold text-tl-ink marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="underline-offset-2 hover:underline">{summaryLabel}</span>
      </summary>
      <p className="mt-2 text-xs text-tl-ink-muted">
        Chain-of-custody hashes and optional client-side signature check.
        Proposed mount — confirm placement before treating this as the
        production layout.
      </p>
      <div className="mt-3">
        <AuditTrailViewer entityType={entityType} entityId={entityId} />
      </div>
    </details>
  );
}
