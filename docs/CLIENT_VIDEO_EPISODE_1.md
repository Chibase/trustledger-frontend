# TrustLedger — Episode 1 video brief (Introduction & App Overview)

**Audience:** Prospective clients / Plan Owners  
**Tone:** Calm, institutional — Global South infrastructure & community trust  
**Promise:** Resolution you can audit  
**Live URL:** https://trustledger-frontend-pi.vercel.app

---

## 1. Problem & value proposition

**Problem:** Infrastructure and development projects lose social licence when grievances are slow, opaque, or undocumented — especially in low-connectivity, multilingual field settings. Boards and funders need ESG evidence; wards need visible resolution.

**Value proposition (from product copy):**  
*Turn community risk into measurable trust outcomes* — operationalise grievance resolution and governance-grade ESG reporting so teams can move from ward intake to board-ready proof.

**Three outcome pillars (home benefit strip):**
1. Faster grievance resolution (ownership + SLA visibility)
2. Trust score / community signal visibility
3. Audit-ready ESG evidence for funders and regulators

---

## 2. Primary entry & onboarding flow

### Marketing entry (`/`)
1. Hero: brand promise + dashboard visual  
2. Primary CTA → **Start 14-day trial** (`/trial`)  
3. Secondary → Book pilot walkthrough (`/contact`)  
4. Scroll: benefits → how it works → sectors → pricing → final CTA

### Two product paths (do not conflate on camera)

| Path | URL | What it is |
|------|-----|------------|
| **Trial (own data)** | `/trial` | Name + work email → own workspace (`tl-mode=trial`) → `/app/dashboard` |
| **Sample preview** | `/demo` | Instant sample/fictional data as guest → `/app/dashboard` |

**Recommended Episode 1 journey (record this):**

```text
Home (/)
  → Start 14-day trial (/trial)  [or cut to /demo for zero-friction sample]
  → App shell + role dashboard
  → Incidents list / one case desk
  → AI assist (suggest → apply)
  → Brief mention: Upgrade → /pay (no deep checkout in Ep.1)
```

**Post-pay onboarding (mention only, don’t demo live):**  
Payment creates a CRM Lead; Plan Owner login is still provisioned by Chibase in soft launch.

---

## 3. Top features / UI to highlight (high-level)

1. **Role-aware workspace (`/app/dashboard`)**  
   Community / contractor / client / admin each see different KPIs and actions (ward status, site incidents, portfolio risk, intake/SLA). One product, four stakeholder lenses.

2. **Case desk + AI assist (suggest → human apply)**  
   Incident triage / report brief: AI proposes; user confirms. Never auto-sends community messages. Unique governance-safe UX.

3. **Hero / product visual + open trial CTA**  
   Marketing composition: brand-first hero with real dashboard imagery, then one click into a working product — preview or trial without a sales maze.

**Honourable mention (optional 5s):** Trial banner + “Upgrade” → Paystack path (trust that buying is one click away).

---

## 4. UX highlights from the code (smooth / unique)

- **Low friction start:** `/demo` auto-sets session cookies and routes into `/app` (no signup wall for sample walkthrough).
- **Own-data trial:** `/trial` clears prior trial local data, seeds a workspace, sets plan cookie — upgrade path preserved via `?plan=`.
- **AI governance pattern:** suggest → apply → save (locked product rule).
- **Field-ledger design:** teal trust accent, Source Sans / Source Serif, SLA amber — reads institutional, not generic SaaS.
- **Mobile-ready shell:** left nav collapses; ward-to-board flows stay usable on small screens.
- **Clear mode banners:** Demo vs Trial so viewers know sample vs own workspace.

---

## 5. Suggested screen-recording focal points (~2–3 min)

| Time | Screen | Say / show |
|------|--------|------------|
| 0:00–0:25 | `/` hero | Problem + “measurable trust outcomes”; pan dashboard image |
| 0:25–0:40 | Benefit strip | Resolution, trust visibility, audit-ready ESG |
| 0:40–1:00 | `/trial` or `/demo` | “Enter the product in under a minute” |
| 1:00–1:40 | `/app/dashboard` | Role home + KPI cards; click Incidents |
| 1:40–2:20 | Incident desk + AI assist | Open a case; generate suggestion; stress human apply |
| 2:20–2:45 | Reports / brief (optional) | Board-ready output path |
| 2:45–3:00 | CTA | Trial + Paystack upgrade / book walkthrough |

**Avoid in Episode 1:** deep Paystack checkout, Ops `/ops`, Frappe live login, WordPress paste, EFT confirm.

---

## 6. One-line closing (VO)

*TrustLedger turns community risk into measurable trust outcomes — grievance resolution and ESG evidence you can audit, from ward to board.*
