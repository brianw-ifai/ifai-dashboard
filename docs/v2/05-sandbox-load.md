# Sandbox schema load: proof

Chunk 5 of the dashboard-v2 build. The `sandbox` schema was created in the SANDBOX Supabase project (ref `ltkotsvnkslewecaicvv`) from the approved model (`docs/v2/schema/ifai-dashboard-v2.schema.json`, verbatim copy of `schemas/ifai-dashboard-v2/schema.json`; `docs/v2/schema/migration-map.md` likewise) and loaded from that project's own `command.*` and `canvas_private.*` copies. Migrations live in `supabase/sandbox-migrations/` and were applied with `apply_migration` under the same names (`0005b_sandbox_refresh` is the retry of the function after a typed-null fix; the final SQL is in `0005_sandbox_refresh.sql`). Only `apply_migration`, `execute_sql` and `list_tables` on the sandbox server were used; nothing outside schema `sandbox` was created or changed.

Recorded migrations: `0001_sandbox_schema`, `0002_sandbox_grants`, `0003_sandbox_load`, `0004_sandbox_views`, `0005_sandbox_refresh`, `0005b_sandbox_refresh`, `0006_sandbox_seed_outputs`.

## Source drift to know about

The as-of recorded on every backfill run is `detail.as_of = 2026-10-08T19:30:00Z`, as instructed. The sandbox mirror kept receiving the hourly dual writes after 19:30, so the copy loaded at 20:35 UTC was slightly newer than the 19:30 state behind `04-expected-readings.md`. Each backfill run records the real `detail.source_max_write`:

| Run | Source table | source_max_write (UTC) |
| --- | --- | --- |
| R1 catalog | fmic_electric_catalog.updated_at | 2026-10-08 20:30:37 |
| R2 seller | fmic_electric_catalog.buybox_checked_at | 2026-10-08 19:00:30 |
| R3 benchmark | fmic_retail_buybox_map.updated_at (finished_at = latest kpi_summary 19:41:11) | 2026-10-08 19:51:49 |
| R4 Walmart | wmt_checked_at (finished_at = job_state 19:51:48) | 2026-10-08 19:51:48 |
| R5 Musician's Friend | mf_checked_at (finished_at = job_state 19:39:00) | 2026-10-08 19:38:58 |
| R6 spec | fmic_spec_readiness.checked_at (1,987 rows, was 1,977 at 19:30) | 2026-10-08 20:03:05 |

Every retail and AI count below still matches; the only value differences are the spec counts (two more fender.com pages found in the 20:03 batch) and the per-source freshness timestamps, which moved forward by one hourly cycle. These are source changes, not load defects.

## list_tables for schema sandbox (row counts, RLS on every table)

| Table | Rows | Table | Rows |
| --- | --- | --- | --- |
| seller_type | 5 | spec_reading | 1,987 |
| client | 1 | competitor_brand | 9 |
| seller | 33 | ai_prompt | 34 |
| seller_authorization | 0 | ai_answer | 4,287 |
| listing | 3,604 | metric_registry | 25 |
| reading_run | 528 (6 backfill R1 to R6, 522 AI battery runs; R7, R8, R9 not needed) | metric_value | 48 |
| listing_offer_reading | 5,647 (R1 3,604, R2 1,007, R3 1,036) | estimate | 2 |
| listing_channel_price | 2,410 (walmart 1,033, musiciansfriend 341, amazon 1,036, legacy 0) | estimate_input | 0 |
| listing_map_price | 0 | action_item | 54 |

Views: `v_listing_current` (3,604 rows), `v_reading_freshness` (6), `v_ai_answer_detail` (4,287), `v_spec_current` (947). 18 tables with RLS, 18 SELECT policies, anon/authenticated SELECT only (`has_table_privilege('anon','sandbox.listing','insert') = false`; `refresh_metric_values` EXECUTE revoked from anon/authenticated). Trigger `action_item_refresh_metrics` enabled.

`select count(*) from sandbox.metric_value` = **48** (20 registry ids; no row for retail_control_partner_led, map_below, ecommerce_to_ai_link, estimate_phase1_uplift, estimate_enterprise_range).

## Expected readings vs sandbox.metric_value

| Registry id | Expected (04-expected-readings) | sandbox now | Match |
| --- | --- | --- | --- |
| catalog_monitored | 3,604 listings; 1,007 active | 3,604; offer_status=active 1,007 | match |
| seller_mix | Amazon 55; third party 885; not read 67 | amazon_retail 55; third_party 885; not_read 67 | match |
| amazon_offer_share | 55 of 1,007 = 5.5 % | 55 / 1,007 = 5.46 % | match |
| featured_offer_present | 945 present of 1,015 read | 945 / 1,015 | match |
| featured_offer_suppressed | 48 | 48 (denominator 438 active listings with a benchmark) | match |
| price_gap_above_benchmark | sum 10,667.03; min 5.92; max 1,215.67 | sum 10,667.03 over 48; min 5.92; max 1,215.67 (view) | match |
| benchmark match | 19 of 48 have an MF price equal to the benchmark; 0 Walmart | v_listing_current: 19 suppressed with musiciansfriend in benchmark_match_channels; 0 walmart; 0 amazon | match |
| benchmark coverage | 440 of 1,036 rows | 440 R3 rows with competitive_external_price_cents | match |
| channel_price_coverage | Walmart 116 priced of 1,033 (116 urls); MF 306 of 341 | walmart 116 / 1,033 (116 with url); musiciansfriend 306 / 341; amazon 1,036 / 1,036 | match |
| map_below | unavailable | no metric_value row; listing_map_price has 0 rows | match |
| bundle_share | 399 of 1,007 | 399 / 1,007 = 39.62 % | match |
| spec_fender_page_found | 139 of 947 = 14.7 % | 141 / 947 = 14.89 % | mismatch, source drift (10 spec rows checked 19:30 to 20:03; canvas_private.spec_latest now also says 141) |
| spec_additional_property_missing | 139 of 139 | 141 / 141 | mismatch, same drift |
| spec_amazon_completeness | 91.5 % | 91.46 % (11,260 / 12,311 fields) | match |
| ai_answer_share | 3,209 of 3,885 = 82.6 %; 4,287 answers; 260 unclear; 142 errors | 3,209 / 3,885 = 82.60 %; 4,287 answers; 260 unclear; 142 errors | match |
| ai_answer_share_by_category | beginner 168 of 287 = 58.5 %; Yamaha 111 of 287 = 38.7 %; gap 19.9 | beginner 168 / 287 = 58.54 %; category_top_rival beginner:Yamaha 111 / 287 = 38.68 %; gap 19.86 | match |
| ai_wrong_spec_flags | 222 | 222 (of 4,287) | match |
| ai_answer_share_by_engine | engine stored on 114 of 4,287 | chatgpt 1,046 / 1,275; gemini 1,113 / 1,380; perplexity 1,050 / 1,230 (all 4,287 carry an engine) | different by design: the load rule decodes the engine from the " [engine]" prompt suffix present on every row (114 stored engines all agree with the suffix, 0 conflicts), so 0 rows are unknown |
| ai_battery_freshness | 2026-10-05 16:26:36 UTC | epoch 1791217596.811 = 2026-10-05 16:26:36.811 UTC | match |
| reading_freshness | catalog 19:30; seller 19:30; benchmark 18:41; Walmart 18:53; MF 18:38; spec 19:03; AI 10-05 16:26 | keepa_product 20:30:37 (catalog R1); keepa_seller 19:00:30 (max buybox_checked_at per load rule); benchmark R3 finished_at 19:41:11 (same source keepa_product, so it sits on the run row, not in the per-source metric); walmart_price 19:51:48; musiciansfriend_price 19:39:00; spec_check 20:03:05; ai_battery 10-05 16:26:36 | mismatch on timestamps, source drift (one more hourly cycle) and the seller rule; AI matches |
| catalog_by_category | Solid Body 3,202; Electric Guitar Kits 223; Electric Guitars 109; Hollow & Semi-Hollow Body 68; Bags, Cases & Covers 1; Tuning Pegs 1 | identical six rows; no uncategorized row | match |
| estimate_phase1_uplift, estimate_enterprise_range | unavailable | no metric_value row; estimate rows exist with low/high null; 0 estimate_input rows | match |
| action_items_open | count of seeded rows | 54 = 48 suppressed-listing rows + 6 (authorized-seller list, MAP sheet, "Add additionalProperty to 141 found fender.com pages", "Finish the seller read for 67 active offers", Phase 1 inputs (COO), enterprise range inputs (COO)) | match (all counts generated by SQL) |

## Acceptance question 1: why is this Featured Offer withheld?

Picked from `v_listing_current where suppressed` (first by ASIN with a Musician's Friend match):

| Field | Value |
| --- | --- |
| asin / listing_id | B08GL3HR1F / lst_B08GL3HR1F |
| finding (listing_offer_reading_id) | lor_B08GL3HR1F_r3 (run R3 a0000000-0000-4000-8000-000000000003) |
| featured_offer_withheld | true |
| offer_price_cents | 183,999 ($1,839.99) |
| competitive_external_price_cents | 163,999 ($1,639.99) |
| read_at | 2026-10-08 19:41:12 UTC |
| legacy_status | Unknown/Not Harvested |
| benchmark_match_channels | {musiciansfriend} |
| Amazon page | https://www.amazon.com/dp/B08GL3HR1F |

Channel price rows for the listing whose `price_cents` equals the benchmark: `lcp_B08GL3HR1F_musiciansfriend`, channel musiciansfriend, priced, 163,999 cents ($1,639.99), checked 2026-10-06 08:37 UTC, store title "Fender American Professional II Stratocaster Rosewood Fingerboard Electric Guitar", run R5 (Musician's Friend stores no url). Other channel rows for the listing: amazon priced 183,999 (the offer itself), walmart no_match. Action row: `act_suppressed_B08GL3HR1F`, finding_ref lor_B08GL3HR1F_r3, owner client, severity high, open, "Match the outside price or correct the outside listing for B08GL3HR1F".

## REST check (anon key, Accept-Profile: sandbox)

`GET $SANDBOX_SUPABASE_URL/rest/v1/metric_registry?select=registry_id&limit=3` → HTTP 200, body:

```json
[{"registry_id":"ai_answer_share"},{"registry_id":"ai_answer_share_by_category"},{"registry_id":"ai_wrong_spec_flags"}]
```

`GET /rest/v1/v_listing_current?select=asin&suppressed=eq.true&limit=1` → HTTP 200 `[{"asin":"B000RW7U40"}]`. `POST /rest/v1/competitor_brand` with the anon key → HTTP 401 (no write grant). The `sandbox` schema is exposed through the API; no blocker.

## Load decisions worth knowing

- `spec_reading` unique constraint is (listing_id, reading_run_id, read_at), not (listing_id, reading_run_id) as the schema.json note says: all 1,987 historical spec rows (947 listings) sit under one backfill run R6 as instructed. Live runs writing one row per listing per run still satisfy it. 0 spec rows were skipped (every asin is in the catalog).
- `metric_registry.status_rule` was already in the published schema.json by the time it was fetched, so 0001 carries it from the file rather than as an addition.
- R1 and R3 share source keepa_product, so R3's workflow_execution_id is `backfill_keepa_product_benchmark_20261008T1930`.
- 19 AI runs have no `workflow_execution_id` in fmic_audit_runs; they load as `legacy_audit_run_<uuid>` with `detail.workflow_execution_id_was_null = true`. All 522 audit_run_ids referenced by sims_all exist, so R7 was not created (the guard stays in 0003). command.listing_channel_price has 0 rows, so R8/R9 were not created either (guards stay).
- `seller_read_coverage` counts seller_class in (amazon_retail, third_party, no_offer) over active listings; a missing seller row counts as not_read.
- `ai_prompt.legacy_sim_id` is the prompt index ((sim_id % 1000) - 1) / 10; each index maps to exactly one prompt text and category (34 of 34), 5 prompts (hallucinations) flagged names_client_product.
- `fmic_sellers` covers every seller id the catalog references, so the union branch for missing sellers added 0 rows (33 sellers).
- `listing.parent_listing_id` is null on every row: none of the 1,642 parent ASINs is itself in the catalog.

## Review notes (project manager, 2026-10-08 20:50 UTC)

- Verified directly against the sandbox project after the subagent's report: 18 tables in `sandbox` with the row counts above, 48 metric values, 54 open actions, 48 suppressed listings in `v_listing_current`, 522 AI runs plus 6 backfill runs, anon can select and cannot insert, and the public and command schemas hold the same 54 objects as before the run.
- Decision on the engine split: it loads as complete. Every answer carries its engine in the prompt tag and in the sim id, and the 114 stored engine values agree with both. The registry row `ai_answer_share_by_engine` was updated in the sandbox and in the seed to say so.
- Decision on freshness: the dashboard reads per-workflow freshness from `reading_run` directly, so the benchmark pass (run R3) shows its own as-of beside the catalog run that shares its source.
- The `spec_reading` unique key includes `read_at` so the 1,987 historical checks stay under one backfill run. The published model keeps `(listing_id, reading_run_id)` because a live writer opens one run per batch.
- As-of: the sandbox `command` copy kept receiving hourly dual writes while the load ran, so a few source timestamps are later than 19:30 UTC (catalog 20:30, spec 20:03). The load is a point-in-time copy; the expected-readings table in `docs/v2/04` was written at 19:30 and the two spec counts moved from 139 to 141 in between. Every retail and AI count reproduced exactly.
