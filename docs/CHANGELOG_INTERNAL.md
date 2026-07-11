# Internal changelog

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
