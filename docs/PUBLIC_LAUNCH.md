# Public soft launch — live Paystack

**Goal:** Clients can Subscribe / trial on production with **live** Paystack while Cloud Agents, Bugbot, and Security Agents guard the repo.

## Product surfaces (public)

| Surface | Public? | Notes |
|---------|---------|--------|
| Marketing `/`, `/assessment`, `/contact`, `/quote` | Yes | Lead capture |
| `/demo`, sample `/app` | Yes | Demo banner on |
| `/trial`, `/pay`, `/pay/success`, `/login/trial` | Yes | Card-on-file trial |
| `/invite/accept` | Yes | Demo/local org seats until T5 |
| `/login/live`, live `/app`, `/api/frappe` | **Operator allowlist** until T5 | Keep `PLATFORM_OPERATOR_ONLY=1` |
| `/ops/*` | Always allowlist | Never public |

Trial + Paystack is the **client path**. Frappe live login stays operator-only until Plan Owner SoT (T5 / ADR-013 lift).

## Vercel env — live Paystack cutover

Replace test keys with **live** keys from Paystack Dashboard → API Keys:

```bash
# Required
NEXT_PUBLIC_SITE_URL=https://trustledger-frontend-pi.vercel.app   # or custom domain
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_…
PAYSTACK_SECRET_KEY=sk_live_…
TRIAL_TOKEN_SECRET=<long random string>   # do not reuse Paystack secret long-term
PAYSTACK_WEBHOOK_SECRET=<from Paystack webhook config>

# Recommended
RESEND_API_KEY=…                          # welcome email with temp password
RESEND_FROM=TrustLedger <noreply@…>

# Keep for ops / live Frappe
PLATFORM_OPERATOR_ONLY=1
PLATFORM_OPERATOR_EMAILS=admin@chibaseconsulting.co.za
PLATFORM_OPERATOR_LOCK_PUBLIC=0           # demo stays public

# Data
NEXT_PUBLIC_DATA_MODE=demo                # safe default; live DocTypes later
```

### Paystack Dashboard

1. Switch account to **Live**.
2. Webhook URL: `https://<your-host>/api/paystack/webhook` — events: `charge.success` (and refunds if used).
3. Confirm `callback_url` / site URL match `NEXT_PUBLIC_SITE_URL`.
4. Smoke: `/pay?plan=practitioner` with a **real** small verify charge (default R1), then opt-out from the trial banner.

### Do not

- Commit live keys to git.
- Set `PLATFORM_OPERATOR_ONLY=0` until Frappe Customer/User issuance (T5) is ready.
- Point WordPress CTAs at `/login/live` for buyers — use `/pay` or `/trial`.

## Cursor quality gates (every client-facing PR)

1. **Bugbot** on the PR (rules in `.cursor/BUGBOT.md`).
2. **`npm run lint` + `npm run build`** green.
3. **Security Review** cloud agent if the PR touches `/api/paystack/*`, `/api/billing/*`, `/api/trial/*`, or auth cookies.
4. Manual smoke: Subscribe → success credentials → Settings plan banner → (Project) invite lower desk only.

## After go-live

- Monitor Paystack live transactions + HubSpot/CRM `Trial Authorize` / `Trial Opt-Out`.
- Day-14 charges via Ops `/api/paystack/charge-due` (allowlist) — see ADR-025.
- Plan Owner Frappe users remain **manual** until ADR-013 lift (`docs/PLATFORM_OPERATOR.md`).

## Frappe sample data vs reports

Deleting ERPNext sample DocTypes on Cloud **does not** fix Month-End AI templates. See `docs/FRAPPE_SAMPLE_DATA.md`. Clear bad drafts in the **browser** report library instead; Create report uses the local evidence writer only.
