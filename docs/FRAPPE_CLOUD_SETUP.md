# Frappe Cloud cutover — TrustLedger

**Primary site URL:** `https://app.trustledger.co.za`  
**Cloud hostnames:** `trustledger.jh.frappe.cloud` (also active)

## Stack (3 layers)

| Layer | Host | Role |
|-------|------|------|
| Marketing + email | Webway | `trustledger.co.za` |
| Product UI | Vercel | demo / assessment / `/app` |
| Backend + CRM | **Frappe Cloud** | Desk, later Helpdesk / `srm-core`. **Lead intake needs CRM app or HubSpot until then.** |

## 1. Vercel env (do now — works without CRM)

Production → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://app.trustledger.co.za
FRAPPE_BASE_URL=https://app.trustledger.co.za
```

Redeploy. Live login BFF and `/status` will hit Frappe Cloud.

## 1b. Lead capture — choose one path

### Option A (now): keep HubSpot Free
No Frappe CRM required. Leave `FRAPPE_API_KEY` unset. Demo/assessment/support keep posting to HubSpot.

### Option B: install **Frappe CRM** on this site
Cloud dashboard → site → **Apps** (or Marketplace) → install **CRM**.  
Then Desk shows **Lead** / CRM workspace.

1. User → API Access → **API Key + Secret** (user must create Lead).
2. Vercel:
   ```bash
   FRAPPE_API_KEY=...
   FRAPPE_API_SECRET=...
   LEAD_BACKEND=auto
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

## 5. What stays on HubSpot until you flip

If `FRAPPE_API_*` is unset, HubSpot Free remains the lead path. After Frappe lead smoke, set `LEAD_BACKEND=frappe` and retire HubSpot forms when ready.
