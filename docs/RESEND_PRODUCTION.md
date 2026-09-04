# Production Resend cutover (TrustLedger transactional mail)

> **Goal:** Invitees, OTP, and trial mail reach **any** inbox — not only the Resend account owner.  
> **Product host:** Vercel Production (`trustledger-frontend`).  
> **Mail brand:** `TrustLedger <noreply@trustledgersrm.co.za>` (or another address on a **verified** Resend domain).  
> **Do not** change MX for this — MX for `trustledgersrm.co.za` stays on Webway (`mail.trustledgersrm.co.za`). Resend is **send-only** (SPF + DKIM).

## Current production snapshot (check again after cutover)

As of 2026-08-18 (`GET /api/health` on Production):

| Signal | Value | Meaning |
|--------|--------|---------|
| `launch.resend` | `true` | API key present |
| `launch.resendAuthOk` | `true` | Key authenticates |
| `resendDiag.from` | `Trustledger <onboarding@resend.dev>` | **Test sender** — third-party invitees do not get mail |
| `launch.inviteEmailReady` | missing until PR merge / false until domain From | App will refuse to claim invite “sent” while on test From |

DNS probe of `trustledgersrm.co.za` (operator DNS):

| Record | Observed | Note |
|--------|----------|------|
| MX | `mail.trustledgersrm.co.za` | Keep — inbound stays Webway |
| SPF TXT | `v=spf1 +a +mx +ip4:102.208.231.11 ~all` | Will need Resend `include:` once domain is added |
| DMARC | `p=none` | OK for cutover |
| `resend._domainkey` | **absent** | Domain not yet verified for Resend send |

## Operator steps (do in order)

### 1. Resend — add & verify domain

1. Open [Resend → Domains](https://resend.com/domains).
2. **Add** `trustledgersrm.co.za` (prefer apex; avoid inventing a subdomain unless you already use one for mail brand).
3. Copy the DNS records Resend shows (typically):
   - **DKIM** CNAME (often `resend._domainkey` → Resend target)
   - **SPF** guidance — merge into the existing SPF TXT (do **not** create a second SPF). Prefer adding `include:amazonses.com` or whatever Resend lists **without** removing Webway `+mx` / `+a` / IP.
   - Optional receive MX — **skip** if you only need outbound transactional mail (keep Webway MX).
4. At the DNS host for `trustledgersrm.co.za` (Webway / registrar), publish those records.
5. In Resend, click **Verify**. Wait until status is **Verified** (or **Partially verified** if send is green and receive is not — send is enough).
6. Confirm with dig (examples):
   ```bash
   dig +short CNAME resend._domainkey.trustledgersrm.co.za
   dig +short TXT trustledgersrm.co.za
   ```

### 2. Vercel Production — From address

Vercel → Project → Settings → Environment Variables → **Production**:

| Name | Value | Notes |
|------|--------|--------|
| `RESEND_API_KEY` | existing `re_…` secret | Keep if `resendAuthOk` is already true |
| `RESEND_FROM_EMAIL` | `TrustLedger <noreply@trustledgersrm.co.za>` | Must match the **verified** domain. Display name may be `TrustLedger` (capital L). |
| Remove / replace | any From still set to `onboarding@resend.dev` | Test sender blocks invitees |

Optional alias: `RESEND_FROM` (same value). Do **not** paste secrets into chat, git, or tickets.

After saving env vars: **Redeploy** Production (env changes do not apply to the running deployment).

### 3. Confirm green

```bash
curl -sS https://trustledger-frontend-pi.vercel.app/api/health | jq '.launch | {resend, resendAuthOk, inviteEmailReady, inviteEmailReason, resendDiag}'
```

Expect:

- `resend: true`
- `resendAuthOk: true`
- `inviteEmailReady: true`
- `resendDiag.from` contains `@trustledgersrm.co.za` (not `@resend.dev`)
- `resendDiag.fromIsTestSender: false` (after the invite-email From PR is live)

Smoke:

1. **Settings → Team / Seats** — invite a third-party work inbox → Accept mail arrives.
2. `/login/live` OTP to a non-owner inbox (if access verification is enabled).

## App behaviour after code cutover

- If `RESEND_FROM_EMAIL` is a verified non-test address → use it.
- Else if Resend lists a send-capable domain → auto `TrustLedger <noreply@that-domain>` (prefers `trustledgersrm.co.za`).
- Else stay on test From → invite send returns portable Accept link + clear error; Team / Seats shows a banner.

## Related docs

- `docs/HOSTING_CONTINGENCY.md` §3  
- `docs/ACCESS_MODEL.md` (invite flow)  
- `docs/PUBLIC_LAUNCH.md` / `docs/LAUNCH_WATCHLIST.md`  
- Code: `src/lib/transactionalEmail.ts`, `POST /api/invite/send`, `GET /api/invite/email-status`
