# WordPress CTA → TrustLedger product links

Marketing site: `https://trustledger.co.za`  
Product (Vercel): `https://trustledger-frontend-pi.vercel.app`  
Desk (Frappe Cloud): `https://app.trustledger.co.za`

## Plans (Paystack)

| Plan | Launch /mo (excl. VAT) | Checkout |
|------|------------------------|----------|
| **Practitioner** | R5,399 | `/pay?plan=practitioner` |
| **Project** | R14,999 | `/pay?plan=project` |
| **Institutional** | Custom | `/contact` (sales) |

Amounts live in `src/lib/paystackPlans.ts` (override with `PAYSTACK_AMOUNT_*_CENTS` on Vercel).

## Link map

| CTA | URL |
|-----|-----|
| **Start 14-day trial** (no login) | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=trial_14day` |
| Trial · Practitioner | `…/demo?utm_campaign=trial_practitioner` |
| Trial · Project | `…/demo?utm_campaign=trial_project` |
| **Subscribe Practitioner** | `https://trustledger-frontend-pi.vercel.app/pay?plan=practitioner&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_practitioner` |
| **Subscribe Project** | `https://trustledger-frontend-pi.vercel.app/pay?plan=project&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_project` |
| Institutional / sales | `https://trustledger-frontend-pi.vercel.app/contact?utm_source=wordpress&utm_medium=cta&utm_campaign=buy_institutional` |
| Checkout hub | `https://trustledger-frontend-pi.vercel.app/pay` |
| Sign in (staff) | `https://trustledger-frontend-pi.vercel.app/login/live` |
| Assessment | `https://trustledger-frontend-pi.vercel.app/assessment` |
| Quote / EFT fallback | `https://trustledger-frontend-pi.vercel.app/quote` (secondary only) |

## Behaviour notes

- **Primary buy CTAs** → `/pay?plan=…` (Paystack hosted checkout).
- **Primary trial CTAs** → `/demo` (open trial, email only on print/save).
- **Do not** use “Request a quote” as the main pricing CTA anymore.
- Quote/EFT remains an Ops fallback (`docs/PAYMENTS_SETUP.md` §D0) if card checkout fails.

## WordPress Home

Paste [`docs/wordpress/page-home.txt`](wordpress/page-home.txt) — pricing section has three plan cards with Subscribe → Paystack.

1. Additional CSS from `docs/wordpress/additional-css.css`
2. Pages → Home → replace Custom HTML → Update
3. Purge SpeedyCache → hard refresh

## Assessment page

Paste [`docs/wordpress/page-assessment.txt`](wordpress/page-assessment.txt).

## Vercel env (required for live charges)

```bash
PAYSTACK_SECRET_KEY=sk_test_…   # or sk_live_…
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_…
# Optional overrides (defaults already R5,399 / R14,999):
# PAYSTACK_AMOUNT_PRACTITIONER_CENTS=539900
# PAYSTACK_AMOUNT_PROJECT_CENTS=1499900
```

Webhook: `https://trustledger-frontend-pi.vercel.app/api/paystack/webhook`
