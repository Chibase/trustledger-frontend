# Multi-tenant security ladder & plan packaging

**Audience:** Product, sales, Ops, VIP conversations.  
**Locked posture:** ADR-038.  
**Related:** `docs/ACCESS_MODEL.md`, `docs/PLATFORM_STRATEGIC_BRIEF.md`, VIP beta terms v2.

Clients fear **data mining**, **mixing with other tenants**, and **lawful processing** (POPIA / client contracts). TrustLedger already separates workspaces by **Customer / org**. Reaching a *sellable* multi-tenant security level means climbing a ladder — some steps are **engineering**, some are **process/legal**, some are **recurring cost** that belongs on higher plans.

---

## 1. What “multi-tenant security” means here

Not a magic “privacy shell.” It means, in order:

| Layer | Meaning |
|-------|---------|
| **L1 — Tenant identity** | Every org is a distinct Customer / org id (we largely have this). |
| **L2 — Hard access boundaries** | Server + Desk **User Permissions** so User A cannot read Customer B even via API mistakes. |
| **L3 — Operational privacy** | Audit logs, operator break-glass, purge runbooks, no demo bleed, AI data-use rules. |
| **L4 — Assurances** | DPA, subprocessors list, retention schedule, optional pen-test / ISO / SOC-oriented controls. |
| **L5 — Isolation options** | Dedicated DB site / region / VPC-style hosting for Institutional (true cost step). |

**Today:** Strong **L1**. **L2 Plan Owner + invitee bind** shipped (SEC-1 / SEC-5). **L3** now includes the purge runbook (`docs/PURGE_RUNBOOK.md`) plus ops allowlist, OTP, beta terms, suggest→apply AI. **L4 lite:** public subprocessors (`/legal/subprocessors`) and a **template** DPA (`/legal/dpa`) — not executed until countersigned; not SOC 2 / ISO. **L5** Isolation remains playbook-only until Cloud price is locked. Trial/browser-only invites (no Cloud Customer) are still device-local.

---

## 2. What we need to reach each level (truthful)

### L2 — Hard multi-tenant boundary (must-have for confidence)

| Work | Type | Notes |
|------|------|--------|
| Frappe **User Permission** (or equivalent) per Customer on all TL / SI DocTypes | Engineering | **SEC-1 Done for Plan Owners. SEC-5 Done for accepted Cloud invitees.** |
| API / resource calls never use a global key that can “see all” without a scoped user | Engineering | Site key remains for BFF; customer-facing CRUD **binds session Customer** and post-filters lists. Prefer user `sid` or permissioned service roles next. |
| Entitlement + role asserts on **writes** (not UI alone) | Engineering | ACCESS_MODEL already requires this |
| Invitees as **Cloud Users** scoped to that Customer | Engineering | **SEC-5 Done** for live orgs with a Cloud Customer. Trial without a Customer stays browser-local. |
| Automated tests: “User of A cannot read B” | Engineering | **SEC-1 smoke:** Owner bindings + peer-org binds on `/ops/readiness`. Sid impersonation still later. |

**Cost:** Mostly **build time**, not a big monthly fee. This is the non-negotiable credibility layer for *all* paid live plans over time — not only Institutional.

### L3 — Operational privacy (should-have now)

| Work | Type | Notes |
|------|------|--------|
| Written **subprocessors** list (Frappe Cloud, Vercel, Resend, Paystack) | Process | Already named in VIP TOU at high level |
| **Purge runbook** + ticket SLA (VIP terms target 30 days) | Process + light eng | Manual OK at soft launch; automate later |
| Operator **break-glass** log (who opened which Customer) | Engineering / Ops | Builds trust with municipalities |
| AI policy in product + plans: no external foundation-model **training** on client content; suggest→apply | Product + legal | Align sales scripts |
| Data classification in onboarding: mock / anonymised default for beta | Process | Already VIP TOU v2 |

**Cost:** Low cash; high **discipline**.

### L4 — Legal / assurance pack (sell on Project+)

| Work | Type | Cost shape |
|------|------|------------|
| **DPA** (POPIA-aware processor terms) + annex for subprocessors | Legal | Once + annual review |
| Retention & deletion schedule published | Legal + eng | |
| Optional independent **security questionnaire** pack for RFPs | Sales | |
| Pen-test / vulnerability assessment (annual) | Cash + vendor | Recurring |
| Path toward ISO 27001 / SOC 2 (later) | Cash + process | **Do not sell until started** |

**Cost:** Real, but **amortised** — recover via Project / Institutional margins, not Solo.

### L5 — Dedicated isolation (Institutional only)

| Option | What client buys | Cost driver |
|--------|------------------|-------------|
| Dedicated **cloud site** / DB (internal: private bench) | Stronger “our data isn’t in the shared pool” story | Cloud plan tier |
| Region / residency preference | Procurement comfort | Host pricing |
| Named success + security contact | Human assurance | Staff time |
| Custom retention / private networking (later) | Enterprise RFPs | High |

**Cost:** Yes — **recurring**. This is why Institutional is sales-scoped and should stay **Custom**, with an explicit **Trust & Isolation** line item. Client copy: “private cloud workspace.”

---

## 3. Is it cost-based? Can we put it on plans?

**Both.**

| Layer | Primarily… | Put on plans as… |
|-------|------------|------------------|
| L2 hard permissions | Engineering investment | **Baseline for all live paid** (roadmap; don’t charge Solo extra forever for basic non-mixing) |
| L3 ops privacy | Process | Included; make **explicit** in feature lists |
| L4 DPA / pen-test | Cash + legal | **Project+** included or add-on; Institutional always |
| L5 dedicated site | Recurring host cost | **Institutional only** (or paid add-on “Isolation”) |

**Principle:**  
- **Do not** charge Solo for “we finally stop mixing tenants” — that must become table stakes.  
- **Do** charge for **assurances and dedicated isolation** — that is where cost and law meet procurement.

---

## 4. Explicit plan matrix — “Trust & tenancy” (sell this)

Add these rows to pricing / WP / `/` packaging (honest current → target):

| Feature | Solo | Practitioner | Project | Institutional |
|---------|:----:|:------------:|:-------:|:-------------:|
| Distinct Customer / org workspace | ✓ | ✓ | ✓ | ✓ |
| No demo-seed in your workspace | ✓ | ✓ | ✓ | ✓ |
| HTTPS + operator allowlist for platform ops | ✓ | ✓ | ✓ | ✓ |
| AI: suggest→apply; no external model **training** on your content | — / limited | ✓ | ✓ | ✓ |
| **Hard User-Permission tenancy (L2)** | Plan Owner ✓ | Plan Owner ✓ | Plan Owner ✓ | Plan Owner ✓ |
| **DPA + subprocessors schedule (L4)** | On request | On request | ✓ target | ✓ |
| Audit / break-glass visibility | — | — | Light | ✓ |
| **Dedicated site / isolation option (L5)** | — | — | Add-on* | ✓ sales |
| Custom retention & purge SLA | Soft | Soft | Defined | Contracted |

\*Optional later: **“Isolation Pack”** add-on on Project (dedicated site surcharge) so mid-market can climb without full Institutional.

### Suggested commercial hooks (ZAR — calibrate with Ops Finance)

| Offer | Who | Pricing idea |
|-------|-----|----------------|
| Shared tenancy (default) | Solo → Project | Included in list price |
| **Trust Pack** (DPA + purge SLA + security FAQ) | Practitioner+ on request; Project optional | From ~R1.5k/mo or included in Institutional scoping |
| **Private cloud workspace** (Isolation) | Project add-on / Institutional | **From ~R8k/mo** band (host-driven — confirm cloud quote) |
| Support access visibility | Project / Institutional optional | From ~R900/mo |
| Institutional programme | Public / multi-entity | Custom = platform + isolation + success |

Do **not** lock Isolation list prices until a cloud host quote is locked — sell as “from …” or sales-scoped on `/#pricing`.

**When a client asks for a private bench:** follow `docs/PRIVATE_BENCH_REQUEST.md` (intake → quote → contract → provision → point frontend → run).

---

## 5. Client-facing language (safe)

**Brand rule (marketing / pricing / contact):** Say **TrustLedger** only. For hosting, say **“cloud”** or **“private cloud workspace”** — do **not** name Frappe, Vercel, or other subprocessors on public pricing. Internal docs and DPA annexes may list subprocessors.

**Home pricing (`HomePricing`):** Short data-protection blurb + foldable plan comparison + optional privacy extras (Trust Pack, private cloud workspace, support-access visibility). Most depth is opt-in; base workspace protections stay included.

**Now (truthful):**  
“Your organisation is a separate TrustLedger workspace. Live desks load that organisation from sign-in — the app will not switch onto another client’s workspace. Plan Owners and accepted teammates on a live organisation are bound to that organisation on the server. Operators who support the platform are allowlisted. We don’t sell your content or use it to train external AI models. Beta testers use mock or anonymised data; you can request deletion when access ends.”

**Honest limit:** Trial or browser-only invites (no Cloud Customer yet) stay on that device until the organisation is on TrustLedger Cloud. Do not claim every trial seat is a Cloud User.

**Institutional / Isolation:**  
“For programmes that require it, we can run your desk on a private cloud workspace so tenancy isn’t only logical.”

**Never say until true:** SOC 2 certified, air-gapped, “military-grade encryption shells,” “your data never touches any processor.”

---

## 6. Recommended build order (packet-friendly)

1. **SEC-1** — Frappe User Permissions + “A cannot read B” smoke (L2 core) — **Done** (Plan Owner bind + BFF session bind; playbook `docs/FRAPPE_USER_PERMISSIONS.md`).  
2. **SEC-5** — Cloud User seats for invitees — **Done** (live Customer; trial without Cloud stays browser-local).  
3. **SEC-2** — Purge runbook + subprocessors page (L3/L4 lite) — **Done**.  
4. **SEC-3** — DPA template for Project+ (legal) — **Done (template; not executed until countersigned)**.  
5. **SEC-4** — Isolation SKU + dedicated site quote (L5 commercial) — **Playbook only until Cloud price locked**.

Sales can **talk** Trust Pack / Isolation **now** as roadmap with dates only when SEC packets are scheduled — otherwise say “available on Institutional scoping.”

---

## 7. Why this matches the law and the market

- POPIA / client contracts care about **purpose, access, retention, operators, subprocessors** — not marketing words.  
- Data mining fear is answered by: **no sale**, **no external training**, **tenant boundary**, **human-apply AI**, **purge**.  
- Cost belongs on **assurance and isolation**, while **non-mixing** becomes a baseline credibility feature for every live plan.
