# TrustLedger launch plans + Paystack

Locked for launch packaging (from trustledger.co.za). Source of truth in app: `src/config/plans.ts`.

## Plans (ZAR, excl. VAT)

| Plan | Launch /mo | Launch annual (/mo equiv.) | List /mo | Trial | CTA |
|------|------------|----------------------------|----------|-------|-----|
| **Starter** | R5,399 | R4,299 | R8,999 | 14 days | Start trial |
| **Growth** | R14,999 | R11,999 | R24,999 | 14 days | Start trial |
| **Enterprise / Public** | Custom | — | — | On request | Talk to Sales |

## Paystack status

**Not implemented in this repo or `srm-core` yet.** Ops must create Paystack Plans (Test first), then paste codes into `src/config/plans.ts` (`paystackPlanCodeTest` / `paystackPlanCodeLive`) and wire checkout via Interserv (secret key server-side only).

### Ops checklist

1. Paystack dashboard → **Test** mode → Plans matching Starter + Growth (ZAR, monthly + annual if needed).
2. Note plan codes (`PLN_…`).
3. Add Test secret/public keys to Interserv env (never `NEXT_PUBLIC_` for secret).
4. Repeat in **Live** after Test smoke.
5. Webhook → Frappe entitlement (backend packet; not in frontend alone).

Until codes exist, trial CTAs open the **open trial** frontend (`/demo` → `/app`) without charging.

## Trial UX (frontend)

- No role/login gate for demo/trial explore.
- Email required only to **print** or **save** (local persistence / export).
- Staff Frappe login remains at `/login/live`.
