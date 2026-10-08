# Expected readings for the sandbox load check

Production values at 2026-10-08 19:30 UTC, read with SELECT only. After the `sandbox` schema is loaded from the sandbox project's `command` copy (same as-of), the reading-model selectors must reproduce these from sandbox rows. Any difference is a load defect, not a product change.

| Registry id | Expected | Query basis |
| --- | --- | --- |
| catalog_monitored | 3,604 listings; 1,007 with an active offer | `fmic_electric_catalog` count; `current_price is not null` |
| seller_mix | Amazon 55; third party 885; not read 67 (of 1,007) | `fmic_retail_buybox_map.buybox_status` on active rows |
| amazon_offer_share | 55 of 1,007 = 5.5 % | same |
| featured_offer_present | 945 present of 1,015 read (70 withheld) | `featured_offer_withheld` not null |
| featured_offer_suppressed | 48 | `competitive_offer_suppressed` in `canvas_retail_listings` |
| price_gap_above_benchmark | sum 10,667.03; min 5.92; max 1,215.67 over the 48 | `offer_price - competitive_price_threshold_cents / 100` |
| benchmark match | 19 of the 48 have a Musician's Friend stored price equal to the benchmark; 0 Walmart | `round(mf_price * 100) = competitive_price_threshold_cents` |
| benchmark coverage | 440 of 1,036 rows have a benchmark | `competitive_price_threshold_cents > 0` |
| channel_price_coverage | Walmart 116 priced of 1,033 checked (116 with url); Musician's Friend 306 priced of 341 checked | `wmt_price`, `wmt_checked_at`, `mf_price`, `mf_checked_at` |
| map_below | unavailable (0 of 1,036 rows have `map_price`) | |
| bundle_share | 399 of 1,007 active (419 of 1,036 rows) | `is_bundle` |
| spec_fender_page_found | 139 of 947 = 14.7 % | `canvas_private.spec_latest` |
| spec_additional_property_missing | 139 of 139 | `fender_missing_fields ilike '%additionalProperty%'` |
| spec_amazon_completeness | 91.5 % | avg `amazon_completeness_pct` |
| ai_answer_share | 3,209 of 3,885 = 82.6 %; 4,287 answers; 260 unclear; 142 errors | `canvas_private.sims_all` |
| ai_answer_share_by_category | beginner 168 of 287 = 58.5 %; Yamaha 111 of 287 = 38.7 %; gap 19.9 | `canvas_ai_category` |
| ai_wrong_spec_flags | 222 | `hallucination_flag` |
| ai_answer_share_by_engine | engine stored on 114 of 4,287 (gemini 45, chatgpt 36, perplexity 33) | `canvas_ai_engine` |
| ai_battery_freshness | 2026-10-05 16:26:36 UTC | max `created_at` |
| reading_freshness | catalog 2026-10-08 19:30; seller 19:30; benchmark 18:41; Walmart 18:53; Musician's Friend 18:38; spec 19:03; AI 2026-10-05 16:26 | `fmic_job_state`, `fmic_brand_kpi_summary`, `fmic_ai_simulations` |
| catalog_by_category | Solid Body 3,202; Electric Guitar Kits 223; Electric Guitars 109; Hollow & Semi-Hollow Body 68; Bags, Cases & Covers 1; Tuning Pegs 1 (plus any uncategorized) | `fmic_electric_catalog.category` as of the Oct 8 recompute |
| estimate_phase1_uplift, estimate_enterprise_range | unavailable (no inputs) | |
| action_items_open | count of seeded `action_item` rows | |
