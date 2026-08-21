# Marketing engine source pack

Operator-owned source material for the autonomous marketing engine (packet **MKT-1**, ADR-052).

| Folder | Brand | Cron |
|--------|--------|------|
| `chibase-papers/` | Chibase Consulting thought-leadership | Monday `GET /api/cron/run-chibase-campaign` |
| `trustledger-campaigns/` | TrustLedger SRM product / trial | Wednesday `GET /api/cron/run-trustledger-outreach` |

Add a markdown file with YAML front matter (see existing files). Cron synthesizes a draft via Gemini, stages it in ClickUp **Marketing Review**, and **does not publish** until a human approves.

Public copy rules: `docs/MARKETING_ENGINE.md` and ADR-039. Never put API keys in these files.
