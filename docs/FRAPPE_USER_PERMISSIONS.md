# Cloud User Permissions (SEC-1)

**Audience:** Ops / Desk.  
**Public copy:** say **organisation**, never the Cloud product name.  
**Related:** `docs/SECURITY_TENANCY.md`, `docs/FRAPPE_SOT.md`, ADR-038.

Plan Owners get a Cloud **User Permission** bound to their **Customer**. That is the L2 credibility layer for live paid desks: User A cannot open Customer B from a Desk session, and the app BFF will not switch onto another client’s workspace from a spoofed `customer=` field.

## What this packet ships

| Control | Where | Honest limit |
|---------|--------|--------------|
| Stamp User Permission on Owner provision | `ensureCustomerUserPermission` from `provisionOwnerOnCloud` | Owner only. Invitees stamped on accept (SEC-5). |
| BFF session bind | `bindSessionCustomer` on SI, migrate-org, upload-file, `/api/app/projects` | Organisation comes from the **live sid user**, not a client-supplied Customer name and not a forgeable email cookie. Buyer `customer=` is **ignored** (first-login migrate still works when browser org name ≠ Cloud Customer name). Platform Operators may break-glass with an explicit Customer. |
| List post-filter | `rowsForCustomer` on TL Project / SI lists | Drops rows not stamped to that Customer. Empty `customer` is **not** treated as shared. |
| A≠B smoke | `GET\|POST /api/ops/tenancy-smoke` + `/ops/readiness` | Checks Owner bindings + peer-org binds. Does **not** impersonate a sid to read another tenant’s DocTypes. |
| Health flag | `launch.tenancyL2` | Reachability of User Permission API + BFF bind shipped. |

The site API key used by the BFF can still see all Customers. **Never** add `ignore_permissions` on customer-facing resource calls. Tenant safety for BFF lists/writes is **session bind + post-filter**, not the site key.

## Stamp shape (Desk)

```json
{
  "user": "owner@example.co.za",
  "allow": "Customer",
  "for_value": "<Customer name>",
  "apply_to_all_doctypes": 1
}
```

Idempotent: existing matching User Permission is left in place.

If the stamp fails after Customer + User create, **provision still succeeds** (Paystack must not roll back). Ops sees `userPermission.ok: false` and should run **Stamp missing permissions** on `/ops/readiness`.

## Operator runbook

1. Open `/ops/readiness` (allowlisted).
2. **Check bindings** — `GET /api/ops/tenancy-smoke`.
3. If unbound Owners exist, **Stamp missing permissions** — `POST { applyMissing: true }`.
4. Need a second live Customer before the smoke can say A≠B peers exist.
5. If `foreignBinds` lists `email → other Customer`, remove that User Permission in Desk (User Permission list, filter by User). Do not leave an Owner linked to a peer organisation.

## What sales may say

**Yes:** Live desks resolve organisation from sign-in. The app will not switch onto another client’s workspace. Plan Owners and accepted teammates on a live organisation are bound to that organisation on the server.

**No:** SOC 2. Dedicated isolation (L5) without a quote. Trial/browser-only invites (no Cloud Customer) are not Cloud Users.

## Invitee Cloud seats (SEC-5)

Accepted teammates on a **live** organisation get their own Cloud User on that Customer — not the Plan Owner login.

| Control | Where | Honest limit |
|---------|--------|--------------|
| Provision on accept | `provisionInviteeOnCloud` from `POST /api/invite/accept-seat` | Portable signed invite only. One-shot — existing Cloud User is not a password reset. Owner email cannot accept as invitee. Desk rank uses the live Customer plan. |
| Same Customer User Permission | `ensureCustomerUserPermission` | `allow=Customer`, `for_value=<Customer>`, `apply_to_all_doctypes=1` |
| Tighter role | `User.custom_tl_app_role` + locked desk | `community\|contractor\|client`. Never `custom_tl_plan_owner=1`. |
| Live bind | `resolveSessionCustomer` then `bindSessionCustomer` | Owner email first; else invitee `custom_tl_customer`. Claimed `customer=` still ignored. |
| Login | `/login/live` | Invitee without a Customer stamp: 403 (operators exempt). Desk cookie locked. |

Trial orgs without a Cloud Customer still accept in the browser (`cloud: false`). Plan Owner password issue for existing Cloud Users was already shipped.
