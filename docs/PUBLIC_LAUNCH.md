# Public soft launch — live Paystack

**Goal:** Clients Subscribe / trial on production with **live** Paystack.  
**Status:** GO LIVE Done (2026-07-23) — buyers may `/login/live`. Instant runbook: `docs/LAUNCH_WATCHLIST.md`.

## Product surfaces (public)

| Surface | Public? | Notes |
|---------|---------|--------|
| Marketing `/`, `/product`, `/assessment`, `/contact`, `/quote` | Yes | Lead capture + onboarding |
| `/demo` | Redirect | **Retired** → `/product` (ADR-033) |
| `/trial`, `/pay`, `/pay/success`, `/login/trial` | Yes | Own-data trial / card path |
| `/invite/accept` | Yes | Browser-local org seats until Cloud Users |
| `/login/live`, live `/app` | **Buyers open** | `PLATFORM_OPERATOR_ONLY=0` |
| `/api/frappe` (buyer session) | Live buyers + ops | Entitlement gate applies |
| `/ops/*` | Always allowlist | `PLATFORM_OPERATOR_EMAILS` — never public |

Trial + Paystack is the **self-serve path**. Live Frappe login is open for entitled Customers; Ops stay allowlist-only. See `docs/PLATFORM_STRATEGIC_BRIEF.md` for plan packaging and public agent scripts.

## Branding

- UI product name: **TrustLedger** only.
- **Chibase Consulting** OK for footer / legal / ops allowlist email — not as a product alias.
- Client co-branding later: Institutional-first, exports only — see `docs/LAUNCH_WATCHLIST.md`.

## Vercel env — live Paystack cutover

Replace test keys with **live** keys from Paystack Dashboard → API Keys:

```bash
# Required
NEXT_PUBLIC_SITE_URL=https://trustledger-frontend-pi.vercel.app   # or custom domain
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_…
PAYSTACK_SECRET_KEY=sk_live_…
TRIAL_TOKEN_SECRET=<long random string>   # do not reuse Paystack secret

# Recommended
RESEND_API_KEY=…                          # welcome email with temp password
RESEND_FROM_EMAIL=TrustLedger <onboarding@resend.dev>   # or verified @trustledger.co.za
# Alias also accepted: RESEND_FROM=…

# GO LIVE posture
PLATFORM_OPERATOR_ONLY=0
PLATFORM_OPERATOR_EMAILS=admin@chibaseconsulting.co.za
PLATFORM_OPERATOR_LOCK_PUBLIC=0           # demo stays public
FRAPPE_OWNER_ISSUANCE=1
FRAPPE_AUTO_PROVISION=1
CRON_SECRET=<random>                      # day-14 cron

# Data
NEXT_PUBLIC_DATA_MODE=demo                # safe default until live lists proven
NEXT_PUBLIC_AI_MOCK=true
```

Webhook auth uses the **Paystack secret key** HMAC (`PAYSTACK_SECRET_KEY`) — there is no separate webhook secret env in this app.

### Paystack Dashboard

1. Switch account to **Live**.
2. Webhook URL: `https://<your-host>/api/paystack/webhook` — events: `charge.success` (and refunds if used).
3. Confirm `callback_url` / site URL match `NEXT_PUBLIC_SITE_URL`.
4. Smoke: `/pay?plan=practitioner` with a **real** small verify charge (default R1), then opt-out from the trial banner.

### Do not

- Commit live keys to git.
- Set `PLATFORM_OPERATOR_ONLY=1` again (re-blocks buyers / GO LIVE ladder).
- Clear `PLATFORM_OPERATOR_EMAILS` (breaks `/ops`).
- Point WordPress CTAs at `/login/live` for cold buyers — use `/pay` or `/trial`.

## Cursor quality gates (every client-facing PR)

1. **Bugbot** on the PR (rules in `.cursor/BUGBOT.md`).
2. **`npm run lint` + `npm run build`** green.
3. **Security Review** cloud agent if the PR touches `/api/paystack/*`, `/api/billing/*`, `/api/trial/*`, or auth cookies.
4. Manual smoke: Subscribe → success credentials → Settings plan banner → (Project) invite lower desk only.

## After go-live

- Monitor Paystack live transactions + HubSpot/CRM `Trial Authorize` / `Trial Opt-Out`.
- Day-14 charges via cron + Ops Finance charge-due — see `docs/LAUNCH_WATCHLIST.md`.
- Keep customer live workspaces free of demo `INC-*` bleed (sample `/demo` retired).

## Frappe sample data vs reports

Deleting ERPNext sample DocTypes on Cloud **does not** fix Month-End AI templates. See `docs/FRAPPE_SAMPLE_DATA.md`. Clear bad drafts in the **browser** report library instead; Create report uses the local evidence writer only.
