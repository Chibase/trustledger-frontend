# Solo plan — entry package for lone consultants

**ADR-035.** Commercial SKU for independent SRM / CLO / grievance practitioners who cannot carry Practitioner pricing yet.

## Who it is for

- Lone consultants and small practice independents  
- People who lean on larger firms for project opportunities  
- Need a **personal resolution desk**, not a multi-seat site team  

## Commercial box

| Item | Solo |
|------|------|
| Price (launch, ZAR/mo excl. VAT) | **R1,999** (`PAYSTACK_AMOUNT_SOLO_CENTS`, default `199900`) |
| Seats | **1** (Plan Owner only — no junior invites) |
| Projects | **1** soft limit |
| Storage | **10 MB** soft |
| Trial | 14 days (`/trial?plan=solo`, `/pay?plan=solo`) |
| Checkout | Self-serve Paystack |

## Features in the box

| In | Out (upgrade to Practitioner+) |
|----|--------------------------------|
| Dashboard / activity | AI assist (suggest→apply) |
| 1 project | Governance report depth |
| Incidents / grievance desk | Capture hub |
| Issue intake | Stakeholder CRM / engagements / commitments |
| Geo / place fields | ESG intelligence cards |
| Trust pulse (light) | Desk graphs / supervisor queue |
| Monthly operational report | Executive / board packs |

## Ladder

```text
Solo (R1,999) → Practitioner (R5,399) → Project (R14,999) → Institutional (sales)
```

Sell Solo as **survive and professionalise**; Practitioner as **earn with AI + light governance**; Project when they win a multi-party site team.

## Packaging rules

1. Do **not** promise Stakeholder Intelligence registry on Solo.  
2. Do **not** allow junior seats — that is the commercial line vs Project.  
3. Upsell with honest capability gates (ADR-024), not silent unlocks.  
4. Public CTAs: “Solo — for independent practitioners” next to Practitioner.

## Code SoT

- Prices: `src/lib/paystackPlans.ts`  
- Capabilities: `src/config/entitlements.ts`  
- Seats / desk: `src/lib/orgSeats.ts`, `src/types/deskTier.ts`  
- Quotas: `src/config/mediaQuotas.ts`  
- Cloud draft limits: `src/lib/frappeSoT.ts`  
