# HubSpot cutover (Frappe CRM Lead)

**Goal:** Stop using HubSpot for TrustLedger product leads and support intake.  
**Acquisition SoT:** Frappe Cloud **CRM Lead** on `app.trustledger.co.za` (ADR-034).  
**Marketing site:** WordPress CTAs only → Vercel branded forms (`/assessment`, `/contact`, `/quote`, `/trial`, Support). No HubSpot embeds.

## Path (packets)

| Packet | Scope | Status |
|--------|--------|--------|
| **HS-1** (this) | Production defaults to Frappe-only when Cloud keys exist; Ops/health gates; runbook + ADR-034 | **Active** |
| **HS-2** | Confirm Production smoke (all form sources → CRM Lead); set/confirm `LEAD_BACKEND=frappe`; turn off HubSpot sequences for product forms | Planned |
| **HS-3** | Remove HubSpot portal/form env from Vercel; strip WP embeds (Webway, outside this repo) | Planned |
| **HS-4** | Delete `submitHubSpotLead` path (keep `siteBaseUrl` moved out of `hubspot.ts`) | Planned |

## Production behaviour (HS-1)

| `LEAD_BACKEND` | Frappe keys | Effect |
|----------------|-------------|--------|
| unset | yes | **frappe** — HubSpot never tried |
| `frappe` | yes | Same (explicit) |
| `auto` | yes | Frappe first, HubSpot fallback (mid-cutover / emergency) |
| `hubspot` | any | HubSpot only (emergency) |
| unset | no | `auto` — HubSpot if configured (local/preview) |

Ops `/ops/readiness` gate **Lead backend (Frappe CRM)** and `GET /api/health` → `launch.leadBackendCutover` must be green on Production.

## Operator checklist (HS-2)

1. Deploy HS-1 to Production.
2. Submit once each: assessment unlock, contact, quote, product feedback, support ticket.
3. Desk → **CRM Lead** — each source appears (`docs/CRM_VIEWS.md`).
4. If anything 502: `LEAD_DEBUG=1` temporarily; fix API user roles / Lead Source names.
5. Explicitly set `LEAD_BACKEND=frappe` on Vercel (optional once Production default applies).
6. Pause HubSpot form workflows / sequences that duplicated Vercel forms.
7. Commitment → Customer/Owner stays Paystack + Ops provision (unchanged). VIP guests: `docs/VIP_ACCESS.md`.

## WordPress (outside this repo)

- Keep buttons/links to Vercel (`docs/WORDPRESS_CTA.md`).
- Remove HubSpot Free form embeds / tracking scripts when HS-3 runs.
- Do not paste HubSpot “buy now” forms on trustledger.co.za.

## Rollback

Set `LEAD_BACKEND=auto` (or `hubspot`) on Vercel and redeploy. HubSpot portal/form IDs must still be present for fallback.
