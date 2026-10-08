# IntoFocus client dashboard v2: migration map (v0.1, 2026-10-08)

Target: Postgres schema `sandbox`, loaded from `command`. Every loaded row gets `client_id = <pilot client>` and a `reading_run_id`. Old rows with no matching run get a backfill `reading_run` (trigger_type `backfill`, legacy_run_key = old batch id).

## command tables (18)

| Current table | Rows | Decision | Target | Notes |
|---|---|---|---|---|
| fmic_electric_catalog | 3,604 | renamed + split | listing (stable facts), listing_offer_reading (price, rank, stock, offers) | the current_price test becomes offer_status on the latest reading (no is_active column exists) |
| fmic_retail_buybox_map | 1,036 | split | listing_offer_reading (Featured Offer, benchmark, seller), listing_channel_price (Walmart, Musician's Friend, Amazon rows), listing.bundle_name | map_price column retired; MAP comes from listing_map_price |
| fmic_sellers | 33 | renamed | seller | authorization moves to seller_authorization (client-supplied) |
| listing_channel_price | 0 | kept (reshaped) | listing_channel_price | adds client_id, reading_run_id, read_at, match_status, price_cents |
| fmic_spec_readiness | 1,977 | renamed | spec_reading | semicolon lists become text[] |
| fmic_ai_simulations | 2,320 | merged | ai_prompt + ai_answer (legacy_source live) | |
| fmic_ai_simulations_run1_archive | 2,007 | merged | ai_answer (legacy_source run1_archive) | engine loads as unknown when absent |
| fmic_ai_sim_conflict_snapshot | 66 | merged | ai_answer (legacy_source conflict_snapshot) | rows duplicating a live row are skipped |
| fmic_competitor_sov | 16 | retired (brand names kept) | competitor_brand | share of voice is recomputed from ai_answer into metric_value |
| fmic_brand_kpi_summary | 1,306 | merged | metric_registry + metric_value | text values parsed to numeric_value; display text dropped |
| fmic_division_metrics | 1,303 | merged | metric_value (dimension_name category) | authored division names retired; category comes from listing |
| fmic_audit_runs | 746 | renamed | reading_run | |
| fmic_job_state | 7 | merged | reading_run.cursor_end / detail | next cursor = cursor_end of latest run per source |
| fmic_social_intelligence | 2 | retired | none | no workflow reads it; no registry row needs it |
| fmic_dual_write_errors | 1 | retired | none | ops log for the old dual write; failed runs now show as reading_run.status failed with detail |
| organizations | 2 | kept in command | client.organization_id (by value) | login data, not modeled |
| organization_memberships | 4 | kept in command | none | login data |
| user_profiles | 2 | kept in command | none | login data |

## command views (7): all retired, rebuilt as sandbox views over the new tables

| View | Rebuilt from |
|---|---|
| v_fmic_ai_simulations_all | ai_answer + ai_prompt |
| v_fmic_ai_simulations_latest | ai_answer, latest reading_run of source ai_battery |
| v_fmic_brand_kpi_summary_latest | metric_value latest per registry_key |
| v_fmic_division_metrics_latest | metric_value latest per registry_key and dimension_value |
| v_fmic_listing_monitor | listing + latest listing_offer_reading |
| v_fmic_retail_buybox_latest | latest listing_offer_reading + latest listing_channel_price per channel |
| v_fmic_spec_readiness_latest | latest spec_reading per listing |

## public views (11): all retired, rebuilt over sandbox

| View | Rebuilt from |
|---|---|
| canvas_ai_category | ai_answer + ai_prompt by category |
| canvas_ai_engine | ai_answer by engine |
| canvas_ai_simulations | ai_answer + ai_prompt |
| canvas_competitor_sov | ai_answer + competitor_brand |
| canvas_divisions | listing by category + metric_value |
| canvas_freshness | reading_run max(finished_at) per source, with status |
| canvas_listing_channel_price | listing_channel_price |
| canvas_metrics | metric_registry + metric_value |
| canvas_retail_listings | listing + latest listing_offer_reading + seller |
| canvas_spec_missing_fields | spec_reading unnest of the missing-field arrays |
| canvas_spec_readiness | spec_reading |

## public tables (18, all 0 rows): retired

organizations, profiles, organization_memberships, departments, people, role_seats, role_assignments, role_responsibilities, audit_log, modules, work_items, work_milestones, work_source_links, work_dependencies, components, variants, votes, brand_tokens. Decision for each: **retired**, target none. They're an empty work-register and design-system scaffold, and no dashboard output reads them. No workflow writes them, so no writer changes.

## Workflow writes that must change

| Wrench | Writes today | Writes in the new model |
|---|---|---|
| fender_catalog_harvester | fmic_electric_catalog: asin, title, brand, manufacturer, model_number, upc, ean, color, category, parent_asin, url, list price, current price, sales_rank, monthly_sold, offer_count_new, amazon_stock, extracted_at (current_price not null means active) | listing (stable facts, amazon_list_price, last_harvested_at); listing_offer_reading (listed_price, sales_rank, monthly_sold, offer_count_new, amazon_stock, offer_status) with reading_run_id and read_at; opens and closes a reading_run (source keepa_product) |
| fender_buybox_seller_harvester | fmic_retail_buybox_map: buybox seller id, seller class, buybox_is_fba; fmic_sellers: name, rating, rating count | listing_offer_reading.featured_offer_seller_id, seller_class, seller_ships_with_amazon (was buybox_is_fba); seller upsert; reading_run (source keepa_seller) |
| fender_omnichannel_audit_sync | fmic_retail_buybox_map: buyBoxIsUnqualified, offer incl. shipping, competitivePriceThreshold, status; fmic_audit_runs | listing_offer_reading.featured_offer_withheld, offer_price, competitive_external_price_cents, legacy_status; reading_run instead of fmic_audit_runs |
| fender_retail_buybox_map_audit | fmic_retail_buybox_map: walmart price, walmart url, walmart seller, match confidence, leakage, map_price | listing_channel_price rows (channel walmart): price, url, store_seller_name, match_confidence, match_status, checked_at; stops writing leakage and map_price |
| fender_map_checker_musiciansfriend | fmic_retail_buybox_map: mf price, mf url, mf msrp, mf_leakage | listing_channel_price rows (channel musiciansfriend): price, url, store_msrp, checked_at; stops writing mf_leakage |
| fender_spec_readiness_audit | fmic_spec_readiness: run id, title, category, amazon found/missing, completeness pct, fender page found, url, fields, missing list; fmic_job_state cursor | spec_reading with text[] lists and additional_property_present; reading_run cursor_end replaces fmic_job_state |
| fender_ai_simulation_battery_real | fmic_ai_simulations: sim_id, category, prompt, engine, winner, hallucination flag/text, response, citations, remediation; fmic_competitor_sov | ai_prompt upsert; ai_answer (engine, repeat_no, outcome, winner_brand_id, wrong_spec_flag, wrong_spec_reason, answer_text, citations, citation_urls, remediation_note); stops writing fmic_competitor_sov |
| (KPI writers inside the audits) | fmic_brand_kpi_summary, fmic_division_metrics | metric_value with numeric_value, numerator, denominator |

## Columns written today that the model drops

| Column (table) | Reason |
|---|---|
| leakage_amount, wmt_leakage, mf_leakage (fmic_retail_buybox_map) | Derived from stored prices; computed in views, not stored |
| map_price (fmic_retail_buybox_map) | Null or the list price used as a stand-in; replaced by client-supplied listing_map_price |
| buybox_share_pct (fmic_retail_buybox_map) | Never measured |
| reviews_count (fmic_retail_buybox_map) | Always 0; no reader fills it. Would be a fake measured zero |
| channels text (fmic_retail_buybox_map) | Replaced by one listing_channel_price row per channel |
| model_name (fmic_electric_catalog) | Parsed from title; title and model_number are kept |
| current_price IS NOT NULL as the active test (fmic_electric_catalog; no is_active column exists) | offer_status on each reading replaces the current_price test |
| amazon_completeness_pct, fender_completeness_pct (fmic_spec_readiness) | Derived as found / expected |
| schema_sync_pct (fmic_division_metrics) | Literal 0 written for every row; not a measurement |
| title, category copies (fmic_spec_readiness) | Duplicates of listing |
| sov_pct, fender_win_rate (fmic_competitor_sov) | Derived from ai_answer |
| metric_value display text, status_tone, trend_direction (fmic_brand_kpi_summary) | Presentation; numeric_value plus registry carry the meaning |
| primary_threat, strategic_action, splinter_bundles (fmic_division_metrics) | Authored prose tied to retired divisions; actions move to action_item |
| created_at / updated_at on reading tables | Replaced by read_at and the run's started_at / finished_at |
| fmic_job_state.extra, fmic_audit_runs.metadata | Kept as reading_run.detail (renamed, not dropped) |
| all fmic_social_intelligence and fmic_dual_write_errors columns | Tables retired (see above) |

Carried, by request: Walmart match confidence (listing_channel_price.match_confidence), Walmart seller (store_seller_name), Musician's Friend MSRP (store_msrp), offer_count_new, buybox_is_fba (seller_ships_with_amazon), sales_rank, monthly_sold, amazon_stock (listing_offer_reading), spec missing-field lists (spec_reading text[]).

Column names on the "writes today" side come from the audit brief. The coding agent should confirm them against information_schema before load.
