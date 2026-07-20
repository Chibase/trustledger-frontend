<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TrustLedger agent rules

1. Read `docs/BUILD_PLAN.md` before coding. Implement **only the active packet**.
2. Obey `docs/DECISIONS.md` and `docs/DESIGN_SYSTEM.md` — do not re-ask locked choices.
3. Current phase = **Phase 2 Frappe Cloud–ready** (Demo still default). Backend host = `app.trustledger.co.za` only (Interserv retired). No Cloudflare/WordPress work in this repo unless asked.
4. Minimise human interruption: only ask when blocked (secrets, prod destroy, plan conflict).
5. After each packet: update `docs/CHANGELOG_INTERNAL.md`, run `npm run lint` and `npm run build`.
6. AI features stay suggest → apply → save. Never put LLM API keys in client code.
7. Product name in UI: **TrustLedger** only.
8. Live data mode must fall back to mock if Frappe is unreachable.