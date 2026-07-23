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

| Symptom | Likely trigger | Instant fix |
|---------|----------------|-------------|
| Buyers cannot `/login/live` | `PLATFORM_OPERATOR_ONLY=1` | Set `0`, redeploy. **Keep** `PLATFORM_OPERATOR_EMAILS` |
| Ops locked out | Empty / wrong allowlist | Set `PLATFORM_OPERATOR_EMAILS`, redeploy |
| Paystack paid but no Cloud User | `FRAPPE_AUTO_PROVISION` or `FRAPPE_OWNER_ISSUANCE` off / missing API keys | Set both `=1` + keys; Ops → Accounts → Create on Cloud |
| Login “could not map roles” | Frappe User missing roles | Desk: assign roles; re-login |
| Login entitlement blocked | `custom_entitlement_status` = `past_due` / `cancelled` | Desk → `trial`/`active`; Ops Finance charge-due |
| Welcome email missing | `RESEND_API_KEY` unset | Buyer uses `/pay/success` credentials; set Resend |
| Day-14 not charging | `CRON_SECRET` missing / cron auth fail | Set secret; Ops Finance **Charge due now** |
| Demo `INC-*` in customer desk | Old invite as `demo` / live empty→mock (fixed in launch-hardening) | Sign out; clear site data; `/login/live`; redeploy hardening |
| Bad deploy / env bake | Wrong `NEXT_PUBLIC_*` | Vercel → previous Production deployment |
| Cloud / Frappe down | Site or API key issue | `/api/health`; Desk ping; keep `NEXT_PUBLIC_DATA_MODE=demo` for public until live lists proven |
| Spam on contact/assessment | Form flood | Enable reCAPTCHA keys; rate limit is weak on serverless |

**Do not** set `PLATFORM_OPERATOR_ONLY=1` again after GO LIVE — it re-blocks buyers and the readiness ladder.

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
