# TrustLedger launch plans + Paystack

Source of truth for checkout amounts: `src/lib/paystackPlans.ts` (ADR-012 / ADR-035).

## Plans (ZAR, excl. VAT)

| Plan | Launch /mo | Trial | Checkout |
|------|------------|-------|----------|
| **Solo** | R1,999 | 14 days | `/pay?plan=solo` |
| **Practitioner** | R5,399 | 14 days | `/pay?plan=practitioner` |
| **Project** | R14,999 | 14 days | `/pay?plan=project` |
| **Institutional** | Custom | On request | `/contact` |

Ladder: **Solo** (survive desk) → **Practitioner** (AI + light governance) → **Project** (multi-seat SI) → **Institutional** (sales). See `docs/SOLO_PLAN.md`.

Persona campaigns (ADR-054) stay on this ladder — they are not extra Paystack products. UTM `grievance_desk` / `grm` → Solo; `local_procurement` / `ed_portal` / `bbbee` / `field_companion` / `capture_hub` → Project. Runbook: `docs/MODULAR_SKUS.md`.

## Paystack (Vercel path)

1. Set `PAYSTACK_SECRET_KEY` + `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` on Vercel.
2. Defaults already encode launch prices in cents (`199900` / `539900` / `1499900`).
3. Create Paystack plan code **`solo`** before live Solo charges.
4. Webhook → `/api/paystack/webhook`.
5. WordPress pricing cards → `/pay?plan=…` (see `docs/WORDPRESS_CTA.md`).

## Trial UX

- `/trial` — own-data workspace; optional `?plan=solo|practitioner|project`.
- Subscribe CTAs use Paystack, not quote-first.
