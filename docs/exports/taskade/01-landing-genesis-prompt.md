# TrustLedger Feature Showcase — Taskade Genesis prompt

**Job of this app:** Let visitors *experience* TrustLedger capabilities interactively — not another marketing homepage.

WordPress (`trustledger.co.za`) and Vercel `/` already sell the story (hero, pricing, CTAs).  
`/product` already lists features as static text.  
**This Taskade app must not repeat those.** It is a living capability explorer + guided walkthrough.

Copy everything inside the fenced block into Taskade Genesis (Create app). Prefer starting from a **dashboard / portal / interactive tool** template — **not** “SaaS Landing Page.”

```text
Build an interactive PUBLIC Feature Showcase app for TrustLedger — NOT a marketing landing page, NOT a pricing page, NOT a clone of a SaaS homepage.

PURPOSE
Visitors should click, step, and explore what TrustLedger can do: the grievance desk path, Stakeholder Intelligence chain, AI suggest→apply→save, roles, and which plan unlocks what. When they are ready to buy or trial, send them OUT to existing TrustLedger URLs. Do not rebuild WordPress marketing sections (hero value-prop wall, sector grid, FAQ, full pricing wall, benefit strips).

PRODUCT FACTS
- Name: TrustLedger only.
- Promise: “Resolution you can audit.”
- What it is: grievance resolution + Stakeholder Intelligence for projects where social licence decides whether work moves.
- Tone: clear, calm, institutional. No hype, emojis, or slang.
- Version honesty: Version 001 = live resolution desk. Version 002 = Stakeholder Intelligence (registry, engagements, commitments) on Cloud for entitled plans — still deepening. Never claim full ESIP, GIS editing, public community portal, offline native app, or auto-closing AI.
- Sample demo desk is RETIRED. This showcase is a guided simulator with clearly labelled ILLUSTRATIVE examples — never pretend the visitor is inside a real workspace, and never show fictional INC-* as “your cases.”

VISUAL DIRECTION (“Field ledger”)
- Colours: ink #12202a, muted #5b6b76, paper #f3f5f7, surface #ffffff, line #d7dee4, trust #0e7c66, trust-ink #085f4d, amber #c47a10.
- Fonts: Source Serif 4 for “TrustLedger” wordmark only; Source Sans 3 everywhere else. No Inter/Roboto/purple/neon/dark-mode default.
- Layout: app-shell feel (left or top nav of showcase modules), not a long marketing scroll. Prefer interactive panels over brochure sections. Cards only for clickable capability modules.
- Persistent slim footer bar with exits: Start trial · Product overview · Assessment · Subscribe (links below).

EXTERNAL LINKS (always use these — product of record)
- Product overview: https://trustledger-frontend-pi.vercel.app/product
- 14-day trial: https://trustledger-frontend-pi.vercel.app/trial
- Subscribe: https://trustledger-frontend-pi.vercel.app/pay
- Assessment: https://trustledger-frontend-pi.vercel.app/assessment
- Quote: https://trustledger-frontend-pi.vercel.app/quote
- Contact: https://trustledger-frontend-pi.vercel.app/contact
- Live login: https://trustledger-frontend-pi.vercel.app/login/live

APP STRUCTURE — interactive modules (primary UI)

MODULE 0 — Entry (compact, not a marketing hero)
- Brand wordmark: TrustLedger
- Title: Feature Showcase
- One line: Explore how the desk, Stakeholder Intelligence, and AI Assist actually work — then open a real trial with your own data.
- Buttons: Open presentation report dashboard | Begin walkthrough | Capability map | Find my plan fit
- Tiny note: Illustrative · not a live workspace · sample desk retired
- Lead with the presentation dashboard — it is the flagship demo surface (SaaS analytics feel), not a brochure page.

MODULE 1 — Guided walkthrough (6 steps, progress indicator)
Scripted UI mock only. Label every screen “Illustrative.”
Step 1 Intake — Community/field issue captured with place/geo fields.
Step 2 Case desk — Ownership, status, evidence hooks on a grievance/incident record.
Step 3 AI Assist — Show a suggestion panel; visitor MUST click “Apply suggestion” before a “Saved” state appears. Caption: Suggest → Apply → Save. AI never auto-closes cases.
Step 4 Engagement — Meeting/outreach logged against a stakeholder.
Step 5 Commitment — Promise with due date linked to that engagement.
Step 6 Report depth — Toggle Monthly / Executive / Board and show what each pack is for (Monthly on Solo+; Executive Project+; Board Institutional). CTA: Start trial with your own data.

MODULE 2 — Capability explorer (plan-aware map)
Interactive grid/list. Click a capability → detail panel shows: what it does, who needs it, which plan unlocks it, optional add-on code.
Capabilities and unlocks (exact):
- Dashboard / activity — all plans
- Projects (light) — all (Solo: 1 project)
- Incidents / grievance desk — all (V001 heart)
- Issue intake — all
- Geo / place fields — all
- Trust pulse — all
- AI Assist (suggest→apply) — Practitioner+
- Governance / monthly reports — Practitioner+
- Capture hub — Project+ (or addon_capture)
- Stakeholder CRM — Project+ (or addon_crm)
- Engagements — Project+ (or addon_commitments)
- Commitments — Project+ (or addon_commitments)
- ESG / intelligence cards — Project+ (or addon_esg)
- Desk graphs — Project+ (or addon_graphs)
- Supervisor queue — Project+ (or addon_supervisor)
- Executive report pack — Project+
- Board presentation pack — Institutional
Detail panel always includes “Open in product” → /product and “Try with my data” → /trial.
Do NOT put list prices on this module (prices live on WP / pay). Optional: “See plans on trustledger.co.za” text link only.

MODULE 3 — Stakeholder Intelligence chain builder
Interactive: connect Stakeholder → Engagement → Commitment in order.
When the chain is complete, show: “This is the SRM engine. Without it you mainly have a case list.”
When broken/incomplete, show what is missing.
Caption: Available on Project / Institutional (or CRM + commitments add-ons). Still deepening vs full TEDS.
CTA: Project plan / Quote.

MODULE 4 — Role lens
Visitor picks a role: community | contractor | client | admin.
Show which surfaces that role typically touches (intake vs case desk vs CRM vs reports vs supervisor). Grounded in TrustLedger’s four roles — no invented roles.
CTA: Start trial (they will pick role in-product).

MODULE 5 — Plan fitness (short) — NOT the SRM readiness assessment
3–5 questions only: team size (solo / small / project team / multi-project); need AI Assist?; need stakeholder registry + commitments?; need junior seats?; need board pack?
Output: recommended plan name + one sentence why + link to /pay or /quote or /contact. Mention assessment separately: “For a governance maturity score, use the SRM assessment” → /assessment.
Do not duplicate the 16-question assessment.

MODULE 6 — AI Assist micro-lab (can be embedded in walkthrough)
Standalone mini panel: fake suggestion text → disabled Save until Apply → then Saved confirmation. Reinforce human-in-the-loop.

MODULE 7 — Presentation report dashboard (FLAGSHIP — finance/SaaS analytics density)
Build this exactly like Taskade’s Finance / Revenue / Investor metrics demos: dense KPI strip, multi-chart grid, process flows, narrative captions — a board presentation pack you can click through.
Full specification: follow docs/exports/taskade/04-presentation-report-dashboard.md (paste that prompt into this module or as the default home view of the app).
Required story spine:
1) BEFORE engagement — low trust baseline (index ~28 At risk), broken process flow, declining chart, story text under every KPI
2) Engagement begins — trust grows; engagements/commitments charts; healthy SI flow
3) Incident reported — SHOW-2407-014 with date/time; trust dip annotated on the chart
4) Trace to closure — stepper with TrustLedger stages (Reported → Resource deployed → Investigating → AI Apply→Save → Engagement linked → Commitment → Resolved → Verified → Closed); every stage has a one-line story
5) Recovery analytics — SaaS-style KPIs (trust Δ, TAT, on-time %, commitments kept, illustrative delay-days avoided) + graphs with captions
6) Pack depth toggle — Monthly / Executive / Board
Banner on all views: Illustrative presentation · not a live workspace. Case IDs use SHOW-… only (never INC-* as “your cases”).

OPTIONAL: Public guide agent
Floating chat trained only on showcase + approved product facts. Defers pricing detail to WP/pay and never invents features.

EXPLICITLY DO NOT BUILD
- Long marketing homepage (problem/benefits/sectors/FAQ/pricing wall)
- Fake live workspace with guest login or INC-* as “your incidents”
- HubSpot embeds
- Claims of auto-resolve AI, offline native app, full GIS, public community portal
- Parallel CRM that replaces Frappe Lead — CTAs out to TrustLedger forms only

PUBLISH
- App title: TrustLedger Feature Showcase
- Site name: TrustLedger
- Meta: Interactive walkthrough of TrustLedger grievance desk, Stakeholder Intelligence, and AI Assist — not a live workspace.
- Visibility: Secret for review, then Public.
- Indexing: optional after approval (this is a product tool, not a duplicate SEO homepage — consider noindex if WP owns SEO).
```

## After generate — must-fix edits

1. Delete any sections that look like WP home (hero sales copy, sector cards, full price table, FAQ).
2. Confirm every exit CTA hits Production Vercel URLs.
3. Walkthrough must force Apply before Save on the AI step.
4. Publish **Secret** → internal review → Public.
5. Attach public agent from `02-public-agent-knowledge.md` (updated for showcase framing).
