# WhatsApp Business ↔ TrustLedger CRM (WA-1)

**Locked:** ADR-039.  
**Site:** `https://app.trustledger.co.za`  
**App:** Frappe WhatsApp (`frappe_whatsapp`) — usually from Cloud Marketplace (the app you installed).

TrustLedger’s **Vercel app does not talk to Meta**. Chat and templates live in **Desk / Frappe CRM**. This repo probes readiness, ensures a **WhatsApp** CRM Lead Source, and lets Ops log WhatsApp interest as a Lead (with mobile) until Meta webhooks are live.

```text
Meta WhatsApp Cloud API
        ↓ webhook
Frappe WhatsApp (Desk)
        ↓
CRM Lead / Deal WhatsApp tab  (+ mobile_no on Lead)
        ↓
Ops / sales follow-up (templates → free-form after reply)
```

---

## 1. What “connected” means

| Ready | Meaning |
|-------|---------|
| App installed | `frappe_whatsapp` on the Cloud site |
| Credentials | WhatsApp Account / Settings: token, Phone ID, Business ID, App ID, verify token |
| Webhook | Meta points at Cloud URL; verify succeeds; subscribed to `messages` |
| CRM | Lead/Deal show WhatsApp tab; Lead **mobile** populated |
| Templates | At least one Meta-approved template to *start* chats |

Personal WhatsApp (phone app) ≠ Business API. Scanning WhatsApp Web on your laptop does not feed CRM.

---

## 2. Desk / Meta setup (you)

Follow `docs/exports/whatsapp/HUMAN_ONLY.md` in order.

**Webhook URL (typical):**

```text
https://app.trustledger.co.za/api/method/frappe_whatsapp.utils.webhook.webhook
```

Verify token = the same string you set in Desk WhatsApp Account / Settings.

Official CRM notes: [Frappe CRM · WhatsApp](https://docs.frappe.io/crm/whatsapp).

---

## 3. Agent / Ops (this repo)

After deploy with `FRAPPE_API_KEY` / `SECRET`:

1. `/ops/accounts` → **WhatsApp CRM** → **Probe Desk** → **Ensure WhatsApp source**.
2. Or `POST /api/frappe/ensure-whatsapp` with `{ "dryRun": false }` (operator session or `x-tl-whatsapp-setup` + `CRM_SETUP_TOKEN` / `WHATSAPP_SETUP_TOKEN`).
3. Log a chat as a lead: same panel → name + mobile (+ optional email) → **Create lead**.

Creates/updates:

- CRM Lead Source **`WhatsApp`**
- Pinned CRM view **WhatsApp queue** (source = WhatsApp, status = New)

---

## 4. Sales rules (SA soft launch)

- Prefer people who messaged you first or gave consent.
- Outbound cold start = **approved template** only; free-form after they reply (24h window).
- Put the **E.164 mobile** on the Lead (`mobile_no`) so the WhatsApp tab can match threads.
- Do not buy lists or blast from personal WhatsApp into CRM.

---

## 5. Related

- Human checklist: `docs/exports/whatsapp/HUMAN_ONLY.md`
- CRM sources: `docs/CRM_VIEWS.md`
- ADR-039 in `docs/DECISIONS.md`
