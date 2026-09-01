# Audit trail UI

Reusable **Audit trail / verification** panel for TrustLedger desks.

## What it does

- `GET /api/method/srm_core.api.ledger.get_chain?entity_id=…` (accepts `message` as an array or `{ entries }`)
- `GET /api/method/srm_core.api.ledger.public_key`
- Recomputes `current_hash` with `src/lib/ledger/canonicalize.ts` (same byte rules as `docs/LEDGER_API.md`)
- Verifies ed25519 over ASCII-hex `current_hash` in the browser via Web Crypto (no private keys)
- If the public key is missing: **Verification not available** (hash check still runs)

## Files

| Path | Role |
|------|------|
| `src/components/audit/AuditTrailViewer.tsx` | Viewer |
| `src/components/audit/AuditTrailPanel.tsx` | Collapsible mount |
| `src/stories/AuditTrailViewer.stories.tsx` | Storybook CSF (no Storybook package required to typecheck) |
| `tests/ts/AuditTrailViewer.test.tsx` | Jest + Testing Library |

## Proposed production mounts (needs UX sign-off)

On `/app/incidents/[id]`:

1. Case-level panel after the Evidence section (`entityType=incident`).
2. Per-file collapsible on each evidence row (`entityType=evidence`). There is no separate evidence-detail route today.

Do not treat this placement as final until a human confirms copy and location.

## Run tests

```bash
npm install
npm run test:audit
```

Storybook: add Storybook to the frontend dev flow and open `src/stories/AuditTrailViewer.stories.tsx`. Stories pass `initialEntries` so they render without Cloud.

## Security

- Public key only. No signing seeds in the client.
- Optional later: add `@noble/ed25519` if Web Crypto Ed25519 is missing in a target browser.
