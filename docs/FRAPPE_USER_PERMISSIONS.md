# Cloud User Permissions (SEC-1)

**Audience:** Ops / Desk.  
**Public copy:** say **organisation**, never the Cloud product name.  
**Related:** `docs/SECURITY_TENANCY.md`, `docs/FRAPPE_SOT.md`, ADR-038.

Plan Owners get a Cloud **User Permission** bound to their **Customer**. That is the L2 credibility layer for live paid desks: User A cannot open Customer B from a Desk session, and the app BFF will not switch onto another client’s workspace from a spoofed `customer=` field.

## What this packet ships

| Control | Where | Honest limit |
|---------|--------|--------------|
| Stamp User Permission on Owner provision | `ensureCustomerUserPermission` from `provisionOwnerOnCloud` | Owner only. Junior Cloud seats = **SEC-5**. |
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

**Yes:** Live desks resolve organisation from sign-in. The app will not switch onto another client’s workspace. Plan Owners are bound to their organisation on the server.

**No:** Every junior seat is Cloud-permissioned (SEC-5). SOC 2. Dedicated isolation (L5) without a quote.

## Next (SEC-5)

Invitees stay browser-local for now. When they become Cloud Users, stamp the same Customer User Permission (and a tighter role) — do not reuse the Plan Owner bind as a shared login.
