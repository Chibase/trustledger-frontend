# Paystack plan setup (Ops)

Checkout catalogue: `src/lib/paystackPlans.ts`.  
Full soft-launch cutover: **`docs/PUBLIC_LAUNCH.md`**.

## Amounts (ZAR)

| Plan | Monthly | Cents (default) |
|------|---------|-----------------|
| Practitioner | R5,399 | `539900` |
| Project | R14,999 | `1499900` |
| Institutional | Custom | `0` (sales) |

## Vercel

1. `PAYSTACK_SECRET_KEY` + `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (**live** keys for public launch)
2. `TRIAL_TOKEN_SECRET` — required in production
3. Optional amount overrides via `PAYSTACK_AMOUNT_*_CENTS`
4. Webhook: `https://<host>/api/paystack/webhook` (`charge.success`)
5. Smoke: `/pay?plan=practitioner` — test cards in test mode; real small verify in live mode

## Chibase Consulting packages (ADR-048)

Separate catalogue: `src/lib/chibase/packages.ts`. **Do not** add these IDs to `PaystackPlanId`.

| Package | Env (ZAR cents) | Listed starter (default) |
|---------|-----------------|--------------------------|
| Social facilitation sprint | `CHIBASE_AMOUNT_FACILITATION_CENTS` | R95,000 (`9500000`) |
| IKS method embed | `CHIBASE_AMOUNT_IKS_CENTS` | R110,000 (`11000000`) |
| MEL & evidence | `CHIBASE_AMOUNT_MEL_CENTS` | R125,000 (`12500000`) |
| Short-cycle field intervention | `CHIBASE_AMOUNT_FIELD_CENTS` | R185,000 (`18500000`) |

These are **starter engagements** (one programme or site, excl. VAT), not monthly software. Set the env to `0` to hide Pay now and keep request-only. Multi-site / longer work stays a quote.

Same Paystack keys as TrustLedger. Initialize: `POST /api/chibase/pay/initialize` with metadata `catalogue=chibase`. References start with `cb_`. The existing webhook at `/api/paystack/webhook` detects that catalogue and **only** writes a CRM Lead source **Chibase Consulting** — it must not provision a Plan Owner.

Smoke: `/firm/packages` (or `https://www.chibaseconsulting.co.za/packages`). Request always works. Pay now appears when cents > 0.

WordPress CTAs: `docs/WORDPRESS_CTA.md` + `docs/wordpress/page-home.txt`.
