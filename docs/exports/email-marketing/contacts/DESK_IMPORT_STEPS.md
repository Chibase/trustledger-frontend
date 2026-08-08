# Desk import — TL Warm Contacts (Email Group)

**Why Start Import stays disabled / fails on Contact:**  
Frappe **Contact** stores email on a **child table**, not a simple `email` field. Mapping HubSpot-style columns often never validates. For Newsletter blasts, import **Email Group Member**, not Contact.

**This agent cannot click Start Import** on your Cloud site (no Desk session / API keys). You run the steps below once.

## File to use

`TL_Warm_Contacts_email_group_member.csv` — 21 rows:

| Column | Maps to |
|--------|---------|
| `email_group` | Email Group (exact name) |
| `email` | Email |

## Steps

1. Desk → **Email Group** → New → name exactly **`TL Warm Contacts`** → Save.  
   (If it already exists, open it and confirm the name matches.)

2. Awesome Bar → **Data Import** → New:
   - **Document Type:** `Email Group Member`
   - **Import Type:** Insert New Records
   - Upload `TL_Warm_Contacts_email_group_member.csv`

3. Map:
   - `email_group` → **Email Group**
   - `email` → **Email**

4. **Save** the Data Import (required before Start Import enables).

5. **Start Import**. Open the Email Group — you should see 21 members.

6. **Newsletter** → Email Group `TL Warm Contacts` → template → test to yourself → send.

## If Start Import is still grey

- Confirm the Data Import was **Saved** (not only mapped).
- Confirm DocType is **Email Group Member**, not Contact / Lead.
- Confirm Email Group **`TL Warm Contacts`** already exists (link field must resolve).
- Download failed rows from the import log if it starts then errors (duplicates are OK to skip).

Do **not** import into Contact for this campaign — demo Contacts will stay mixed in; Newsletter ignores them.
