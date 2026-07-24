# Launch watchlist — first days + rising traffic

**Status:** GO LIVE Done (2026-07-23). Use this as the instant-response runbook.

Production: https://trustledger-frontend-pi.vercel.app  
Cloud: https://app.trustledger.co.za  
Ops ladder: `/ops/readiness` · Health: `GET /api/health` (`deploySha`)

---

## Branding (non-negotiable)

| Rule | Detail |
|------|--------|
| Product name in UI | **TrustLedger** only |
| Owner / legal | **Chibase Consulting** OK in footer, ops allowlist email, contact “we reply from…” |
| Forbidden | AccordBridge or any other product alias in runnable UI/meta |
| Client branding (future) | Institutional-first co-brand on **exports/reports only**; never replace TrustLedger chrome. Density: Practitioner none → Project optional later → Institutional capability. See § Client branding below. |

---

## Instant mitigations (keep this open)

| Symptom | Likely trigger | Instant fix | Code status |
|---------|----------------|-------------|-------------|
| Buyers cannot `/login/live` | `PLATFORM_OPERATOR_ONLY=1` | Set `0`, redeploy. **Keep** `PLATFORM_OPERATOR_EMAILS` | Gate on `/ops/readiness` + `/api/health` `launch.lockdownLifted` |
| Ops locked out | Empty / wrong allowlist | Set `PLATFORM_OPERATOR_EMAILS`, redeploy | Fail closed |
| Paystack paid but no Cloud User | `FRAPPE_AUTO_PROVISION` / `FRAPPE_OWNER_ISSUANCE` / API keys | Both flags `=1` + keys; Ops Create on Cloud | Hardening gate `autoProvision` |
| Login entitlement blocked | `past_due` / `cancelled` | Desk → `trial`/`active`; Ops charge-due | Entitlement gate live |
| Welcome email missing | `RESEND_API_KEY` unset | `/pay/success` credentials; set Resend | Hardening gate `resend` |
| Day-14 not charging | `CRON_SECRET` missing | Set secret; Ops **Charge due now** | Hardening gate `cronSecret` |
| Demo `INC-*` in customer desk | Empty live→mock / invite `demo` | Fixed (launch-hardening) | Shipped |
| Bad deploy / env bake | Wrong `NEXT_PUBLIC_*` | Vercel rollback | `deploySha` on health |
| **Spam on forms** | reCAPTCHA keys unset | **Set keys + `FORM_REQUIRE_RECAPTCHA=1`**, redeploy | Wired; **keys = you** |
| Unverified inbox uses product | No email proof | Set `RESEND_API_KEY` (OTP + trial verify auto-on in Production) | Shipped |

**Do not** set `PLATFORM_OPERATOR_ONLY=1` again after GO LIVE — it re-blocks buyers and the readiness ladder.

### Access email verification (before reCAPTCHA is fine)

```bash
# Vercel Production — enables live login OTP + trial “verify email” copy
RESEND_API_KEY=re_…
RESEND_FROM_EMAIL=TrustLedger <onboarding@resend.dev>
# After Domains verified: TrustLedger <onboarding@trustledger.co.za>
# Optional force:
ACCESS_EMAIL_VERIFICATION=1
```

- **Live:** password → emailed 6-digit code → session  
- **Trial:** Paystack success → email “Verify & open” → `/pay/activate` opens workspace  
- Confirm: `/api/health` → `launch.accessVerificationReady: true`

### Turn on reCAPTCHA now (operator)

```bash
# Vercel Production env — then Redeploy
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<Google reCAPTCHA v3 site key>
RECAPTCHA_SECRET_KEY=<Google reCAPTCHA v3 secret>
FORM_REQUIRE_RECAPTCHA=1
RECAPTCHA_MIN_SCORE=0.5
```

Domains on the Google key: `trustledger-frontend-pi.vercel.app`, `trustledger.co.za`.  
Until keys are set: honeypot + work-email + **tighter** rate limit (3/15 min) still run.

---

## First-days failure modes (detail)

### 1. Onboarding: `/pay` → webhook → Cloud Owner → `/login/live`

1. Checkout needs live Paystack keys + plan amount cents.
2. Webhook verifies with **`PAYSTACK_SECRET_KEY` HMAC** (not a separate `PAYSTACK_WEBHOOK_SECRET`).
3. Auto-provision needs `FRAPPE_AUTO_PROVISION=1` ∧ `FRAPPE_OWNER_ISSUANCE=1` ∧ API keys.
4. Buyer first login migrates `tl-org-*` best-effort — same browser as trial helps.

### 2. Invites (browser-local until Cloud seats)

- Invites live in `localStorage` — **same browser/device** as Owner (ADR-026).
- Invitees now enter **`trial` mode** (customer workspace) so they do not see demo `INC-*`.
- Password is not a Frappe User yet — say so in onboarding copy if asked.

### 3. Demo vs live isolation

| Path | Rule |
|------|------|
| `/demo` | Sample data OK |
| Trial / invitee / live customer org | **No** mock `INC-*` seed |
| `NEXT_PUBLIC_DATA_MODE=live` + Frappe error | Customer/trial → empty/workspace; demo-only → mock fallback (ADR-010) |
| Production default | Prefer `NEXT_PUBLIC_DATA_MODE=demo` until Cloud list methods are reliable |

### 4. Billing day-14

- Cron: `vercel.json` → `/api/cron/charge-due` with `Authorization: Bearer CRON_SECRET`.
- Batch cap 50 Customers — re-run Ops charge-due if cohort is larger.
- Declined cards → `past_due` → live login blocked until Desk/ops fix.

### 5. Traffic increase

| Risk | Mitigation |
|------|------------|
| Vercel cold starts on first pay/login | Accept; optional warm via health ping |
| Paystack webhook retries | Provision idempotent by `custom_owner_email` |
| Frappe API key pressure | Avoid polling; Ops tools on demand |
| In-memory form rate limits reset per instance | reCAPTCHA |
| Multi-device before Cloud SoT | Promise `/login/live` after provision; browser trial is device-local |

---

## Env checklist (Production)

```bash
PLATFORM_OPERATOR_ONLY=0
PLATFORM_OPERATOR_EMAILS=admin@chibaseconsulting.co.za   # ops only
FRAPPE_OWNER_ISSUANCE=1
FRAPPE_AUTO_PROVISION=1
FRAPPE_BASE_URL=https://app.trustledger.co.za
FRAPPE_API_KEY=…
FRAPPE_API_SECRET=…
PAYSTACK_SECRET_KEY=sk_live_…
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_…
TRIAL_TOKEN_SECRET=…   # dedicated, not Paystack secret
CRON_SECRET=…
RESEND_API_KEY=…       # strongly recommended
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=…
RECAPTCHA_SECRET_KEY=…
FORM_REQUIRE_RECAPTCHA=1
NEXT_PUBLIC_SITE_URL=https://trustledger-frontend-pi.vercel.app
NEXT_PUBLIC_DATA_MODE=demo
NEXT_PUBLIC_AI_MOCK=true
```

---

## Client branding (future — do not rush)

No white-label hooks today (fixed TrustLedger logo/chrome).

**Phased density by plan:**

| Plan | Branding density |
|------|------------------|
| Practitioner | None — TrustLedger only |
| Project | Optional later: report footer co-name |
| Institutional | Co-brand logo + short name on **PDF/export headers** behind capability `clientBranding` |

**Rules when built:** TrustLedger wordmark stays in app chrome; client mark is secondary; fields on Frappe Customer (`custom_brand_*`); AI stays suggest→apply→save; no LLM keys in client.
