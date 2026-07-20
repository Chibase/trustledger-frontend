# TrustLedger launch plans + Paystack

Source of truth for checkout amounts: `src/lib/paystackPlans.ts` (ADR-012 names).

## Plans (ZAR, excl. VAT)

| Plan | Launch /mo | Trial | Checkout |
|------|------------|-------|----------|
| **Practitioner** | R5,399 | 14 days | `/pay?plan=practitioner` |
| **Project** | R14,999 | 14 days | `/pay?plan=project` |
| **Institutional** | Custom | On request | `/contact` |

## Paystack (Vercel path)

1. Set `PAYSTACK_SECRET_KEY` + `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` on Vercel.
2. Defaults already encode launch prices in cents (`539900` / `1499900`).
3. Webhook → `/api/paystack/webhook`.
4. WordPress pricing cards → `/pay?plan=…` (see `docs/WORDPRESS_CTA.md`).

## Trial UX

- `/demo` open trial — no login; email on print/save only.
- Subscribe CTAs use Paystack, not quote-first.
