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

## Already applied on Cloud

### Single ICP marketing list + industry segments

| Target | Count | Name |
|--------|------:|------|
| Email Group | **21** | **`TL Marketing`** — **canonical ICP Newsletter audience** (pruned) |
| Email Group | 7 | `TL Segment Construction` |
| Email Group | 7 | `TL Segment Architects` |
| Email Group | 3 | `TL Segment Engineers` |
| Email Group | 2 | `TL Segment Government` |
| Email Group | 1 | `TL Segment Social Facilitators` |
| Email Group | 1 | `TL Segment Related Industries` |

**91 non-ICP** contacts removed from `TL Marketing` (vendors, Quora, tests, internals).  
Detail: `SEGMENTATION.md`, `TL_Marketing_removed.csv`.

Draft soft-launch **Newsletter** → **`TL Marketing`**.  
Industry-specific copy → the matching **`TL Segment …`** group.

### Legacy archive (not for blasts)

| Target | Count | Name |
|--------|------:|------|
| Email Group | 21 | `TL Warm Contacts` — same ICP as master (historical name) |
| Email Group | 83 | `TL HubSpot Import` — raw HubSpot archive (includes junk) |
| CRM Lead | many | Sales pipeline — not the Newsletter list |

CRM Lead remains the sales CRM. **Blasts use `TL Marketing` or a segment group only.**

---

## Remapped files in this folder

| File | DocType | Rows | Use |
|------|---------|-----:|-----|
| `TL_Marketing_email_group_member.csv` | Email Group Member | 21 | **Canonical ICP blast list** |
| `TL_Segment_*_email_group_member.csv` | Email Group Member | varies | Industry segments |
| `TL_Marketing_segmentation.csv` | — | all | Keep/remove + segment audit |
| `TL_Marketing_removed.csv` | — | 91 | Non-ICP removals |
| `TL_Marketing_sources_audit.csv` | — | 112 | Pre-prune provenance |
| `SEGMENTATION.md` | — | — | Segment angles + send rules |

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

1. Email Group **`TL Marketing`** must exist (exact title).
2. Awesome Bar → **Data Import** → New  
   - Document Type: **`Email Group Member`**  
   - Import Type: Insert New Records  
   - Upload `TL_Marketing_email_group_member.csv`
3. Map `email_group` → Email Group, `email` → Email → **Save** → **Start Import**.
4. Newsletter → select **`TL Marketing`** → branded template → send test to yourself → send.

To refresh the union later: add new CRM Lead / form emails into **`TL Marketing`** (or re-run the consolidate script / re-import the CSV).

### CRM Lead (optional)

1. CRM Lead Source **`HubSpot Import`** must exist.
2. Data Import → DocType **`CRM Lead`** (not Lead) → upload `hubspot_to_crm_lead_warm_review.csv`.
3. Map only the eight columns above → Save → Start Import. Skip duplicates by email.

---

## Send checklist

1. Email Account / domain for `sales@` or `hello@` (`DESK_EMAIL_ACCOUNT_SALES.md`).
2. Audience = **`TL Marketing`** (general) or a **`TL Segment …`** group (industry-specific).
3. Match copy to the segment (construction vs municipality vs architects, etc.) — see `SEGMENTATION.md`.
4. Test to yourself first. See `docs/FRAPPE_EMAIL_MARKETING.md`.
