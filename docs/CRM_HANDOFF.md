# CRM handoff: HubSpot → Frappe

**Locked operating model (solo / launch):**  
HubSpot Free = **lead magnet** (acquisition only).  
Frappe (**Cloud** `app.trustledger.co.za`) = **relationship system of record** after commitment.

```text
Website / Assessment / Demo
        ↓
   HubSpot contact + deal stage
   (Demo → Waitlist → Qualified → Commitment)
        ↓  ← human marks "Commitment"
   Frappe Customer + Contact + (optional) User
        ↓
   Live /login/live · projects · support (Helpdesk later)
```

## What stays in HubSpot

| Keep | Why |
|------|-----|
| Assessment leads `[Source: assessment]` | Free form + marketing list |
| Demo entry / soft-gate leads | Same |
| Support tickets Phase A `[Source: support_ticket]` | Until Helpdesk |
| Early pipeline & email follow-ups | Free-tier strength |
| UTM / campaign attribution | Already captured |

**Do not** build full customer success, renewals, or project history in HubSpot.

## What moves to Frappe at commitment

**Trigger (any one):** signed pilot, paid Paystack invoice/checkout, written “yes” to paid plan, or you set HubSpot deal stage = **Commitment / Closed Won**.

**Create on Frappe Cloud (manual at first, automate later):**

1. **Customer** (organisation)  
2. **Contact** (buyer / champion) linked to Customer  
3. **User** + roles when they need product access  
4. Optional **CRM Lead/Deal** closed against that Customer  
5. Link **Project(s)** in `srm-core` (on Cloud) to Customer  

After handoff, day-to-day relationship work (calls logged, renewals, support) happens in **Frappe**, not HubSpot.

## HubSpot Free limitations — how we work around them

| Limit | Workaround |
|-------|------------|
| Contact/list caps | Export Closed Won → Frappe; archive or delete cold HubSpot leads periodically |
| Weak ticketing | Phase A form tickets OK; Phase C → Frappe Helpdesk |
| Limited seats/automation | Short sequences only; Calendly for meetings |
| No deep product context | Never try — that’s why Frappe takes over |

## Solo checklist when someone commits

1. HubSpot: stage → **Commitment** (note plan + ZAR amount).  
2. Frappe Cloud: Customer + Contact (+ User if access needed).  
3. Email credentials / `/login/live` link.  
4. HubSpot contact note: `Handed to Frappe Customer: <name>`.  
5. Stop nurturing that contact in HubSpot sequences.

## Later automation (not launch-critical)

- Button/script: “Provision from HubSpot deal” → Frappe Customer/Contact/**Owner admin User** (see `docs/ACCESS_MODEL.md`)
- Paystack webhook → entitlement + Owner login email (see `docs/PAYMENTS_SETUP.md`)
- Owner-confirmed invites for lower roles (`client` / `contractor` / `community`)
- Sync only **Closed Won**; never bi-directional full CRM sync  

## Decision

| Stage | System |
|-------|--------|
| Strangers → interest | **HubSpot** |
| Commitment → ongoing client | **Frappe** |
