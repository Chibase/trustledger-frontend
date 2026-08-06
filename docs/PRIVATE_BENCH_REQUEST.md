# Private bench / dedicated site — client request playbook

**Yes — clients may request a private Frappe bench / dedicated site at their cost.**  
That is **L5 Isolation** (ADR-038 / `docs/SECURITY_TENANCY.md`). It is not the default Solo–Project shared site.

Default production backend today: shared site **`https://app.trustledger.co.za`** on Frappe Cloud.  
Private bench = a **separate Frappe Cloud site** (typically on a **private bench group**) whose database and apps are not co-mingled with other TrustLedger customers’ Desk data.

---

## 1. What the client is buying

| Included in Isolation | Still often shared (say so explicitly) |
|------------------------|----------------------------------------|
| Dedicated Frappe **site** + DB | TrustLedger **Vercel** frontend (unless they also buy a branded deploy) |
| Their Customer(s), Users, TL/SI DocTypes on that site | **Paystack** (merchant account may stay Chibase’s or theirs — contract) |
| Independent backups / update cadence (per Cloud plan) | **Resend** (or their own email domain later) |
| Stronger procurement story (“our bench”) | Marketing WordPress |

**Honest line:** “Your *application data* runs on a dedicated Frappe site you fund. The product UI may still be our Vercel app pointed at your site URL.”

---

## 2. Who may request it

| Plan | Policy |
|------|--------|
| Solo / Practitioner | **No** — shared tenancy only. Upsell to Project + Isolation add-on or Institutional. |
| Project | **Yes** as paid **Isolation add-on** (after quote). |
| Institutional | **Yes** — default scoping conversation. |
| VIP beta | **No** by default — shared VIP Pilot Customer on main site; convert to paid Isolation if they insist and pay. |

Minimum commercial bar (recommended): written **Institutional or Isolation order**, DPA, and prepaid host period (e.g. 3–12 months).

---

## 3. What happens when the request is made

```text
Client asks (Contact / Quote / sales call)
        ↓
Sales logs CRM Lead + tags "Isolation / private bench"
        ↓
Ops + Finance scope: site size, region, apps, who pays Cloud invoice
        ↓
Chibase gets Frappe Cloud quote (private bench group + site)
        ↓
Commercial offer = Cloud cost + Chibase margin + setup fee
        ↓
Client signs (order + DPA) and pays deposit / first period
        ↓
Ops provisions private site → installs apps → CORS + API keys
        ↓
Point product: FRAPPE_BASE_URL (dedicated) on a Vercel env or client deploy
        ↓
Migrate or fresh Owner provision → smoke → hand over
        ↓
Monthly: client (or Chibase) pays Cloud; Chibase retains success retainer if sold
```

### Step A — Intake (same day)

1. Capture request on **Contact / Quote** with organisation, contact, why they need isolation (procurement / POPIA / funder).  
2. Create / update **Frappe CRM Lead** (or Customer if already paying).  
3. Tag: `Isolation`, `private-bench`.  
4. Reply with: timeline (typically **5–15 business days** after payment + Cloud provisioning), what is dedicated vs shared, and that price follows host quote.

### Step B — Internal scope (Ops)

Fill before quoting:

| Field | Options / notes |
|-------|-----------------|
| Frappe Cloud plan | Per [cloud.frappe.io](https://cloud.frappe.io) private bench / site tier |
| Region | If offered by host; else document “host default” |
| Apps | ERPNext/CRM as needed + TrustLedger custom DocTypes / `srm_core` when ready |
| Domains | e.g. `client.trustledger.co.za` or client-owned domain → Cloud Domains |
| Who is Cloud account owner | **Prefer Chibase-owned site, client-funded** (we retain ops control) unless enterprise insists on client-owned Cloud account |
| Frontend | Shared Vercel + `FRAPPE_BASE_URL` override **or** dedicated Vercel project |
| Migration | Fresh empty site vs copy from shared `app.trustledger.co.za` Customer |

### Step C — Quote (Finance + Sales)

```text
Monthly = Frappe Cloud private site (ZAR) + Chibase Isolation retainer
Once-off = Setup (site create, apps, CORS, keys, Owner provision, smoke, DNS)
```

- Do **not** publish a fixed Isolation price on WordPress until a current Cloud quote exists.  
- Offer band verbally: see SECURITY_TENANCY (“from … / sales-scoped”).  
- Invoice: “TrustLedger Isolation — dedicated Frappe site” + pass-through or bundled host fee.

### Step D — Contract gate

Do not create the bench until:

- [ ] Signed order / Institutional SOW  
- [ ] DPA (or Trust Pack) accepted  
- [ ] Deposit or first period paid  
- [ ] Named Plan Owner email confirmed  

### Step E — Provision (Ops)

1. Frappe Cloud: create **private bench group** (if required) → create **site**.  
2. Install required apps (CRM, etc.) — see `docs/FRAPPE_CLOUD_SETUP.md` private-bench notes.  
3. Site Config: CORS allow TrustLedger Vercel origin(s).  
4. Create API key pair for that site only; store in the **dedicated** Vercel env (never reuse shared-site keys).  
5. Ensure custom fields / product DocTypes / SI DocTypes on **this** site (`/ops` ensure tools pointed at the new `FRAPPE_BASE_URL`).  
6. Provision Plan Owner Customer + User on the private site.  
7. DNS: map agreed hostname; TLS via Cloud.  
8. Smoke: login OTP path, create project/incident or SI row, entitlement active.  
9. Hand over: URL, Owner login, support channel, backup/update expectations.

### Step F — Run (steady state)

| Topic | Practice |
|-------|----------|
| Updates | Schedule with client; private benches are not auto-tied to shared-site deploy cadence |
| Backups | Per Cloud plan; document RPO/RTO in SOW |
| Support | Named channel; Ops still allowlisted — break-glass logged |
| Keys | Rotate on staff change; one site ↔ one credential set |
| Offboarding | Cancel Cloud site only after purge request + final invoice; follow SEC purge runbook when written |

---

## 4. How the product “points” at a private bench

TrustLedger frontend does not magically discover benches. Ops chooses one:

| Pattern | When | Mechanism |
|---------|------|-----------|
| **A. Env override** | Single big client | Separate Vercel project or preview env: `FRAPPE_BASE_URL=https://their-site...` + that site’s API keys |
| **B. Shared app + future site router** | Many isolated clients | Not built yet — do **not** promise multi-bench routing in one deploy until engineered |
| **C. Client-owned front end** | Rare | They host UI; we supply Cloud site only |

Until **B** exists: each private bench usually means **a dedicated frontend deployment** or a carefully scoped env. Budget that into setup fee.

---

## 5. What to tell the client (script)

> “Yes. On Institutional (or Project with an Isolation add-on), you can fund a **private Frappe bench / dedicated site**. Your application database then sits on that site, not on our shared multi-customer site. You pay the host cost plus our setup and isolation retainer. The TrustLedger app is configured to talk only to your site. Shared services like card payments or email may still use our platforms unless we contract otherwise. We’ll quote from the current Frappe Cloud private-site price, then provision after signature and payment.”

If they ask for Solo/Practitioner:  
> “Private benches aren’t on that plan — we’d move you to Project Isolation or Institutional.”

---

## 6. Refusal / deferral cases

| Situation | Response |
|-----------|----------|
| VIP / unpaid beta | Soft no — upgrade to paid Isolation |
| Cannot fund Cloud minimum | Stay on shared Customer tenancy; offer Trust Pack (DPA) instead |
| Wants “air gap / on-prem only” | Out of Soft-launch scope — roadmap / custom professional services |
| Wants one Vercel app auto-routing many benches | Not available yet — dedicated deploy per bench |

---

## 7. Ops checklist (printable)

- [ ] Lead tagged Isolation  
- [ ] Scope sheet complete  
- [ ] Cloud quote attached  
- [ ] Commercial offer sent  
- [ ] Signed + paid  
- [ ] Private site live  
- [ ] Apps + DocTypes + CORS + keys  
- [ ] Frontend env pointed  
- [ ] Owner provisioned + smoke  
- [ ] Handover email + SOW dates for review  

---

## Related

- `docs/SECURITY_TENANCY.md` — L5 packaging  
- `docs/FRAPPE_CLOUD_SETUP.md` — shared vs private bench install  
- `docs/ACCESS_MODEL.md` — Institutional dedicated options  
- ADR-038  
