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

WordPress CTAs: `docs/WORDPRESS_CTA.md` + `docs/wordpress/page-home.txt`.
