# TrustLedger Frontend — Build Plan

> **Single source of truth** for scope, locked decisions, packet order, and agent behaviour.
> **Phase 1 (Done):** full functional Demo on Vercel.
> **Phase 2 (Active):** Frappe-ready wiring in the frontend (still mock-default); WordPress/Cloudflare remain external.

## 1. Product

| Item | Value |
|------|--------|
| Official name | **TrustLedger** |
| App host | **Vercel** |
| Demo URL target | `/demo` (and role dashboards under `/app/...`) |
| Backend | **Frappe Cloud** `app.trustledger.co.za` (CRM/auth/payments now; `srm-core` later on Cloud) |
| Marketing | WordPress `trustledger.co.za` on Webway (CTA later) |
| Runtime AI | Grok via `srm-core` on Cloud only — never from browser |

**Current phase:** Phase 2 — Frappe-ready on **Frappe Cloud**. Demo remains default and must keep working without live product DocTypes. Interserv is retired (ADR-018).

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
| 23b | Ops reports | Filterable intake/feedback/assessment reports + CSV | Planned |
| 23c | Ops accounts | Customer plan/status/seat controls | Planned |
| 23d | Ops support packs | Per-person/org context for support | Planned |

See `docs/PLATFORM_OPS.md`, ADR-015, ADR-016, ADR-017.

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
