# Bugbot — TrustLedger review rules

Run on every client-facing PR before merge. Prefer **Deep** when touching payments, auth, or entitlements.

## Always check

1. **Plan gates** — Features, desk ranks, and invites must respect `PLAN_CAPABILITIES` / `canInviteDeskTier`. No force-on for modules above the plan.
2. **Plan Owner only** — Settings → Plan capabilities, Team invites, and desk privilege matrix must not appear for juniors.
3. **Desk ranks** — 1 Client/Board/funder → 5 CLO. Invites only **strictly lower** than Plan Owner desk. Accept path must re-check plan desk cap.
4. **Paystack** — No secret keys in client bundles. Webhook signature verified. Opt-out must not accept raw `authorizationCode` from the browser without Paystack reference + email match.
5. **Trial tokens** — `TRIAL_TOKEN_SECRET` (or Paystack secret) required in production; no hardcoded prod fallbacks.
6. **ADR-013** — `/ops` and live Frappe BFF stay operator-allowlisted even when trial/pay are public.
7. **AI** — Suggest → apply → save only; no LLM API keys in client code.
8. **Product name** — UI says **TrustLedger** only.

## Autofix guidance

Safe autofix: missing null checks, plan desk re-check on accept, greyed UI for off-plan desks.  
Do **not** autofix: lifting `PLATFORM_OPERATOR_ONLY`, changing live Paystack amounts, or deleting CRM lead paths.
