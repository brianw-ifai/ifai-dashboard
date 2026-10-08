# Dashboard v2 reading model and architecture

Chunk 4 design. The coding subagent builds to this. Table names follow the approved Schema-Architect model (`schemas/ifai-dashboard-v2/schema.json`); where this note names a table, the schema file wins.

## Route and boundaries

- New route: `app/(canvas)/dashboard-v2/page.tsx`. Nothing under `components/v3`, `lib/fender-canvas`, `lib/canvasData.ts`, `lib/canvas-sdk`, `data/`, or `e2e/*.spec.ts` for the current dashboard is edited. New code lives in `lib/dashboard-v2/**`, `components/dashboard-v2/**`, `app/(canvas)/dashboard-v2/**`, `app/api/dashboard-v2/**`, `scripts/dashboard-v2/**`, and `e2e/dashboard-v2/**`.
- The canvas SDK (`lib/canvas-sdk`) is reused as is through `IntelligenceCanvas`. If the SDK lacks something v2 needs, copy the file into `lib/dashboard-v2/sdk/` and change the copy.
- The sandbox credentials (`SANDBOX_SUPABASE_URL`, `SANDBOX_PUBLISHABLE_KEY`, `SANDBOX_ANON_KEY`) have no `NEXT_PUBLIC_` prefix. They are read only in server code: the page (a Server Component) and route handlers under `app/api/dashboard-v2/`. The browser never holds a sandbox key. Route handlers set `Accept-Profile: sandbox` (supabase-js `db: { schema: "sandbox" }`).
- One data-access layer: `lib/dashboard-v2/data/sandbox-client.ts` (server-only, `import "server-only"`) and `lib/dashboard-v2/data/reads.ts` (one function per read, each returns rows plus the reading-run rows it joined). Selectors never call Supabase directly.

## The reading contract

Every figure on screen is a `Reading<T>`:

```ts
type Coverage = { read: number; population: number | null; asOf: string | null; runId: string | null; source: string };
type Reading<T> =
  | { status: "complete"; value: T; coverage: Coverage; registryId: string }
  | { status: "partial"; value: T; coverage: Coverage; registryId: string }   // value is the reading so far; UI says "not final"
  | { status: "unavailable"; reason: string; coverage: Coverage | null; registryId: string };
type Rate = { numerator: number; denominator: number; pct: number };
```

Rules, each enforced by a unit test in `scripts/dashboard-v2/*.test.ts`:

1. A missing input yields `unavailable` with a reason. Never zero, never a typed figure. `formatReading()` renders `unavailable` as the word "unavailable" plus the reason in the explainer.
2. A stored zero with a run id is `complete` with value 0.
3. A run whose `rows_read` is below `population_count` yields `partial`, and the UI prints `read of population` and the words "not final".
4. A rate is a `Rate` object. The UI shows numerator and denominator next to the percentage.
5. Confirmed findings outrank unfinished reads in the headline: the headline selector ranks `complete` and `partial` findings with a non-zero value above any `unavailable` row. An unavailable higher-priority row is shown beside the headline as coverage text, never as the headline.
6. Channel gaps stay with the channel: a Walmart price difference is reported under Walmart, never summed into an Amazon figure.
7. A price gap is labeled "price gap", never "revenue" or "uplift".
8. Action counts come from `action_item` rows. No component holds a count literal.
9. Every selector output carries `registryId`; the explainer looks the registry row up by that id. A selector that returns a figure with no registry row fails its test.
10. No node status is typed. `statusFor(reading)` maps a reading to danger, warning, success, or neutral from the registry row's threshold rule; unavailable is always neutral.
11. Failed reads render the unavailable state. There is no static fallback spec and no last-good cache that renders without a visible "stale" label and timestamp.

## Selectors (one per headline)

`lib/dashboard-v2/selectors/*.ts`, pure functions over `SandboxBundle` (the rows the page loaded). Bubbles, tickers, the command center, the tour, and the panels all call the same selector; a test renders each surface and asserts it contains the selector's formatted value and nothing else for that registry id.

| Selector | Registry id | Headline rule |
| --- | --- | --- |
| `selectAiAnswerShare` | ai_answer_share | Rate over resolved answers; partial when the latest run is partial. |
| `selectWeakestCategory` | ai_answer_share_by_category | Excludes categories under 10 resolved and the hallucinations category. |
| `selectWrongSpecFlags` | ai_wrong_spec_flags | Count with reason groups. |
| `selectEngineSplit` | ai_answer_share_by_engine | Partial when engine coverage is below the answer count. |
| `selectRetailHeadline` | retail_control_partner_led, featured_offer_suppressed, featured_offer_present | Picks the seller type's primary question; when its reading is unavailable, the headline is the highest-ranked confirmed finding (suppression) and the primary question is shown as coverage. |
| `selectAmazonOfferShare` | amazon_offer_share | Drill-down only; denominator is active offers. |
| `selectSellerMix` | seller_mix, seller_read_coverage | Counts by class with the unread count. |
| `selectMapBelow` | map_below | Unavailable until a MAP row exists. |
| `selectChannelPriceCoverage` | channel_price_coverage | Per channel; a channel with zero stored prices is omitted. |
| `selectSpecReadiness` | spec_fender_page_found, spec_additional_property_missing, spec_amazon_completeness | Rates with coverage against active offers. |
| `selectEcommerceToAiLink` | ecommerce_to_ai_link | Always unavailable until a linking reading exists; returns the two measured sides for the first view. |
| `selectPriceGapAboveBenchmark` | price_gap_above_benchmark | Sum and per-listing lines; recompute test checks sum equals the lines. |
| `selectEstimate(id)` | estimate_phase1_uplift, estimate_enterprise_range | Computes the formula from `estimate_input` rows; unavailable when any input is missing; recompute test per estimate. |
| `selectActions` | action_items_open | Rows and count from `action_item`. |
| `selectFreshness` | reading_freshness | One as-of per source; the header shows the oldest, not the newest. |

## Surfaces

- Hub first view: a chart (bar or dot plot) of the five executive outputs as coverage-aware marks, each with status, short label, and the headline figure. Narrative lives in the drill-down.
- Spoke first views: one visual each (AI: share by category with rival bars; Retail: Featured Offer state stacked bar with the suppressed slice; Product data: three coverage bars; Competitive: share by category; Actions: count by owner and status; Money: formula tree with missing inputs marked).
- Every figure, status, and estimate opens an explainer panel: registry row (meaning, as-of, coverage, formula, inputs, source links). Suppressed listings open the Amazon page and, when a stored channel price matches the benchmark, that channel's URL. Estimates open the lines that sum to them.
- Tables (`components/dashboard-v2/DataTable.tsx`): client-side sort on every column with type-aware comparators, per-column filters that combine (text contains, enum select, numeric range, date range), empty state when nothing matches, incomplete rows kept and filterable by their status, each row expandable to its explainer. Server pages of 1,000 rows load through the route handlers; the table holds all rows for the listing-sized sets (about 1,000) and uses a server page for simulations (about 4,300).

## Tests

- `scripts/dashboard-v2/reading-model.test.ts`: missing, partial, zero, conflicting-surface cases.
- `scripts/dashboard-v2/money.test.ts`: recompute each estimate and the price gap from stored inputs.
- `scripts/dashboard-v2/surfaces.test.ts`: fails if any surface string contains a figure that no selector produced for that registry id (scans the spec built from a fixture bundle for digits and dollar signs and matches them against selector outputs).
- `e2e/dashboard-v2/*.spec.ts`: headline, drill-down, explainer, sort, filter, empty result, failed read (route handler forced to 500 through a query flag honored only when `E2E_AUTH_BYPASS=1`), desktop and narrow widths, no page errors.
