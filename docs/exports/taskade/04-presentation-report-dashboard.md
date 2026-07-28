# Presentation report dashboard — Taskade Genesis prompt

**What this builds:** A board/executive-style **presentation report dashboard** that feels like Taskade’s finance / SaaS analytics demos — KPI tiles, trend graphs, process flows, narrative callouts — telling one continuous trust story from *before engagement* through *incident → closure*.

Use either:
- As a **primary module** inside the Feature Showcase app, or
- As a **standalone Genesis app** (clone Finance / Revenue / Investor Metrics dashboard, then paste this prompt to reshape).

Illustrative data only. Banner on every view: `Illustrative presentation · not a live workspace`.

---

## Paste into Taskade Genesis

```text
Build a polished PRESENTATION REPORT DASHBOARD for TrustLedger that looks and behaves like a real SaaS analytics / finance command center (similar to Taskade’s Finance dashboard, Revenue analytics, Investor metrics demos) — NOT a marketing homepage.

PRODUCT CONTEXT
- Product: TrustLedger — “Resolution you can audit.”
- This screen simulates what an Executive / Board presentation pack feels like after Stakeholder Intelligence + grievance desk work.
- Tone: institutional, calm, Global South infrastructure. Field ledger colours: ink #12202a, muted #5b6b76, paper #f3f5f7, surface #ffffff, line #d7dee4, trust #0e7c66, amber #c47a10, danger #b42318.
- Fonts: Source Serif 4 for titles sparingly; Source Sans 3 for UI. No purple gradients, neon glow, Inter/Roboto as brand.
- Persistent banner: “Illustrative presentation data · not your live workspace · sample desk retired.”
- Exit CTAs (slim bar): Start trial → https://trustledger-frontend-pi.vercel.app/trial · Product → https://trustledger-frontend-pi.vercel.app/product · Subscribe → https://trustledger-frontend-pi.vercel.app/pay

STORY ARC (the whole dashboard must read as ONE narrative from low trust → recovery)
Project label (illustrative): “Northern Corridor Water Scheme — illustrative board pack”
Period: Jan 2026 → Jul 2026
Case studied in depth: SHOW-2407-014 (never use INC-* as if it were the visitor’s case)

CHAPTER 0 — Before engagement (baseline / low trust)
Show the “low level” first — what the site looked like BEFORE TrustLedger desk + engagements:
- Trust index baseline: 28 (At risk) — large KPI with amber/danger tone
- Avg community sentiment: −62
- Open grievances tracked only in spreadsheets: 11 (unstructured)
- Mean days to first response: 19
- Engagements logged: 0 · Commitments tracked: 0
- Narrative callout (must appear as readable story text under the KPIs):
  “Before a durable desk, community concerns sat in email and WhatsApp. There was no auditable ownership, no stakeholder registry, and trust eroded every week a case stalled.”
- Visual: horizontal process flow of BROKEN state: Concern raised → Lost in inbox → Rumour → Protest risk → Project delay
- Mini chart: Trust index flat/declining across Jan–Feb (line chart)

CHAPTER 1 — Engagement begins (trust starts to grow)
- Timeline marker: 3 Mar — First structured engagement logged (ward committee + contractor CLO)
- KPI shift strip: Trust index 28 → 41 (Watch)
- Dual-axis or paired charts:
  - Line: Trust index rising Mar–May
  - Bars: Engagements conducted per month (0,0,1,3,4,5,4)
  - Line: Commitments opened vs kept
- Narrative:
  “Engagements turned anonymous tension into named relationships. Each meeting created a commitment trail the board can inspect.”
- Process flow (healthy start): Stakeholder identified → Engagement recorded → Commitment dated → Follow-up scheduled

CHAPTER 2 — Incident reported (the break in the story)
- Featured case card SHOW-2407-014
  Title: “Access road dust & livestock corridor blocked near Ward 4 borehole staging”
  Reported: 12 May 2026, 07:40 SAST · Role: community
  Severity: High · Place: Ward 4 / Northern Corridor (geo/place fields)
- Trust dip annotation on the trust chart at 12 May (index dips 52 → 44) with story text:
  “A real grievance arrived. Trust dipped — that is expected. What matters is whether the desk can show every hour from report to close.”
- Sparkline: open cases vs closed that week

CHAPTER 3 — Trace to closure (every stage tells a story)
Build an interactive vertical STEPPER / process flow with timestamps, owners, and a one-line story under EACH stage. Use TrustLedger’s real process stages:

1) Reported — 12 May 07:40 — Community intake via issue form
   Story: “Concern enters the ledger with place, role, and time — not a chat screenshot.”
2) Resource deployed — 12 May 09:15 — CLO + HSE assigned
   Story: “Ownership is named within two hours; SLA clock is visible to client and contractor.”
3) Investigating — 13 May 11:00 — Site walk + photo evidence attached
   Story: “Evidence lands on the case, not in a private phone gallery.”
4) AI Assist suggestion (Practitioner+) — 13 May 14:20 — Suggested next action + tone note
   Story: “AI suggests wording and next step. A human clicks Apply before anything is saved. No auto-close.”
   UI: show Apply gate (button) then “Applied by CLO · saved”
5) Engagement linked — 14 May 16:00 — Meeting with Ward 4 committee + contractor
   Story: “The case connects to Stakeholder Intelligence — people, not only tickets.”
6) Commitment opened — 14 May 17:10 — Water carting + corridor reopened by 18 May; due date set
   Story: “A dated promise the board can track; failure would show as broken commitment, not a forgotten favour.”
7) Resolved — 18 May 15:40 — Corridor reopened; dust suppression in place
   Story: “Outcome recorded with evidence. Complainant notified.”
8) Verified — 20 May 10:05 — Community verification note
   Story: “Verification prevents ‘closed on paper’ while the field still burns.”
9) Closed — 21 May 09:00 — Case closed; sentiment after close: +18
   Story: “Closure is an audit event. Trust can recover because the trail is complete.”

Beside the stepper: Gantt-style or horizontal timeline of the same stages; TAT summary tile: Reported → Closed = 8.1 days (client target 10).

CHAPTER 4 — After closure / trust recovered (financial + operational SaaS analytics)
Make this chapter feel like a FINANCE / SaaS metrics dashboard (MRR-style density, but SRM metrics):

Top KPI row (4–6 tiles, large numbers, delta vs prior period):
- Trust index now: 61 (Strong) · Δ +33 vs baseline
- Avg sentiment: +12 · Δ from −62
- Cases closed on-time: 86%
- Avg TAT (hrs): 38 · target 48
- Commitments kept: 92%
- Est. delay-days avoided (illustrative): 14 days · story: “Fewer stoppages when grievances close with proof”

Charts (must include graphs + explanatory captions under each):
1) Trust index trend Jan→Jul with event markers: Baseline · First engagement · Incident SHOW-2407-014 · Closed · Board pack
2) Funnel / sankey-style: Reported → Investigating → Resolved → Verified → Closed (counts)
3) Stacked bar: Cases by status this quarter
4) Heat-ish or grouped bar: SLA pressure — on track / watch / breached
5) Engagement → Commitment conversion rate over months
6) “Cost of unresolved trust” illustrative combo chart: open high-severity days vs estimated schedule risk (ZAR illustrative bands — label as modelled illustration, not audited finance)

Narrative strip under charts:
“Boards do not buy dashboards for decoration. They buy an audit trail: what trust was, when it broke, who owned the fix, and whether the commitment held.”

CHAPTER 5 — Presentation mode / report pack depth
Toggle or tabs:
- Monthly operational (text + graphs) — Solo+
- Executive risk brief (graphs · strategic & high risk) — Project+
- Board / funder pack (presentation assurance) — Institutional
When Board is selected, emphasize Chapters 0→4 as slide-ready sections with “Export presentation” disabled stub + CTA: “Generate real packs in TrustLedger after trial” → /trial

INTERACTIVITY (SaaS demo feel)
- Click any KPI → side drawer with definition + story + related chart highlight
- Click SHOW-2407-014 anywhere → jump to Chapter 3 stepper
- Hover event markers on trust chart → tooltip with story sentence
- Filter period: Baseline / During engagement / Incident window / Recovery
- Optional embedded analyst agent chip: “Explain this trust dip” (answers from showcase knowledge only)

DATA MODEL (seed illustrative tables so charts are live inside Taskade)
Create projects/tables:
1) MonthlyTrustMetrics — month, trustIndex, avgSentiment, engagements, commitmentsKeptPct, casesOpened, casesClosed, avgTatHours
2) CaseSHOW2407014Stages — stageKey, stageLabel, at, owner, storyLine, done
3) PortfolioCasesIllustrative — id, title, status, severity, reportedAt, closedAt, tatHours, sentimentAfter (6–10 rows, IDs SHOW-… only)
4) ProcessFlowNodes — chapter, nodeOrder, label, state (broken|healthy), storyLine

DO NOT
- Build a WordPress-style marketing homepage
- Show INC-* as the visitor’s live cases
- Claim AI auto-closes cases
- Claim Stats SA certified feeds or audited financials — label modelled illustrations clearly
- Put full plan price tables here (link out to trustledger.co.za /pay)

PUBLISH
- Title: TrustLedger — Presentation Report Dashboard (Illustrative)
- Meta: Board-style trust story: baseline → engagement → grievance trace to closure → recovery analytics.
- Visibility: Secret then Public; prefer noindex if WP owns SEO.
```

---

## After generate — QA

1. Does the page **start** on baseline / before engagement (low trust), not on a happy end-state?
2. Is SHOW-2407-014 traced stage-by-stage to Closed with a story line under each step?
3. Are there real charts (line, bar, funnel) with captions — not only text?
4. Does the recovery chapter feel like a SaaS/finance analytics wall (dense KPIs + graphs)?
5. Banner says illustrative / not live workspace?
6. AI step still requires Apply before save if shown?

## Optional builder follow-up if layout is too “brochure”

```text
Increase dashboard density like a finance SaaS analytics demo: top KPI strip, multi-chart grid, left chapter nav (Baseline → Engagement → Incident → Trace → Recovery → Pack depth). Every chart needs a one-sentence story caption. Keep the SHOW-2407-014 closure stepper as the narrative spine.
```
