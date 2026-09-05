# TrustLedger Frontend — Build Plan

> **Single source of truth** for scope, locked decisions, packet order, and agent behaviour.
> **Phase 1 (Done):** full functional Demo on Vercel.
> **Phase 2–5 (Done / partial):** Frappe-ready + ops + pay soft paths.
> **Phase 6 (Active):** **Version 002** Stakeholder Intelligence core (geo → stakeholders → engagements → commitments → grievance → reports → ESG). Soft launch may wait (ADR-023).
> Current public product label: **Version 001**.

## 1. Product

| Item | Value |
|------|--------|
| Official name | **TrustLedger** |
| App host | **Vercel** |
| Demo URL target | `/demo` (and role dashboards under `/app/...`) |
| Backend | **Frappe Cloud** `app.trustledgersrm.co.za` (CRM/auth/payments now; `srm-core` later on Cloud) |
| Marketing | TrustLedger WP `trustledgersrm.co.za` on Webway (CTAs). **Chibase Consulting** brochure on this app (`/firm`; DNS after WP cleanup). MX for both domains stays Webway. |
| Runtime AI | Grok via `srm-core` on Cloud only — never from browser |

**Current phase:** Phase 6 — **Version 002** core (ADR-023). Product label in market: **Version 001**. Demo/mock remains default until Frappe DocTypes land.

## 2. Locked decisions (do not re-ask)

See `docs/DECISIONS.md`. Strategic packaging / evaluation / public agent scripts: **`docs/PLATFORM_STRATEGIC_BRIEF.md`**.

See `docs/DECISIONS.md`. Agents **must not** reopen these unless the user explicitly overrides.

Summary:

1. TrustLedger branding only (no AccordBridge in UI).
2. Four roles: `community` | `contractor` | `client` | `admin`.
3. Demo mode is first-class; live mode is a flag for later.
4. Mock services mirror future Frappe shapes.
5. AI = suggest → human apply → save (even in demo).
6. Design system in `docs/DESIGN_SYSTEM.md` is mandatory.
7. Packet-driven delivery; one active packet at a time.
8. Vercel deploy must stay green (`npm run build`).

## 3. Agent autonomy rules (minimise human interference)

When implementing:

1. **Follow this file** and the active packet only.
2. **Do not ask** for preference on colours, fonts, IA, or stack — already locked.
3. **Do not** change Cloudflare or WordPress in this repo (different hosts). Frappe client scaffolding targets **Frappe Cloud** only; do not require live product DocTypes for Demo.
4. **Do** update `docs/CHANGELOG_INTERNAL.md` when a packet completes.
5. **Do** run `npm run lint` and `npm run build` before considering a packet done.
6. **Only stop and ask** if: secrets/credentials needed, destructive prod action, or BUILD_PLAN contradiction.
7. Prefer extending mock data/services over inventing parallel patterns.
8. Keep commits focused: one packet ≈ one commit when user asks to commit.

## 4. Information architecture

```
/                     Marketing home → CTA to /trial (and /product)
/product              Onboarding + feature purpose (ADR-033) — no sample workspace
/demo                 301 → /product (legacy)
/readiness            Promo + CTA for SRM readiness diagnostic
/assessment           Quiz + email/OTP unlock → /readiness/next hub + /readiness/report
/readiness/next       Post-confirm choice hub (report / product / trial / walkthrough)
/readiness/report     Score overview + dimension detail + TrustLedger turnaround lanes
/resources            Free SRM toolkits + field templates (email-gated PDF packs)
/resources/[slug]     Pack preview + download gate
/login                Sign-in chooser → live / trial (no sample demo)
/app                  Authenticated shell (trial or live)
/app/dashboard        Executive dashboard (overall graphs; project links)
/app/projects         Project list
/app/projects/[id]    Project dashboard (overall graphs; capture/reports in details)
/app/incidents        Incident list
/app/incidents/[id]   Case desk + AI assist
/app/stakeholders     Stakeholder Intelligence CRM (Cloud when live)
/app/engagements      Engagements
/app/commitments      Commitments board
/app/issues/report    Assisted intake
/app/reports          Client/admin briefs
/app/settings         Profile / org
/firm                 Chibase Consulting brochure (preview; canonical host after DNS)
/firm/packages        Chibase consulting catalogue (request; Paystack when priced)
```

Legacy routes (`/dashboard`, `/incidents`, …) **redirect** into `/app/...` so old links work.

## 5. Workspace behaviour (ADR-033)

| Behaviour | Rule |
|-----------|------|
| Public entry | `/product` educates; `/trial` opens own-data workspace; `/login/live` for Cloud |
| Sample demo | **Retired** — no `tl-mode=demo` guest funnel; `/demo` → `/product` |
| Data | Trial = browser org store; Live = Frappe Cloud; empty Cloud ≠ mock seed |
| AI | Suggest → apply → save; keys server-side only |
| Live fallback | ADR-010 mock only when Frappe unreachable **and** not a customer/trial workspace |

Meaningful actions: submit issue, apply AI suggestion, generate brief, open incident assist.

## 6. Role dashboards (must ship)

| Role | Widgets / views |
|------|-----------------|
| **community** | Ward projects status, my reported issues, report CTA, meeting notes list |
| **contractor** | Assigned projects, open site incidents, upload evidence stub, deadlines |
| **client** | Portfolio KPIs, budget vs spend, open risk/incidents, compliance brief AI |
| **admin** | Intake queue, SLA breach list, escalations, users/roles stub, audit snippet |

## 7. Packet roadmap

### Phase 1 — Demo on Vercel

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| 00–10 | Demo complete | Shell, mock domain, role dashboards, lead gate, Vercel docs | **Done** |

### Phase 2 — Frappe-ready frontend

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| 11 | App mode + Frappe client | `dataMode`, fetch wrapper, method paths, env | **Done** |
| 12 | Settings + project detail | `/app/settings`, `/app/projects/[id]` | **Done** |
| 13 | Live service adapters | Services call Frappe when live; mock fallback | **Done** |
| 14 | Auth bridge stub | Document + stub session for Frappe login (no secrets) | **Done** |

**Still external (not this repo):** Cloudflare DNS (if used), Grok API keys on Frappe Cloud site config when `srm-core` lands.
WordPress CTA copy lives in `docs/WORDPRESS_CTA.md` for paste into Webway.

### Phase 3 — Demo depth + marketing handoff

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| 15 | WordPress CTA guide | Paste-ready buttons/UTM for trustledgersrm.co.za | **Done** |
| 16 | Evidence upload stub | Demo local evidence add on incident desk | **Done** |
| 17 | Demo issue persistence | localStorage intake → appears in incident list | **Done** |
| 18 | Toast feedback | Light success/error toasts on key actions | **Done** |

### Phase 4 — Attribution, mobile, backend contract

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| 19 | UTM capture | Store campaign params from `/demo` for lead handoff | **Done** |
| 20 | Mobile nav | Compact responsive navigation in AppShell | **Done** |
| 21 | SEO basics | robots.txt, sitemap, Open Graph metadata | **Done** |
| 22 | Frappe API contract | Doc of methods/payloads `srm-core` must expose | **Done** |

### Phase 5 — Platform Ops command centre

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| 23a | Ops overview | `/ops` shell, allowlist gate, client/visitor activity (not /app projects) | **Done** |
| 23e | Executive Board | `/ops/executive` C-suite brief — KPIs, graphs, demographics, voice quotes, print | **Done** |
| 23f | Command control | Finance, staff, AI tools, issues control pillars | **Done** |
| 23g | Vercel Paystack | `/pay` checkout + webhook → Ops Finance/Executive; manual CRM | **Done** |
| 23h | Trial → pay funnel | `/trial` capture then demo or subscribe; banner/WP CTAs | **Done** |
| 23i | Quote + EFT bridge | `/quote` CRM Lead; Ops Confirm EFT paid; trial/WP CTAs | **Done** |
| 23j | Open trial explore | No-login `/demo`→`/app`; email on print/save; plan catalogue docs | **Done** |
| 23b | Ops reports | Filterable intake/feedback/assessment reports + CSV | **Done** |
| 23c | Ops accounts | Customer plan/status/seat controls | **Done (lite)** — provision + VIP; Desk remains SoT for plan/status |
| 23d | Ops support packs | Per-person/org context for support | **Done (slice)** — support filter + CSV on `/ops/reports` |

See `docs/PLATFORM_OPS.md`, ADR-015, ADR-016, ADR-017.

### Phase 6 — Version 002 Stakeholder Intelligence core (ACTIVE)

> Soft launch may wait until V002 core is credible (ADR-023).  
> Detail: `docs/VERSIONING.md`, `docs/ROADMAP_V002.md`.

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **24a** | Geo foundation | SA hierarchy types/mock, `/app/geo`, place fields, ingest hook | **Done (ZA MDB pack)** |
| **24b** | Stakeholders registry | List/detail/create; Cloud DocType + BFF | **Done (Cloud SI path)** |
| **24c** | Engagements | Meetings / consultations; Cloud DocType + BFF | **Done (Cloud SI path)** |
| **24d** | Commitments | Promise board; Cloud DocType + BFF | **Done (Cloud SI path)** |
| **24e** | Stronger grievance | Fuller incident workflow on Frappe | **Done (Cloud stamps)** |
| **24f** | Reports packs | Dual dashboards: Activity + Reports hub (monthly / executive / board) + Owner pack access | **Done** (superseded nav by UX-1) |
| **UX-1** | Portfolio → project reports | Executive dashboard (graph-first workspace overview) → project dashboard (overall graphs; category capture/reports in details) → kind/format/level reports | **Done** — packs bind to live Cloud lists; empty Cloud stays empty |
| **24g** | Intelligence / ESG | Indicators, socio-econ layers, stronger AI briefs; tenant local community intel beside Stats SA | **Done (baseline + local upload)** |
| **D1** | Product onboarding | `/product` replaces public `/demo` sample entry | **Done** |
| **D2** | Kill demo mode | No guest `tl-mode=demo`; retarget CTAs; clear lingering demo sessions | **Done** |

### Client org / tenancy (demo → Cloud)

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **T1** | Plan Owner master | Org store, session cookies, master desk strip, Team shell | **Done** |
| **T2** | Invites + seats | Owner invites, `/invite/accept` + `/invite/reject`, email Accept/Decline (Resend), locked junior desk, plan seat caps | **Done** |
| **T3** | Org data space | Org-scoped store, no demo seed in trial, CSV deposit | **Done** |
| **T4** | Media + quotas | Registers/minutes/photos/video; plan storage quotas | **Done** |
| **T5** | Frappe SoT | Customer/User contract + operator provision prep (lockdown stays) | **Done** |
| **OD-1** | Operational Step 1 | Desk Customer/User fields + issuance smoke; Ops `/ops/readiness` ladder (ADR-032) | **Done** |
| **OD-2** | Product DocTypes + File | TL Project / Incident / Evidence ensure + smoke + upload BFF | **Done** |
| **OD-3** | Sync + auto-provision | Paystack → Cloud Owner; migrate tl-org-data on live login | **Done** |
| **OD-4** | Billing + lift lockdown | Day-14 cron charge-due; entitlement gate; lift ADR-013 | **Done** |
| **OD-5** | V002 depth | Engagements → commitments → grievance → ESG (24c–24g) | **Done (UI modules)** |
| **GO LIVE** | Operational grade | Env gates + lockdown-off; paying-customer Cloud ops | **Done** |
| **P0b** | Project Cloud save | Update `TL Project` on every live save (`upsertCloudProject` + `PUT /api/app/projects/[id]`); dossier stays local overlay; empty Cloud stays empty | **Done** |
| **SI-Cloud** | Stakeholder Intelligence on Cloud | TL Stakeholder / Engagement / Commitment DocTypes + live BFF CRUD | **Shipped (Ops ensure + smoke; buyer live usable)** |
| **SI-SEP** | Stakeholder engagement plan | RFP/tender/briefing **or facts pack (no file)** → extract metadata → seven-phase **process map** + **plan execution dashboard** + Gemini-drafted tender SEP; human apply seeds registry / engagements / commitments. Live entitled workspaces persist plan + overlay on **TL Engagement Plan**. Analysis engine (Phases A–G) | **Done (composer + Cloud persist)** |
| **TE-1** | Trust overlay (non-breaking) | Optional `trustResponse` / `trustSupport` + `composeTrustSignals` + opt-in AI overlay helpers. No UX, formula, or DocType change. `docs/TRUST_OVERLAY.md` | **Done** |
| **TE-2** | Parallel trust-native layer | Dimensions, observations, explainable status, participation, community context; derive from SRM; separate `tl-trust-layer` store. No UI/DocType. `docs/TRUST_LAYER.md` | **Done** |
| **TE-2b** | Blueprint trust dimensions | Six dimensions (project, entity, process, people, fairness, concerns acted upon). SRM sentiment is not a trust observation. Cloud DocTypes still future. | **Done** |
| **TE-3** | Trust analytics and proof reporting | Explainable trend / comparison / risk on the trust layer; optional proof markdown on `/app/reports`. Not a pack; Trust pulse and existing writers unchanged. `docs/TRUST_PROOF.md` | **Done** |
| **TE-3b** | Trust workspace hub | Dashboard cards + comparison + risk + proof narrative + shortcuts. Not SLA/impact-trend charts. | **Done** |
| **TE-3c** | Trust workspace surfaces | Desk + executive hub: period trend, all comparison axes, dimension bars. Not SLA/impact-trend charts. Frappe Desk JSON stays out of this repo. | **Done** |
| **TE-4** | Trust intelligence and recommendations | Rule-based, suggestion-only next steps, alerts, and local advisory drafts on TE-3. Optional panel. No autonomous apply. `docs/TRUST_INTELLIGENCE.md` | **Done** |
| **TE-5** | Global South operating adaptations | Optional community context, field-friendly capture, language readiness, authority mapping, participation realism. Additive; no single template. `docs/TRUST_GLOBAL_SOUTH.md` | **Done** |
| **TE-5b** | Community profiles + language support | Persist field extras on Capture apply; community profiles on Intelligence; offline field drafts; triage language support without fake translation. | **Done** |
| **TE-6** | MVP packaging and readiness | Gap review, proof-package path, cross-module validation, internal checklist. No new trust capability. Living inventory: `docs/TRUST_MVP.md` | **Done** |
| **TE-7** | Cloud trust SoT | TL Trust Observation / Participation / Community Context; SEC-1; BFF CRUD; live customer/trial SoT. Sentiment not copied. Overlay not posted. `docs/TRUST_DOCTYPES.md` | **Done** |
| **TE-8** | Engagement apply → trust rows | Capture/desk apply writes participation (upsert by engagement id) + optional overlay observations to the trust layer / Cloud SoT. Overlay optional. Sentiment not copied. Attendance ≠ consent. Mixed motive ≠ weak. `docs/TRUST_LAYER.md` | **Done** |
| **TE-9** | Participation-quality reading | Classify participation as trust / obligation / livelihood / mixed without treating mixed as weak or attendance as consent | **Done** |
| **TE-10** | Trust-claim verification | Classify claims as unevidenced / evidenced / verified; linked evidence is not verification; attendance does not verify; human apply required | **Done** |
| **TE-11** | Cloud SoT for claim-verification stamps | `TL Trust Claim Verification` DocType + BFF; live customer/trial SoT; human apply still required; not a sealed ledger | **Done** |
| **TE-12** | Trust-movement companion reading | Later-half co-occurrence with movement; not statistical causality; attendance and mixed motive are not causes | **Done** |
| **PP-1** | Plan-as-container packaging | TierFlow module sequence; executive roll-up; VIP-only demo seed across included desks; non-VIP empty | **Done** |

### HubSpot cutover (ACTIVE)

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **HS-1** | Frappe-first leads | Production default `frappe` when Cloud keys set; Ops/health gate; ADR-034 + `docs/HS_CUTOVER.md` | **Done** (#68) |
| **HS-2** | Production smoke + Webway | All Vercel forms → CRM Lead; explicit `LEAD_BACKEND=frappe`; `docs/WEBWAY_CUTOVER.md` | **Done (in-repo)** — Production env + Webway CMS still operator sitting |
| **HS-3** | Remove HubSpot config | Drop portal/form env; strip WP embeds (Webway) | Planned (deferred until Production smoke) |
| **HS-4** | Delete HubSpot client | Remove `submitHubSpotLead`; relocate `siteBaseUrl` | Planned (deferred until Production smoke) |
| **P3** | Acquisition / ops (not buyer desk) | HS-2 inventory + ops smoke UI; EM-1 Desk checklist on `/ops/readiness`; HS-3/4 not in this packet | **Done (in-repo)** |

### Email marketing on Frappe (EM-1 templates + ops surface)

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **EM-1** | Branded bulk email | TrustLedger HTML templates + Desk runbook (`docs/FRAPPE_EMAIL_MARKETING.md`); Frappe Email Domain/Newsletter — not HubSpot / not Resend blasts | **Done (templates + ops surface)** — Desk SMTP / EDS uninstall still operator |
| **EM-2** | ClickUp newsletter ops | Cadence + AI draft + human approve in ClickUp; send remains Frappe Newsletter (`docs/CLICKUP_NEWSLETTER_OPS.md`) | **Done** (playbook) |

### Autonomous marketing engine (ACTIVE)

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **MKT-1** | Developer-owned marketing engine | Gemini synthesis + ClickUp HITL + Zernio publish; crons for Chibase papers and TrustLedger outreach; webhook `/api/webhooks/clickup` (`docs/MARKETING_ENGINE.md`, ADR-052) | **Done** |
| **MKT-2** | Ops marketing desk | Allowlisted `/ops/marketing` cockpit: engine flags, stage drafts, review queue, human-apply publish (`GET|POST /api/ops/marketing`) | **Done** |
| **MKT-3** | Operator briefs | Compose topic, length, and destination (LinkedIn post/article/comment, Reddit, ESG, website blog) from `/ops/marketing`; paste-ready for long-form/site | **Done** |
| **MKT-4** | Marketing review inbox | `/ops/marketing` content space shows only drafts still needing review/publish; Archive lane for finished or skipped pieces | **Done** |

### Public guide agent (ACTIVE)

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **THEMBA-A** | Themba Phase A visitor guide | ADR-042 — widget on `/`, `/product`, `/faq`; BFF `/api/themba/chat`; knowledge from `siteFacts` + brief §6; escalate → contact/Lead; no client LLM keys (`docs/THEMBA.md`) | **Done** |
| **THEMBA-B** | Themba marketing guru | ADR-043 — global public widget + avatar; role profiling; Social Licence framework knowledge; conversion chips; resource magnet; `/api/telemetry/bug-report` | **Done** |
| **THEMBA-C** | Audiences + document grounding | ADR-045 — MEL / community / facilitator profiles; Global South (ZA packs as SA baseline); retrieve+cite operating procedures, SRM blueprint, IKS practice frame; IKS paper drop zone | **Done** |

### Commercial packaging

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **CP-1** | Solo entry plan | ADR-035 — `solo` R1,999 / 1 seat / essentials; wire Paystack + entitlements + seats + docs (`docs/SOLO_PLAN.md`) | **Done** |
| **CP-2** | Focused SKUs (land-and-expand) | ADR-054 — persona desks on **one** TrustLedger workspace (grievance / local-spend evidence / field capture). No standalone product repos or per-SKU Cloud sites. Runbook `docs/MODULAR_SKUS.md` | **Done (decision + public copy)** |

### User enablement

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **UG-1** | User manual + first-login setup | `docs/USER_MANUAL.md`; in-app Setup wizard + `/app/guide` checklist (plan-aware spine) | **Done** |
| **UG-2** | Field capture templates | Minutes / attendance / field-note PDFs mapped to Capture; bundled on Project+; also `/resources` | **Done** |

### Security / tenancy packaging

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **SEC-0** | Security ladder docs | ADR-038 + `docs/SECURITY_TENANCY.md` — L1–L5 + plan Trust/Isolation matrix; home pricing blurb + foldable comparison + optional privacy extras | **Done** |
| **SEC-1** | Hard User Permissions | Frappe per-Customer permissions + A≠B smoke (L2) | **Done** (Plan Owner bind + BFF session bind; invitees = SEC-5 **Done**) |
| **SEC-2** | Purge + subprocessors | Runbook + public subprocessors note (L3/L4 lite) | **Done** (`docs/PURGE_RUNBOOK.md`, `/legal/subprocessors`) |
| **SEC-3** | DPA Trust Pack | POPIA-aware DPA for Project+ | **Done (template)** — `/legal/dpa`; not executed until countersigned |
| **SEC-4** | Isolation SKU | Dedicated site quote + Institutional/add-on commercial; request playbook `docs/PRIVATE_BENCH_REQUEST.md` | **Playbook done** — quote/SKU live when Cloud price locked |
| **SEC-5** | Cloud invitee seats | Replace browser-only junior seats; Owner password issue already covers Cloud Users on the Customer | **Done** |
| **SEC-BFF** | BFF session hardening | Ops APIs require live sid + Cloud identity; Plan Owner from Customer owner-email; Paystack verify one-shot; Frappe proxy allowlist; live lists never seed demo INC-* | **Done** |
| **SEC-SITE** | Dual-origin public hardening + Chibase site | ADR-046 — `/firm` brochure; retire Chibase WP; website DNS to this app; MX stays Webway; **SEO: 410 for retired WP spam + firm sitemap** (`docs/CHIBASE_SITE.md`, `docs/SITE_SECURITY.md`) | **Done** (SEO deepen 2026-08-17) |
| **CHIBASE-PREVIEW** | Hero preview desk | ADR-047 — local mock cases/people/promises on Chibase home; not a workspace; CTA to own-data trial | **Done** |
| **CHIBASE-PACK** | Consulting packages | ADR-048 — independent Chibase catalogue + optional Paystack; add-on request from any TrustLedger plan; no software entitlements | **Done** |

## 8. Quality gates (every packet)

```bash
npm run lint
npm run build
```

Manual smoke: `/product` → `/trial` or `/login/live` → Stakeholders create/list on Cloud when live.

## 9. Repository layout (target)

```
docs/
  BUILD_PLAN.md          ← this file
  DECISIONS.md
  DESIGN_SYSTEM.md
  CHANGELOG_INTERNAL.md
src/
  app/
    demo/
    app/                 ← authenticated product routes
    (marketing home)
  components/
    shell/
    ai/
    dashboard/
    ui/
  data/mock/
  services/
  types/
  config/
content/
  chibase-papers/    ← MKT-1 thought-leadership sources
  trustledger-campaigns/
src/lib/marketing/   ← Gemini / Zernio / ClickUp wrappers (server-only)
src/app/api/cron/    ← charge-due + marketing crons
src/app/api/webhooks/clickup/
```

## 10. Revision history

| Date | Change |
|------|--------|
| 2026-09-05 | SEC-BFF — Ops sid session, Cloud Plan Owner, Paystack verify one-shot, Frappe proxy allowlist, no live demo seed |
| 2026-09-05 | P3 — HS-2 in-repo inventory + ops smoke; EM-1 Desk remaining on `/ops/readiness`; HS-3/4 deferred |
| 2026-09-05 | P0b — Project Cloud save: live edits upsert `TL Project`; dossier stays local overlay; empty Cloud stays empty |
| 2026-09-04 | 24e-cloud — grievance lifecycle stamps on TL Incident (live upsert; blank times stay blank) |
| 2026-09-04 | TE-12 — trust-movement companion reading (later-half co-occurrence; not statistical causality) |
| 2026-09-04 | TE-11 — Cloud SoT for claim-verification stamps (human apply still required; not a sealed ledger) |
| 2026-09-04 | TE-10 — trust-claim verification (linked evidence ≠ verified; attendance does not verify) |
| 2026-09-04 | TE-9 — participation-quality reading (class mix; mixed ≠ weak; attendance ≠ consent) |
| 2026-09-04 | UX-1 — dashboards present as product overviews (KPI row + overall graphs; tables in details) |
| 2026-09-04 | TE-8 — engagement apply writes participation + optional overlay observations; sentiment not copied |
| 2026-09-04 | TE-7 — Cloud trust DocTypes + BFF; live SoT for customer/trial; sentiment not copied |
| 2026-09-04 | TRUST_MVP living inventory — semantic gap audit vs TE-1…TE-6; proof hub location; SI Engagement vs legacy `list_meeting_notes` |
| 2026-09-04 | TE-6 — MVP packaging: gap review, proof path, cross-module checks; no new trust capability |
| 2026-09-04 | TE-5b — community profiles, field extras persist on apply, language support without translation |
| 2026-09-04 | TE-5 — Global South adaptations: optional community/field context, language readiness, authority + participation realism |
| 2026-09-04 | TE-4 — trust intelligence: rule-based suggestions, alerts, local advisory drafts (not autonomous) |
| 2026-09-04 | TE-3c — desk + executive trust workspace: period trend, all-axis comparison, dimension bars |
| 2026-09-04 | TE-3b — dashboard trust workspace: movement cards, comparison, risk, proof narrative, shortcuts |
| 2026-09-04 | TE-2b — six blueprint trust dimensions; sentiment is not a trust observation |
| 2026-09-04 | TE-1 — frontend trust overlay library (optional fields + helpers; no UX/DocType change) |
| 2026-07-21 | Phase 6 Version 002 core; Version 001 public label (ADR-023) |
| 2026-07-22 | Operational delivery path (ADR-032); OD-1 active — delay paid prod until Cloud SoT |
| 2026-07-23 | GO LIVE Done — operational-grade Cloud ops for paying customers |
| 2026-07-23 | ADR-033 — retire public sample demo; `/product` + Cloud SI active |
| 2026-07-23 | PLATFORM_STRATEGIC_BRIEF — living brief for plans, agents, evaluation |
| 2026-07-23 | HS-1 active — cut HubSpot; Frappe CRM Lead acquisition SoT (ADR-034) |
| 2026-07-24 | ADR-034 clarified Frappe-only; WEBWAY_CUTOVER checklist; HS-2 active |
| 2026-07-24 | EM-1 — branded Frappe bulk email templates + FRAPPE_EMAIL_MARKETING |
| 2026-07-24 | CP-1 / ADR-035 — Solo entry plan (R1,999, 1 seat, essentials) |
| 2026-07-26 | UG-1 — user manual + first-login setup wizard / Guide |
| 2026-08-15 | UG-2 — field capture templates (minutes / attendance / field note) |
| 2026-07-27 | SEC-0 / ADR-038 — multi-tenant security ladder + plan packaging |
| 2026-07-27 | SEC-0 UI — optional privacy extras + foldable plan comparison on home pricing |
| 2026-08-07 | Hosting contingency runbook — pre–paying-client uptime + Node standby (`docs/HOSTING_CONTINGENCY.md`) |
| 2026-08-14 | CHIBASE-PACK / ADR-048 — independent Chibase consulting packages; optional Paystack; TrustLedger add-on request only |
| 2026-08-14 | CHIBASE-PREVIEW / ADR-047 — local preview desk on Chibase hero |
| 2026-08-14 | SEC-SITE — retire Chibase WordPress (SP declined cleanup); website DNS only; MX stays Webway |
| 2026-08-14 | SEC-SITE / ADR-046 — Chibase Next.js brochure + dual-origin public hardening; MX stays Webway |
| 2026-08-14 | THEMBA-C / ADR-045 — Themba audiences, Global South, document grounding |
| 2026-08-14 | THEMBA-B / ADR-043 — Themba marketing guru on all public landing pages |
| 2026-08-13 | THEMBA-A / ADR-042 — Themba (The Trust) visitor guide on marketing routes |
| 2026-08-15 | EM-2 — ClickUp newsletter ops playbook (approve → Frappe send) |
| 2026-08-21 | MKT-1 — autonomous marketing engine (Gemini + ClickUp HITL + Zernio; ADR-052) |
| 2026-08-21 | MKT-2 — `/ops/marketing` operator desk for the engine |
| 2026-08-21 | MKT-3 — operator briefs (topic / length / LinkedIn·Reddit·ESG·blog) |
| 2026-08-21 | MKT-4 — marketing review inbox + archive |
| 2026-09-05 | P3 — HS-2 in-repo inventory + ops smoke; EM-1 Desk remaining on `/ops/readiness`; HS-3/4 deferred |
| 2026-09-05 | SI-SEP Cloud persist — TL Engagement Plan DocType + live BFF; overlay on execution_json; empty Cloud stays empty |
| 2026-08-31 | CP-2 / ADR-054 — focused SKUs on one workspace (not standalone products); `docs/MODULAR_SKUS.md` |
