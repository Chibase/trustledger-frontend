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
| Seats / desks | **Institutional** ceiling includes Client/Board peers and all junior desks. **VIP** also skips remaining paid seat/desk gates (unlimited seats; every desk). Paid Project still greys desks above its Owner. |

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

## Safety notes

- Keep VIP Customers **named distinctly** so finance never confuses them with billed accounts.
- Do not put VIP emails through HubSpot “buy now” CTAs unless you intend a commercial lead.
- Refreshing an existing Customer with `complimentaryVip: true` clears Paystack tokens and forces `active` — use only for intentional comps, never on a paying account by mistake.
- Agent / CI environments without `FRAPPE_API_KEY` cannot create Cloud rows; use Production Ops with Cloud env vars set.

## Related code

- `src/lib/provisionOwnerCloud.ts` — `complimentaryVip` / `vipPilotOrganizationName`
- `src/app/api/frappe/provision-owner/route.ts`
- `src/components/ops/VipAccessPanel.tsx`
- `src/lib/orgSeats.ts` — `vip` seat/desk invite bypass (paid plans keep gates)
- Charge-due: `src/lib/entitlementCloud.ts` (trial + authorization only)

## VIP illustrative showcase (operator / preview)

A packaged **VIP Institutional** workspace with the NCGR-B illustrative programme from `docs/DEMO_PLAN_SRM_SHOWCASE.md`. This is **not** the retired public `/demo` and **not** Cloud Owner provision.

| Item | Value |
| --- | --- |
| Sign-in | `/login/vip` |
| Plan | Institutional + `tl-vip` (complimentary) |
| Data | Browser own-data (`PRJ-NCGR-B`, `INC-NCGR-*`) — never `INC-1001` sample ids |
| Production / preview / local | Enabled unless `VIP_SHOWCASE_LOGIN=0`. Password is `VIP_SHOWCASE_PASSWORD` or the documented default in `src/lib/vipShowcaseAuth.ts` (`DEFAULT_PREVIEW_PASSWORD`) |
| Allowlist | `thozi@chibaseconsulting.co.za` (not the Platform Operator mailbox) plus `VIP_SHOWCASE_EMAILS` |

Do **not** link `/login/vip` from marketing. If that mailbox is typed on `/login/live`, TrustLedger sends it to the showcase form instead of Cloud. Declare the programme **illustrative** in the room. Paying guests still use Ops **Create VIP access + temp password** + `/login/live`.

The showcase is an **Institutional** plan container: executive roll-up plus every included module dashboard (projects, incidents, capture, stakeholders, engagements, SEP, commitments, intelligence/ESG, reports). Seed bundle v2 adds SEP-NCGR-B and ESG-NCGR-B for workspaces that previously only had desk rows. **Setup / Guide stays unlocked** — seed does not dismiss the wizard; the modal does not auto-open over the preloaded desk, but Dashboard, Guide, and Settings can launch it. Live Cloud VIP guests are **not** seeded.

Related: `src/data/vipShowcase.ts`, `src/lib/vipShowcaseSeed.ts`, `POST /api/auth/vip-showcase`, `docs/DECISIONS.md` ADR-056.
