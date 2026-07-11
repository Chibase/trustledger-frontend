# TrustLedger — Design System (locked)

Agents must follow this file. Do not substitute Inter, Roboto, purple gradients, or generic AI dashboard chrome.

## Brand

- **Name:** TrustLedger
- **Voice:** Clear, calm, institutional — Global South infrastructure & community trust
- **Promise:** Resolution you can audit

## Direction

**“Field ledger”** — practical clarity for ward-to-board workflows. Cool stone surfaces, deep ink type, a single teal trust accent, amber for urgency. No neon glow, no purple SaaS, no cream/serif brochure cliché.

## Colour tokens

```css
:root {
  --tl-ink: #12202a;          /* primary text */
  --tl-ink-muted: #5b6b76;    /* secondary text */
  --tl-paper: #f3f5f7;        /* page background */
  --tl-surface: #ffffff;      /* cards/panels */
  --tl-line: #d7dee4;         /* borders */
  --tl-trust: #0e7c66;        /* primary actions / brand */
  --tl-trust-ink: #085f4d;    /* hover/active */
  --tl-amber: #c47a10;        /* SLA / attention */
  --tl-danger: #b42318;       /* critical */
  --tl-demo: #1f4b7a;         /* demo banner */
}
```

## Typography

- **UI / body:** `Source Sans 3` (Google font)
- **Brand / display:** `Source Serif 4` (logo wordmark, hero titles only)
- Do not use Geist/Inter/Arial as the design voice (system fallbacks OK in font stack)

Scale (approx):

| Token | Size | Use |
|-------|------|-----|
| display | 2rem–2.5rem | Demo/marketing titles |
| title | 1.25rem–1.5rem | Page titles |
| body | 0.95rem–1rem | Forms, tables |
| meta | 0.75rem–0.85rem | Labels, banners |

## Layout

- Max content width: `72rem` (app), `40rem` (forms)
- App shell: left nav ≥768px; bottom or top collapse on mobile
- Page padding: `1rem` mobile, `1.5rem–2rem` desktop
- Prefer open sections over heavy card stacks; cards only for interactive units (KPI, issue row actions, AI suggestion panel)

## Components

| Component | Rules |
|-----------|--------|
| Primary button | `--tl-trust` fill, white text, 8px radius |
| Secondary button | white/surface, `--tl-line` border |
| Demo banner | full width, `--tl-demo` bg, white text, single line + “Book demo” link |
| AI panel | dashed border, surface tint, always “Suggestion only” helper |
| Tables | line headers, no dense newspaper rules |
| KPI | one number + label + optional delta; max 4 per row on desktop |

## Motion

Use sparingly (2–3 intentional motions max on demo entry):

1. Demo banner enter (short fade/slide)
2. AI panel appear when status → ready
3. Soft-gate modal fade

No continuous parallax or glow pulses.

## Responsive

- Mobile first
- Nav collapses; tables scroll horizontally or stack key fields
- AI assist buttons full-width on small screens

## Iconography

Simple stroke icons (inline SVG). No emoji in product UI.

## Accessibility

- Contrast AA for text on paper/surface
- Focus rings visible on trust/ink
- Do not rely on colour alone for P1–P4 (include text labels)
