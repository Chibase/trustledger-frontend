# Post-payment access & seats

**Locked with ADR-012.**  
After payment (or confirmed commitment), TrustLedger issues logins from **plan entitlements**. The **purchaser is Plan Owner**; they alone hold org **admin** and may invite others at **lower** roles.

```text
Peach payment success / Commitment
        ↓
Create Frappe Customer + Contact
        ↓
Issue Plan Owner login (role: admin, org-scoped)
  · dashboard · reporting · settings · invite seats
        ↓
Owner invites people + chooses lower role
        ↓
Invitee accepts → User created at that role
```

## Roles (existing four — org-scoped)

| Role | Typical who | Access (product) | Can invite? |
|------|-------------|------------------|-------------|
| **admin** (Plan Owner only at purchase) | Lead consultant / buyer | Full org desk: dashboard, projects, incidents, reports, settings, seat invites | **Yes** — lower roles only |
| **client** | Client / funder / sponsor on the account | Portfolio KPIs, reports, read-heavy governance views | No |
| **contractor** | Delivery / site teams | Assigned projects, incidents, field report | No |
| **community** | Community liaison / ward users | Ward-scoped status, report issue, limited case view | No |

There is **no** second “super-admin” above Owner for a customer org. Chibase staff use Interserv desk separately.

## Plan → seats (entitlements)

Aligned to marketing tiers (prices unchanged on site until you say otherwise):

| Plan | Owner | Additional seats | Notes |
|------|-------|------------------|-------|
| **Practitioner** (lower tier) | 1 × **admin** (purchaser) | **0** by default (optional later: +1–2 paid add-ons) | Single-user: owner does login, reporting, dashboard |
| **Project** | 1 × **admin** | Unlimited **per project environment** at client/contractor/community | Owner assigns people to projects |
| **Institutional** | 1+ owners (custom) | Custom roles/seats/regions | Sales-defined |

**Rule:** Only the Plan Owner is created automatically at payment. Everyone else is **invited by the Owner** with an explicit lower role.

## Owner confirmation of user level

1. Owner opens **Settings → Team / Seats** (to build).  
2. Enters name + work email + **suggested role** (`client` \| `contractor` \| `community`).  
3. Owner **confirms** role (cannot pick `admin` for invitees on Practitioner/Project without sales exception).  
4. System sends invite email with accept link.  
5. Invitee sets password (or receives temp password once) → `/login/live`.  
6. Seat counts against plan entitlement; over-limit → block invite + upgrade CTA.

“Suggest” = Owner proposes person + role; **Confirm** = Owner submits invite (no auto-admin for colleagues).

## What the Owner gets at issuance (email pack)

- Login URL: `/login/live`  
- Username (email)  
- Temporary password **or** set-password link  
- Plan name + seat summary  
- Link to invite teammates (if plan allows)

## Allow / deny (security)

**Allowed automated actions after payment**
- Create Customer + Owner User with `admin`  
- Send Owner credentials  
- Create invited Users only after Owner-confirmed invite  
- Enforce seat caps from plan  

**Never automated**
- Promoting invitee to `admin` without Owner + (for Institutional) sales rules  
- Cross-tenant access  
- Creating users from HubSpot without payment/commitment trigger  

## HubSpot → Frappe (ties to CRM_HANDOFF)

| Stage | Action |
|-------|--------|
| Lead / demo / assessment | HubSpot only |
| Payment or Commitment | Frappe Customer + **Owner admin** user |
| Ongoing team | Owner invites in-app → Frappe Users |

## Build sequence (after Peach sandbox)

1. Entitlement DocType / fields on Customer (`plan`, `seat_limit`, `owner_user`)  
2. Payment webhook → provision Owner  
3. Settings → Team invites UI  
4. Invite accept + password set  
5. Seat enforcement middleware  

Launch week can still be **manual**: you create Owner in Frappe after Peach/commitment using this model; automate next.
