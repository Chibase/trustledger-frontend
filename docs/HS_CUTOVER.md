# HubSpot cutover — Frappe-only acquisition (ADR-034)

**Goal:** Marketing + CRM on **Vercel + Frappe only**. HubSpot is optional baggage, not a required link.  
**Acquisition SoT:** Frappe Cloud **CRM Lead** on `app.trustledgersrm.co.za`.  
**Webway checklist:** `docs/WEBWAY_CUTOVER.md`.

```text
WordPress (Webway)     →  CTAs only (no forms)
        ↓
Vercel TrustLedger     →  branded forms + Paystack
        ↓
Frappe Cloud           →  CRM Lead → (commit) Customer + Owner User
        ↓
/login/live            →  product
```

| Layer | Job |
|-------|-----|
| **WordPress** | Brochure + buttons |
| **Vercel** | Forms, trial, pay, product UI, Ops |
| **Frappe** | Leads, customers, users, entitlements, SI/desk data |

---

## Phases (low risk)

| Phase | Scope | Status |
|-------|--------|--------|
| **0 — Decide** | Lock ADR-034: acquisition CRM = Frappe CRM Lead; HubSpot not required | **Done** |
| **1 — Frappe only writer (HS-1)** | Production frappe-only when Cloud keys exist; Ops/health gates | **Done** (#68) |
| **2 — Smoke + explicit env (HS-2)** | All Vercel forms → CRM Lead; set `LEAD_BACKEND=frappe`; pause HubSpot sequences | **Done (in-repo)** — Production env + public-form click still operator |
| **2b — Webway credibility** | Remove HubSpot embeds; CTAs → Vercel (`docs/WEBWAY_CUTOVER.md`) | **Active** (operator sitting; not this repo) |
| **3 — Sales on Frappe** | Lead stages → Commitment; Paystack / Ops provision; follow-ups via Frappe email / Webway mailbox; bulk brand pack **EM-1** (`docs/FRAPPE_EMAIL_MARKETING.md`) | **Done (templates + ops surface)** — Desk SMTP/EDS still operator |
| **4 — Retire HubSpot (HS-3/HS-4)** | Export if needed; unset `HUBSPOT_*`; delete `submitHubSpotLead`; cancel Free portal | Planned (deferred until Production smoke) |

---

## Production behaviour (Phase 1+)

| `LEAD_BACKEND` | Frappe keys | Effect |
|----------------|-------------|--------|
| unset | yes | **frappe** — HubSpot never tried |
| `frappe` | yes | Same (explicit — preferred) |
| `auto` | yes | Frappe first, HubSpot fallback (emergency only) |
| `hubspot` | any | HubSpot only (emergency) |
| unset | no | `auto` — HubSpot if configured (local/preview) |

Ops `/ops/readiness` gate **Lead backend (Frappe CRM)** and `GET /api/health` → `launch.leadBackendCutover` must be green on Production.

### Immediate env (when ready)

```bash
LEAD_BACKEND=frappe
# leave HUBSPOT_* unset or unused
```

---

## Operator checklist (Phase 2 / HS-2)

In-repo (Ops `/ops/readiness` → **Acquisition / ops**):

1. Confirm `GET /api/health` → `launch.leadBackendCutover` (or the Lead backend gate on readiness).
2. Review the form inventory (`src/lib/leadFormInventory.ts`) — contact, quote, assessment, feedback, support are smoke-required.
3. **Write HS-2 smoke lead** — Desk CRM Lead `hs2-smoke@trustledgersrm.co.za`, job title `HS-2 smoke`.

Still operator (not this repo / not a code click):

1. Set `LEAD_BACKEND=frappe` on Vercel Production (explicit).
2. Submit once each on Production: `/contact`, `/quote`, `/assessment` unlock, product feedback, support ticket.
3. Desk → **CRM Lead** — each source appears (`docs/CRM_VIEWS.md`).
4. If anything 502: `LEAD_DEBUG=1` temporarily; fix API user roles / Lead Source names.
5. Run **Webway** cutover: `docs/WEBWAY_CUTOVER.md`.
6. Pause HubSpot form workflows / sequences that duplicated Vercel forms.
7. Commitment → Customer/Owner stays Paystack + Ops provision. VIP: `docs/VIP_ACCESS.md`.

Do **not** start HS-3/HS-4 (drop `HUBSPOT_*` / delete `submitHubSpotLead`) until the Production public-form smoke is confirmed.

---

## What replaces HubSpot’s marketing jobs

| HubSpot job | Vercel + Frappe replacement |
|-------------|-----------------------------|
| Hosted forms | Vercel `/contact`, `/quote`, `/assessment`, `/trial` |
| Contact database | Frappe **CRM Lead** → **Customer/Contact** |
| Pipeline | Frappe Lead status / Deal |
| Light email nurture | Manual or Frappe notifications; Webway mailbox using Lead comment |
| UTMs | Vercel forms → Lead comment / fields |
| Closed Won → product | Paystack webhook / Ops provision (already on Frappe) |

---

## Rollback (emergency)

Set `LEAD_BACKEND=auto` (or `hubspot`) on Vercel and redeploy. HubSpot portal/form IDs must still be present for fallback — only until Phase 4.

---

## Related

- ADR-034 — `docs/DECISIONS.md`
- Webway steps — `docs/WEBWAY_CUTOVER.md`
- CTA URLs — `docs/WORDPRESS_CTA.md`
- Handoff model — `docs/CRM_HANDOFF.md`
