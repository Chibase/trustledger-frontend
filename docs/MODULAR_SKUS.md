# TrustLedger focused SKUs (land-and-expand)

**ADR-054.** Commercial packaging for smaller organisations, contractors, and municipalities that may not buy the full SRM box on day one — **without** splitting TrustLedger into standalone products.

**Public brand:** TrustLedger only (ADR-002 / ADR-039). Internal names below are operator language, not SKU brands.

**Do not sell as separate apps.** Buyers get one workspace on TrustLedger Cloud. Modules that are off stay hidden by entitlements (ADR-024). Upgrade is a **plan or add-on change**, not a data migration.

---

## 1. Why this exists

The GTM case is real:

| Intent | How TrustLedger already covers it |
|--------|-----------------------------------|
| Lower barrier to entry | **Solo** (R1,999, 1 seat, grievance desk) — ADR-035 |
| Land-and-expand | Plan ladder Solo → Practitioner → Project → Institutional + typed add-ons |
| Persona marketing | Same product, different **entry stories** and UTM; not different codebases |
| Hide unused SRM | Capability gates already hide CRM / engagements / commitments on Solo |

What we **do not** do now: new Git repos, a “core Frappe app + plugin apps”, per-SKU Cloud sites, or a public WhatsApp / vendor marketplace as a shippable product.

---

## 2. Three focused desks (honest mapping)

### Desk A — Community grievance & incident desk

| | |
|--|--|
| **Buyer** | Construction projects, mines, municipalities that must log public complaints |
| **Internal name** | Grievance desk (already the Version 001 heart) |
| **Public language** | TrustLedger grievance resolution desk |
| **Shipped today** | Issue intake → incidents → evidence → monthly report. **Solo** is the entry SKU. Practitioner adds AI Assist. |
| **Not shipped** | Public community portal, anonymous web form, WhatsApp as a product intake channel (V003+). Field staff may *map* a WhatsApp thread onto a case; that is not a public portal. |
| **Expand path** | Solo → Practitioner (AI) → Project (Stakeholder Intelligence + seats) |
| **Checkout** | `/pay?plan=solo` · trial `/trial?plan=solo` |
| **UTM** | `utm_campaign=grievance_desk` (or `grm`) → Solo |

### Desk B — Local procurement & ED evidence

| | |
|--|--|
| **Buyer** | Main contractors and developers who must prove local ED / B-BBEE / preferential procurement |
| **Internal name** | Local spend evidence (not a marketplace) |
| **Public language** | Local procurement and empowerment **evidence** on TrustLedger |
| **Shipped today** | Capture packs (B-BBEE / empowerment, labour, training, local procurement ZAR) and Intelligence cards on **Project / Institutional**. Evidence trail for KPIs the client already named. |
| **Not shipped** | Vendor self-registration portal, compliance-document verification workflow, supplier directory, or a procurement marketplace. TrustLedger is **not** a buying platform. |
| **Expand path** | Project (or Practitioner + capture / ESG add-ons) → Institutional when multi-project / isolation is required. A future `addon_procurement` (vendor register + document checks) is **candidate only** — not in `AddonId` until DocTypes and a price exist. |
| **Checkout** | `/pay?plan=project` |
| **UTM** | `utm_campaign=local_procurement` (or `ed_portal`, `bbbee`) → Project |

### Desk C — Social performance field companion

| | |
|--|--|
| **Buyer** | Independent environmental consultants, field researchers, CLOs |
| **Internal name** | Field capture |
| **Public language** | Field templates and Capture hub (works in the mobile browser) |
| **Shipped today** | Minutes / attendance / field notes (UG-2) on `/resources` and Capture hub on **Project+**. Responsive web. |
| **Not shipped** | Native App Store / Play app, offline-first sync, a separately licensed “companion” product. Do not promise. |
| **Expand path** | Project (capture + SI) is the honest SKU. Solo is the wrong box if they need registers and CRM. Practitioner + `addon_capture` / `addon_crm` is the wedge if they cannot carry Project yet. |
| **Checkout** | `/pay?plan=project` |
| **UTM** | `utm_campaign=field_companion` (or `capture_hub`) → Project |

---

## 3. Architecture (locked)

```text
One Next.js product  →  one TrustLedger Cloud site (app.trustledgersrm.co.za)
                         Customer + Plan Owner + entitlements
                         TL Project / Incident / Evidence
                         TL Stakeholder / Engagement / Commitment
```

| Proposal | Verdict |
|----------|---------|
| Shared foundational app + domain Git repos | **Reject for now.** One frontend repo; Cloud DocTypes already shared. A later `srm-core` split into Frappe apps is an **engineering** concern, not customer SKUs. |
| Provision a site with only “supplier app” installed | **Reject as default.** Entitlements hide modules. Dedicated sites are **L5 Isolation** (ADR-038 / SEC-4), Institutional / quoted — not a SKU install flag. |
| JSON import/export so standalone clients “migrate into SRM” | **Unnecessary** if they were always on the same Customer. Trial → live already migrates `tl-org-data`. Isolation moves (SEC-4) may later need export; do not build a second product database. |
| Independent licensing | **Plan code + add-ons** (Paystack + Customer entitlement fields). Not a second product licence. |
| Marketplace / ISV channel | **V003+** (`docs/VERSIONING.md`). Do not package as imminent. |

### Decision test (from the strategic brief)

1. Strengthens resolution desk or SI? **Yes** — packaging, not a fork.  
2. Runs on TrustLedger Cloud without browser-only dead ends for paying customers? **Yes** — same SoT.  
3. Plan switch exists? **Yes** — ADR-024.  
4. One-sentence public line? **Yes** — “Same TrustLedger; start on the desk you need.”  
5. What we discontinue: separate product brands, per-SKU Cloud sites as default, promising WhatsApp portals or native offline apps.

---

## 4. What to build next (not this packet)

North star stays **Stakeholder Intelligence deepening**. Focused-SKU work is packaging and honesty, then depth:

| Order | Work | When |
|-------|------|------|
| **Now (this packet)** | ADR + this runbook; public FAQ / Themba / `/product` copy; UTM aliases | **Done in CP-2 docs** |
| **Later (persona pages)** | Optional `/product#grievance` (or similar) landing blocks with plan CTAs — still one app | After SI deepening, if campaigns need them |
| **Later (Desk B depth)** | Vendor register + document checklist as **entitled module** on the same workspace — only with a capability id, Cloud DocTypes, and a price | After SI CRM depth |
| **Later (Desk C depth)** | PWA / offline queue — V003; never a second brand | After Capture Cloud write is solid |
| **Never without a new ADR** | Separate Git product repos; hiding the TrustLedger name; WhatsApp as public community portal |

---

## 5. Operator / agent rules

- Market **personas**, not product brands. Say “grievance desk on Solo”, not “buy Grievance Logger.”  
- Never tell a buyer they must re-enter data to “upgrade to TrustLedger.” They already are on TrustLedger.  
- Do not invent a supplier portal or offline companion in quotes, Themba, FAQ, or SEP client copy.  
- Chibase field facilitation remains a **consulting** add-on (ADR-048), not Desk C.

**Code SoT:** `src/config/entitlements.ts`, `src/types/entitlements.ts`, `src/config/plans.ts`, `docs/SOLO_PLAN.md`, `docs/PLATFORM_STRATEGIC_BRIEF.md` §5.
