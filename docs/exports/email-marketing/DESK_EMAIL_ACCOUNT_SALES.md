# Desk checklist — Email Account `sales@trustledger.co.za`

Operator-only. **Never commit or chat the mailbox password.**

## Settings (Webway SSL/TLS)

| | |
|--|--|
| Username | `sales@trustledger.co.za` |
| IMAP | `mail.trustledger.co.za:993` SSL |
| SMTP | `mail.trustledger.co.za:465` SSL |
| Password | Mailbox password (Desk field only) |

## Steps

1. [ ] Desk → **Email Account** → New → fill SMTP 465 SSL + login.
2. [ ] Enable **Outgoing** + **Default Outgoing**.
3. [ ] (Optional) Enable **Incoming** IMAP 993 for reply tracking.
4. [ ] **Send Test** to yourself — must arrive (check spam).
5. [ ] Email Group **TL Warm Contacts** — import `docs/exports/email-marketing/contacts/TL_Warm_Contacts_email_group.csv` (after #74 merge, or from that PR branch).
6. [ ] Newsletter / Email Template → paste `01-soft-launch.html` → test to yourself → send to group.

Full runbook: `docs/FRAPPE_EMAIL_MARKETING.md`.
