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

On [https://app.trustledger.co.za](https://app.trustledger.co.za) (Frappe Cloud site):

1. Cloud dashboard → your site → **Apps** / **Install from Marketplace**.
2. Install **Frappe Paystack** (`frappe_paystack`) — *not* only the generic **Payments** app.
3. Wait for install + migrate to finish; reload Desk.

If Marketplace install is blocked, ask Frappe Cloud support to install  
`https://github.com/mymi14s/frappe_paystack` on the site.

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

## D. Soft-launch operating model (no code yet)

Until webhook → entitlement is built:

1. Buyer pays via Paystack link on Sales Invoice.  
2. You see Paid in Desk.  
3. Manually create Plan Owner per `docs/ACCESS_MODEL.md` (after Platform Operator lockdown is lifted).  
4. Log handoff in CRM Lead / Customer note: `Paid Paystack ref … · Plan …`.

Do **not** auto-create customer logins from HubSpot.

---

## E. Later (product automation)

| Step | Owner |
|------|--------|
| Webhook handler → entitlement DocType | `srm-core` on Cloud |
| Email Owner invite / magic link | Frappe Notification + Vercel `/login/live` |
| Marketing “Buy” CTA → invoice or hosted Paystack checkout | WordPress or TrustLedger `/contact` |
| Vercel env for public key (never secret) | Optional hosted checkout |

---

## F. Checklist

- [ ] Paystack SA business + test keys  
- [ ] `frappe_paystack` installed on `app.trustledger.co.za`  
- [ ] Mode of Payment `Paystack` + clearing account  
- [ ] Paystack Gateway Setting enabled (test)  
- [ ] Webhook URL saved in Paystack  
- [ ] Test invoice paid end-to-end  
- [ ] Live keys only after test passes  

**Blocked on you:** Paystack signup/KYC + Marketplace install + pasting keys in Desk (secrets stay with you).
