# TrustLedger payments — Paystack on Frappe Cloud

**Gateway (locked for SA launch):** **Paystack** (ZAR; cards + Instant EFT / Capitec Pay after Paystack KYC).  
**Why not Peach / Stripe:** Peach new merchant intake closed; Stripe not available for this SA entity path.  
**Stock “Payments” app** on the site is Frappe’s generic payments framework — it does **not** give you Paystack by itself. Install **Frappe Paystack** (marketplace) for ERPNext invoices/links.

Product access after payment still follows `docs/ACCESS_MODEL.md` (Plan Owner = admin). Automation can wait; **manual Owner create after paid invoice** is fine for soft launch.

---

## A. Paystack account (business)

1. Create / sign in at [https://dashboard.paystack.com](https://dashboard.paystack.com) (South Africa business).
2. Complete business KYC (legal name, bank, directors) until **Go live** is available.
3. **Settings → API Keys & Webhooks**
   - Copy **Test** Public + Secret keys for sandbox.
   - Later: **Live** keys only after a successful test charge.
4. **Settings → Preferences → Payments** — enable channels you need (Card; request Instant EFT / Capitec Pay if required).
5. Note company settlement bank (ZAR).

Keep keys out of chat and git. Store only in Frappe Desk / password manager.

---

## B. Frappe Cloud — install Paystack app

**Frappe Paystack is a third-party Marketplace app.** On a **shared / public bench** it will **not** appear under Site → Apps → Install App (only featured Frappe apps show). That is why the Marketplace page’s “install” guidance feels broken.

### B1. Put the site on a private bench (required)

1. [https://cloud.frappe.io](https://cloud.frappe.io) → open site `app.trustledger.co.za`.
2. If you see **Upgrade Plan** / private-bench banner: upgrade to a plan that allows private benches (**USD 25+/month** class — confirm on FC pricing).
3. Then use **Move to Private Bench** (or create a private **Bench Group**, add apps, migrate site).  
   Docs: [Move site from shared to private bench](https://docs.frappe.io/cloud/site/site-migrations/move-site-from-shared-to-private-bench).

### B2. Add Paystack to the **bench**, then install on the **site**

1. Cloud → your **Bench Group** (not only the site) → **Apps** → **Add App**.
2. Choose **Frappe Paystack** from Marketplace, or GitHub `https://github.com/mymi14s/frappe_paystack` (Version **15**).
3. **Update Available** → deploy/update including this site.
4. Site → **Apps** → **Install App** → **Frappe Paystack**.
5. Wait for migrate; open Desk `https://app.trustledger.co.za` and hard-refresh.

Also confirm **ERPNext** is installed on the site (Sales Invoice / Mode of Payment). CRM-only sites cannot complete the Paystack invoice flow.

### B3. If still blocked

Open a Frappe Cloud support ticket: ask them to add `frappe_paystack` to your private bench / site `app.trustledger.co.za`.  
App page: [Marketplace — Frappe Paystack](https://cloud.frappe.io/marketplace/apps/frappe_paystack).

---

## C. Desk configuration (Accounts)

Sign in as **Administrator** / System Manager.

### 1. Company & currency
- **Company** uses **ZAR**.
- Chart of accounts has a bank / clearing account you can use as suspense.

### 2. Mode of Payment
- New **Mode of Payment** → name: `Paystack`.
- Type: **Cash** or **Bank** (match your accounting practice).
- Default account: your Paystack clearing / suspense account.

### 3. Paystack Gateway Setting
Desk search → **Paystack Gateway Setting** (or Accounts → Payment Gateways):

| Field | Value |
|-------|--------|
| Public Key | Paystack **test** `pk_test_…` |
| Secret Key | Paystack **test** `sk_test_…` |
| Suspense / clearing account | ZAR account from step 1 |
| Mode of Payment | `Paystack` |
| Enabled | ✓ |

Save.

### 4. Webhook (Paystack → Frappe)
In Paystack Dashboard → **Settings → API Keys & Webhooks**:

- URL (typical for this app; confirm on the app’s README after install):  
  `https://app.trustledger.co.za/api/method/frappe_paystack.api.webhook`  
  If Desk/app docs show a different path, **use that path**.
- Events: at least `charge.success` (and refunds if offered).

### 5. Smoke test (test mode)
1. Create a **Customer** + **Sales Invoice** (small amount, ZAR) with customer **email**.
2. Submit invoice → **Pay** / Paystack action → generate **payment link** (email or copy).
3. Pay with Paystack **test** card: `4084084084084081` (any future expiry, any CVV) — confirm current test cards in Paystack docs.
4. Confirm invoice shows **Paid** (or partial) and a Paystack transaction log exists.

Only after that: switch Gateway Setting to **live** keys and repeat one tiny live payment.

---

## D0. Quote + EFT bridge (fallback)

Prefer **Paystack `/pay`** for Practitioner and Project. Use quote → invoice → EFT only if card checkout is unavailable:

```text
WordPress / trial CTA
  → https://trustledger-frontend-pi.vercel.app/quote?plan=practitioner
  → CRM Lead (source Quote Request) + optional OPS_ALERT_WEBHOOK_URL
  → you send Quotation / Sales Invoice from Frappe Desk
  → buyer pays EFT
  → Ops → Finance → Confirm EFT paid
  → CRM Lead (source EFT Payment) → Finance / Executive
  → you create Customer + Plan Owner manually when lockdown allows
```

| Piece | Detail |
|-------|--------|
| Public form | `/quote` (secondary) |
| CRM sources | `Quote Request`, `EFT Payment` — create via crm-setup or Desk |
| Ops action | `/ops/finance` → **Confirm EFT paid** (allowlist only) |
| Optional alert | Vercel `OPS_ALERT_WEBHOOK_URL` (Slack/Discord/Make) |
| Integrity | No auto Plan Owner; lockdown still applies |

Plan prices on the quote form use the same `PAYSTACK_AMOUNT_*_CENTS` list prices when set (indicative on the Lead).

---

## D. Vercel Paystack checkout (active while Desk app blocked)

Use this path on the **shared Frappe Cloud bench** (no Marketplace Paystack install required).

```text
WordPress / pricing Subscribe
  → https://trustledger-frontend-pi.vercel.app/pay?plan=practitioner
  → Paystack hosted checkout (default: trial_authorize = small card verify)
  → /pay/success → trial active immediately + temp password (email when Resend set)
  → CRM Lead (source Trial Authorize) · card on file for day-14 charge
  → Opt-out anytime before bill → Trial Opt-Out + deactivate authorization
  → Ops charge-due after trial if still scheduled
```

Optional immediate pay: `/pay?mode=pay_now` (first month charged today).

### D1. Vercel env (Production)

```bash
PAYSTACK_SECRET_KEY=sk_test_…
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_…
# Amounts in ZAR cents (R500.00 = 50000)
PAYSTACK_AMOUNT_PRACTITIONER_CENTS=539900
PAYSTACK_AMOUNT_PROJECT_CENTS=1499900
# Card verification amount for trial subscribe (default R1.00)
# PAYSTACK_TRIAL_VERIFY_CENTS=100
# Optional welcome email (temp password). If unset, credentials show on success page only.
# RESEND_API_KEY=re_…
# RESEND_FROM_EMAIL=TrustLedger <onboarding@trustledger.co.za>
# Optional stronger signing for activation tokens (falls back to Paystack secret)
# TRIAL_TOKEN_SECRET=…
# Institutional stays contact-sales unless you set an amount
# PAYSTACK_AMOUNT_INSTITUTIONAL_CENTS=0
```

Redeploy after saving.

### D2. Paystack webhook

Dashboard → **Settings → API Keys & Webhooks**:

`https://trustledger-frontend-pi.vercel.app/api/paystack/webhook`

Event: `charge.success` (signature verified with the secret key).

### D3. WordPress CTAs

| Plan | URL |
|------|-----|
| Practitioner | `…/pay?plan=practitioner&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_practitioner` |
| Project | `…/pay?plan=project&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_project` |
| Institutional | `…/contact` (sales-led) |

### D4. Soft-launch ops

1. Buyer completes Subscribe on `/pay` (trial_authorize by default).  
2. Success page activates trial + shows login details (no contact CTA).  
3. CRM shows **Trial Authorize**; Finance / Executive notifications fire.  
4. Before day 14: buyer can **Cancel before you are charged** in the trial banner.  
5. After day 14 (if still scheduled): Ops calls `/api/paystack/charge-due` with the authorization from the CRM lead note.  
6. Manually update CRM Customer + Plan Owner when lockdown allows (`docs/ACCESS_MODEL.md`).  

Do **not** auto-create customer Frappe logins from HubSpot while ADR-013 lockdown is on. Browser trial + temp password is the self-serve path.

---

## E. Soft-launch via Frappe Desk (after private bench)

Until Desk Paystack + entitlement automation:

1. Buyer pays via Paystack link on Sales Invoice.  
2. You see Paid in Desk.  
3. Manually create Plan Owner per `docs/ACCESS_MODEL.md`.  
4. Log handoff: `Paid Paystack ref … · Plan …`.

---

## F. Later (product automation)

| Step | Owner |
|------|--------|
| Webhook handler → entitlement DocType | `srm-core` on Cloud |
| Email Owner invite / magic link | Frappe Notification + Vercel `/login/live` |
| Desk `frappe_paystack` on private bench | When you upgrade FC plan |
| Live keys | After test checkout passes |

---

## G. Checklist

### Vercel path (now)
- [ ] Paystack SA business + **test** keys on Vercel  
- [ ] Plan amounts (`*_CENTS`) set  
- [ ] Webhook → `/api/paystack/webhook`  
- [ ] Test `/pay?plan=practitioner` end-to-end  
- [ ] Payment visible in Ops Finance  
- [ ] Live keys only after test passes  

### Desk path (later)
- [ ] Private bench + `frappe_paystack`  
- [ ] Mode of Payment + Gateway Setting  
- [ ] Test Sales Invoice paid  

**Blocked on you:** Paystack keys + Vercel env amounts (secrets stay with you).
