# Bulk email — what only you can do

Agent / Ops can push **Email Templates** and empty **Email Groups** to Cloud
(`/ops` → Bulk email marketing, or `POST /api/frappe/ensure-email-marketing`).

Everything below needs your Cloud / Desk / DNS login or a secret we must not store in git.

## Checklist (do in order)

1. [ ] **Frappe Cloud → Apps** on `app.trustledger.co.za`  
   If **Email Delivery Service** is installed → ⋯ → **Uninstall**.  
   Without this, `sales@` SMTP stays blocked.

2. [ ] **Desk → Email Account** `sales@trustledger.co.za`  
   - SMTP `mail.trustledger.co.za` **465** SSL  
   - Password = Webway mailbox password (**Desk only — never paste in chat/git**)  
   - Enable **Outgoing** + **Default Outgoing**  
   - **Send Test** to yourself — must arrive before any Newsletter.

3. [ ] **DNS (Webway)** — SPF / DKIM / DMARC for `trustledger.co.za` green in Desk **Email Domain**.

4. [ ] **Ops → Bulk email marketing → Push templates** (after deploy with `FRAPPE_API_KEY` / `SECRET`).  
   Creates/updates `TL Soft Launch`, trial, quote, assessment templates + empty groups.

5. [ ] **Email Group → TL Warm Contacts** — import CSV of people you may email  
   (`email`, `first_name`). No bought lists.

6. [ ] **Newsletter** → template **TL Soft Launch** → send test → small batch.  
   Do **not** blast from Resend (OTP / trial only).

When 1–3 are green and 4–6 are done, bulk marketing is live.

Full runbook: `docs/FRAPPE_EMAIL_MARKETING.md`  
SMTP detail: `docs/exports/email-marketing/DESK_EMAIL_ACCOUNT_SALES.md`
