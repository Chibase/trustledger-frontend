# Paystack plan setup (Ops)

Checkout catalogue: `src/lib/paystackPlans.ts`.  
Full soft-launch cutover: **`docs/PUBLIC_LAUNCH.md`**.  
Billing model: **ADR-025** (card verify → trial → recurring charge_authorization).

## Amounts (ZAR / month)

| Plan | Monthly | Cents (default) | Checkout |
|------|---------|-----------------|----------|
| Solo | R1,999 | `199900` | Self-serve |
| Practitioner | R5,399 | `539900` | Self-serve |
| Project | R14,999 | `1499900` | Self-serve |
| Institutional | Quote | `0` | `/quote` (not Paystack list price) |

Confirm live catalogue: `GET /api/paystack/plans` on the deployment.

## Recurring model (important)

We do **not** rely on Paystack Dashboard “Subscription Plans” for TrustLedger SaaS.

Flow:

1. **Subscribe** (`trial_authorize`) — small verify charge; store reusable authorization + `custom_bill_at` = trial end.  
2. **Day 14** — cron `/api/cron/charge-due` charges plan amount → status `active`, **advance `custom_bill_at` +1 month**.  
3. **Each following month** — same cron charges again while authorization remains and entitlement is not `cancelled`.  
4. **Pay now** — first month charged immediately; next `custom_bill_at` = +1 month with auth on file.  
5. **Opt-out** — deactivate authorization + clear billing so cron skips.

Daily schedule: `vercel.json` → `0 6 * * *` → `/api/cron/charge-due` (needs `CRON_SECRET`).

## Vercel

1. `PAYSTACK_SECRET_KEY` + `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (**live** keys for public launch)
2. `TRIAL_TOKEN_SECRET` — required in production
3. Optional amount overrides via `PAYSTACK_AMOUNT_*_CENTS`
4. `CRON_SECRET` for charge-due
5. Webhook: `https://<host>/api/paystack/webhook` (`charge.success`)
6. Smoke: `/pay?plan=solo` or `practitioner` — test cards in test mode; real small verify in live mode

WordPress CTAs: `docs/WORDPRESS_CTA.md` + `docs/wordpress/page-home.txt`.

## Ops after deploy (recurring fix)

1. Ops → Accounts → ensure Customer custom fields (label **Next bill at**).  
2. For any **active** Customer already charged once with auth still stored but `custom_bill_at` empty/past: set next bill date manually, or they will not renew.  
3. Finance → Dry-run due list → confirm trial + renewals appear.
