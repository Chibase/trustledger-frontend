# DPA Trust Pack template (SEC-3)

**Status:** Template for Project+ / Institutional Trust Pack. **Not executed** until countersigned. Not legal advice. Do not claim ISO 27001 or SOC 2.

Public HTML: `/legal/dpa`. Subprocessors annex: `/legal/subprocessors` and `src/lib/legal/subprocessors.ts`.

Operator: Chibase Consulting, product name **TrustLedger**.

Copy the `/legal/dpa` clauses into the signed PDF/Word when an order includes Trust Pack. Replace the execution paragraph with signature blocks, Customer legal name, and effective date.

## Attachments

| Annex | Content |
|-------|---------|
| A | Subprocessors table (keep in lockstep with `/legal/subprocessors`) |
| B | Purge SLA — 30 days after verified request (`docs/PURGE_RUNBOOK.md`) |
| C | Plan / isolation notes — Isolation SKU remains playbook-only until Cloud price is locked (SEC-4) |

## Honest limits

- Trial without a Cloud Customer is device-local; the DPA’s Cloud purge path does not apply until provision.
- AI Assist is suggest → apply → save; this is not a training opt-out for a model we do not train.
- Ledger production signing is blocked on `docs/KEY_MANAGEMENT.md`.
