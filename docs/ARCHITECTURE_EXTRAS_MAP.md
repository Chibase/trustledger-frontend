# TrustLedger — marketing / agents / Helpdesk / BI extras map

**Status:** Architecture alignment (response to Gemini-style “unified extras” blueprint)  
**As of:** 2026-07-29  
**Authoritative product rules:** `docs/DECISIONS.md`, `docs/PLATFORM_STRATEGIC_BRIEF.md`, `AGENTS.md`, ADR-039  

> Goal: keep a solid unified system **without** heavy recurring SaaS sprawl — while **not** replacing TrustLedger’s locked grievance, AI, and reporting paths.

---

## 1. Verdict on the proposed blueprint

| Phase | Proposal | TrustLedger verdict |
|-------|----------|---------------------|
| **1 — Core** | Frappe CRM + Vercel frontend | **Already built** (and more: SI DocTypes, Paystack, `/ops`, trial/live) |
| **2a — Frontline agents** | Typebot/custom + **Gemini in the browser** → webhook CRM/Helpdesk | **Adapt hard** — no client LLM keys; no auto case writes (ADR-006) |
| **2b — Grievance intake** | **Frappe Helpdesk** public forms as grievance SoT | **Reject as grievance path** — Helpdesk may come later for **paid support** only |
| **2c — BI** | **Frappe Insights** iframes as customer SaaS dashboards | **Defer / do not sell as product BI** — desk graphs + `reportComposer` + `/ops/executive` are the truth today |

---

## 2. What Phase 1 already is (honest inventory)

| Layer | Lives where | Role |
|-------|-------------|------|
| Marketing | `trustledgersrm.co.za` (WP CTAs) + Vercel `/`, `/product`, `/faq` | Story, pricing, AEO FAQ |
| Product UI | Vercel `/app/*` | Roles, desk, SI, reports |
| Acquisition CRM | Frappe **CRM Lead** (ADR-034) | Assessment / contact / quote / support tickets |
| Product SoT | Frappe Cloud `app.trustledgersrm.co.za` | Customer, Project, Incident, Evidence, Stakeholder, Engagement, Commitment |
| Commercial | Paystack on Vercel + Ops finance | Trial → subscribe → provision |
| Ops BI | Vercel `/ops/executive` | Platform operator only |
| Public education | `/product`, `/faq`, optional Taskade showcase (noindex) | Not a second CRM |

Frappe CRM messaging channels (WhatsApp / Twilio) may exist on Desk for **sales/ops** — they are **not** the public community grievance portal (that is V003+).

---

## 3. Map each “optional extra” to TrustLedger truth

### 3.1 Customer-facing AI agents & onboarding

| Blueprint says | Locked rule | TrustLedger path |
|----------------|-------------|------------------|
| Embed Typebot + Gemini API on Vercel | LLM keys **never** in browser (`AGENTS.md`, ADR-006) | Any chat widget must call a **Vercel BFF**; provider can be Grok (preferred via `srm-core`) or another server-side model |
| Agent auto-answers then pushes to CRM/Helpdesk | AI = **suggest → human apply → save**; no auto-send / auto-case | Soft **lead qualifier** may create a **CRM Lead** via existing form BFF — never silent `TL Incident` creates |
| Train on docs / guidelines | Public scripts in strategic brief §6; ADR-039 Trust voice | Use approved FAQ corpus (`src/lib/aeo/siteFacts.ts`); no vendor brands in public copy |

**Recommended shape (low cost):**

1. **Now:** Keep `/product` + `/faq` + assessment + public agent *scripts* (and optional Taskade showcase).  
2. **Optional next:** “TrustLedger Guide” chat — Vercel API route → server LLM → answers from FAQ pack; “talk to a human” → `/contact` or CRM Lead webhook (same as forms).  
3. **Not now:** Browser Gemini keys, Typebot as branded product surface, agent auto-opening Helpdesk tickets for grievances.

### 3.2 Grievance & intake

| Blueprint says | Locked rule | TrustLedger path |
|----------------|-------------|------------------|
| Frappe Helpdesk public web forms | Grievance SoT = **TL Incident** + `/app/issues/report` | Keep TrustLedger issue intake |
| Embed Helpdesk in dashboard | Helpdesk = **Phase C support** for paying clients (`docs/SUPPORT_OPS.md`) | Separate from community grievance |
| Community member logs grievance publicly | Public community portal = **V003+** (do not sell) | Field roles use product intake after access; assessment is readiness not case desk |

**Recommended shape:**

| Need | Use |
|------|-----|
| Community / field grievance | TrustLedger **Issue intake** → Incident stages (Reported → … → Closed) |
| Paying-client tech support | Later **Helpdesk** (authenticated), AI draft replies with **approve to send** |
| Sales lead / walkthrough | Vercel forms → **CRM Lead** |

### 3.3 Analytics & visual dashboards

| Blueprint says | Locked rule | TrustLedger path |
|----------------|-------------|------------------|
| Frappe Insights connected to CRM/Helpdesk | Activity / compliance briefs use **local `reportComposer`** — never Cloud month-end templates | Do not replace reportComposer with Insights |
| Embed Insights charts in customer `/app` | Customer BI today = trust pulse, desk graphs (entitled), report packs | Sell what is entitled; deepen Cloud-backed charts later |
| SaaS metric cards for ESG trends | ESG cards illustrative until Stats SA; honest packaging | No “Insights” brand in public UI (ADR-039) |

**Recommended shape:**

1. **Customer-facing:** TrustLedger dashboard KPIs + entitled desk graphs + report packs (Monthly / Executive / Board).  
2. **Operator-facing:** `/ops/executive` + readiness.  
3. **Optional internal:** Insights (or similar) for **Chibase/ops** analysis of CRM/Helpdesk tables — not required for GO LIVE product claims.  
4. **Taskade presentation dashboard:** marketing/demo storytelling only — not live customer SoT.

---

## 4. Unified architecture (revised)

| Component | Role | Where it lives | Phase |
|-----------|------|----------------|-------|
| Core UI | Product + funnel | Vercel | **Now** |
| Backend + CRM Lead | Data engine + acquisition | Frappe Cloud | **Now** |
| Grievance desk | Case trail & SLA stages | `TL Incident` + Vercel desk | **Now** |
| Stakeholder Intelligence | Registry → engagement → commitment | Cloud SI + Vercel | **Now (deepening)** |
| AI Assist | Suggest → apply → save | Server-side (Grok/`srm-core` target) | **Now / mid** |
| Reports | Evidence-based briefs | `reportComposer` + packs | **Now** |
| Public FAQ / AEO | Parseable TrustLedger facts | `/faq`, WP paste, `llms.txt` | **Now** |
| Guide chat (optional) | Onboarding Q&A → CRM Lead | Vercel BFF + approved corpus | **Optional** |
| Helpdesk | Authenticated **support** tickets | Frappe Helpdesk | **Optional mid (Phase C)** |
| Insights | Internal / ops BI only | Frappe Insights (if installed) | **Optional internal** |
| Public community portal | External grievance portal | — | **V003+** |

---

## 5. Cost & complexity discipline

Keep recurring cost low by preferring **native Cloud modules you already host** over new SaaS:

| Prefer | Avoid for core product |
|--------|-------------------------|
| Frappe CRM Lead + existing Vercel forms | HubSpot (ADR-034) |
| TrustLedger intake + Incident | Helpdesk-as-grievance |
| Server LLM behind BFF | Browser Gemini / Typebot as SoT |
| reportComposer + Ops board | Paid BI SaaS for customer packs |
| One public FAQ corpus | Parallel chatbots with conflicting claims |

---

## 6. Decision test (before building any extra)

1. Does it strengthen the **resolution desk** or **Stakeholder Intelligence**?  
2. Does it keep AI as **suggest → apply** with keys server-side?  
3. Does public copy stay **TrustLedger + Trust voice** (ADR-039)?  
4. Is there an **entitlement** so packaging stays honest?  
5. Are we accidentally building **V003 public portal** early?

If three answers are “no,” do not ship in the current plan box.

---

## 7. Suggested packet order (if pursuing extras)

| Order | Packet | Outcome |
|-------|--------|---------|
| 0 | — | Continue V002 SI deepening (already active north star) |
| 1 | Optional Guide chat BFF | FAQ-grounded answers + handoff to `/contact` / CRM Lead |
| 2 | SUPPORT Phase C | Helpdesk for **paid** support only; wire from in-app Support drawer |
| 3 | Ops-only Insights | Internal dashboards; no customer marketing claim |
| Later | V003 portal | Only after desk + SI maturity and honest packaging |
| Never | Standalone Grievance / Supplier / Field products | ADR-054 — focused SKUs on one workspace (`docs/MODULAR_SKUS.md`) |

Do **not** start with Typebot + Gemini embed + Helpdesk-as-grievance + Insights-in-`/app` as one project — that fights the ADRs and inflates cost.
Do **not** split TrustLedger into separately licensed Frappe apps to chase smaller buyers — use Solo + entitlements.
