# Purge runbook (SEC-2)

**Audience:** Platform operators.  
**SLA target:** 30 days after a verified deletion request (VIP terms).  
**Not:** a self-serve customer button in this packet.

Live Customer records live on TrustLedger Cloud (`app.trustledgersrm.co.za`). Browser-only trial data lives on that device until the organisation is provisioned.

## 1. Verify the request

1. Confirm the requester is the Plan Owner (or a person with written authority) for that Customer.
2. Log the ticket (date, Customer name, Owner email, scope: all / named modules).
3. Do not purge on an unverified `mailto:` from a junior seat.

## 2. Cloud Customer (live)

On Desk, as System Manager / allowlisted operator:

1. Export a hold copy if a legal hold applies (stop here).
2. Disable live login: set Customer status so entitlement blocks `/login/live`.
3. Delete or disable Cloud Users on that Customer (Owner + invitees). User Permission rows go with the User.
4. Delete TL Project / Incident / Evidence / SI / trust / SEP rows for that Customer (or archive per hold).
5. Delete CRM Lead / Contact rows that are solely that Customer’s workspace people (keep acquisition Leads that never became a Customer unless the request covers them).
6. Confirm Paystack subscription cancelled / no further charges.
7. Note completion date on the ticket.

Empty Cloud stays empty after purge — do not refill with demo `INC-*`.

## 3. Browser-only trial (no Cloud Customer)

Tell the requester to sign out and clear site data for the TrustLedger app origin. Operators cannot remotely wipe another person’s browser store.

## 4. Subprocessors

Transactional mail (Resend) and payment (Paystack) follow each vendor’s deletion tools if copies exist there. Marketing mailbox on Webway is not the workspace SoT.

Public list: `/legal/subprocessors`.

## 5. What this runbook is not

- Not a sealed ledger wipe (`docs/KEY_MANAGEMENT.md` still blocked).
- Not a dedicated-site teardown (SEC-4 Isolation).
- Not automatic GDPR/POPIA software — it is an operator procedure.
