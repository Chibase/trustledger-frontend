# TrustLedger SaaS landing — Taskade Genesis prompt

Copy everything inside the fenced block below into Taskade Genesis (Create app / prompt box).  
Optional: clone gallery **SaaS Landing Page** first, then paste this as a rebuild/customise instruction.

```text
Build a public SaaS marketing landing page for TrustLedger — a South African stakeholder relationship and grievance resolution platform for infrastructure and community-trust projects.

PRODUCT
- Official name: TrustLedger only (never AccordBridge, Interserv, or dual brands).
- Promise / tagline: “Resolution you can audit.”
- One-line: TrustLedger helps operators run grievance resolution and Stakeholder Intelligence for projects where social licence decides whether work moves.
- Tone: clear, calm, institutional — Global South infrastructure & community trust. No hype, no startup slang, no emojis.
- Operator company (footer only): Chibase Consulting — not a second product brand.

VISUAL DIRECTION (“Field ledger”)
- Cool stone / paper surfaces, deep ink text, single teal trust accent, amber only for urgency.
- Colours: ink #12202a, muted #5b6b76, paper #f3f5f7, surface #ffffff, line #d7dee4, trust #0e7c66, trust-ink #085f4d, amber #c47a10.
- Typography: Source Serif 4 for the brand wordmark and one hero title; Source Sans 3 for all body/UI. No Inter, Roboto, purple gradients, neon glow, cream/serif brochure look, or dark-mode default.
- First viewport = ONE composition: brand “TrustLedger” as hero-level signal, one headline, one short supporting sentence, one CTA group, one full-bleed atmospheric/product visual plane (edge-to-edge — not an inset card or floating collage).
- No cards in the hero. No floating badges, pills, stat strips, or overlays on the hero image.
- After the hero: one job per section — one headline + short support line. Prefer open sections over card grids. Cards only where interaction requires a container (e.g. plan chooser).
- Mobile-first; 2–3 intentional motions max (e.g. soft hero fade, CTA hover, section reveal). No continuous parallax or glow pulses.

HERO COPY (use exactly)
- Brand: TrustLedger
- Headline: Resolution you can audit.
- Support: Grievance desk and Stakeholder Intelligence for projects where community trust decides whether work moves.
- Primary CTA button: Start 14-day trial → https://trustledger-frontend-pi.vercel.app/trial
- Secondary CTA button: See the product → https://trustledger-frontend-pi.vercel.app/product

SECTIONS (in order — keep lean)

1) Problem (one job)
   Headline: When grievances stall, projects stall.
   Body: Operators need a durable desk for cases, evidence, and stakeholder commitments — not spreadsheets and chat threads that cannot be audited.

2) What you get (Version honesty)
   Headline: Version 001 desk. Version 002 intelligence where entitled.
   Body: Version 001 is the live resolution desk (projects, incidents/grievance, human-applied AI assist, reports). Version 002 Stakeholder Intelligence — registry, engagements, commitments — runs on Cloud for entitled plans and is still deepening. Do not claim full ESIP, GIS editing, public community portal, offline native app, or auto-closing AI.

3) How AI works
   Headline: Suggest. Apply. Save.
   Body: AI only suggests. A human applies before anything is saved. Never “AI closes cases automatically.”

4) How to start
   Three clear paths with buttons:
   - Learn features → https://trustledger-frontend-pi.vercel.app/product
   - 14-day own-data trial → https://trustledger-frontend-pi.vercel.app/trial
   - SRM readiness assessment → https://trustledger-frontend-pi.vercel.app/assessment
   Note: Sample demo desk is retired. No fictional INC-* preview workspace.

5) Plans (honest packaging — prices excl. VAT, monthly ZAR)
   Present as a simple comparison, not a flashy pricing wall:
   - Solo — R1,999/mo — Lone consultant entry desk: dashboard, projects (light), grievance/incidents, issue intake. No AI Assist. No Stakeholder CRM in the box.
   - Practitioner — R5,399/mo — Independent desk with AI Assist (suggest→apply) + light governance reports. Still no full SI registry included.
   - Project — R14,999/mo — Default real SRM SKU: desk + Stakeholder Intelligence (CRM, engagements, commitments), capture hub, ESG cards, supervisor queue, junior seats.
   - Institutional — Contact sales — Multi-project / public sector; board pack and commercial options.
   CTAs: Subscribe → https://trustledger-frontend-pi.vercel.app/pay · Quote → https://trustledger-frontend-pi.vercel.app/quote · Contact → https://trustledger-frontend-pi.vercel.app/contact
   Mention sellable add-ons only briefly: capture, CRM, commitments, ESG, graphs, supervisor — for practitioners who need one V002 slice without jumping to Project.

6) Trust & data
   Headline: Your workspace is yours.
   Body: Paying and trial workspaces never show fictional sample incidents. Live Cloud host is app.trustledger.co.za. After provision, sign in at https://trustledger-frontend-pi.vercel.app/login/live.

7) Footer
   Product: TrustLedger · Promise: Resolution you can audit.
   Links: Product, Trial, Assessment, Quote, Contact, Privacy (link to marketing site https://trustledger.co.za if privacy page lives there).
   Small line: Operated by Chibase Consulting.

FORMS / LEADS
- Prefer CTA buttons that leave to TrustLedger URLs above (system of record).
- If you include one waitlist/contact form on this page: fields = work email, name, organisation, short note (min 10 chars). Label source as “taskade_landing”. Show a privacy consent line. Do not promise instant discounts. Do not use HubSpot embeds.

PUBLISH
- App title: TrustLedger — Resolution you can audit
- Site name: TrustLedger
- Meta description (≤160 chars): TrustLedger is the grievance resolution and Stakeholder Intelligence desk for projects where social licence decides whether work moves.
- Visibility: Secret for first review; Public when copy is approved.
- Allow search indexing only after Public + copy sign-off.
- Embed a public TrustLedger guide agent as a floating chat widget once the agent is published (bottom-right).

Do not invent features. Do not show fake dashboards with INC-* sample tickets as “your workspace.” Do not say demo desk is available without signup.
```

## After generate — quick edits

1. Replace any purple/generic fonts Taskade may default to with the Field ledger tokens above.
2. Confirm every CTA hits the Production URLs (not localhost).
3. Publish **Secret** → share link for internal review → then **Public**.
4. Attach the public agent from `02-public-agent-knowledge.md`.
