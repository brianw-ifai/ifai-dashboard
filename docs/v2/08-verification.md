# Dashboard v2 verification (chunk 9)

Run on 2026-10-08 in the `dashboard-v2` worktree with the installed Chrome. Evidence files (screenshots, raw logs, scripts) are in the session scratchpad `…/scratchpad/chunk9/`. Every text below was read from the page or from a command's output; nothing is quoted from expectation.

## Step 0: hub Overview label and figure layout

Defect: in `components/dashboard-v2/charts/HubOverviewChart.tsx` the chart's narrow branch (measured width under 480 px) used a 140 px label column with character truncation and a fixed 90 px figure column. The first label rendered as "Withheld above be…" and the 10-character figure "$10,667.03" (91 px at 16 px bold) ran under the coverage bar. At a 1280 viewport with the panel in column layout the chart measures 948 px, so the settled page did not show it; the panel width is animated (`@property --drilldown-width`) and the chart measures under 480 px during the slide-in and whenever the panel is 560 px or narrower. Reproduced by forcing the panel to 560 px (chart 469 px).

Fix (only file changed): labels wrap to at most two `tspan` lines within the label column instead of truncating (a trailing space keeps the DOM text "Withheld above benchmark"), and the figure column is sized from the longest figure string so the bar always starts after it. No label string was typed; labels still come from `hubLabel()` in `lib/dashboard-v2/canvas/first-views.ts`.

| Case | Chart width | First label | Price gap figure box | Coverage bar left | Overlap |
| --- | --- | --- | --- | --- | --- |
| before, 1280, settled panel | 948 | Withheld above benchmark | x 504 to 596 | 606 | no |
| before, 1280, panel forced to 560 | 469 | Withheld above be… | x 924 to 1015 | 996 | yes |
| after, 1280, settled panel | 948 | Withheld above benchmark | x 504 to 596 | 614 | no |
| after, 1280, panel forced to 560 | 469 | Withheld above benchmark (two lines) | x 924 to 1015 | 1034 | no |
| after, 1600, settled panel | 1268 | Withheld above benchmark | x 505 to 596 | 615 | no |

Screenshots: `step0-before-1280.png`, `step0-before-forced560-1280-panel.png` (shows the truncation and the overlap), `step0-after-1280.png`, `step0-after-forced560-1280-panel.png`, `step0-after-1600.png` (all in `…/scratchpad/chunk9/`). Unit re-run after the change: `node --import ./scripts/register-alias.mjs --test scripts/dashboard-v2/*.test.ts` → tests 57, pass 57, fail 0. `eslint` on the file: clean.

## Step 1: unit tests

`node --import ./scripts/register-alias.mjs --test scripts/*.test.ts scripts/dashboard-v2/*.test.ts` → `ℹ tests 74`, `ℹ pass 74`, `ℹ fail 0`, `ℹ cancelled 0`, `ℹ skipped 0`, `ℹ todo 0`.

| Rule | Test (file) | Result |
| --- | --- | --- |
| missing input | a missing input yields unavailable with a reason, never zero (reading-model); a missing metric_value row yields unavailable with a reason, never 0 (selectors) | pass |
| partial read | a run that read fewer rows than its population is partial and renders not final with read N of M (reading-model); a partial read reports its counts and says not final (selectors) | pass |
| stored zero | a stored zero with a run id is complete with value 0 and renders 0 (reading-model); a stored zero with a complete run is complete and renders 0 (selectors) | pass |
| conflicting surfaces | with conflicting stored rows, the same registry id formats identically on node, command center, tour, and widget (surfaces) | pass |
| headline rule | headline rule: an unavailable higher rank does not replace a confirmed lower rank, and shows as coverage; headline rule: among eligible findings the lowest rank number wins; partial counts as confirmed; headline rule: a confirmed zero does not outrank a confirmed non-zero, but does outrank unavailable; headline rule: all unavailable falls back to the lowest rank with no coverage list (reading-model); the retail headline is the confirmed suppression finding; the unavailable primary question is coverage (selectors) | pass |
| price gap recompute | the price gap sum recomputed from the lines equals the stored metric value (money) | pass |
| Phase 1 estimate recompute | an estimate with a missing input is unavailable and names the missing inputs; an estimate whose inputs all exist equals the sum of its inputs (money) | pass |
| enterprise range / formula shape | a formula without named inputs sums every stored input, and none means unavailable (money) | pass |
| price gap label | a price gap is labeled price gap, never revenue or uplift (money) | pass |

## Step 2: current dashboard suite (port 3111, spawned by playwright.config.ts)

Both runs: `20 failed`, `42 passed (1.7m)`. The baseline in `06-e2e-baseline.md` is 43 passed, 19 failed. Because the counts differed the suite was run twice; the failing sets of run 1 and run 2 are identical.

| Comparison | Specs |
| --- | --- |
| fail now, not in baseline | `e2e/panel-layout.spec.ts:45:7 › panel layout › always leaves a usable graph rail` (both runs): `Error: graph rail at 1440px, Expected: <= 250, Received: 400` |
| in baseline, pass now | none |
| the 19 baseline failures | all 19 fail in both runs |

The extra failing spec resizes the viewport from 1280 to 1440 and reads the panel width at once; the read saw the 1280 panel width (1040 px), so the rail was 400. The spec drives `/dashboard`; `git diff --stat main...HEAD` shows no change under `lib/canvas-sdk`, `components/v3`, `e2e/fixtures.ts`, or the current `e2e/*.spec.ts` files on this branch. Note: my 3113 server (started early for the step 0 screenshots) had to be stopped before this step because `next dev` refuses a second server in the same directory; the spawn then worked. Raw output: `e2e-current-run1.txt`, `e2e-current-run2.txt`.

## Step 3: v2 suite (`E2E_BASE_URL=http://localhost:3113 npx playwright test e2e/dashboard-v2`)

| Spec | Run 1 | Run 2 |
| --- | --- | --- |
| v2-explainer.spec.ts:7 a suppressed listing's explainer shows benchmark, offer, gap, the Amazon link, and channel rows | pass | pass |
| v2-explainer.spec.ts:40 a metric card opens a drawer with the registry name and the formula | pass | pass |
| v2-failed-read.spec.ts:4 a failed listings read renders the unavailable state with no digits and no page errors | pass | pass |
| v2-narrow.spec.ts:6 at phone width the page loads, the hub is visible, a spoke opens, no sideways scroll | pass | pass |
| v2-overview.spec.ts:4 the hub first view loads with five chart marks and an as-of header, with no page errors | pass | pass |
| v2-tables.spec.ts:9 sorting listings by offer price changes the first row | pass | pass |
| v2-tables.spec.ts:43 filtering outside prices to Walmart; empty state; clearing restores | fail | pass |

Run 1: `1 failed, 6 passed (21.0s)`. The failure was the no-console-error assertion: `console: Failed to load resource: the server responded with a status of 502 (Bad Gateway)`; the dev log shows one `GET /api/dashboard-v2/listings?page=0 502 in 3.1s` (the route helper's status for a failed upstream sandbox read) and no other 502 in the whole session. The spec's own evidence lines were read in both runs: `filtered counts: initial: 422 of 422 outside price rows; Walmart: 116 of 422 outside price rows; after clear: 422 of 422 outside price rows`. Run 2: `7 passed (17.1s)`. Both logs: `e2e-v2.txt`, `e2e-v2-run2.txt`.

## Step 4: interactive pass (`step4-interactive.mjs`, Chrome, console and page errors collected)

1600x950, checks failed: 0; console and page errors: none (desktop context), none (phone context), only the three forced-500 notices in the failed-read context.

| Check | Text read |
| --- | --- |
| a. Portfolio Retail node | pieces: Portfolio, Retail, "48 withheld above benchmark", "93.3% seller read", "read 438 of 1,007, not final" |
| a. command center | 7 items; first title "Featured Offer withheld above Amazon's outside benchmark" (CRITICAL; "48 of 438 … Read 438 of 1,007, not final"); second item "Healthy Featured Offer, authorized seller: unavailable" (MODERATE); other titles: Weakest category; fender.com page found; Share by engine; Open action items; Price gap on suppressed listings |
| b. Overview headline card | "FEATURED OFFER WITHHELD ABOVE AMAZON'S OUTSIDE BENCHMARK 48 read 438 of 1,007, not final" |
| b. offer-states legend | Present: 945; Withheld within benchmark: 22; Withheld above benchmark: 48 |
| b. seller-mix legend | Amazon Retail: 55; not read yet: 67; third-party seller: 885 |
| b. primary question line | "Partner-led primary question: Does an authorized seller hold a healthy Featured Offer on each active listing? Unavailable: No authorized-seller list is stored." |
| c. Listings, filter Suppressed = yes | count "48 of 3,604 listings"; first row ASIN B0B9ZVTN24, suppressed cell "yes" |
| c. row explainer | name "Featured Offer withheld above Amazon's outside benchmark"; Offer price $3,465.66; Benchmark $2,249.99; Price gap $1,215.67; Amazon href https://www.amazon.com/dp/B0B9ZVTN24; channel rows: "Amazon priced $3,465.66 Oct 8, 2026, 19:41 UTC Open the Amazon listing differs from the benchmark", "Walmart no match unavailable Oct 8, 2026, 07:53 UTC no link stored no price"; Benchmark match "no stored outside price equals the benchmark" |
| c. headline drawer | Formula "withheld = true AND offer_cents > benchmark_cents"; Reading run "fender_omnichannel_audit_sync: started Oct 5, 2026, 13:41 UTC, finished Oct 8, 2026, 19:41 UTC, not final" |
| d. sort Offer price | before B0B9ZVTN24 $3,465.66; click 1 (asc) B003AYNEEM $8.39; click 2 (desc) B0C7LY6GZV $4,750 |
| e. Outside prices, channel = Walmart | "422 of 422 outside price rows" → "116 of 422 outside price rows"; 116 channel cells, all "Walmart" |
| f. empty result | "No rows match these filters. Clear filters"; "0 of 422 outside price rows"; after Clear filters "422 of 422 outside price rows" |
| g. listings API forced to 500 | Listings area text "unavailable: forced failure for the failed-read check"; contains no digit; 0 tables rendered |
| h. Estimates | Phase 1 tree: each input "unavailable: not stored"; total "unavailable until every input is stored"; no "$" anywhere in the tree. Price gap block head "Price gap on suppressed listings $10,667.03 48 lines, read 438 of 1,007, not final"; figure "$10,667.03" |
| i. guided tour | launcher "Guided tour"; step 1 "STEP 1 OF 7", title "Brand Portfolio", value "48"; after Next: "STEP 2 OF 7", "AI Search Visibility", "82.6% (3,209 of 3,885)"; closed with the close button |
| j. glossary | dotted term "Unavailable"; tooltip "Unavailable No stored value exists for this reading yet. The dashboard shows the word and the reason instead of a number, never a zero." |
| 390x844 | header "IntoFocus Fender Readings as of Oct 5, 2026, 16:26 UTC (oldest source) Priorities 7"; hub node visible; AI Search Visibility headline card "AI ANSWER SHARE 82.6% as of Oct 5, 2026, 16:26 UTC"; scrollWidth 390, innerWidth 390, body 390 |

Screenshots paired with those reads: `step4a-command-center.png` … `step4j-glossary.png`, `step4-narrow.png`.

## Step 5: current dashboard at /dashboard (same server, 1600x950)

| Read | Value |
| --- | --- |
| login card | did not appear (guest cookie set as e2e/fixtures.ts does) |
| .graph-node count | 17 (hub, 6 spokes, 10 satellites) |
| hub node text | Brand Portfolio, 3,604 SKUs, 13 Divisions |
| Portfolio Retail node text | Portfolio Retail, 6.9% 1P, 1,036 Active, 6.5% seller unknown |
| header | IntoFocus AEO Consensus Control, Data as of Oct 8, 2026, 6:15 PM, Priorities 6 |
| command center first item | "Only 6.9% of active Amazon offers confirm Amazon as the seller" (6 items) |
| Portfolio Retail spoke | title "Portfolio Retail, Buy Box & Brand Registry"; tabs: Retail Listings, MAP, Suppressed Listings, Catalog Consolidation & Brand Registry Governance |
| console and page errors | none |

## Step 6: same-system check

Bundle (`/api/dashboard-v2/bundle`, HTTP 200): 25 registry rows. Ids and names: action_items_open (Open action items), ai_answer_share (AI answer share), ai_answer_share_by_category (Weakest category), ai_answer_share_by_engine (Share by engine), ai_battery_freshness (Last AI read), ai_wrong_spec_flags (Answers flagged for a wrong spec), amazon_offer_share (Amazon Retail share of Featured Offers), bundle_share (Partner bundles), catalog_by_category (Listings by category), catalog_monitored (Monitored ASINs), channel_price_coverage (Outside prices on file), ecommerce_to_ai_link (Ecommerce cause of the AI result), estimate_enterprise_range (Enterprise uplift range), estimate_phase1_uplift (Phase 1 uplift), featured_offer_present (Featured Offer present), featured_offer_suppressed (Featured Offer withheld above Amazon's outside benchmark), map_below (Offers below MAP), price_gap_above_benchmark (Price gap on suppressed listings), reading_freshness (As-of per reading), retail_control_partner_led (Healthy Featured Offer, authorized seller), seller_mix (Who holds the Featured Offer), seller_read_coverage (Seller read coverage), spec_additional_property_missing (Pages missing additionalProperty), spec_amazon_completeness (Amazon attribute completeness), spec_fender_page_found (fender.com page found).

Schema tables (18): seller_type, client, seller, seller_authorization, listing, reading_run, listing_offer_reading, listing_channel_price, listing_map_price, spec_reading, competitor_brand, ai_prompt, ai_answer, metric_registry, metric_value, estimate, estimate_input, action_item.

| Check | Result |
| --- | --- |
| registry ids whose source_tables name no schema table | ecommerce_to_ai_link (source_tables empty; the registry row says source "none", by design). Every other row's tables exist in the schema. |
| summary figures with no support | none. 947 / 141 / 14.9% and 438, 19, $10,667.03, 54, 48 of 54 are supported by `05-sandbox-load.md` (the registry doc still carries the pre-drift 139 / 14.7% and 440); 3,209 / 3,885 / 82.6%, 168 / 287 / 58.5%, 111 / 287 / 38.7%, 222 / 4,287, 3,604 / 1,007, 48, 67, $680K and $38M to $62M (named as unavailable) are registry rows. The page showed the same values (141 of 947, 14.9%; read 438 of 1,007; 54; $10,667.03). |
| dashboard areas the summary does not name | none. Page spoke titles: AI Search Visibility, Portfolio Retail, AI Readiness, Competitive Radar, Action Items, Estimates; all six are named in the summary. The hub's panel title "Brand Portfolio" is described as "a hub for Fender" rather than by that name. |
| public schema diagram | `curl -sI https://intofocus-client-dashboard-v2-schema.tryapexti.ai` → HTTP/2 200; grep -c metric_registry → 1; grep -c status_rule → 1 |

## Step 7: shutdown

Dev server on 3113 stopped; `lsof` shows no listener on 3111 or 3113 and no `next dev` process for the worktree. `git status --short` in the worktree: only `components/dashboard-v2/charts/HubOverviewChart.tsx` modified, plus this document.

## Open findings

1. Current dashboard suite: 42 pass / 20 fail against a baseline of 43 / 19; the one extra failure is `panel-layout.spec.ts:45 always leaves a usable graph rail` (rail 400 at 1440 px, read before the animated panel width settled), identical in two runs. It fails on `/dashboard`, which this branch does not change.
2. v2 suite run 1 had one transient `502` from the listings route on `?page=0` (a failed upstream sandbox read); run 2 passed 7 of 7.

## Project manager follow-up (2026-10-08, after the report above)

- Step 2, the one spec outside the baseline (`e2e/panel-layout.spec.ts:45 always leaves a usable graph rail`): re-run three times on an idle machine from this worktree with `--repeat-each=3`; it failed twice and passed once, while the other 19 baseline failures stayed constant. Across the session it has passed 3 of 7 runs (2 of 2 in the baseline, 0 of 2 in verification, 1 of 3 here). The spec resizes the viewport and reads the panel width before the panel's animated width settles, so the result depends on machine load. The branch changes no file the current dashboard imports (`git diff main...HEAD -- lib/canvas-sdk components/v3 lib/fender-canvas e2e/fixtures.ts e2e/*.spec.ts` is empty), so this is a timing-flaky spec, not a regression. Everything else matched the baseline exactly: the same 43 pass and the same 19 fail.
- Step 3, the transient 502: `sandbox.v_listing_current` computed `benchmark_match_channels` with a correlated subquery that ran once per listing (989 ms for the full view), and the browser role has a 3 second statement timeout, so concurrent page reads could time out. Sandbox migration `0007_sandbox_listing_view_speed` replaces the subquery with one aggregated join; the view now runs in 34 ms with identical results (3,604 rows, 48 suppressed, 19 suppressed rows matching a Musician's Friend price).

## After merging main (2026-10-09)

`origin/main` moved 31 commits past this branch's base on 2026-10-08 (pull requests #22 to #25). It was merged into `dashboard-v2` with no conflicts. On the merged tree: 150 unit tests pass, the static Pages build succeeds, and the seven v2 end-to-end specs pass. The current dashboard's suite as `main` now defines it: a pure `main` checkout gives 49 pass and 19 fail; the merged branch gives 48 pass and 20 fail. The one difference, `guided-tour.spec.ts:127 the lit area never sits under the tour card`, is unstable on `main` itself (it failed 3 of 4 repeats on the pure `main` checkout and 4 of 4 on the branch); the branch is identical to `main` in every file that spec exercises (`git diff origin/main HEAD -- lib/canvas-sdk components/v3 lib/fender-canvas app/(canvas)/dashboard e2e/guided-tour.spec.ts e2e/fixtures.ts` is empty).
