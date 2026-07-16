# Frappe Jinja render hardening (PR #37924)

**Source:** Frappe Team notice — security hardening for Jinja template rendering on **v15 / v16 Public Benches** (gradual rollout).  
**TrustLedger site:** `https://app.trustledger.co.za` (Frappe Cloud).

## Impact on TrustLedger

| Layer | Impact |
|-------|--------|
| Vercel frontend (`trustledger-frontend`) | **None** — no Jinja; uses REST / session APIs only |
| HubSpot / WordPress / Paystack Vercel path | **None** |
| Frappe Desk templates (Print Format, Email Template, Notification, Auto Email Report, Web Page, etc.) | **Possible** if any custom Jinja uses blocked APIs |
| Future `srm-core` Server Scripts / custom apps | Design Jinja as **read-only field access** only |

TrustLedger currently runs on a **shared / public Frappe Cloud bench** (see `docs/PAYMENTS_SETUP.md`). Per Frappe’s notice, this patch is being **enabled on Public Benches**. Private benches remain opt-in.

## What the patch changes (summary)

In Jinja **render** context:

- Write operations are blocked.
- Removed from templates: `new_doc`, `copy_doc`, `rename_doc`, `delete_doc`, `sendmail`, `frappe.call`, `enqueue`, `get_print`, `attach_print`.
- `get_doc` / `get_last_doc` / `get_cached_doc` / `get_meta` return **read-only dicts**, not live Document objects (no `.some_method()`).
- Only GET-style HTTP helpers remain (`make_post_request` / put / patch / delete removed).

Emergency opt-out (bench `common_site_config`): `disable_render_safe_exec` — **do not set unless Frappe Support advises**; prefer fixing templates.

## Operator checklist (do this after Cloud updates)

### 1. Confirm you are on a Public Bench
Cloud dashboard → site `app.trustledger.co.za` → note Shared vs Private bench.  
Public = this rollout applies to you.

### 2. Inventory custom Jinja (Desk)
Search / review for custom content in:

- **Print Format** (any custom HTML/Jinja)
- **Email Template**
- **Notification** (subject/message Jinja)
- **Auto Email Report**
- **Web Page** / **Web Form** custom scripts that render Jinja
- Custom **Letter Head** / quote templates if any

Flag any template that:

- Calls methods on `frappe.get_doc(...)` / `get_last_doc` / `get_cached_doc`
- Uses `new_doc`, `copy_doc`, `rename_doc`, `delete_doc`, `sendmail`, `frappe.call`, `enqueue`, `get_print`, `attach_print`
- Uses `make_post_request` / put / patch / delete

### 3. Refactor pattern (if something breaks)

**Before (breaks):**
```jinja
{% set doc = frappe.get_doc("CRM Lead", name) %}
{{ doc.get_title() }}
```

**After (safe):**
```jinja
{% set doc = frappe.get_doc("CRM Lead", name) %}
{{ doc.title or doc.lead_name or doc.name }}
```

Move side effects (email send, create docs, enqueue) out of Jinja into **Server Scripts**, **Notification** channels, or **whitelisted Python** — not template render.

### 4. Smoke tests (15 minutes)

After Frappe Cloud applies the update:

1. Desk login works.
2. Open a **CRM Lead** → Print / PDF if you use print formats.
3. Trigger one **Notification** / email path you rely on (if configured).
4. Vercel: `/status` or `/api/health` still green; live login still works.
5. Create a test lead from demo/assessment → still lands in CRM (or HubSpot fallback).

### 5. If valid code breaks

1. Do **not** blindly disable the protection.
2. Capture Error Log + template name.
3. Raise [support.frappe.io](https://support.frappe.io) or a GitHub issue on `frappe/frappe` with the template snippet.
4. Only if Support directs: discuss `disable_render_safe_exec` for emergency.

## Private bench note

If/when TrustLedger moves to a **private bench** (e.g. for Desk Paystack), this hardening stays **opt-in** unless you enable it. Prefer enabling it once custom templates are clean — same security posture as Public.

## Related docs

- `docs/FRAPPE_CLOUD_SETUP.md`
- `docs/PAYMENTS_SETUP.md` (public vs private bench)
- `docs/INTERSERV_CANCEL.md`
