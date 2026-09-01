"use client";

import { AuditTrailViewer } from "@/components/audit/AuditTrailViewer";
import {
  MOCK_LEDGER_CHAIN,
  TEST_ONLY_PUBLIC_KEY,
} from "@/lib/ledger/mockChain";

/** Public UX preview for PR review — not a production desk. */
export default function AuditPreviewPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tl-trust">
          UX preview
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-tl-ink">
          Audit trail / verification
        </h1>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Mocked ledger chain (TEST-ONLY public key). Confirm copy and
          placement on Incident / Evidence before merge.
        </p>
      </header>
      <AuditTrailViewer
        entityType="evidence"
        entityId="EVID-0099"
        initialEntries={MOCK_LEDGER_CHAIN}
        initialPublicKey={TEST_ONLY_PUBLIC_KEY}
      />
      <AuditTrailViewer
        entityType="evidence"
        entityId="EVID-0099"
        initialEntries={MOCK_LEDGER_CHAIN}
        initialPublicKey={null}
      />
      <AuditTrailViewer
        entityType="incident"
        entityId="INC-1001"
        initialEntries={[]}
        initialPublicKey={TEST_ONLY_PUBLIC_KEY}
      />
    </main>
  );
}
