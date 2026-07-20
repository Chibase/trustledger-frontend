# Paystack setup (Ops)

Frontend catalogue: `src/config/plans.ts`. No Paystack SDK in the browser until a BFF exists.

## Create plans (Test)

| TrustLedger plan | Suggested Paystack name | Amount (ZAR) | Interval |
|------------------|-------------------------|--------------|----------|
| Starter monthly | TrustLedger Starter Launch | 5399.00 | Monthly |
| Starter annual | TrustLedger Starter Launch Annual | 51588.00 (R4,299×12) | Annually |
| Growth monthly | TrustLedger Growth Launch | 14999.00 | Monthly |
| Growth annual | TrustLedger Growth Launch Annual | 143988.00 (R11,999×12) | Annually |

Enterprise stays sales-led (no Paystack plan required for launch).

## After create

1. Copy each `plan_code` into `plans.ts`.
2. Backend: initialize transaction / subscription with secret key; webhook verifies payment.
3. Frontend: pricing page or CTA calls BFF → redirects to Paystack authorization URL.

## Smoke

1. Test mode: pay with Paystack test card.
2. Confirm webhook received on Interserv.
3. Flip Live keys only after one successful Test cycle.
