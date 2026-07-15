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

## 1b. Lead capture — choose one path

### Option A (now): keep HubSpot Free
No Frappe CRM required. Leave `FRAPPE_API_KEY` unset. Demo/assessment/support keep posting to HubSpot.

### Option B: install **Frappe CRM** on this site (recommended)
See **§0** above. Frappe CRM uses DocType **`CRM Lead`** (our API defaults to that).

1. User → API Access → **API Key + Secret** (user must create **CRM Lead**).
2. Vercel:
   ```bash
   FRAPPE_API_KEY=...
   FRAPPE_API_SECRET=...
   LEAD_BACKEND=auto
   # optional override:
   # FRAPPE_LEAD_DOCTYPE=CRM Lead
   ```
   `auto` = Frappe first, HubSpot fallback.  
   After smoke: `LEAD_BACKEND=frappe` to stop HubSpot.

### Option C (later): custom `srm-core` DocType
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
3. Submit demo or assessment on Vercel → Lead in Frappe **or** HubSpot contact (Option A).  
4. `/status` on Vercel shows Frappe check green.  
5. `/login/live` with your operator user (after `PLATFORM_OPERATOR_EMAILS` + CORS).

## 4. WordPress / marketing

Keep desk links as `https://app.trustledger.co.za` (already aligned).

## Troubleshooting: lead not in CRM

If the demo form returns OK but nothing appears in **CRM → Leads**:

1. Vercel likely fell back to HubSpot (`LEAD_BACKEND=auto`). Set temporarily:
   ```bash
   LEAD_BACKEND=frappe
   LEAD_DEBUG=1
   ```
   Redeploy, submit again — you should get a **502** with `detail` if Frappe rejects the create.
2. API user roles: add **Sales User** or **System Manager** (must **create** CRM Lead).
3. Desk → **CRM Lead Status**: ensure a status named **`New`** exists (default).
4. Create Desk **CRM Lead Source** names listed in `docs/CRM_VIEWS.md` (Product Feedback, Website Contact, …) before relying on Source filters.
5. Frappe Desk → **Error Log** after a failed submit.

## Viewing user feedback & relevance

See **`docs/CRM_VIEWS.md`**: Job Title + Source columns, saved filters, and rating triage.
