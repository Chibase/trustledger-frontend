# Desk checklist — Email Account `sales@trustledger.co.za`

## Segment Newsletter From names

Keep **Email / Username** = `sales@trustledger.co.za`.  
On each segment Newsletter, set **Sender Name** only (does not require new mailboxes):

| Newsletter audience | Sender Name |
|---------------------|-------------|
| TL Segment Construction | TrustLedger Construction |
| TL Segment Government | TrustLedger Municipal |
| TL Segment Architects | TrustLedger for Architects |
| TL Segment Engineers | TrustLedger Engineering |
| TL Segment Social Facilitators | TrustLedger Community Practice |
| TL Segment Related Industries | TrustLedger Practice |

Optional later: Webway aliases (`construction@…`, etc.) forwarding to `sales@`, then switch Sender Email. See `SEGMENT_INTROS.md`.

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
5. [ ] Email Group **TL Warm Contacts** → import cleaned CSV when available.
6. [ ] Newsletter → paste `01-soft-launch.html` → test → send.

Full runbook: `docs/FRAPPE_EMAIL_MARKETING.md`.
