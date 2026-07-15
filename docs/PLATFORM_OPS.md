# Platform Ops — command centre

**Locked with ADR-015 + ADR-016 + ADR-017.**  
This is **not** a CRM and **not** the customer Plan Owner (`admin`) desk.

**Purpose:** Your control / command centre for the whole TrustLedger platform. Surfaces share the same allowlist:

| Surface | Audience | URL |
|---------|----------|-----|
| **Executive Board** | C-suite / owner — board & investor briefs | `/ops/executive` |
| **Control pillars** | Owner control — finance, staff, AI, issues | `/ops/finance`, `/ops/staff`, `/ops/ai`, `/ops/issues` |
| **Ops activity** | Day-to-day / junior ops | `/ops`, `/ops/activity` |

Frappe CRM / Customer / Paystack remain systems of record; Ops **reads and acts**, it does not replace CRM.

## Who can enter

| Role | Access |
|------|--------|
| **Platform Owner** (you) | Full `/ops` + executive + control pillars |
| **Platform Staff** (emails you add later) | Scoped read / support (future) |
| Customer Plan Owner / demo users | **Never** |

Allowlist: `PLATFORM_OPERATOR_EMAILS` (same env as ADR-013).  
`/ops` is **always** allowlist-gated (even if customer lockdown is off).

**Entry (owner):** `https://trustledger-frontend-pi.vercel.app/ops/executive`  
**Login:** `/login/live` → homes to **`/ops/executive`**.

## Executive Board (`/ops/executive`)

Presentation-first overview for boards and investors:

- Headline KPIs (pipeline, demos, assessments, experience score)
- Activity trend + mix charts
- Conversion funnel
- Demographics: origin (UTM/source), industry/sector, influence level
- Sentiment / tool-usage perception + verbatim visitor quotes
- Control-centre strip linking finance / staff / AI / issues
- Auto talking points (copy / print)

## Control pillars (ADR-017)

| Pillar | URL | Now | Later |
|--------|-----|-----|-------|
| **Finance** | `/ops/finance` | Layout + budget/utilisation placeholders | Paystack / books / burn actuals |
| **Staff** | `/ops/staff` | Capacity & performance scaffold | HR signals; **wellbeing deferred** (placeholder only) |
| **AI tools** | `/ops/ai` | Registry of platform AI tools + governance actions | Invocation metrics, fail rates, upgrade/discharge workflow |
| **Issues** | `/ops/issues` | Support Ticket CRM overview | SLA/TAT clocks, post-resolution client feeling |

## Ops activity desk (`/ops`)

Operational feed: who did what (demo, assessment, feedback, contact, support). Not customer project workloads.

| Pillar | Examples |
|--------|----------|
| **Activity overview** | Volume + latest client signals + health |
| **Client activity feed** | Filterable feed — deep edit stays in CRM |
| **Reports** | Pull full slices + CSV (packet 23b) |
| **Accounts** | Plan / seats / suspend (packet 23c) |

## What Ops is not

- Customer product desk (`/app` dashboards, projects, incidents, issues)  
- Duplicate day-to-day CRM pipeline (use Cloud CRM for record editing)  
- Marketing CMS  
- Live HR/payroll system (staff pillar is control overview only)

## Data sources

| Signal | Source |
|--------|--------|
| Leads / feedback / contact | CRM Lead + Comments (API) |
| Support issues | CRM Lead Source `Support Ticket` |
| Assessment readiness | Lead job_title / message (score band) |
| Platform health | `/api/health` |
| Payments / budget | Paystack / Sales Invoice / books (later) |
| AI tool telemetry | Future event log from `aiService` / srm-core |
| Staff wellbeing | Explicitly deferred — no live sensors yet |

## Build sequence

| Packet | Scope | Status |
|--------|--------|--------|
| **23a** | `/ops` shell + allowlist gate + activity overview | Done |
| **23e** | Executive Board brief | Done |
| **23f** | Control pillars: finance, staff, AI tools, issues | **Active** |
| **23b** | Reports hub (filter → table → CSV) | Next |
| **23c** | Account control panel | Later |
| **23d** | Support case pack + activity timeline | Later |
