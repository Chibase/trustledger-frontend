# Frappe Cloud cutover — TrustLedger

**Primary site URL:** `https://app.trustledger.co.za`  
**Cloud hostnames:** `trustledger.jh.frappe.cloud` (also active)  
**Interserv:** retired for this product — cancel checklist in `docs/INTERSERV_CANCEL.md` (ADR-018).

## Stack (3 layers)

| Layer | Host | Role |
|-------|------|------|
| Marketing + email | Webway | `trustledger.co.za` |
| Product UI | Vercel | demo / assessment / `/app` |
| Backend + CRM | **Frappe Cloud** | Desk + **Frappe CRM** (install) + later Helpdesk / `srm-core` |

## 0. Install Frappe CRM (do this on Cloud)

You install from the **Frappe Cloud dashboard** (not from this Vercel repo).

### If the site is on a shared/public bench
1. Open [site Domains/Overview](https://cloud.frappe.io/dashboard/sites/erpnext-ruy-goy.jh.frappe.cloud) → **Apps** tab.  
2. **Install App** → choose **CRM** (or open [Marketplace CRM](https://cloud.frappe.io/marketplace/apps/crm) → Install on this site).  
3. Wait until status is **Installed / Active**.  
4. Open Desk `https://app.trustledger.co.za` → you should see a **CRM** workspace.

### If the site is on a **private bench group**
1. Bench Group → **Apps** → **Add App** → **CRM**.  
2. **Update Available** → deploy/update including this site.  
3. Site → **Apps** → **Install App** → **CRM**.

After install, tell me — we wire API keys and confirm Lead create from the demo form.

Production → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://app.trustledger.co.za
FRAPPE_BASE_URL=https://app.trustledger.co.za
```

Redeploy. Live login BFF and `/status` will hit Frappe Cloud.

## 1b. Lead capture — Frappe CRM (HubSpot cutover)

**Canonical path (ADR-034):** Vercel forms → Frappe **CRM Lead**. See `docs/HS_CUTOVER.md`.

1. Install **Frappe CRM** on Cloud (DocType `CRM Lead`).
2. User → API Access → **API Key + Secret** (user must create CRM Lead).
3. Vercel:
   ```bash
   FRAPPE_API_KEY=...
   FRAPPE_API_SECRET=...
   # Optional once HS-1 is live — Production already defaults to frappe when keys exist:
   LEAD_BACKEND=frappe
   # optional override:
   # FRAPPE_LEAD_DOCTYPE=CRM Lead
   ```
4. Mid-cutover emergency only: `LEAD_BACKEND=auto` (Frappe then HubSpot) or `hubspot`.

### Legacy Option A (retiring): HubSpot Free

Only if Frappe keys are absent (local) or you explicitly set `LEAD_BACKEND=hubspot` / `auto`. Do not add new HubSpot embeds on WordPress.

### Later: custom `srm-core` DocType
If you prefer not to install CRM, we add `TL Lead` + whitelisted method and set:
```bash
FRAPPE_LEAD_METHOD=srm_core.api.leads.create_lead
```

Optional when CRM Lead exists (default Resource API):
```bash
# FRAPPE_LEAD_METHOD=srm_core.api.leads.create_lead
```

## 2. CORS on Frappe Cloud (required for live browser calls)

**Site Config** (Cloud dashboard → Site Config, or Desk → System Settings / `site_config.json`):

```json
{
  "allow_cors": "https://trustledger-frontend-pi.vercel.app"
}
```

If multiple origins later:
```json
{
  "allow_cors": [
    "https://trustledger-frontend-pi.vercel.app",
    "https://trustledger.co.za"
  ]
}
```

Save / reload site after change.

## 3. Smoke checklist

1. Open `https://app.trustledger.co.za` → login page (padlock OK).  
2. Desk → **Lead** list loads (only after CRM install — Option B).  
3. Submit assessment/contact on Vercel → Lead in Frappe CRM (HubSpot only if `LEAD_BACKEND=auto|hubspot`).  
4. `/status` on Vercel shows Frappe check green.  
5. `/login/live` with your operator user (after `PLATFORM_OPERATOR_EMAILS` + CORS).

## 4. WordPress / marketing

Keep desk links as `https://app.trustledger.co.za` (already aligned).

## 4b. Jinja render security (Public Bench)

Frappe is rolling out safer Jinja rendering on **v15/v16 Public Benches** (PR #37924).  
TrustLedger’s Vercel app is unaffected. If Desk emails/prints break after a Cloud update, see **`docs/FRAPPE_JINJA_SAFE_RENDER.md`** — do not disable the protection unless Support advises.

## Troubleshooting: lead not in CRM

If the demo form returns OK but nothing appears in **CRM → Leads**:

1. Vercel fell back or HubSpot-only mode. For cutover:
   ```bash
   LEAD_BACKEND=frappe
   LEAD_DEBUG=1
   ```
   Redeploy, submit again — you should get a **502** with `detail` if Frappe rejects the create.
   Production with Frappe keys and unset `LEAD_BACKEND` already prefers frappe (HS-1).
2. API user roles: add **Sales User** or **System Manager** (must **create** CRM Lead).
3. Desk → **CRM Lead Status**: ensure a status named **`New`** exists (default).
4. Create Desk **CRM Lead Source** names listed in `docs/CRM_VIEWS.md` (Product Feedback, Website Contact, …) before relying on Source filters.
5. Frappe Desk → **Error Log** after a failed submit.

## Viewing user feedback & relevance

See **`docs/CRM_VIEWS.md`**: Job Title + Source columns, saved filters, and rating triage.
