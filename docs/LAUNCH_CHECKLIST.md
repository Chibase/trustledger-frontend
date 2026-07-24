# Launch checklist — TrustLedger

## Fixed in code (baseline)

- Demo soft-gate leads → HubSpot (`POST /api/demo/lead`)
- Assessment lead fails closed in production if HubSpot unset
- Contact email unified to `info@trustledger.co.za`
- Privacy Policy links on assessment + demo lead forms
- Login copy no longer says “Dev”
- `NEXT_PUBLIC_DEV_ROLE` ignored in Vercel production
- Dynamic `robots.ts` + `/reports` redirect
- Plan Owner org + ranked desk invites (T1–T2); invite accept re-checks plan desk
- Trial opt-out verifies Paystack reference + email before deactivating authorization
- Production requires `TRIAL_TOKEN_SECRET` or `PAYSTACK_SECRET_KEY` (no silent fallback)

## Human actions — public soft launch + live Paystack

Follow **`docs/PUBLIC_LAUNCH.md`** end-to-end. Short form:

1. **Paystack Live** — KYC complete; copy `pk_live_` / `sk_live_` into Vercel; set webhook to `/api/paystack/webhook`.
2. **`NEXT_PUBLIC_SITE_URL`** — production host (custom domain or Vercel URL); must match Paystack callbacks.
3. **`TRIAL_TOKEN_SECRET`** — long random string on Vercel (separate from Paystack secret).
4. **`RESEND_API_KEY`** — welcome email with temp password (strongly recommended for live).
5. **Keep `PLATFORM_OPERATOR_ONLY=1`** + your email in `PLATFORM_OPERATOR_EMAILS` — buyers use `/pay` + `/trial`, not `/login/live`, until T5.
6. **`PLATFORM_OPERATOR_LOCK_PUBLIC=0`** — demo/assessment stay public.
7. **Smoke** — live R1 verify on Practitioner → thank-you + login → banner opt-out → CRM lead.
8. **Cursor Bugbot** — enable on this GitHub repo; PRs use `.cursor/BUGBOT.md`.
9. **Security Agents** (Team) — run before/after live key cutover.
10. **HubSpot** — confirm Trial Authorize / Opt-Out / demo leads.
11. **Legal** — Privacy + Terms on `trustledger.co.za` (real entity details).
12. **WordPress CTAs** — point Subscribe at `/pay`, explore at `/trial` (`docs/WORDPRESS_CTA.md`).

## Recommended launch mode

**Public:** marketing + demo + assessment + **live Paystack trial/subscribe**.  
**Operator-only:** Frappe live login + `/ops` + BFF until Plan Owner SoT (ADR-013 / T5).

See `docs/CURSOR_AGENTS.md` for Cloud Agent / Bugbot / Security / Best-of-N usage.
