# Themba (The Trust) — public visitor guide

Customer-facing guide agent for TrustLedger marketing surfaces. Locked by **ADR-042**. Packet **THEMBA-A**.

## Identity

| Item | Value |
|------|--------|
| Name | **Themba** |
| Subtitle | The Trust |
| Voice | Trust — calm, institutional, Global South social licence |
| Product name | TrustLedger only |
| Operator | Chibase Consulting — footer/legal only; never co-brand in replies |

## Phase A (shipped in THEMBA-A)

- **Surfaces:** floating widget on `/`, `/product`, `/faq`.
- **BFF:** `POST /api/themba/chat` — rate-limited; honeypot on escalate; no LLM keys in the browser.
- **Knowledge:** `PUBLIC_FAQS` in `src/lib/aeo/siteFacts.ts` + approved lines / objections in `src/lib/themba/knowledge.ts` (from PLATFORM_STRATEGIC_BRIEF §6, public-voice safe).
- **Behaviour:** answer simple product Q&A **without gating on signup**; explain features and how they help; offer readiness prompts aligned to the free diagnostic; soft CTAs (`/product`, `/assessment`, `/trial`, `/pay`, `/contact`, `/faq`); escalate unknowns and human-intent to contact + optional CRM Lead.
- **Not in scope:** desk writes, AI Assist suggest→apply, authenticated in-app help, inventing Version 002/003 claims.

## Visitor education (do not soft-gate)

Feature / capability / “how does it help” questions must get a grounded answer first. Trial and subscribe are optional next steps after education — never the only reply. Retrieval scores question + keywords far above answer-body tokens so CTA copy (e.g. “learn on product”) cannot steal the match.

## Escalation

Escalate when the visitor asks for pricing negotiation, contracts/legal, account recovery, billing disputes, personal case data, or explicitly wants a human — or when retrieval confidence is low.

Lead path reuses `submitProductLead` with `sourceTag: themba_escalate`. Work email required (same as contact form).

## Optional LLM (Phase B / ops)

If `THEMBA_XAI_API_KEY` (or `XAI_API_KEY`) is set on the server, the BFF may polish a reply grounded on retrieved snippets. Without a key, Phase A uses retrieval-only answers. Never put keys in client bundles.

## Brand bans in replies

Do not say: Frappe, Vercel, HubSpot, Interserv, AccordBridge. Prefer **TrustLedger Cloud** / **cloud**.

## Ops checks

1. Open `/`, `/product`, `/faq` — Themba launcher visible; panel opens.
2. Ask “What are the features of this product?” — lists capabilities + soft links (not “sign up first”).
3. Ask “How do I know if TrustLedger is suitable?” — readiness prompts + `/assessment`.
4. Ask “I need to speak to someone” — escalate UI; work email creates Lead when CRM configured.
5. Confirm no stack vendor names in replies.
