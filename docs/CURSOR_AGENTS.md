# Cursor agents for TrustLedger

Operational playbook — matches product surfaces to Cursor capabilities.

| Capability | When to use | TrustLedger match |
|------------|-------------|-------------------|
| **Cloud Agents** | Feature packets (T1–T5, payments, Settings) | Default delivery path → branch, build, PR |
| **Bugbot** | Every PR that touches `/app`, `/pay`, `/api/*`, entitlements | Enable on GitHub; uses `.cursor/BUGBOT.md` |
| **Security Agents** (Team+) | Before live Paystack cutover and after ADR-013 changes | Paystack, trial tokens, cookies, BFF |
| **Best-of-N** | Rare UI/IA forks only (Settings, marketing hero) | Not for routine packet work |
| **Automations** | Optional nightly lint/build or entitlement drift | Configure in Cursor dashboard → Automations |
| **Explore subagent** | “Where is X gated?” across the repo | Fast context without burning main chat |

## Public soft-launch posture

1. Keep **Cloud Agents** for packets.
2. Require **Bugbot** review on PRs into `master`.
3. Run **Security Agents** (or a Security Review cloud run) whenever Paystack keys or lockdown flags change.
4. Reserve **Best-of-N** for design forks — not every fix.

See also: `docs/PUBLIC_LAUNCH.md`, `docs/PLATFORM_OPERATOR.md`, `docs/PAYSTACK_SETUP.md`.
