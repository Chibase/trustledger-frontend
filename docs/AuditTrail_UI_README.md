Audit Trail UI

This branch feature/audit-trail-ui adds a small reusable AuditTrailViewer React component that:

- Fetches the ledger chain for an entity using GET /api/method/srm_core.api.ledger.get_chain?entity_id=...
- Fetches the ledger public key from GET /api/method/srm_core.api.ledger.public_key
- Recomputes the chain hash using the canonicalizer in src/lib/ledger/canonicalize.ts
- Verifies signatures client-side using @noble/ed25519 if installed

Files added
- src/components/audit/AuditTrailViewer.tsx
- src/lib/ledger/canonicalize.ts
- src/lib/ledger/verify.ts
- src/stories/AuditTrailViewer.stories.tsx
- tests/ts/AuditTrailViewer.test.tsx

Notes & next steps
- The verification helper depends on @noble/ed25519; add it to the frontend dependencies: `npm install @noble/ed25519`.
- Storybook story is a simple placeholder; in CI you can wire MSW to mock the API endpoints for live previews.
- UX copy and placement: the component is ready to mount in Incident and Evidence detail pages; I included a separate integration patch suggestion in the PR (do not apply without UX review).

Human review checkpoints
- Security: review use of public_key endpoint and decision to verify client-side. If you prefer server-side verify only, we can adjust.
- UX: approve the copy, placement and confirm where on the Incident and Evidence pages this collapsible panel should mount.
