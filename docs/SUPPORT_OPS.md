# TrustLedger support operations

**System of record (Phase A):** HubSpot via structured in-app tickets  
**Later (Phase C):** Frappe Helpdesk for authenticated paying clients  
**Entry:** Vercel `/app` Support drawer (not WordPress)

## Phases

| Phase | Scope | Human load |
|-------|--------|------------|
| **A (this ship)** | Status page, in-app Support, self-serve session repair, HubSpot tickets with diagnostics | You only handle escalations |
| **B** | Playbook runner (allowlisted auto-actions) + AI diagnosis | Most common tech issues self-serve |
| **C** | Frappe Helpdesk + in-app AI draft replies (approve to send) | Humans for edge cases only |

## Issue catalog (recommended + yours)

| Code | Issue | Phase A | Phase B auto |
|------|--------|---------|--------------|
| `LOGIN_FAILED` | Unable to login / wrong password | Self-serve reset tips + ticket | Password-reset link send |
| `SESSION_EXPIRED` | Keeps getting logged out | **Repair session** button | Invalidate sid + re-auth redirect |
| `SYSTEM_DOWN` | App or API unreachable | Status page + ticket | Detect outage, post status, suppress noise |
| `DATA_MISSING` | Can’t see projects/incidents | Guided checks + ticket | Scope/role diagnostic |
| `REPORT_FAIL` | Can’t generate reports | Retry tips + ticket | Re-queue report job |
| `AI_ASSIST_FAIL` | AI assist errors / stuck | Ticket with mode flags | Fallback provider / disable assist banner |
| `UPLOAD_FAIL` | Evidence / file upload fails | Ticket | Retry + size/type validation message |
| `PERMISSION_DENIED` | Sees 403 / wrong role screens | Explain role + ticket | **No auto role change** — escalate |
| `PERF_SLOW` | Pages hang / timeouts | Ticket + request timing | Cache warm / degrade non-critical |
| `BILLING_ACCESS` | Paid but still demo / locked | Ticket (priority) | Sync entitlement from Peach (later) |
| `BROWSER_CACHE` | Odd UI after deploy | Safe-mode checklist | — |
| `NOTIFY_FAIL` | Not receiving email alerts | Ticket | Resend verification / check bounce |

## Allowlisted auto-actions (Phase B+)

**Allowed without human**
- Clear/repair demo or live session (logout + redirect to login)
- Retry failed read APIs / re-queue report generation
- Show status from health checks
- Create/update support ticket with diagnostics
- Send password-reset email (Frappe) when requested by the same user
- Switch UI to “degraded mode” messaging when Interserv is down

**Never auto (always escalate)**
- Change roles / permissions / tenant scope
- Access or export another organisation’s data
- Delete records, refunds, plan changes
- Disable security controls or CORS
- Any action when diagnostic confidence is low

## Ticket payload (Phase A)

HubSpot form message includes:
`[Source: support_ticket]` + category code + mode + role + path + user agent + short description + optional health snapshot.
