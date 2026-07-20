# Paystack plan setup (Ops)

Checkout catalogue: `src/lib/paystackPlans.ts`.

## Amounts (ZAR)

| Plan | Monthly | Cents (default) |
|------|---------|-----------------|
| Practitioner | R5,399 | `539900` |
| Project | R14,999 | `1499900` |
| Institutional | Custom | `0` (sales) |

## Vercel

1. `PAYSTACK_SECRET_KEY` + `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
2. Optional amount overrides via `PAYSTACK_AMOUNT_*_CENTS`
3. Webhook: `https://trustledger-frontend-pi.vercel.app/api/paystack/webhook` (`charge.success`)
4. Smoke: `/pay?plan=practitioner` with test card

WordPress CTAs: `docs/WORDPRESS_CTA.md` + `docs/wordpress/page-home.txt`.
