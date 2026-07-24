<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TrustLedger agent rules

1. Read `docs/BUILD_PLAN.md` before coding. Implement **only the active packet**.
2. Obey `docs/DECISIONS.md` and `docs/DESIGN_SYSTEM.md` — do not re-ask locked choices.
3. Current phase = **GO LIVE Done** + Cloud Stakeholder Intelligence deepening. Backend host = `app.trustledger.co.za` only (Interserv retired). No Cloudflare/WordPress work in this repo unless asked.
4. Minimise human interruption: only ask when blocked (secrets, prod destroy, plan conflict).
5. After each packet: update `docs/CHANGELOG_INTERNAL.md`, run `npm run lint` and `npm run build`.
6. AI features stay suggest → apply → save. Never put LLM API keys in client code.
7. Product name in UI: **TrustLedger** only.
8. Live data mode may fall back to mock if Frappe is unreachable — **never** for customer/trial workspaces (no demo INC-* bleed).
9. **Client-facing PRs:** Bugbot must review (`.cursor/BUGBOT.md`). Use Security Agents before Paystack/live auth changes. Best-of-N only for rare UI forks — see `docs/CURSOR_AGENTS.md`.
10. **Public launch / plan packaging / agent scripts:** treat `docs/PLATFORM_STRATEGIC_BRIEF.md` as the living brief. Do not over-claim V002/V003. Sample `/demo` is retired → `/product`.
11. **Report AI:** Activity reports and compliance briefs must use the local evidence composer (`reportComposer`). Never call Frappe/Grok for those — it returns fill-in-the-blank month-end templates.
