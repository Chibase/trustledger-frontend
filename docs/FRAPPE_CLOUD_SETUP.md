# Frappe Cloud cutover — TrustLedger

**Primary site URL:** `https://app.trustledger.co.za`  
**Cloud hostnames:** `trustledger.jh.frappe.cloud` (also active)

## Stack (3 layers)

| Layer | Host | Role |
|-------|------|------|
| Marketing + email | Webway | `trustledger.co.za` |
| Product UI | Vercel | demo / assessment / `/app` |
| Backend + CRM | **Frappe Cloud** | Desk, Lead, later Helpdesk / `srm-core` |

## 1. Vercel env (do now)

Production → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_BASE_URL=https://app.trustledger.co.za
FRAPPE_BASE_URL=https://app.trustledger.co.za
```

### Lead capture → Frappe (preferred)

1. In Desk: **User** → your Platform Operator → **API Access** → generate **API Key + Secret**  
   (or a dedicated `lead-bot` user with permission to create **Lead** only).
2. Ensure **CRM** (or ERPNext) is installed so **Lead** DocType exists.
3. Vercel:
   ```bash
   FRAPPE_API_KEY=...
   FRAPPE_API_SECRET=...
   LEAD_BACKEND=auto
   ```
   `auto` = try Frappe first, fall back to HubSpot if Frappe fails.  
   Set `LEAD_BACKEND=frappe` to stop HubSpot once smoke passes.

Optional custom method instead of Resource API:
```bash
FRAPPE_LEAD_METHOD=srm_core.api.leads.create_lead
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
2. Desk → CRM → **Lead** list loads.  
3. Submit demo or assessment on Vercel → new **Lead** appears (check Notes for `[Source: …]`).  
4. `/status` on Vercel shows Frappe check green.  
5. `/login/live` with your operator user (after `PLATFORM_OPERATOR_EMAILS` + CORS).

## 4. WordPress / marketing

Keep desk links as `https://app.trustledger.co.za` (already aligned).

## 5. What stays on HubSpot until you flip

If `FRAPPE_API_*` is unset, HubSpot Free remains the lead path. After Frappe lead smoke, set `LEAD_BACKEND=frappe` and retire HubSpot forms when ready.
