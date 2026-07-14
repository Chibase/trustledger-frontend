# Internal changelog

## 2026-07-14 — UI branding sweep

- Removed user-facing “Frappe” / vendor doc paths; Settings, login, status, support, AI copy use TrustLedger (Cloud) / Chibase Consulting

## 2026-07-14 — CRM Desk bootstrap

- `/api/frappe/crm-setup` (token-gated) creates Lead Sources, default Job Title/Source columns, pinned views

## 2026-07-14 — Contact + launch feedback

- User-facing API errors say **TrustLedger** (not Frappe)
- `/contact` form replaces mailto bounce; posts to CRM Lead
- Post-assessment feedback form + demo shell **Feedback** drawer (rating + note → CRM)
- CRM Lead **Job Title** + **Source** + structured Comment for relevance triage (`docs/CRM_VIEWS.md`)

## 2026-07-13 — Honeypot autofill fix

- Renamed lead honeypot from `company_url` → `tl_hp` (password managers were autofilling website fields and silently dropping real leads)
- Server still accepts legacy `company_url`; logs when honeypot trips

## 2026-07-13 — Frappe Cloud cutover wiring

- Lead APIs prefer Frappe CRM Lead (`FRAPPE_API_KEY`/`SECRET`) with HubSpot fallback
- Docs: `docs/FRAPPE_CLOUD_SETUP.md` (Vercel env, CORS, smoke)
- Copy/defaults point at `https://app.trustledger.co.za`

## 2026-07-13 — Lead form spam + required comments

- Honeypot + rate limit + optional reCAPTCHA v3 on demo/assessment/support APIs
- Required intent comment on demo entry + assessment unlock
- `docs/LEAD_FORMS.md` for incentives/follow-up (CRM-side, not form-side)

## 2026-07-12 — Platform Operator sole live control

- ADR-013 + `docs/PLATFORM_OPERATOR.md`: live login / `/app` / Frappe BFF limited to `PLATFORM_OPERATOR_EMAILS` when `PLATFORM_OPERATOR_ONLY=1`
- Email session cookie; operator banner + Settings access panel
- Demo remains public unless `PLATFORM_OPERATOR_LOCK_PUBLIC=1`

## 2026-07-12 — Post-payment access model

- ADR-012 + `docs/ACCESS_MODEL.md`: Plan Owner = org admin; Owner confirms lower-role invites by plan seats

## 2026-07-12 — CRM handoff model

- ADR-011 + `docs/CRM_HANDOFF.md`: HubSpot Free = lead magnet; Frappe owns relationships after commitment

## 2026-07-12 — Support Phase A

- In-app Support drawer (self-serve + HubSpot tickets)
- `/status` + `/api/health` (Vercel + Interserv probes)
- Issue catalog + allowlist in `docs/SUPPORT_OPS.md`
- Repair session + live sign-in shortcuts

## 2026-07-11 — Demo entry lead capture

- `/demo` requires name + work email before start (same bar as assessment)
- Posts to HubSpot with `[Source: demo_entry]` for marketing segmentation
- Soft gate remains as backup (`demo_soft_gate`) if entry was skipped

## 2026-07-11 — Launch hardening

- Demo lead gate posts to HubSpot via `/api/demo/lead`
- Shared HubSpot helper; production fails closed without CRM config
- Unified `info@trustledger.co.za`; privacy links on lead forms
- Disable `NEXT_PUBLIC_DEV_ROLE` bypass in Vercel production
- Dynamic robots; `/reports` redirect; launch checklist doc

## 2026-07-11 — Stronger product chrome

- Ink (`#12202a`) full-height sidebar with teal active nav
- Full-bleed app layout (content still max-width)
- KPI cards with accent bar + larger type; framed page header; table elevation

## 2026-07-11 — App shell & dashboard polish

- Refined AppShell sidebar (sticky, workspace label, user footer)
- Soft active nav with stroke icons; tighter demo banner motion
- Shared `PageHeader`, `KpiCard`, `StatusChip`, `IncidentTable`
- Role dashboards: KPI strips, status chips, concern tables (Field ledger tokens)

## 2026-07-11 — Assessment → HubSpot

- `/api/assessment/lead` submits to HubSpot Forms API (EU) when `HUBSPOT_PORTAL_ID` + `HUBSPOT_FORM_ID` are set
- Maps name/email/company + assessment summary into the form `message` field
- Generic `ASSESSMENT_WEBHOOK_URL` remains as fallback

## 2026-07-11 — SRM Readiness Assessment

- Public `/assessment` wizard (16 Likert items across 6 governance dimensions)
- Lead gate (name + work email) before score / risk / top 3 / 90-day plan
- `POST /api/assessment/lead` with optional `ASSESSMENT_WEBHOOK_URL`
- CSP `frame-ancestors` allowlist for WordPress embed (`trustledger.co.za`)
- WordPress embed snippet: `docs/wordpress/assessment-embed.html`

## 2026-07-11 — Phase 4 Packets 19–22

- UTM capture on `/demo` + lead payload attribution
- Mobile menu nav for small screens
- robots.txt, sitemap, Open Graph metadata
- `docs/FRAPPE_API_CONTRACT.md` for Interserv / srm-core

## 2026-07-11 — Phase 3 Packets 15–18

- WordPress CTA paste guide (`docs/WORDPRESS_CTA.md`)
- Demo localStorage for submitted issues + evidence stubs
- Toast provider for apply/submit feedback

## 2026-07-11 — Phase 2 Packets 11–14

- `NEXT_PUBLIC_DATA_MODE` + Frappe client (`callFrappeMethod`)
- Live adapters on project/incident/note/AI services with mock fallback
- `/app/settings`, `/app/projects/[id]`, auth bridge stub doc

## 2026-07-11 — Packets 08–10

- Incident list filters (status, SLA, search)
- Demo lead soft-gate after 3 meaningful actions
- `docs/VERCEL_SMOKE.md` deploy checklist

## 2026-07-11 — Packets 03–07

- Expanded mock domain: projects, incidents (SLA/escalation/timeline), meeting notes, evidence
- Added `projectService`, `incidentService`, `noteService`, `evidenceService`
- Role dashboards now render real widgets (community/contractor/client/admin)
- Incident detail loads via services with timeline + evidence

## 2026-07-11 — Packets 00–02

- Demo-first docs, design system, `/demo` entry, `/app` shell
