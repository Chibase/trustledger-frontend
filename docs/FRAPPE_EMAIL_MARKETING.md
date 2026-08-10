# Frappe email marketing (branded bulk) — EM-1

**Locked:** ADR-034 — acquisition on Vercel + Frappe; HubSpot not required.  
**Brand:** `docs/DESIGN_SYSTEM.md` (ink / trust teal / Source Serif wordmark).  
**HTML packs:** `docs/exports/email-marketing/`.

Use this for **bulk campaigns to contacts**. Keep **Resend on Vercel** for transactional OTP / trial welcome only — do **not** blast marketing from `onboarding@resend.dev`.

```text
Contacts (CRM Lead / Contact / Email Group)
        ↓
Frappe Email Account (SPF/DKIM on trustledger.co.za)
        ↓
Email Template / Newsletter body (TrustLedger HTML)
        ↓
CTAs → Vercel /trial /contact /quote /assessment /pay
```

---

## 1. Brand rules (every send)

| Element | Value |
|---------|--------|
| Product name | **TrustLedger** only (no AccordBridge / HubSpot chrome) |
| From name | `TrustLedger` |
| From address | Verified domain, e.g. `hello@trustledger.co.za` or `info@trustledger.co.za` |
| Accent | `#0e7c66` buttons; header `#12202a` |
| CTAs | Absolute `https://trustledger-frontend-pi.vercel.app/...` with `utm_source=email&utm_medium=bulk&utm_campaign=…` |
| Forms | Prefer Vercel branded forms — **not** HubSpot embeds, not unbranded Frappe Web Forms for public marketing |

**Frappe Web Forms / Desk print:** if you must use a Cloud Web Form, set title/branding text to TrustLedger and link out to Vercel for pay/trial. Public lead capture stays on Vercel (`/contact`, `/quote`, `/assessment`).

---

## 2. Desk setup (Frappe Cloud)

Do this once on `https://app.trustledger.co.za` (System Manager / Email Manager).

### A. Sending identity — `sales@trustledger.co.za`

**Do not paste the mailbox password into GitHub, chat, or this repo.** Enter it only in Frappe Desk.

#### Blocker: Email Delivery Service app

If Desk shows:

> You have Email Delivery Service app installed due to which emails won't be sent from this account. Please uninstall the app to use current Email Account for sending.

Frappe Cloud’s **Email Delivery Service** overrides custom SMTP (including Webway `sales@`). Uninstall it to use your own mailbox:

1. [Frappe Cloud](https://frappecloud.com) → site **`app.trustledger.co.za`** → **Apps**.
2. **Email Delivery Service** → ⋯ → **Uninstall**.
3. Wait for the job → reload Desk → retry **Send Test** on the Email Account.

Cloud docs: [Uninstall an app](https://docs.frappe.io/cloud/how-to-uninstall-an-app-from-the-site).  
If Apps/Uninstall is missing, open a ticket at [support.frappe.io](https://support.frappe.io).

**Alternative:** keep EDS and send only via Cloud quota (not `sales@` SMTP). For TrustLedger brand from Webway, prefer **uninstall EDS**.

#### Webway SSL/TLS → Desk Email Account

| Field | Value |
|-------|--------|
| Email / Username | `sales@trustledger.co.za` |
| IMAP | `mail.trustledger.co.za` · **993** SSL |
| SMTP | `mail.trustledger.co.za` · **465** SSL |
| Password | Mailbox password (Desk only) |

1. Desk → **Email Account** → New (or edit `sales@…`).
2. Enable **Outgoing** + **Default Outgoing**; SMTP 465 SSL; login as above.
3. Optional: **Incoming** IMAP 993 SSL for reply tracking.
4. **Send Test** to yourself. Until it arrives, do not send bulk.
5. Ensure **Email Domain** `trustledger.co.za` exists (SPF/DKIM/DMARC on Webway DNS).

Operator checklist: `docs/exports/email-marketing/DESK_EMAIL_ACCOUNT_SALES.md`.

### B. Templates (branded — DESIGN_SYSTEM)

**Already on Cloud (2026-08-10):** Email Templates  
`TL Email Shell` · `TL Soft Launch` · `TL Trial Invite` · `TL Quote Follow-up` · `TL Assessment Nudge`  
plus a draft **Newsletter** (soft launch → `TL Warm Contacts`). Open Desk → review → Send Test → Send.

Brand chrome in every HTML pack:

| Element | Spec |
|---------|------|
| Header | Ink `#12202a` bar, wordmark **Trust**Ledger (teal `#7dcfbf` on Ledger), promise *Resolution you can audit* |
| Accent | 4px trust teal `#0e7c66` stripe under header |
| CTA | Teal filled button, white label; secondary = line border |
| Footer | TrustLedger wordmark + Chibase legal only + trustledger.co.za |
| Voice | Trust outcomes — no HubSpot / Paystack / Frappe / Vercel names in body |

Source files in `docs/exports/email-marketing/`:

| File | Template name | Use |
|------|----------------|-----|
| `00-shell.html` | `TL Email Shell` | Wrapper / Jinja shell |
| `01-soft-launch.html` | `TL Soft Launch` | First blast to warm contacts |
| `02-trial-invite.html` | `TL Trial Invite` | Trial push |
| `03-quote-followup.html` | `TL Quote Follow-up` | Quote / Institutional |
| `04-assessment-nudge.html` | `TL Assessment Nudge` | Diagnostic |

To refresh Cloud after editing HTML: Desk → Email Template → open name → paste full HTML (Use HTML on) → Save.  
Jinja: `{{ first_name or "there" }}` (or `{{ doc.first_name }}` if your Desk build requires it).

### C. Contact list (bulk audience)

Pick one:

| Source | How |
|--------|-----|
| **CRM Lead** | Filter by Source / status → add to **Email Group** (or CRM campaign recipients) |
| **Contact** | Import CSV (HubSpot export or spreadsheet) → Email Group |
| **Manual Email Group** | Email Group → add members by email |

Suggested groups: `TL Warm Contacts`, `TL Quote Pipeline`, `TL Trial Invites`.

**Import columns (minimum):** for Newsletter use **Email Group Member** CSV with `email_group` + `email` (see `docs/exports/email-marketing/contacts/DESK_IMPORT_STEPS.md`). Do not rely on Contact import for blasts — email is a child table and often blocks Start Import.

Ready file: `docs/exports/email-marketing/contacts/TL_Warm_Contacts_email_group_member.csv` (21 warm contacts).

### D. Send a campaign

**Option 1 — Newsletter (Frappe core, common on Cloud)**  
1. **Email Group** with recipients.  
2. **Newsletter** → select group → paste/`Email Template` → schedule or Send.  
3. Confirm unsubscribe / footer present.

**Option 2 — CRM Email Campaign** (if Frappe CRM Email Campaign is available)  
1. Create campaign → audience = Lead list / Contact segment.  
2. Attach Email Template.  
3. Schedule; review bounce report after.

**Option 3 — Solo / small list (&lt; ~50)**  
1. Open CRM Lead → **New Email** with template.  
2. Or send from Webway mailbox using the same HTML (BCC carefully; prefer Desk for audit).

---

## 3. First campaign checklist (today)

- [ ] Email Domain + Email Account green (test mail received).
- [ ] Paste `01-soft-launch.html` into an Email Template; send **test to yourself**.
- [ ] Build Email Group from contacts you have permission to email.
- [ ] Soft-launch Newsletter / Campaign with UTM links.
- [ ] Spot-check: CTA opens TrustLedger Vercel (not HubSpot / not Google mailto).
- [ ] Log campaign name + date on a CRM Lead note or Ops activity for later.

---

## 4. What stays on Vercel (not Frappe blast)

| Flow | Channel |
|------|---------|
| Live login OTP | Resend (`RESEND_*`) |
| Trial welcome / activate | Resend |
| Public lead forms | Vercel → CRM Lead |
| Paystack receipts | Paystack / your finance path |

---

## 5. Compliance (solo / SA soft launch)

- Only email people who asked / have a legitimate interest (leads, partners, existing clients).
- Always include identity + how to opt out (footer in templates).
- Prefer smaller batches first; watch bounces before large HubSpot-list dumps.
- Do not buy lists.

---

## 6. Related

- Brand tokens: `docs/DESIGN_SYSTEM.md`
- Acquisition path: `docs/HS_CUTOVER.md` · `docs/WEBWAY_CUTOVER.md`
- Lead sources: `docs/CRM_VIEWS.md`
- HTML files: `docs/exports/email-marketing/`
