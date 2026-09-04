import type { LedgerEntry } from "@/lib/ledger/types";

/**
 * TEST-ONLY fixtures from tests/ledger_vectors/test_vectors.json (vector-1 + vector-3).
 * Public key and signature only — no private key.
 */
export const TEST_ONLY_PUBLIC_KEY =
  "ktdnmKwz9NE9/9D8PAwjzPhRZLN3ZjTMnChUZ58Hy1c=";

export const VECTOR_1_HASH =
  "f75f31fd969b0de632af1c7604a536d5bf068cde34459e1ad8ab0a7f4f533059";

export const VECTOR_3_HASH =
  "e2ffac3e9aa4b466dee47b9e74c61b9bfd6d28e16a0883ec67fc8436a2308ef6";

export const MOCK_LEDGER_CHAIN: LedgerEntry[] = [
  {
    id: "LGR-5001",
    action: "create",
    entity_type: "evidence",
    entity_id: "EVID-0099",
    timestamp: "2026-08-01T09:17:30Z",
    actor_id: "USER-INS-01",
    prev_hash: "",
    current_hash: VECTOR_1_HASH,
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
    },
  },
  {
    id: "LGR-5002",
    action: "create",
    entity_type: "inspection",
    entity_id: "INSP-1002",
    timestamp: "2026-08-02T10:46:00Z",
    actor_id: "USER-INS-02",
    prev_hash: VECTOR_1_HASH,
    current_hash: VECTOR_3_HASH,
    signature: null,
    canonical_entity: {
      asset_id: "ASSET-211",
      checklist_json: {
        corrosion: "none",
        fasteners: "secure",
      },
      date_time: "2026-08-02T10:45:00Z",
      id: "INSP-1002",
      inspector_id: "USER-INS-02",
      notes: "Guard rail OK",
      score: 88,
      status: "Completed",
    },
  },
];
