# Institutional sector packs (quote-only)

**Locked:** ADR-042.  
**Commercial plan code:** always `institutional` (Paystack / Customer).  
**Checkout:** **Quote & EFT** — not self-serve Paystack list price.

Sector packs are **sales lenses** under Institutional — same product entitlements (full SI + board pack + Trust / Isolation scoping), framed for a buyer’s world.

---

## 1. Catalogue

| Pack id | Marketing name | Primary buyer |
|---------|----------------|---------------|
| `municipal` | **Municipal / IDP Trust Desk** | Local government, IDP / public participation / ward support |
| `housing` | **Housing programmes** | Human settlements, housing agencies, implementing agents |
| `infrastructure` | **Infrastructure programmes** | Roads, water, bulk infra, corridor sponsors |
| `renewable` | **Renewable energy & just transition** | IPPs, developers, host-community programmes |

Config: `src/config/institutionalPacks.ts`.  
Quote deep-link: `/quote?plan=institutional&pack=<id>`.

---

## 2. Municipal / IDP Trust Desk (flagship)

Inspired by the public “IDP information gap” narrative (incomplete data, unclear owners, weak feedback). TrustLedger sells the **desk that closes that gap** — not an IDP editor.

| Gap theme | What we package |
|-----------|-----------------|
| Incomplete information | ZA place intel + geo-tagged cases / evidence |
| Unclear responsibilities | Engagements → commitments with named owners |
| Capacity pressure | Ranked seats + AI suggest→apply→save |
| Repeated questions | Stakeholder + case history |
| Little feedback / unclear timelines | Commitment status the municipality can show back |
| Participation without influence | Meeting / capture → tracked decision trail |
| Council assurance | Board presentation pack + Trust Pack / Isolation options |

**Do not claim:** full IDP drafting, GIS replacement, municipal ERP / budget.

**One-liner:** *Municipalities don’t lack meetings — they lack a desk where participation becomes information, ownership, and a reply.*

---

## 3. Shared Institutional floor (every pack)

Same as Institutional matrix (`docs/PLATFORM_STRATEGIC_BRIEF.md` §5):

- Full Stakeholder Intelligence (registry, engagements, commitments)
- Board + executive + monthly report packs
- Custom seats / multi-project
- Trust Pack + optional private cloud workspace (ADR-038)
- Quote-scoped commercials

Packs change **story, example themes, and quote notes** — not a second Paystack SKU.

---

## 4. Marketing rules

- Name **TrustLedger** only; say **quote** / **Institutional**, not host brands.
- On home `#pricing`: Institutional card → Request quote; sector strip lists Municipal, Housing, Infrastructure, Renewable → `/quote?plan=institutional&pack=…`.
- WordPress paste mirrors the same links (absolute product URL).
- Self-serve remains Solo / Practitioner / Project only.

---

## 5. Quote ops

1. Lead lands as **Quote Request** with plan `institutional` and pack in the message / job title.
2. Sales scopes seats, Trust Pack, Isolation, and pack focus.
3. Provision Customer with `custom_plan_code = institutional` (pack noted on Customer comment / CRM).

---

## 6. Related

- ADR-042 · ADR-038 · ADR-040 (ZA baseline)  
- Strategic brief §5  
- Privacy extras on home pricing
