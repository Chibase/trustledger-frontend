# Desk import — HubSpot contacts → marketing lists

## Why the Lead import failed

Desk Data Import **`Lead Import on 2026-08-06…`** targeted ERPNext **Lead** with the raw HubSpot CSV. That mapping cannot succeed:

| HubSpot column | Bad Lead map | Problem |
|----------------|--------------|---------|
| Lead Status (`New`) | `status` | Lead only allows Lead/Open/Replied/… — not HubSpot “New” |
| Contact owner (`Thozamile Ngcozela`) | `lead_owner` | Must be a **User** email/id, not a display name |
| Company Type / Industry (`NGO`) | `industry` | Missing **Industry Type** link |
| Duplicate Email / First Name / Status columns | multiple fields | Same field mapped twice |
| Lifecycle dates | `notes.added_on` | Child-table noise — do not import |

**Do not Start that Lead import.** Leave it Pending or delete the Data Import row in Desk.

For **marketing Newsletter**, use **Email Group Member** (not Contact, not Lead). Contact stores email on a child table and often never enables Start Import.

---

## Already applied on Cloud (2026-08-10)

Via API (same HubSpot file on Desk: `hubspot-crm-exports-all-contacts-2026-07-24.csv`):

| Target | Count | Name |
|--------|------:|------|
| Email Group | 21 | **`TL Warm Contacts`** — ICP blast list |
| Email Group | 83 | **`TL HubSpot Import`** — full HubSpot export |
| CRM Lead | 23 | Source **`HubSpot Import`** — warm + review only (spam excluded) |
| CRM Lead Source | 1 | **`HubSpot Import`** |

You can open Desk → **Email Group** → `TL Warm Contacts` and send a **Newsletter** now.

---

## Remapped files in this folder

| File | DocType | Rows | Use |
|------|---------|-----:|-----|
| `TL_Warm_Contacts_email_group_member.csv` | Email Group Member | 21 | Soft-launch / first blast |
| `TL_HubSpot_Import_email_group_member.csv` | Email Group Member | 83 | Full archive list (includes vendors — do not blast blindly) |
| `hubspot_to_crm_lead_warm_review.csv` | CRM Lead | 23 | Warm + review CRM rows |
| `hubspot_to_crm_lead_import.csv` | CRM Lead | 83 | Full remapped CRM Lead (optional; includes excluded noise) |

### Correct column maps

**Email Group Member**

| CSV column | Desk field |
|------------|------------|
| `email_group` | Email Group (exact title, e.g. `TL Warm Contacts`) |
| `email` | Email |

**CRM Lead** (Frappe CRM — not ERPNext Lead)

| CSV column | Desk field |
|------------|------------|
| `first_name` | First Name |
| `last_name` | Last Name |
| `email` | Email |
| `organization` | Organization |
| `job_title` | Job Title |
| `mobile_no` | Mobile No |
| `status` | Status → always **`New`** |
| `source` | Source → **`HubSpot Import`** (create Lead Source first) |

Do **not** map: Contact owner, HubSpot Lead Status, Industry, lifecycle dates, deals, notes.

---

## Re-import from Desk (if you need to redo)

1. Email Group already exists (`TL Warm Contacts` / `TL HubSpot Import`) — or create with the exact title.
2. Awesome Bar → **Data Import** → New  
   - Document Type: **`Email Group Member`**  
   - Import Type: Insert New Records  
   - Upload `TL_Warm_Contacts_email_group_member.csv` (or the HubSpot Import file)
3. Map `email_group` → Email Group, `email` → Email → **Save** → **Start Import**.
4. Newsletter → select **`TL Warm Contacts`** → paste `../01-soft-launch.html` → send test to yourself → send.

### CRM Lead (optional)

1. CRM Lead Source **`HubSpot Import`** must exist.
2. Data Import → DocType **`CRM Lead`** (not Lead) → upload `hubspot_to_crm_lead_warm_review.csv`.
3. Map only the eight columns above → Save → Start Import. Skip duplicates by email.

---

## Send checklist

1. Email Account / domain for `sales@` or `hello@` (`DESK_EMAIL_ACCOUNT_SALES.md`).
2. Newsletter audience = **`TL Warm Contacts`** (21), not the full 83.
3. Test to yourself first. See `docs/FRAPPE_EMAIL_MARKETING.md`.
