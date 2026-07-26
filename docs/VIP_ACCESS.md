# VIP complimentary access (pilot guests)

Invite a small number of people to the **full Institutional** package for a fixed period (default **8 weeks**) with **no Paystack**, without changing how paying or trial customers work.

## What “VIP” means in Cloud

| Field | Value |
| --- | --- |
| Customer name | `VIP Pilot — {Organization}` (or `VIP Pilot — {Name} pilot`) |
| Plan | `institutional` (full) by default |
| `custom_entitlement_status` | `active` |
| Paystack | No `authorization_code` / `bill_at` (amount 0) |
| User | Owner role, same as normal live owners |
| Login | `/login/live` only — **not** `/pay`, **not** public `/trial` |

Charge-due automation only bills **`trial`** rows that still have an authorization. VIP `active` + empty Paystack ⇒ **no auto-charge**.

Public trial and checkout paths are unchanged. Do **not** send VIP guests those links.

## Operator steps (Ops UI)

1. Sign in as Platform Operator and open **Ops → Accounts**.
2. Use **VIP complimentary access**:
   - Guest name, work email, organisation (optional).
   - Package (default Institutional).
   - Access until (calendar; default ≈ +8 weeks).
   - Prefer **Dry-run VIP** first, then **Create VIP access + temp password**.
3. Copy the credentials block (login URL + temporary password) and send it privately (email/WhatsApp). Ask the guest to change the password after first login.
4. Confirm the Customer appears in Frappe Desk as `VIP Pilot — …`.

Requires Production env: `FRAPPE_OWNER_ISSUANCE=1`, `FRAPPE_API_KEY` / `SECRET` / `BASE_URL`.

API equivalent (operator session cookie required):

```http
POST /api/frappe/provision-owner
Content-Type: application/json

{
  "ownerName": "Jane Example",
  "ownerEmail": "jane@example.com",
  "organization": "Example NGO",
  "planId": "institutional",
  "complimentaryVip": true,
  "complimentaryUntil": "2026-09-15",
  "dryRun": false,
  "ensureFields": true
}
```

Then set a temp password:

```http
POST /api/frappe/set-user-password
Content-Type: application/json

{ "email": "jane@example.com" }
```

Response includes `temporaryPassword`. Share `/login/live` + email + password with the guest.

## Ending or converting VIP

- **Calendar end:** In Frappe Desk → Customer → set `custom_entitlement_status` to `cancelled` (or disable User login). Optionally add a Comment.
- **Convert to paying:** Guest uses branded `/pay` (or Ops Owner provision with Paystack) so authorization is captured and status follows normal trial→active rules. Clear the “VIP Pilot” naming if you prefer a commercial Customer name.

## VIP guest invites (view + comment only) — ADR-037

VIP Plan Owners may invite as many guests as they need. **Invitees are locked to view + comment:**

| Allowed | Blocked |
|---------|---------|
| Browse desk modules they can see | Create / edit / delete desk data |
| Post on **Comments** (`/app/comments`) | Print / PDF |
| Provide role, rank, entity, email, optional face photo | Download / share desk exports |

Comment profile fields are shaped for a future **website client-comment wall**. Owners can **Export publishable JSON** from Comments (rows with website consent).

Cookies: `tl-vip-org=1` (VIP Pilot Customer), `tl-access-mode=vip_viewer` (invitee). Live VIP Owner login stamps VIP cookies when Customer name matches `VIP Pilot — …` and bootstraps a browser org so Team / Seats invites work on that device.

## Safety notes

- Keep VIP Customers **named distinctly** so finance never confuses them with billed accounts.
- Do not put VIP emails through HubSpot “buy now” CTAs unless you intend a commercial lead.
- Refreshing an existing Customer with `complimentaryVip: true` clears Paystack tokens and forces `active` — use only for intentional comps, never on a paying account by mistake.
- Agent / CI environments without `FRAPPE_API_KEY` cannot create Cloud rows; use Production Ops with Cloud env vars set.
- Browser-local seats until Cloud User seat issuance — share accept links from the same Owner device.

## Related code

- `src/lib/provisionOwnerCloud.ts` — `complimentaryVip` / `vipPilotOrganizationName`
- `src/app/api/frappe/provision-owner/route.ts`
- `src/components/ops/VipAccessPanel.tsx`
- `src/lib/vipAccess.ts`, `src/lib/vipComments.ts`, `src/components/vip/*`
- Charge-due: `src/lib/entitlementCloud.ts` (trial + authorization only)
