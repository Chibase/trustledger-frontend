# Desk checklist — Email Account `sales@trustledger.co.za`

Operator-only. **Never commit or chat the mailbox password.**

## Blocker first

If Desk says Email Delivery Service is installed and blocks this account:

1. [ ] Frappe Cloud → site Apps → **Email Delivery Service** → ⋯ → **Uninstall**
2. [ ] Reload Desk

## Settings (Webway SSL/TLS)

| | |
|--|--|
| Username | `sales@trustledger.co.za` |
| IMAP | `mail.trustledger.co.za:993` SSL |
| SMTP | `mail.trustledger.co.za:465` SSL |
| Password | Mailbox password (Desk field only) |

## Steps

1. [ ] Desk → **Email Account** → New/edit → SMTP 465 SSL + login.
2. [ ] Enable **Outgoing** + **Default Outgoing**.
3. [ ] (Optional) Enable **Incoming** IMAP 993.
4. [ ] **Send Test** to yourself — must arrive.
5. [ ] Ops `/ops/accounts` → **Push templates** (or paste HTML manually).
6. [ ] Email Group **TL Warm Contacts** → import cleaned CSV when available.
7. [ ] Newsletter → **TL Soft Launch** → test → send.

Human-only summary: `HUMAN_ONLY.md`  
Full runbook: `docs/FRAPPE_EMAIL_MARKETING.md`.
