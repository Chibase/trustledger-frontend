# WhatsApp — what only you can do

Installing the WhatsApp app on Frappe Cloud is **step 0**. Until Meta credentials + webhook verify succeed, Desk cannot send/receive Business messages.

Ops can already: ensure CRM Lead Source **WhatsApp**, pin a WhatsApp queue view, and create Leads from a WhatsApp chat (name + mobile).

## Checklist

1. [ ] Confirm **Frappe WhatsApp** (`frappe_whatsapp`) is **Installed** on `app.trustledger.co.za` (Cloud → Apps).  
   Optional later: **WhatsApp Chat** for a richer Desk inbox.

2. [ ] **Meta Developer** → WhatsApp Cloud API  
   - Create/select Business app  
   - Add WhatsApp product  
   - Copy **temporary or permanent** access token, **Phone number ID**, **WhatsApp Business Account ID**, **App ID**  
   Guide: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

3. [ ] Desk → **WhatsApp Account** (or CRM **Settings → WhatsApp Settings**)  
   - Paste token + IDs  
   - Set a **Webhook Verify Token** (make one up; keep it private)  
   - Enable / set as default for incoming + outgoing  
   - **Never** paste the access token into GitHub, chat, or this repo

4. [ ] **Meta → WhatsApp → Configuration → Webhook**  
   - Callback URL:  
     `https://app.trustledger.co.za/api/method/frappe_whatsapp.utils.webhook.webhook`  
   - Verify token: same as Desk  
   - Subscribe at least: `messages`, `message_template_status_update`

5. [ ] Desk → **WhatsApp Templates** → create / **Sync from Meta** → wait for Meta **APPROVED**  
   First outbound to a new number must use a template.

6. [ ] Smoke: from a CRM Lead with **mobile_no** set → WhatsApp tab → send template → reply from the phone → message appears in Desk.

7. [ ] Ops `/ops/accounts` → WhatsApp CRM → **Ensure WhatsApp source** (after Vercel deploy).

When 1–6 are green, the platform is connected for CRM chat. Personal WhatsApp remains for ad-hoc only.

Full runbook: `docs/WHATSAPP_SETUP.md`
