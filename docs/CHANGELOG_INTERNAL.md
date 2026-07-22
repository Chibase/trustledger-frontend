# Internal changelog

## 2026-07-22 — T1+T2: Plan Owner org + team invites (demo)

- Browser org tenancy: Plan Owner workspace on trial/subscribe; seat caps per ACCESS_MODEL
- Dashboard master strip; Settings → Team / Seats invites (role + desk exposure)
- `/invite/accept` joins as junior with locked desk tier; Practitioner = Owner-only
- Data space / media quotas / Frappe User SoT deferred (T3–T5); ADR-026

## 2026-07-22 — Report AI: hard-bind to demo cases (no LLM guides)

- Create report always seeds `mockIncidents` / `mockProjects` into evidence
- Activity-report compose never calls Cloud LLM (was returning `[Month/Year]` guides when `AI_MOCK=false`)
- UI shows case IDs in scope before write; template detector expanded

## 2026-07-22 — AI report writes finished prose (not a template guide)

- Activity report AI always uses evidence-based local writer from picked topics + demo/workspace cases
- Rejects fill-in-the-blank / “how to write a report” LLM guides
- Output includes real case findings, trust pulse, dates, and author — apply into editor on generate

## 2026-07-22 — AI report write from picked topics (demo data)

- Create report: pick topics → AI writes narrative sections from workspace/demo cases, trust pulse, and Capture evidence
- Suggest → apply → save; project scope filters facts; mock compose uses structured section writers
- Desk-gated topics stay greyed / non-selectable

## 2026-07-22 — Trial subscribe (card verify + deferred charge)

- `/pay` default = 14-day trial: Paystack card verification, authorization on file, bill at trial end
- Success: thank you + login/temp password (email via Resend when configured); no Contact us CTA
- Trial activates immediately; first-login password change prompt; `/login/trial` + `/pay/activate`
- Banner opt-out cancels scheduled charge (`Trial Opt-Out` + deactivate authorization)
- Ops `/api/paystack/charge-due` for day-14 collection; ADR-025
- CRM sources: `Trial Authorize`, `Trial Opt-Out`

## 2026-07-22 — Create report (evidence-based, seniority-gated)

- `/app/reports` → Create a report wizard: kinds (monthly, GRM, ESG, H&S, B-BBEE, CSI, MEL, board…)
- Sections selectable; options above desk grade greyed (visible, not selectable)
- AI compose from workspace incidents + Capture evidence; save for performance/dispute use
- Dashboard Report library views packs by desk level
- Nav label: Create report

- Capability catalogue + plan defaults + sellable add-ons (`entitlements` types/config/lib)
- `FeatureGate`, nav capability filters, Settings add-on/override preview (admin)
- Desk panels honour plan capabilities alongside desk-tier visibility
- Pricing/seats unchanged — packaging revisit later; switches are ready

- Professional desk tiers (CLO → supervisor → site → delivery → oversight → funder) with admin visibility matrix in Settings
- Capture hub: minutes / attendance / social intel / pasted report → AI stakeholder extract + brief (suggest → apply)
- Stakeholder CRM framed as demo placeholder; growth via capture
- Supervisor ranked queue of CLO/site filings; senior desks get charts (ops chart primitives)
- Issue intake requires project (select or create) — projects merge into dashboard/list

- Report flow: issue → reporter (or anonymous) → sequential dialogs for city, DM, TC, ward
- Geo pack powers `/api/geo` for the form only; place KPIs and Places browse removed from client dashboard/report
- Case still stores full geo path for tracking and categorisation

- Removed TEDS maturity panels from `/app/*` (ops-only: `/ops`, `/ops/executive`)
- Cascading geo picker (any-order province/DM/city/TC/ward) via `/api/geo`
- Intake: complaint natures, urgency, client junior/senior threshold, TAT stage targets
- AI triage suggests nature + staff routing (suggest → apply)
- Trust pulse (sentiment → trust index + TAT) on all role dashboards and client reports
- Case desk shows process stage timeline vs client targets

- `buildClientPortfolioBrief` aggregates projects, grievances, CRM, geo (same Frappe contract shapes)
- Client home → governance portfolio KPIs + CRM/geo panels
- `/app/reports` → printable portfolio trust brief for client/admin
- Geo + stakeholder services call live Frappe with seed fallback

## 2026-07-21 — TEDS maturity report (ops-only)

- `src/lib/tedsMaturity.ts` + `docs/TEDS_MATURITY_REPORT.md` (~36% MVP progress)
- Panels on `/ops/executive` (full) and `/ops` only — not on public product `/app` surfaces

## 2026-07-21 — ZA geo pack + stakeholder CRM seed

- Ingested MDB Wards 2020 (4 468 wards) + 15 traditional councils into `data/geo/za-mdb-2020.places.json`
- Multi-country pack schema (add NA/BW/… packs beside ZA)
- `/app/geo` browse by province → municipality → wards; TC list
- Stakeholder CRM kinds expanded; list + detail; Stats SA indicators deferred
- `scripts/ingest_za_geo.py` to regenerate

## 2026-07-21 — Version 001 label + Version 002 core kickoff (ADR-023)

- Soft launch may wait for V002 core; public Now/Next messaging (`HomeVersionStrip`)
- Docs: `VERSIONING.md`, `ROADMAP_V002.md`, Phase 6 packets 24a–24g
- Scaffold: `/app/geo`, `/app/stakeholders`, geo/stakeholder mocks + API contract rows
- App shell shows **Version 001**

## 2026-07-21 — Fix Vercel build (next/headers on client)

- Split server `readTrialSnapshot` into `trial.server.ts`
- Client `/trial` + incident service no longer import `next/headers` via `auth`/`trial`

## 2026-07-21 — WP plan links → Paystack + trial

- Home paste: plan cards → `/pay?plan=…` and `/trial?plan=…` (Institutional → contact)
- Assessment paste: remaining trial CTAs off `/demo` onto `/trial`
- `/trial` reads `?plan=` for pre-selected checkout plan
- Paste checklist: `docs/wordpress/PASTE_PLANS.md`

## 2026-07-21 — Own-data trial + upgrade to Paystack

- Start trial → `/trial` workspace (not `/demo` sample data)
- Banner Upgrade → `/pay`; expired wall with plan checkout + 90-day retention copy
- Subscribe form maze removed from trial funnel (ADR-022)

## 2026-07-20 — Pricing → Paystack plans

- Practitioner R5,399 / Project R14,999 defaults in `paystackPlans.ts`
- Home + WP pricing cards Subscribe → `/pay?plan=…` (quote demoted to fallback)
- Trial funnel choose-step uses Paystack subscribe links

## 2026-07-20 — Open trial (no login until print/save)

- `/demo` auto-enters `/app` as trial guest; email only on print/save
- Plan catalogue `src/config/plans.ts` + `docs/LAUNCH_PLANS.md` / `docs/PAYSTACK_SETUP.md`
- Soft lead gate retired in shell; `/trial` + Paystack subscribe paths remain
- WP paste refreshed: Home + Assessment CTAs → open trial (`docs/WORDPRESS_CTA.md`, `page-home.txt`, `page-assessment.txt`)
- ADR-021

## 2026-07-17 — Conversion homepage (Vercel `/`)

- New marketing homepage: single primary CTA, preserved left-copy / right-dashboard hero
- Admin login de-emphasized; Book walkthrough secondary; analytics hooks stubbed
- Components under `src/components/marketing/*`

## 2026-07-16 — Quote + EFT soft-launch bridge (23i)

- `/quote` → CRM Lead `Quote Request` (+ optional `OPS_ALERT_WEBHOOK_URL`)
- Ops → Finance → **Confirm EFT paid** → CRM Lead `EFT Payment` for Finance/Executive
- Trial / demo CTAs prefer quote over Paystack while KYC finalises
- ADR-020; Plan Owner still manual under lockdown

## 2026-07-16 — Frappe Jinja render hardening notice

- Documented Frappe PR #37924 Public Bench Jinja lockdown impact
- Vercel app unaffected; Desk template audit + smoke checklist in `docs/FRAPPE_JINJA_SAFE_RENDER.md`

## 2026-07-15 — Trial funnel with subscribe path

- `/trial`: capture details → choose Explore demo **or** Subscribe (Paystack)
- Demo banner + soft-gate offer Subscribe / pay; WP Start trial → `/trial`

## 2026-07-15 — Vercel Paystack checkout (23g)

- ADR-019: `/pay` → Paystack hosted checkout while Desk marketplace app is blocked
- Webhook + verify log CRM Lead `Paystack Payment`; Ops Finance + Executive show notifications
- WP buy CTAs documented; amounts via `PAYSTACK_AMOUNT_*_CENTS`

## 2026-07-15 — Interserv retired (ADR-018)

- Sole backend host is Frappe Cloud `app.trustledger.co.za`
- Docs/config scrubbed of Interserv runtime dependency
- `docs/INTERSERV_CANCEL.md` owner checklist to cancel before next deduction

## 2026-07-15 — Command control pillars (23f)

- ADR-017: `/ops/finance`, `/ops/staff`, `/ops/ai`, `/ops/issues`
- Finance + staff scaffolds (no fabricated numbers); **staff wellbeing deferred** placeholder
- AI tools registry with upgrade/watch/discharge framing; issues from Support Ticket CRM + TAT/feeling placeholders
- Executive Board links the four control pillars

## 2026-07-15 — Executive demographics + voice

- `/ops/executive` adds origin, industry/sector, influence, sentiment/perception, and verbatim quotes from CRM Comments
- Lead intake stores structured Sector / Demo role / UTM / Comment for cleaner future parsing

## 2026-07-15 — Executive Board brief (23e)

- ADR-016: `/ops/executive` is the C-suite board/investor surface; `/ops` stays junior day-to-day activity
- KPIs, weekly trend, activity mix, funnel, rating charts, talking points + print/copy
- Operator live login homes to `/ops/executive`

## 2026-07-15 — Ops = client activity (not product desk)

- Operator live login defaults to `/ops` (not `/app/dashboard`)
- Login API returns `home: /ops`; middleware bounces operators off `/app/dashboard` → `/ops`
- `/ops` + `/ops/activity` show demos / assessments / feedback / contact / support — not projects or issues
- Nav no longer treats the customer product desk as the operator home; Cloud CRM remains for record detail

## 2026-07-15 — Platform Ops command centre (23a)

- ADR-015 + `docs/PLATFORM_OPS.md`: `/ops` allowlist-only overview (not a CRM)
- Health + CRM Lead intake intel; Reports/Accounts stubs for later packets

## 2026-07-14 — Paystack payments setup (Frappe Cloud)

- ADR-014: Paystack + Frappe Paystack for ZAR collection
- `docs/PAYMENTS_SETUP.md` Desk/Marketplace checklist; Peach superseded for gateway choice

## 2026-07-14 — Live login without srm-core

- Live sign-in falls back to TrustLedger Cloud session/roles when `srm_core.get_session` is missing
- Unauthenticated `/app` in live data mode goes to `/login/live` (not demo)

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
- `/status` + `/api/health` (Vercel + Frappe Cloud probes)
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
- `docs/FRAPPE_API_CONTRACT.md` for Frappe Cloud / srm-core

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
