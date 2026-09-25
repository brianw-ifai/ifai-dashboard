# IntoFocus v3

The v3 dashboard is a Fender brand-intelligence canvas at `/v3`. It shows how Fender Musical Instruments Corporation (FMIC) is discovered and recommended in AI search, and how catalog, retail, and spec problems on the open web change that outcome.

The view covers 124 monitored ASINs across five divisions: solid-body electrics, acoustic and hybrid, bass, digital amps and audio, and Squier. It is built as an executive briefing for portfolio health, not a live operations console.

## How it works

The canvas is a zoomable map. A center hub, **Brand Portfolio**, connects to six spokes. Each node shows a status (critical, at risk, or on track), a headline metric, and a short tooltip. Clicking a node opens a side panel with tabs of briefing copy, tables, and recommended actions.

A ticker across the top surfaces three live alerts and jumps to the matching spoke:

- Buy Box at 68%, with suppressed listings and third-party splits
- AI scan score of 41 and a controllable readiness score of 52%
- Modeled lift of +$680K on a 14-ASIN pilot, or +$28.4M at enterprise scale

You can filter the map by division, search for a line, node, or ASIN and land on the related spoke, and run a seven-step guided tour of the full briefing.

## What each area covers

**Brand Portfolio (hub).** Executive briefing, division scorecard, and commercial sizing. It pairs an external AI scan index (how often models recommend Fender today) with an IntoFocus readiness score (the factors Fender controls: schema, brand registry, MAP, and community grounding).

**Brand AEO.** Visibility across 100 prompts in ChatGPT, Perplexity, Claude, Gemini, and Copilot. Panels cover the dual index, prompt simulations, where citations actually come from (Reddit and retail outweigh fender.com), and spec hallucinations models repeat.

**Portfolio Retail.** Amazon Buy Box retention, splinter ASINs that split reviews, brand-registry parentage, and MAP drift across Amazon, Reverb, and Walmart.

**Spec Readiness.** Schema.org completeness on catalog pages, missing machine-readable attributes (woods, radius, pickups), and Amazon A+ comparison tables that models can parse as facts.

**Competitive Radar.** Share of voice against category rivals, including PRS, Taylor, Yamaha, Ibanez, Boss, and Positive Grid Spark, with battlecards for the lines where Fender is losing the recommendation.

**Brand Fixes.** Eighteen interventions ranked by effort and revenue. The ROI tab switches between the 14-ASIN pilot and a full FMIC catalog model.

**Roadmap.** A 30-60-90 day plan to raise readiness and Buy Box, plus a resourcing toggle between an IntoFocus-managed sprint and an internal co-pilot model.

## Command center

The panel opens on **What do I need to worry about?** — a ranked queue of the highest-value moves, each with a plain-language reason, the commercial consequence, an owner toggle (IntoFocus AI / client team / done), and a link into the spoke tab holding the evidence. The header's **Priorities** button returns to it from anywhere.

Panel content is written for an operator, not an engineer: jargon is marked with a dotted underline and explains itself on hover (see `components/v3/glossary.ts`), and every **Explanation** block can be hidden once read.

Per-viewer state — owners, starred prompts, hidden explanations — currently lives in `localStorage`. `lib/canvas-sdk/local-store.ts` is the single read/write seam to replace when this moves to per-user Supabase rows.

## Authoring panel content

Spoke panels are authored as HTML strings in `components/v3/spoke-data.ts` and injected into the drilldown. They are wired by delegation in `lib/canvas-sdk/panel-interactions.ts` rather than by inline `onclick` handlers, so a missing handler is impossible rather than a silent runtime error. Supported attributes:

| Attribute | Effect |
| --- | --- |
| `data-ifai-open="<spokeId>"` + optional `data-ifai-tab="<tab substring>"` | Turns the element into a drill-down into another spoke and tab |
| `data-ifai-filter="<value>"` inside `data-ifai-filter-group="<listId>"` | Segmented filter over list children matching `data-category`; `all` and `starred` are built in |
| `data-ifai-star="<stable id>"` | Adds a star toggle and remembers the row in this viewer's watchlist |

`.ceo-callout` blocks get their Hide/Show toggle automatically — no markup needed.

## Tests

End-to-end coverage lives in `e2e/`, run with Playwright against the dev server:

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # interactive runner
npm run test:e2e:report   # last HTML report
```

The suite drives the Chrome installed on the machine, so a fresh clone needs no browser download. Without Chrome (CI, Linux):

```bash
npx playwright install --with-deps chromium
E2E_BROWSER=chromium npm run test:e2e
```

`E2E_BASE_URL` points the suite at an already-running server and skips spawning one. Specs are grouped by the behaviour they protect: `guided-tour`, `command-center`, `panel-layout` (including header fit and light-theme contrast), and `panel-interactions` (filters, watchlist, collapsible explanations, drill-downs, glossary). Every test also asserts the page logged no errors.
