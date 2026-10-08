# Dashboard v2 final report

Branch `dashboard-v2` (worktree beside the main checkout). Nothing was pushed, merged, or opened as a pull request. The current dashboard at `/dashboard` and its files are untouched; the new dashboard is at `/dashboard-v2` and reads only the `sandbox` schema of the sandbox Supabase project.

## 1. Public schema URL and domains

Diagram: https://intofocus-client-dashboard-v2-schema.tryapexti.ai (Schema-Architect dashboard page `ifai-dashboard-v2`, public, v0.2, built with the build_schema_diagram wrench; 18 tables, 211 columns, 35 foreign keys). Source: `schemas/ifai-dashboard-v2/schema.json` in Schema-Architect storage, copied to `docs/v2/schema/ifai-dashboard-v2.schema.json`.

Domains, in reference order:

1. Client context: seller_type, client, seller, seller_authorization
2. Catalog and reading runs: listing, reading_run
3. Retail readings: listing_offer_reading, listing_channel_price, listing_map_price
4. Product data readings: spec_reading
5. AI visibility: competitor_brand, ai_prompt, ai_answer
6. Curated outputs: metric_registry, metric_value, estimate, estimate_input, action_item

## 2. Executive summary

`docs/v2/07-executive-summary.md` (written by COYOTE-Writer from registry facts only; accepted after review).

## 3. Weaknesses: resolved or still open in the new dashboard

| # | Weakness | Status | Proof |
| --- | --- | --- | --- |
| 1 | Authored figures outside retail | Resolved | Every node, widget, command center item, tour step, and chart value comes from `selectAll(bundle)`; `scripts/dashboard-v2/surfaces.test.ts` scans every surface string for number tokens and fails when one is not a selector output (it proves this with an injected literal). The old authored money, action, competitive, and citation figures are absent from `/dashboard-v2`. |
| 2 | Dollars without formula, inputs, date, owner, confidence | Resolved | `estimate` and `estimate_input` tables; `selectEstimate` returns unavailable while any input is missing, so the $680K and $38M to $62M figures do not appear anywhere on `/dashboard-v2`; the Estimates spoke shows each formula line as "unavailable: not stored". The one dollar figure shown, the price gap ($10,667.03), expands to its 48 lines and `scripts/dashboard-v2/money.test.ts` recomputes the sum from the lines. |
| 3 | Two competing retail stories | Resolved | `selectRetailHeadline` ranks the seller type's primary question first and the confirmed suppression finding second; Amazon's share of offers (55 of 1,007) is a drill-down card with its own denominator, never the node figure. |
| 4 | Unfinished higher-priority read hides a confirmed finding | Resolved | `pickHeadline` (tested in `reading-model.test.ts` and `selectors.test.ts`): the unavailable Partner-led question appears beside the headline as coverage; the command center's first item is the 48 suppressed offers. |
| 5 | Stale data inventory document | Resolved | `docs/dashboard-data-inventory.md` now opens with a superseded notice pointing to `docs/v2/01` and `02`; the registry lives in the sandbox table. |
| 6 | Controls that imply a capability | Resolved | No `filters` or `search` in the v2 spec (both are camera-only in the SDK); table filters change rows (`v2-tables.spec.ts`); action counts are `count(action_item)` rows (54); a failed read renders "unavailable" with the error (`v2-failed-read.spec.ts`); no static fallback spec exists for v2. |
| 7 | Evidence trails outside Portfolio Retail | Resolved | Every chart mark, card, and table row opens `Explainer` with meaning, as-of, coverage, formula, inputs, source tables, reading run, and links (`v2-explainer.spec.ts`). |
| 8 | Text-heavy first views | Resolved | Hub and every spoke open on a chart built from the same readings (`first-views.test.ts`); narrative sits in "Read more" tabs; labels are at most three words. |
| 9 | Tables without sort and filter | Resolved | `table-model.ts` sort on every column, type aware, nulls last; filters combine; empty state; incomplete rows stay filterable (`table-model.test.ts`, `v2-tables.spec.ts`). |
| 10 | Single-brand data model | Resolved in the model, pilot-only in data | `client.seller_type` with the primary question per type; every client table carries `client_id`; competitor brands, prompts, and match terms are rows, not literals. One client row (cl_fender) is loaded. |

Still open as data gaps, shown as unavailable with an open action each: the authorized-seller list (Partner-led headline), the MAP sheet (offers below MAP), the estimate inputs (both dollar estimates), and a reading that ties one listing's gap to one answer (the ecommerce-to-AI link stays an assumption).

## 4. Data flow, migrations, and the changes production would need

Data flow for `/dashboard-v2`:

```
command.* (sandbox project copy, as of 2026-10-08 19:30 UTC)
  ──0003_sandbox_load──► sandbox.{listing, reading_run, listing_offer_reading, listing_channel_price, spec_reading, ai_prompt, ai_answer, seller, competitor_brand}
  ──0005 refresh_metric_values──► sandbox.metric_value (one row per registry id and dimension, with numerator, denominator, run)
  ──0006──► sandbox.action_item (SQL-generated from readings), sandbox.estimate (no inputs)
sandbox.* ──PostgREST, server-only keys──► lib/dashboard-v2/data/reads.ts ──► selectors ──► canvas spec, panels, charts, tables, explainers ──► /dashboard-v2
```

Sandbox migrations applied (sandbox project only, schema `sandbox` only; files in `supabase/sandbox-migrations/`): 0001_sandbox_schema, 0002_sandbox_grants, 0003_sandbox_load, 0004_sandbox_views, 0005_sandbox_refresh (plus 0005b, the same function re-applied after a fix), 0006_sandbox_seed_outputs. Proof of the load: `docs/v2/05-sandbox-load.md`.

Changes production and the FenderTest workflow would need to match the sandbox model (full map in `docs/v2/schema/migration-map.md`):

- fender_catalog_harvester: write `listing` (stable facts) and a `listing_offer_reading` row per listing with `reading_run_id` and `read_at`; open and close a `reading_run` (source keepa_product) with population_count and rows_read.
- fender_buybox_seller_harvester: write `listing_offer_reading.featured_offer_seller_id, seller_class, seller_ships_with_amazon` and upsert `seller`; one `reading_run` per run (source keepa_seller).
- fender_omnichannel_audit_sync: write `featured_offer_withheld, offer_price, competitive_external_price_cents` on `listing_offer_reading`; stop writing `fmic_brand_kpi_summary` and `fmic_division_metrics` text values and call `refresh_metric_values` instead; stop copying any list price into a MAP column.
- fender_retail_buybox_map_audit and fender_map_checker_musiciansfriend: write one `listing_channel_price` row per listing, channel, and run (price, url, store_title, store_seller_name, store_msrp, match_confidence, match_status) and stop writing leakage columns; store the Musician's Friend product URL, which is not stored today.
- fender_spec_readiness_audit: write `spec_reading` with text[] missing-field lists and `additional_property_present`; cursor in `reading_run.cursor_end`.
- fender_ai_simulation_battery_real: upsert `ai_prompt`, write `ai_answer` with outcome, winner_brand_id, wrong_spec_flag and reason, engine, repeat_no; stop writing `fmic_competitor_sov`.
- Client-supplied tables with no writer today: `seller_authorization`, `listing_map_price`, `estimate_input`.
- Retire: `fmic_competitor_sov`, `fmic_ai_sim_conflict_snapshot`, `fmic_social_intelligence`, `fmic_dual_write_errors`, the 18 zero-row public work-register tables, the 7 command views and 11 canvas views (rebuilt over the new tables), and `fmic_job_state` (replaced by `reading_run`).

## 5. Blockers

(filled after verification)
