# Dashboard v2 baseline audit

Chunk 1 of the dashboard-v2 build. Read-only. Nothing was written or deleted while producing this file.

As of: 2026-10-08, 19:30 UTC. Production project qftczrlksczfimnzfiov (read-only). Sandbox project ltkotsvnkslewecaicvv (public and command schemas mirror production; the `sandbox` schema exists and is empty).

## A. Surfaces: every client-visible number, status, and dollar on the current dashboard (`/dashboard`)

Legend for "Calculated": **view** = computed in a Postgres view from stored rows; **code** = computed in dashboard code from view rows; **typed** = written into a component, JSON template, or SQL literal; **hidden** = exists in code but not rendered.

| # | Surface | Current value (2026-10-08) | Calculated | Disagreement or defect |
| --- | --- | --- | --- | --- |
| S1 | Hub node stats | 3,604 SKUs · 13 Divisions | view (`canvas_metrics.catalog_skus`, `canvas_divisions` count) | 13 divisions mixes two partitions: 7 category-based rows from the Oct 8 recompute and 6 authored division names from a Sep 29 run that the recompute no longer produces (zombie rows via DISTINCT ON division). |
| S2 | Hub node status | danger | typed | Status is not derived from any reading. Same for every node. |
| S3 | Portfolio Retail node | 5.3% 1P · 1,036 Active · 6.5% seller unknown | view | Amazon share of offers is the retail headline for a Partner-led brand. The KPI table for the same run says 5.5% (55 of 1,007 active). Two values for one fact: `bb_total` counts 1,036 map rows including 29 "No Active Offer" rows. |
| S4 | Buy Box satellite | 5.3% 1P · 6.5% Unk · 1,036 active offers | view | Same denominator defect as S3. |
| S5 | ASIN Split satellite | 0 MAP flags · Reviews pending | view + code | `reviews_count` is 0 on every row (never harvested); NULLIF turns the stored zero into "Pending data". `map_violation_skus` is 0 because `map_price` is NULL on all 1,036 rows after the Oct 8 v10 cleanup. The tooltip still says "Partner bundles and MAP violations". |
| S6 | MAP Leakage satellite | Pending data off-Amazon avg · 0 violations · status danger | view, status typed | No MAP source exists any more, so 0 is "unavailable", not zero. Status danger is typed. |
| S7 | AI Search Visibility node | 82.6% Win · 4,287 Sims · Weakest: beginner 58.5% | view | Win rate is a keyword heuristic (any Fender mention with at least as many Fender terms as competitor names counts as a win). Not labeled as such. |
| S8 | Sims satellite | 4,287 Sims · 522 engine runs | view | "522 engine runs" is the count of distinct audit_run_id rows, one per wrench call. Not engine runs. |
| S9 | Citations satellite | "SOV mix · See drill-down" | typed | Placeholder stats. No citation reading exists. |
| S10 | AI Drift satellite | 222 Confirmed Hallucinations · Of 630 risk answers | view | 222 flags come from 4 keyword rules in the simulation wrench. "Confirmed" overstates. 630 is the row count of the `hallucinations` prompt category, not a risk reading. |
| S11 | Schema.org satellite | 139 missing additionalProperty · 947 checked | view | OK as a reading. Coverage (947 of 1,036 active offers) not shown on the node. |
| S12 | A+ Tables satellite | 91.5% Amazon · 947 checked | view | Label says A+ tables; the value is Amazon attribute completeness. No A+ reading exists anywhere. |
| S13 | Taylor / PRS satellite | 27.5% Taylor · 63.0% Fender | view, title typed | Title and status typed. |
| S14 | Amps Category satellite | 95.6% Fender · 475 resolved | view | OK. |
| S15 | AI Readiness node | 14.7% Found · 91.5% Amazon specs · 947 SKUs checked | view | OK as reading; status typed. |
| S16 | Competitive Radar node | Yamaha 38.7% · 20 pt gap (weakest beginner) | view | `weakest_sov_gap_pts` 19.9 formatted as "20 pts" (integer format on a decimal). |
| S17 | Action Items node | +$680K est. · +$38M to $62M | typed (`metrics-from-live.ts`) | No formula, inputs, date, owner, or confidence stored. |
| S18 | Strategy Roadmap node | 90 Days · 3 Phases · Day 90 target 95%+ | typed | Target has no owner or baseline date. |
| S19 | Command center item 1 | "Only 5.3% of active Amazon offers confirm Amazon as the seller" · critical | view | Ranks an unfinished read (6.5% seller unknown) and the wrong seller question above the confirmed finding (48 suppressed Featured Offers), which is not in the command center at all. |
| S20 | Command center item 4 | "Discounted bundles are dragging your prices down everywhere" · high | typed | Below-MAP count is 0 and MAP is not stored. The headline asserts a finding the data does not support. |
| S21 | Command center summary | 1,036 offers, 5.3% / 85.4% / 6.5%; 3,604 SKUs, 13 divisions; Yamaha 66.7% vs Fender/Squier 33.3% | view | Beginner share of voice sentence is from `canvas_competitor_sov`, which says Yamaha 38.7% vs Fender/Squier 58.5% for beginner. The 66.7/33.3 pair only appears in the unit test fixture; the live sentence therefore reads 38.7 vs 58.5, but the item title says "Beginner share of voice is Yamaha 38.7% vs Fender/Squier 58.5%" without the denominator (287). |
| S22 | Metric widget "Flagged ASINs" | 0 · tone danger | view, tone typed | Zero with a danger tone, caused by the missing MAP source. |
| S23 | Metric widget "Average Amazon Price Drift" | Pending data · tone danger | view, tone typed | Unavailable shown with a danger tone. |
| S24 | Metric widget "Stranded Customer Reviews" | Pending data | view | Stored zeros converted to pending. |
| S25 | Metric widget "Recoverable Revenue" | +$680K | typed | Also typed in `tour-from-live.ts` and as the template fallback in `template-vars.ts`. The KPI table row `phase1_lift` ("+$680,000 / yr", seed run 2026-09-29, numeric_value NULL, name says "14 ASINs") is never read: `canvas_metrics.kpi` only carries the latest run's six metric_ids. |
| S26 | Metric widget "Enterprise GMV Potential" | +$38M to $62M | typed | Inventory doc says +$28.4M to $42.6M and 118x ROI; spoke copy says $50M midpoint and 208x ROI on a $240K/yr retainer. Three documents, three values. |
| S27 | Metric widget "Day 90 Buy Box Target" | 95%+ | typed | Target without owner. |
| S28 | Metric widget "Prioritized Action Items" | "Estimates" | typed | Static fallback says 18. No action rows exist in any table. |
| S29 | Hub tab 0 (Executive Briefing) | 3,144-char HTML; figures bound from view | view + typed prose | Prose names Austin Bazaar, Crazy Dave's, GearTree as authorized partners. No authorized-seller list is stored. "Enterprise Potential {enterprise_potential}" binds to the typed fallback. |
| S30 | Hub tab 1 (Division Performance) | 13 rows; Schema Sync 0.0% on every row | view | `schema_sync_pct` is written as the literal 0 by the recompute wrench. A stored zero that was never measured renders as "0.0%". Buy Box % per division has no denominator (Fender Mexico 100% is n=1). |
| S31 | Hub tab 2 (Commercial Sizing) | $680K, $38M to $62M, $50M midpoint, $20,000/month, $240,000/yr | typed | Tab title itself carries the dollars. |
| S32 | Portfolio Retail tab 0 (Retail Listings) | 1,036 rows, paged 50; filters All / MAP violations only / Bundles only | view | MAP filter returns 0 rows (no MAP). Table has no sort. The JSON template behind this tab still holds a 14-ASIN table with $808.00 etc.; it is dead code because the React override replaces it. |
| S33 | Portfolio Retail tab 1 (MAP) | Listings under MAP 0 · Gap Pending data | code (`map-channels.ts`) | Correct reading model. Shows 0 with "Rows returned by this read"; should say the MAP source is not stored. |
| S34 | Portfolio Retail tab 2 (Suppressed Listings) | 48 listings; gap per listing | view + code (`suppressed-listings.ts`) | Correct reading model (unavailable, empty, and count are distinct). No link to the outside listing that matches the benchmark; no coverage line (440 of 1,036 rows have a benchmark). This is the standard to extend. |
| S35 | Portfolio Retail tab 3 (Catalog Consolidation) | "Catalog rows are not shown until they come from the database." | typed | Honest placeholder. |
| S36 | AI Search Visibility tab 0 | Prose callout about PRS SE and Yamaha Pacifica | typed | Narrative. |
| S37 | AI Search Visibility tab 1 (Simulations) | 4,287 rows, category select, paged 50 | view | Tab label says "100 AI Simulations". Engine field is present on 114 of 4,287 rows; `canvas_ai_engine` shows "unknown" for 4,173. |
| S38 | AI Search Visibility tab 2 (Hallucination) | 222 flagged; root cause groups | view + code | Root causes are the wrench's rule labels, which is fine, but the UI calls them "stored root causes" without saying they are rule-based. |
| S39 | AI Search Visibility tab 3 (Citation Ecosystem) | empty template | typed | Tab exists with no content. |
| S40 | AI Readiness tabs 0–2 | spec summary, missing-field bars, per-ASIN table 947 rows | view | A+ tab (2) is prose only. |
| S41 | Competitive Radar tab 0 | 6 categories; `hallucinations` excluded | view | Intro callout hardcodes "Yamaha and Ibanez under $500". |
| S42 | Competitive Radar tab 1 and 2 | Prose about Sweetwater, Reverb, Walmart; tab 2 empty | typed | No channel reading behind it. |
| S43 | Action Items tab 0 | "Top 5 Urgent Portfolio Interventions" with authored text | typed | Count fixed at 5; names partners not stored anywhere. |
| S44 | Action Items tab 1 and 2 | $680,000; 2.8x; +$380,000 / +$190,000 / +$65,000 / +$45,000; $50,000,000; 208x; +$25,000,000 / +$16,500,000 / +$5,000,000 / +$3,500,000 | typed | Parts sum by hand (380+190+65+45 = 680; 25+16.5+5+3.5 = 50). No input is stored. |
| S45 | Roadmap tabs 0–2 | 88%, 92%, 95% Buy Box targets; +$680K / +$50M | typed | Targets without owner or baseline date. |
| S46 | Tour steps 1–7 | restate S1, S3, S7, S10, S11, S17, S27 | view + typed | Step 6 hardcodes both dollars. |
| S47 | Header "Data as of" | max(last_run_at) over all jobs = 2026-10-08 19:30 | code | AI simulation data is from 2026-10-05 16:26; the single max date makes every figure look equally fresh. |
| S48 | Tickers (3) | 5.3% 1P; 82.6% win; +$680K Phase 1 | hidden (`SHOW_HEADER_TICKERS = false`) | Fallback label "Beginner" typed. |
| S49 | Glossary | 18 terms | typed | Fender-specific wording ("lets Fender control"). Mechanism (dotted-term tooltip) is correct and reusable. |
| S50 | Static spec (`fender-static-nodes.ts`, `FENDER_METRICS`, `fenderCommandCenter`) | 124 SKUs, 68%, −$39.21, −$77.58, 73.3%, 33.3%, 75 / 102, 29.2%, 0%, 100%, 18 | typed | Not rendered on `/dashboard`. Still imported by `/sdk/docs` and `scripts/export-v3-toolbelt.ts`. |
| S51 | `docs/dashboard-data-inventory.md` | 124 SKUs, 68% Buy Box, 41/100 index, +$28.4M to $42.6M, 118x, 15 sellers, 14 flagged, camera-only filters | typed | Describes the 17 Sep 2026 authored canvas. Contradicts the product on every headline. |

Filters: the SDK still implements `spec.filters` as camera targets, but the current Fender spec passes none, so no camera-only filter is rendered today. The search box is also camera-only and is not passed either. The new dashboard must not use either mechanism for data filtering.

## B. Pipeline: FenderTest toolbelt (assistant AEO_Product_Research-FenderTest)

One workflow, "Fender Omnichannel Brand Intelligence" (manual trigger; last execution 2026-10-05 09:00 UTC; now a single step that runs two wrenches and summarizes). Data collection runs on scheduled tasks, not on the workflow. All active wrenches write production first and mirror the same SQL to the sandbox project (dual write, since 2026-10-08); failures land in `command.fmic_dual_write_errors` and are replayed hourly.

| Wrench | Outside source | Writes (table.columns) | Cadence | Last success |
| --- | --- | --- | --- | --- |
| fender_catalog_harvester v12 | Keepa product_finder + get_products (brand Fender, node 11971381) | `fmic_electric_catalog` upsert on asin (all columns; buybox_seller only when Keepa returns one; `is_bundle` = title matches bundle/kit/pack/combo); `fmic_job_state.catalog_harvester` | Daily 09:00 ET, 8 pages of 60 | 2026-10-08 19:30 UTC (wrapped to page 0 at 16:30) |
| fender_buybox_seller_harvester v4 | Keepa get_products (buybox) + get_seller | `fmic_electric_catalog.buybox_seller, buybox_is_fba, offer_count_new, buybox_checked_at`; `fmic_sellers` upsert; `fmic_job_state.buybox_seller_harvester` | Daily 09:15 ET, refresh rows older than 20 h | 2026-10-08 19:30 UTC (0 remaining) |
| fender_omnichannel_audit_sync v10 | Keepa get_products (threshold pass) | appends `fmic_audit_runs`, `fmic_brand_kpi_summary` (6 metric_ids), `fmic_division_metrics` (grouped by catalog `category`, `schema_sync_pct` literal 0); upserts `fmic_retail_buybox_map` (asin, model_name, offer_price, buybox_status, buybox_winner; `map_price` NULL for new rows and never updated); sets `buybox_status = 'No Active Offer'` for rows no longer active; updates `competitive_price_threshold_cents`, `featured_offer_withheld` for active ASINs rotating hourly | Hourly | 2026-10-08 18:41 UTC |
| fender_retail_buybox_map_audit v9 | E-Commerce search_products (Walmart) | `fmic_retail_buybox_map.wmt_price, wmt_title, wmt_url, wmt_seller, wmt_leakage, wmt_match_conf, wmt_checked_at, channels`; `fmic_job_state.map_leakage_walmart` | Hourly, 50 ASINs | 2026-10-08 18:53 UTC |
| fender_map_checker_musiciansfriend v8 | headless browser on musiciansfriend.com | `fmic_retail_buybox_map.mf_price, mf_msrp, mf_title, mf_leakage, mf_checked_at, channels`; `fmic_job_state.map_parity_musiciansfriend` | Hourly, 3 × 10 ASINs | 2026-10-08 18:38 UTC |
| fender_spec_readiness_audit v8 | E-Commerce scrape_product (Amazon, 13 fields) + browser on fender.com (8 JSON-LD fields) | inserts `fmic_spec_readiness` (append-only, one row per check); `fmic_job_state.spec_readiness` | Hourly, 10 SKUs | 2026-10-08 19:03 UTC |
| fender_ai_simulation_battery_real v10 | AI-Search `ask` (chatgpt, perplexity, gemini), 34 fixed prompts | `fmic_audit_runs` (one per call, trigger_type manual), `fmic_ai_simulations` (delete+insert per run/sim); rerun mode also edits `fmic_ai_simulations_run1_archive` and `fmic_job_state.ai_sim_conflict_rerun` | Weekly (Saturday 06:00 UTC), 17 calls | 2026-10-05 16:26 UTC |
| fender_dashboard_metrics_sync v6 | Supabase only | Toolbelt storage file `fender-v3-spec.json` (not the repo copy, not the DB) | Hourly | n/a (no DB write) |
| fender_social_intelligence_harvest v3 | Reddit, YouTube | `fmic_social_intelligence` | not scheduled | 2 rows, 2026-10-08 16:14 UTC |
| fmic_sandbox_resync, fmic_sandbox_drift_check, fmic_dual_write_replay | Supabase only | sandbox `command.*` (resync), `fmic_job_state.sandbox_drift_check`, `fmic_dual_write_errors.replayed_at` | Hourly (health check) | 2026-10-08 18:41 UTC, in sync |

22 other wrenches are deprecated or temporary probes. The scoring in the simulation wrench is a keyword heuristic: winner is Fender/Squier when the answer mentions a Fender term at least as often as competitor names; hallucination flags come from four fixed text rules with fixed root-cause strings.

## C. Database: production `command` and `public`

Row counts and last writes are from production at 2026-10-08 19:30 UTC. "Reads" lists the dashboard code path.

| Table | Purpose | Rows | Last write | Written by | Read by dashboard | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| command.fmic_electric_catalog | One row per ASIN from Keepa | 3,604 | 2026-10-08 19:30 | catalog_harvester, buybox_seller_harvester | `canvas_metrics`, `canvas_retail_listings` (join) | map_price never stored here; `list_price` is Amazon list price, not MAP |
| command.fmic_retail_buybox_map | One row per active-offer ASIN: offer, Buy Box status, Walmart, MF, benchmark | 1,036 | 2026-10-08 18:53 | omnichannel_audit_sync, map audits | `canvas_metrics`, `canvas_retail_listings` | `map_price` NULL on 1,036 of 1,036; `reviews_count` 0 on all; `buybox_share_pct` default 0; benchmark on 440; withheld flag on 1,015 |
| command.fmic_sellers | Seller id to name | 33 | 2026-10-08 12:30 | buybox_seller_harvester | `canvas_retail_listings` (join) | 29 named; no authorized flag |
| command.fmic_brand_kpi_summary | Append-only KPI rows per run | 1,300 | 2026-10-08 18:41 | omnichannel_audit_sync | `canvas_metrics.kpi` (latest run only) | 10 seed metric_ids from 2026-09-29 (phase1_lift, enterprise_potential, ai_scan_index, readiness_*) are never recomputed and never read |
| command.fmic_division_metrics | Append-only per-division rows per run | 1,297 | 2026-10-08 18:41 | omnichannel_audit_sync | `canvas_divisions` via `canvas_private.div_latest` | Mixed partitions (see S1); `schema_sync_pct` literal 0 |
| command.fmic_audit_runs | One row per wrench run | 745 | 2026-10-08 18:41 | audit_sync, ai battery | none directly (`sim_runs` counts distinct ids) | 524 of 745 are AI battery calls |
| command.fmic_ai_simulations | One row per prompt × engine × repeat | 2,320 | 2026-10-05 16:26 | ai battery | `canvas_ai_*`, `canvas_competitor_sov`, `canvas_metrics` via `canvas_private.sims_all` | engine on 114 rows only |
| command.fmic_ai_simulations_run1_archive | Archived first run | 2,007 | 2026-10-02 09:12 | ai battery (rerun deletes) | same via sims_all | no answer_text, no engine |
| command.fmic_ai_sim_conflict_snapshot | Conflict snapshot for the Oct 5 rerun | 66 | 2026-10-05 15:50 | manual | none | **nothing reads** |
| command.fmic_competitor_sov | Sep 29 SOV table | 16 | 2026-09-29 18:58 | retired migrate wrench | none (views compute SOV from sims) | **nothing writes, nothing reads** |
| command.fmic_spec_readiness | Append-only spec checks | 1,977 (947 distinct ASINs) | 2026-10-08 19:03 | spec_readiness_audit | `canvas_spec_*`, `canvas_metrics` via `canvas_private.spec_latest` | ok |
| command.fmic_job_state | Cursor and last run per job | 7 | 2026-10-08 19:30 | every harvester | `canvas_freshness` | ok |
| command.fmic_social_intelligence | Reddit/YouTube mentions | 2 | 2026-10-08 16:14 | social harvest (unscheduled) | none | **nothing reads** |
| command.listing_channel_price | One price per listing per channel (sweetwater, reverb) | 0 | never | **nothing** | `canvas_listing_channel_price` (MAP tab extra channels) | **nothing writes** |
| command.fmic_dual_write_errors | Sandbox mirror failures | 1 (replayed) | 2026-10-08 18:40 | all dual-write wrenches | none | ops only |
| command.organizations, organization_memberships, user_profiles | Tenant and login | 2, 4, 2 | 2026-10-01 | app auth | `lib/command/*` (user menu) | organizations has no seller type and no client fields |
| public.organizations, profiles, organization_memberships, departments, people, role_*, audit_log, modules, work_*, components, variants, votes, brand_tokens | Work-register app tables | 0 each in production | n/a | nothing in this repo | nothing in this repo | Unrelated to the dashboard |
| public.canvas_* (11 views) | Browser reads | n/a | n/a | n/a | `lib/canvasData.ts` | `canvas_metrics` recomputes everything per request from base tables |
| canvas_private.sims_all, spec_latest, div_latest | View helpers | n/a | n/a | n/a | via canvas_* | n/a |

Dashboard values with no table behind them: $680K, $38M to $62M, $50M, 2.8x, 208x, $240,000/yr retainer, the eight money sub-lines, 95%/88%/92% targets, "Top 5" interventions and their partner names, 18 actions, citation ecosystem, A+ tables, and every node status.

Production vs sandbox copies (2026-10-08 19:30 UTC): identical row counts on every `command.fmic_*` table; `fmic_dual_write_errors` is 1 vs 0; sandbox `public` has 1 organization, 1 membership, and 2 audit_log rows that production does not. The hourly drift check at 18:41 UTC reported in sync. Sandbox `public` and `command` are the load source for the new `sandbox` schema; as-of date of that copy is 2026-10-08 19:30 UTC.

## D. Data-flow map

```
Keepa product_finder/get_products ──► fender_catalog_harvester ──► command.fmic_electric_catalog ──┐
Keepa get_products(buybox)/get_seller ► fender_buybox_seller_harvester ► fmic_electric_catalog.buybox_*, fmic_sellers ─┤
Keepa get_products(stats) ──────────► fender_omnichannel_audit_sync ──► fmic_retail_buybox_map (offer, status, threshold, withheld),
                                                                        fmic_brand_kpi_summary, fmic_division_metrics, fmic_audit_runs ─┤
E-Commerce search_products (Walmart) ► fender_retail_buybox_map_audit ► fmic_retail_buybox_map.wmt_* ─────────────────────────────────┤
Browser musiciansfriend.com ────────► fender_map_checker_musiciansfriend ► fmic_retail_buybox_map.mf_* ────────────────────────────────┤
E-Commerce scrape_product + browser fender.com ► fender_spec_readiness_audit ► fmic_spec_readiness ────────────────────────────────────┤
AI-Search ask (chatgpt, perplexity, gemini) ► fender_ai_simulation_battery_real ► fmic_ai_simulations, fmic_audit_runs ────────────────┤
                                                                                                                                        ▼
                                                        canvas_private.{sims_all, spec_latest, div_latest} ► public.canvas_* views
                                                                                                                                        ▼
   lib/canvasData.ts (browser, anon key) ► lib/fender-canvas/{metrics,nodes,command-center,tour,template-vars}-from-live.ts
                                            + components/v3/live/* panels ► IntelligenceCanvas (lib/canvas-sdk) ► /dashboard
   data/fender-v3-spec.json (typed prose + {placeholders}) ──────────────────────────────────────────────────────────────────┘
   (fender_dashboard_metrics_sync writes a Toolbelt storage copy of fender-v3-spec.json that this repo does not read)
```

## E. Finding list mapped to the ten weaknesses

| Weakness | Status in the current dashboard | Evidence |
| --- | --- | --- |
| 1. Authored figures outside retail | Confirmed. Money (S17, S25, S26, S31, S44, S45), actions (S28, S43), competitive prose (S41, S42), spec A+ (S12, S40), node statuses (S2), citation placeholders (S9, S39). | Files: `metrics-from-live.ts`, `tour-from-live.ts`, `template-vars.ts`, `data/fender-v3-spec.json`. |
| 2. Dollars without formula | Confirmed. Three conflicting enterprise figures ($38M to $62M, $50M, $28.4M to $42.6M). The DB row is a text string from a seed run and is never read. | S25, S26, S44. |
| 3. Two retail stories | Confirmed. Amazon 1P share leads every retail surface; the confirmed suppressed Featured Offer finding (48) sits on tab 2 only. | S3, S4, S19, S34. |
| 4. Unfinished read hides a confirmed finding | Confirmed. Command center ranks the seller-unknown read first and omits the suppression finding; MAP item asserts a finding with 0 rows. | S19, S20. |
| 5. Stale inventory document | Confirmed. | S51. |
| 6. Controls implying capability | Partly resolved. No camera-only filter or search is rendered. Still open: typed fallbacks for dollars (S25), zero and pending shown with danger tone (S22, S23), action count without rows (S28, S43), "Data as of" hides the 3-day-old AI read (S47). | |
| 7. Evidence trails outside retail | Confirmed. No surface outside the Suppressed Listings and MAP tabs opens definition, population, date, calculation, and source. | S7, S10, S16, S30. |
| 8. Text-heavy first view | Confirmed. Hub tab 0 is a 3,144-character briefing; command center opens by default with paragraph "why" text. | S29, S19. |
| 9. Tables lack sort and filter | Confirmed. Listings: 3 filter chips, no sort. Simulations: category select only. MAP, Suppressed, Spec, SOV, Divisions: none. | S32, S33, S34, S37, S40, S41. |
| 10. Single-brand data model | Confirmed. No client or seller-type row; `fmic_` prefixes; 'Fender/Squier', 'ATVPDKIKX0DER', 34 Fender prompts, competitor list, and category list are literals in views, wrenches, and components. | `canvas_metrics`, `canvas_ai_category`, `FenderSimulationsPanel.tsx`, simulation wrench. |

Additional defects not in the original list: zombie divisions (S1), mixed denominators for active offers (S3), stored zeros that were never measured (`schema_sync_pct`, `reviews_count`, `buybox_share_pct`), engine coverage 114 of 4,287 (S37), MAP source removed so every MAP metric is unavailable (S5, S6, S22, S33), heuristic scoring presented as confirmed (S7, S10), no authorized-seller list for the Partner-led question, `listing_channel_price` written by nothing, `fmic_competitor_sov` and `fmic_ai_sim_conflict_snapshot` read by nothing.

## F. Baseline test state

Unit tests at HEAD (30599e6), run with `node --import ./scripts/register-alias.mjs --test scripts/*.test.ts`: 17 pass, 0 fail. The main working tree (with uncommitted work) passes 24. End-to-end suites in `e2e/` target `/dashboard` and are unchanged by this work.
