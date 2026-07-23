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
| Backend | **Frappe Cloud** `app.trustledger.co.za` (CRM/auth/payments now; `srm-core` later on Cloud) |
| Marketing | WordPress `trustledger.co.za` on Webway (CTA later) |
| Runtime AI | Grok via `srm-core` on Cloud only — never from browser |

**Current phase:** Phase 6 — **Version 002** core (ADR-023). Product label in market: **Version 001**. Demo/mock remains default until Frappe DocTypes land.

## 2. Locked decisions (do not re-ask)

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
/                     Marketing-lite app home → CTA to /demo
/demo                 Demo landing: role picker + “Demo data” notice + lead CTA
/assessment           Public SRM Readiness & Risk Diagnostic (lead-gated results)
/login                Dev/demo role session (cookie) — same as today, restyled
/app                  Authenticated shell (sidebar + topbar)
/app/dashboard        Role home (real widgets, not bullet lists)
/app/projects         Project list + detail
/app/incidents        Incident list
/app/incidents/[id]   Case desk + AI assist
/app/issues/report    Assisted intake
/app/reports          Client/admin briefs
/app/settings         Profile/role display (demo)
```

Legacy routes (`/dashboard`, `/incidents`, …) **redirect** into `/app/...` so old links work.

## 5. Demo behaviour

| Behaviour | Rule |
|-----------|------|
| Entry | `/demo` explains demo, picks role, sets `session-role` + `tl-mode=demo` cookie |
| Banner | Persistent “Demo mode — sample data” on all `/app` pages |
| Data | `src/data/mock/*` only |
| AI | `NEXT_PUBLIC_AI_MOCK=true` (default) |
| Lead capture | Soft gate modal after N meaningful actions (default 3) OR “Book a demo” in shell |
| Persistence | localStorage for demo actions optional; no server writes |
| Live mode | `NEXT_PUBLIC_DATA_MODE=live` + API base; falls back to mock if unset |

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
| 15 | WordPress CTA guide | Paste-ready buttons/UTM for trustledger.co.za | **Done** |
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
| 23b | Ops reports | Filterable intake/feedback/assessment reports + CSV | Planned |
| 23c | Ops accounts | Customer plan/status/seat controls | Planned |
| 23d | Ops support packs | Per-person/org context for support | Planned |

See `docs/PLATFORM_OPS.md`, ADR-015, ADR-016, ADR-017.

### Phase 6 — Version 002 Stakeholder Intelligence core (ACTIVE)

> Soft launch may wait until V002 core is credible (ADR-023).  
> Detail: `docs/VERSIONING.md`, `docs/ROADMAP_V002.md`.

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **24a** | Geo foundation | SA hierarchy types/mock, `/app/geo`, place fields, ingest hook | **Done (ZA MDB pack)** |
| **24b** | Stakeholders registry | List/detail/create; Frappe DocType contract | **CRM seeded (list+detail)** |
| 24c | Engagements | Meetings / consultations beyond note stubs | Planned |
| 24d | Commitments | Promise lifecycle board | Planned |
| 24e | Stronger grievance | Fuller incident workflow on Frappe | Planned |
| **24f** | Reports packs | Dual dashboards: Activity + Reports hub (monthly / executive / board) + Owner pack access | **Done** |
| 24g | Intelligence / ESG | Indicators, socio-econ layers, stronger AI briefs | Planned |

### Client org / tenancy (demo → Cloud)

| Packet | Name | Scope | Status |
|--------|------|-------|--------|
| **T1** | Plan Owner master | Org store, session cookies, master desk strip, Team shell | **Done** |
| **T2** | Invites + seats | Owner invites, `/invite/accept`, locked junior desk tier, plan seat caps | **Done** |
| **T3** | Org data space | Org-scoped store, no demo seed in trial, CSV deposit | **Done** |
| **T4** | Media + quotas | Registers/minutes/photos/video; plan storage quotas | **Done** |
| **T5** | Frappe SoT | Customer/User contract + operator provision prep (lockdown stays) | **Done** |
| **OD-1** | Operational Step 1 | Desk Customer/User fields + issuance smoke; Ops `/ops/readiness` ladder (ADR-032) | **Done** |
| **OD-2** | Product DocTypes + File | TL Project / Incident / Evidence ensure + smoke + upload BFF | **Done** |
| **OD-3** | Sync + auto-provision | Paystack → Cloud Owner; migrate tl-org-data on live login | **Done** |
| **OD-4** | Billing + lift lockdown | Day-14 cron charge-due; entitlement gate; lift ADR-013 | **Done** |
| **OD-5** | V002 depth | Engagements → commitments → grievance → ESG (24c–24g) | **Active** |

## 8. Quality gates (every packet)

```bash
npm run lint
npm run build
```

Manual smoke (packet 09+): `/demo` → each role → one AI action → lead CTA visible.

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
```

## 10. Revision history

| Date | Change |
|------|--------|
| 2026-07-11 | Initial Demo-first BUILD_PLAN (Packet 00) |
| 2026-07-21 | Phase 6 Version 002 core; Version 001 public label (ADR-023) |
| 2026-07-22 | Operational delivery path (ADR-032); OD-1 active — delay paid prod until Cloud SoT |
