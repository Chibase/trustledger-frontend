"use client";

import { AuditTrailViewer } from "@/components/audit/AuditTrailViewer";
import type { LedgerEntry } from "@/lib/ledger/types";

const TEST_PUBLIC_KEY =
  "ktdnmKwz9NE9/9D8PAwjzPhRZLN3ZjTMnChUZ58Hy1c=";

const mockedChain: LedgerEntry[] = [
  {
    id: "LGR-5001",
    action: "create",
    entity_type: "evidence",
    entity_id: "EVID-0099",
    timestamp: "2026-08-01T09:17:30Z",
    actor_id: "USER-INS-01",
    prev_hash: "",
    current_hash:
      "f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059",
    signature:
      "oqw3ddGMvAsw8D3LsoqqVU3izSlW7RgBWgisEzTShX86Qbyp/Q+vaUndwthPktrhdi5FJvR8Vm6cbQgJqUsJCw==",
    canonical_entity: {
      filename: "culvert_block_20260801.jpg",
      gps_lat: -33.0002,
      gps_lon: 25.7001,
      id: "EVID-0099",
      parent_id: "INSP-1001",
      parent_type: "inspection",
      timestamp: "2026-08-01T09:17:00Z",
      uploader_id: "USER-INS-01",
      checksum: "sha256:demo-checksum",
    },
  },
];

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
        initialEntries={mockedChain}
        initialPublicKey={TEST_PUBLIC_KEY}
      />
      <AuditTrailViewer
        entityType="evidence"
        entityId="EVID-0099"
        initialEntries={mockedChain}
        initialPublicKey={null}
      />
      <AuditTrailViewer
        entityType="incident"
        entityId="INC-1001"
        initialEntries={[]}
        initialPublicKey={TEST_PUBLIC_KEY}
      />
    </main>
  );
}
