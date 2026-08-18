# Hosting contingency — pre–paying-client

**Audience:** Operator (solo).  
**Goal:** VIP / prospect demos stay recoverable if Vercel Hobby pauses the frontend **before** the first paying client funds Pro and other upgrades.  
**Not a goal:** Host the Next.js app inside Frappe Desk. That is a rebuild, not a failover.

**Related:** `docs/VERCEL_SMOKE.md`, `docs/LAUNCH_CHECKLIST.md`, `docs/VIP_ACCESS.md`, `docs/PUBLIC_LAUNCH.md`.

---

## 1. What survives vs what dies

| Layer | Host | If Vercel stops |
|-------|------|-----------------|
| Product UI + `/api/*` BFF | Vercel (Hobby today) | **Down** until redeployed elsewhere or Hobby restored |
| CRM, Customers, Users, SI DocTypes | Frappe Cloud `app.trustledger.co.za` | **Intact** |
| Git history / ability to redeploy | GitHub | **Intact** |
| Trial-only browser `localStorage` | User device | At risk if URL changes mid-session — prefer **live VIP** |
| Marketing apex | Webway / DNS → Vercel | May need DNS retarget |

**Operator line for VIP:** “Your workspace lives on TrustLedger Cloud. The app URL can move once; login and data stay.”

**Do not promise:** “We fail over to Frappe for the product UI.”

---

## 2. Watchdogs (constant check — free)

Use a free uptime service (UptimeRobot, Better Stack free, Cronitor free, etc.). Alert email/Telegram to the operator phone.

| Monitor | URL | Expect |
|---------|-----|--------|
| App health | `https://trustledger-frontend-pi.vercel.app/api/health` | HTTP 200; JSON `"ok": true` |
| Cloud ping | `https://app.trustledger.co.za/api/method/frappe.ping` | HTTP 200 |
| Product page | `https://trustledger-frontend-pi.vercel.app/product` | HTTP 200 |
| Apex (optional) | `https://trustledger.co.za` | HTTP 200 (or intentional redirect) |

**Also read `launch` on `/api/health` weekly** (browser or `curl`):

| Field | Healthy for live VIP |
|-------|----------------------|
| `ok` | `true` |
| `checks` | App + Cloud both `ok` |
| `launch.lockdownLifted` | `true` for buyer live login |
| `launch.frappeOwnerIssuance` | `true` for VIP provision |
| `launch.resend` / `resendAuthOk` | `true` — OTP / welcome mail |
| `launch.resendDiag.keyLooksTruncated` | must be **`false`** |
| `deploySha` | note after each Production deploy |

Cursor / Cloud Agents do **not** replace uptime monitors. Re-check health when working VIP or hosting threads.

### Manual smoke (2 minutes)

```bash
curl -sS 'https://trustledger-frontend-pi.vercel.app/api/health' | head -c 800
curl -sS -o /dev/null -w '%{http_code}\n' 'https://app.trustledger.co.za/api/method/frappe.ping'
```

Ops UI: `/ops/readiness` when signed in as Platform Operator.

---

## 3. Fix Resend before live VIP demos

Live `/login/live` OTP and several transactional mails need Resend on **Vercel Production**.

1. Resend dashboard → create/copy a full API key (`re_…`, long — never a 3-character stub).
2. Resend → Domains → verify `trustledger.co.za` (or your mail domain) with the DNS records Resend shows.
3. Vercel → Project → Settings → Environment Variables → Production:
   - `RESEND_API_KEY` = full secret (no ellipsis / truncated paste)
   - `RESEND_FROM_EMAIL` = `TrustLedger <noreply@trustledger.co.za>` (must match a verified domain — **not** `onboarding@resend.dev`)
4. **Redeploy** Production.
5. Confirm `/api/health` → `launch.resend: true`, `resendAuthOk: true`, `inviteEmailReady: true`, `keyLooksTruncated: false`.
6. Smoke: Team / Seats invite to a third-party inbox, and `/login/live` OTP.

Full cutover checklist (DNS + Vercel + health): **`docs/RESEND_PRODUCTION.md`**.

Do not paste keys into chat or git.

---

## 4. Production env checklist (copy to standby host)

Keep a private password-manager note (not in git) with the same names as Vercel Production. Minimum for VIP live desk:

| Variable | Why |
|----------|-----|
| `NEXT_PUBLIC_SITE_URL` | Canonical product URL (update if host changes) |
| `NEXT_PUBLIC_API_BASE_URL` / `FRAPPE_BASE_URL` | `https://app.trustledger.co.za` |
| `NEXT_PUBLIC_DATA_MODE` | `live` |
| `FRAPPE_API_KEY` / `FRAPPE_API_SECRET` | Cloud BFF |
| `FRAPPE_OWNER_ISSUANCE` | VIP / Owner provision |
| `RESEND_API_KEY` (+ From) | OTP / mail |
| `TRIAL_TOKEN_SECRET` | Trial tokens |
| `PAYSTACK_*` | Only if `/pay` must work on that host |
| `CRON_SECRET` | charge-due if cron enabled |
| `PLATFORM_OPERATOR_ONLY` / `PLATFORM_OPERATOR_EMAILS` | Lockdown policy |
| Assessment / resource token secrets | If those funnels are in use |

Full soft-launch set: `docs/PUBLIC_LAUNCH.md`, `docs/VERCEL_SMOKE.md`.

---

## 5. $0 frontend standby (real failover — not Frappe)

**Prep once** (1–2 hours), before you need it:

1. Create a free/hobby **Node** host: Render, Railway, or Fly (any that runs `npm run build` + `npm start`).
2. Connect the GitHub repo; set **all** Production env vars from §4.
3. Deploy; note the standby URL (keep private).
4. Smoke: `/product`, `/api/health` (`ok` + Cloud check), `/login/live` + OTP, one `/app` page as VIP.
5. Store: standby URL, dashboard login, “last smoke date” in the same private note.

**Frappe is not this standby.** Desk/`www` cannot run the App Router BFF without a product rewrite.

### When Vercel pauses the project

1. Confirm Cloud still pings (§2).
2. Confirm standby still healthy; if cold, redeploy standby first.
3. Point DNS / share the standby URL with VIP (see §6).
4. Update Paystack webhook + `NEXT_PUBLIC_SITE_URL` if pay paths are live on that host.
5. Message VIP with the saved template (§7).
6. After first paying client: upgrade Vercel (and other tools) per commercial plan; migrate DNS back if desired.

---

## 6. DNS / URL flip (minutes — if standby is already green)

| Situation | Action |
|-----------|--------|
| VIP uses `*.vercel.app` only | Send new standby URL; no DNS |
| Custom domain on Vercel | In DNS / Vercel: point domain to the new host’s target; wait TTL; smoke HTTPS |
| Apex on Webway → Vercel | Update A/CNAME (or temporary redirect) to the standby host; keep mail MX on Webway |

Prefer **live VIP** (`docs/VIP_ACCESS.md`) so data is on Cloud, not only browser trial.

---

## 7. VIP / prospect message (copy)

> TrustLedger Cloud is fine — your login and workspace data are unchanged.  
> The app address moved for hosting reasons. Use: **{NEW_URL}**  
> Sign in at **/login/live** with the same email. If anything looks off, reply to this message.

Optional: attach Guide reminder (`/app/guide`) after they land.

---

## 8. Trigger: first paying client

When the first paid Customer is live:

1. Upgrade **Vercel** (and other constrained tools) as budget allows.
2. Keep Cloud SoT on `app.trustledger.co.za`.
3. Re-point production domain at the durable host.
4. Keep free uptime monitors; drop standby only after Pro (or equivalent) is stable for 2 weeks.
5. Do **not** drop monitoring just because Pro is paid.

---

## 9. Hobby risk hygiene (until Pro)

- VIP = invite-only; avoid ads on the Hobby deploy.
- Prefer Ops VIP complimentary live orgs over public “buy now” pressure on Hobby.
- Respond promptly to any Vercel Fair Use / Hobby email — clarify unpaid research/pilot if accurate.
- Code + Cloud survive a pause; **conversion demos** need §5 ready.

---

## 10. Operator checklist (pin this)

- [ ] Uptime monitors on health + Cloud ping (§2)
- [ ] Resend Production key full + health green (§3)
- [ ] Env list in password manager (§4)
- [ ] Standby Node deploy smoke-tested (§5)
- [ ] VIP message template saved (§7)
- [ ] Prefer live VIP provision (`docs/VIP_ACCESS.md`)
- [ ] First paying client → platform upgrades (§8)
