-- 0003_sandbox_load.sql
-- Backfill of schema sandbox from the sandbox project's own command.* and canvas_private.* copies.
-- As-of: 2026-10-08 19:30 UTC (recorded as detail.as_of on every backfill run). Every row belongs to client cl_fender.
-- Fixed backfill run ids (reading_run.reading_run_id), referenced by later migrations and views:
--   R1 a0000000-0000-4000-8000-000000000001 keepa_product          fender_catalog_harvester
--   R2 a0000000-0000-4000-8000-000000000002 keepa_seller           fender_buybox_seller_harvester
--   R3 a0000000-0000-4000-8000-000000000003 keepa_product          fender_omnichannel_audit_sync (Featured Offer + benchmark pass)
--   R4 a0000000-0000-4000-8000-000000000004 walmart_price          fender_retail_buybox_map_audit
--   R5 a0000000-0000-4000-8000-000000000005 musiciansfriend_price  fender_map_checker_musiciansfriend
--   R6 a0000000-0000-4000-8000-000000000006 spec_check             fender_spec_readiness_audit
--   R7 a0000000-0000-4000-8000-000000000007 ai_battery             orphan sims_all rows (created only when such rows exist)
--   R8 a0000000-0000-4000-8000-000000000008 sweetwater_price       legacy command.listing_channel_price rows (only when rows exist)
--   R9 a0000000-0000-4000-8000-000000000009 reverb_price           legacy command.listing_channel_price rows (only when rows exist)
-- workflow_execution_id for R1 and R3 both derive from source keepa_product, so R3 carries the suffix "_benchmark" to stay unique.
-- Source column names were confirmed against information_schema.columns in the sandbox project before this was written.

-- 1. seller_type (reference data, from schema.json sample)
insert into sandbox.seller_type (seller_type, label, primary_retail_question, description) values
  ('partner_led', 'Partner-led', 'Does an authorized seller hold a healthy Featured Offer on each active listing?', 'Authorized resellers sell the brand on Amazon; the brand doesn''t sell there itself.'),
  ('brand_led_marketplace', 'Brand-led marketplace', 'Does the brand''s own seller account hold the Featured Offer at a healthy price?', 'The brand sells on Amazon through its own seller account.'),
  ('amazon_retail_only', 'Amazon Retail only', 'Does Amazon Retail keep each listing in stock and hold the Featured Offer?', 'The brand sells wholesale to Amazon, and Amazon Retail sells to shoppers.'),
  ('hybrid', 'Hybrid', 'Is the seller holding the Featured Offer on each listing the one the brand planned for?', 'The brand mixes Amazon Retail, its own account, and partners across listings.'),
  ('no_managed_presence', 'No managed presence', 'Who sells the brand''s products on Amazon today, and at what price?', 'The brand doesn''t manage Amazon; whoever lists the products sells them.');

-- 2. client
insert into sandbox.client (client_id, name, slug, seller_type, organization_id, brand_site_domain, is_active, onboarded_at, updated_at)
select 'cl_fender', 'Fender', 'fender', 'partner_led', o.id, 'fender.com', true, o.created_at, now()
from command.organizations o
where o.slug = 'fender';

-- 3. seller: every fmic_sellers row, plus any seller id the catalog references that fmic_sellers lacks
insert into sandbox.seller (seller_id, marketplace, seller_name, is_amazon_retail, ships_with_amazon, rating_pct, rating_count, first_seen_at, updated_at)
select s.seller_id, 'amazon', s.seller_name, coalesce(s.is_amazon, false), s.is_fba, s.rating_pct, s.rating_count, s.first_seen, s.updated_at
from command.fmic_sellers s
union all
select distinct c.buybox_seller, 'amazon', null::text, (c.buybox_seller = 'ATVPDKIKX0DER'), null::boolean, null::integer, null::integer, null::timestamptz, null::timestamptz
from command.fmic_electric_catalog c
where c.buybox_seller is not null
  and not exists (select 1 from command.fmic_sellers s where s.seller_id = c.buybox_seller);

-- 4. listing: one per catalog row
insert into sandbox.listing (listing_id, client_id, retailer, asin, parent_listing_id, parent_asin, title, brand, manufacturer, model_number, upc, ean, color, category, is_bundle, bundle_name, url, amazon_list_price, first_seen_at, last_harvested_at, updated_at)
select 'lst_' || c.asin, 'cl_fender', 'amazon', c.asin,
       case when exists (select 1 from command.fmic_electric_catalog p where p.asin = c.parent_asin) then 'lst_' || c.parent_asin end,
       c.parent_asin, c.title, c.brand, c.manufacturer, c.model_number, c.upc, c.ean, c.color, c.category,
       coalesce(c.is_bundle, false), m.bundle_name, c.product_url, c.list_price, c.created_at, c.extracted_at, c.updated_at
from command.fmic_electric_catalog c
left join command.fmic_retail_buybox_map m on m.asin = c.asin;

-- 5. backfill reading runs
-- R1 catalog harvest
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
select 'a0000000-0000-4000-8000-000000000001', 'cl_fender', 'keepa_product', 'fender_catalog_harvester', 'backfill_keepa_product_20261008T1930', 'backfill',
       min(c.created_at), max(c.updated_at), 'complete', count(*), count(*), 'catalog_harvester',
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.fmic_electric_catalog',
                          'population', count(*), 'rows_read', count(*),
                          'active_listings', count(*) filter (where c.current_price is not null),
                          'source_max_write', max(c.updated_at))
from command.fmic_electric_catalog c;

-- R2 seller read
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
select 'a0000000-0000-4000-8000-000000000002', 'cl_fender', 'keepa_seller', 'fender_buybox_seller_harvester', 'backfill_keepa_seller_20261008T1930', 'backfill',
       coalesce(min(c.buybox_checked_at) filter (where c.current_price is not null), min(c.created_at)), max(c.buybox_checked_at), 'partial',
       count(*) filter (where c.current_price is not null),
       count(*) filter (where c.current_price is not null and c.buybox_seller is not null),
       'buybox_seller_harvester',
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.fmic_electric_catalog',
                          'population', count(*) filter (where c.current_price is not null),
                          'rows_read', count(*) filter (where c.current_price is not null and c.buybox_seller is not null),
                          'not_read', count(*) filter (where c.current_price is not null and c.buybox_seller is null),
                          'source_max_write', max(c.buybox_checked_at))
from command.fmic_electric_catalog c;

-- R3 Featured Offer and benchmark pass
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, findings_count, legacy_run_key, detail)
select 'a0000000-0000-4000-8000-000000000003', 'cl_fender', 'keepa_product', 'fender_omnichannel_audit_sync', 'backfill_keepa_product_benchmark_20261008T1930', 'backfill',
       (select min(created_at) from command.fmic_retail_buybox_map),
       k.finished_at, 'partial',
       (select count(*) from command.fmic_electric_catalog where current_price is not null),
       (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price is not null and m.competitive_price_threshold_cents > 0),
       (select count(*) from command.fmic_retail_buybox_map m where m.featured_offer_withheld and m.competitive_price_threshold_cents > 0 and round(m.offer_price * 100) > m.competitive_price_threshold_cents),
       k.audit_run_id::text,
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.fmic_retail_buybox_map',
                          'population', (select count(*) from command.fmic_electric_catalog where current_price is not null),
                          'rows_read', (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price is not null and m.competitive_price_threshold_cents > 0),
                          'map_rows', (select count(*) from command.fmic_retail_buybox_map),
                          'withheld_read', (select count(*) from command.fmic_retail_buybox_map where featured_offer_withheld is not null),
                          'benchmark_rows', (select count(*) from command.fmic_retail_buybox_map where competitive_price_threshold_cents > 0),
                          'latest_audit_run_id', k.audit_run_id,
                          'source_max_write', (select max(updated_at) from command.fmic_retail_buybox_map))
from (select audit_run_id, created_at as finished_at from command.fmic_brand_kpi_summary order by created_at desc limit 1) k;

-- R4 Walmart
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, cursor_end, legacy_run_key, detail)
select 'a0000000-0000-4000-8000-000000000004', 'cl_fender', 'walmart_price', 'fender_retail_buybox_map_audit', 'backfill_walmart_price_20261008T1930', 'backfill',
       coalesce(min(m.wmt_checked_at), min(m.created_at)), j.last_run_at, 'partial',
       count(*), count(*) filter (where m.wmt_checked_at is not null), j.cursor_offset, 'map_leakage_walmart',
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.fmic_retail_buybox_map',
                          'population', count(*), 'rows_read', count(*) filter (where m.wmt_checked_at is not null),
                          'priced', count(*) filter (where m.wmt_price > 0),
                          'job_state_extra', j.extra, 'source_max_write', max(m.wmt_checked_at))
from command.fmic_retail_buybox_map m
cross join (select last_run_at, cursor_offset, extra from command.fmic_job_state where job_key = 'map_leakage_walmart') j
group by j.last_run_at, j.cursor_offset, j.extra;

-- R5 Musician's Friend
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, cursor_end, legacy_run_key, detail)
select 'a0000000-0000-4000-8000-000000000005', 'cl_fender', 'musiciansfriend_price', 'fender_map_checker_musiciansfriend', 'backfill_musiciansfriend_price_20261008T1930', 'backfill',
       coalesce((select min(mf_checked_at) from command.fmic_retail_buybox_map), (select min(created_at) from command.fmic_retail_buybox_map)),
       j.last_run_at, 'partial',
       (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price >= 100 and not coalesce(c.is_bundle, false)),
       (select count(*) from command.fmic_retail_buybox_map where mf_checked_at is not null),
       j.cursor_offset, 'map_parity_musiciansfriend',
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.fmic_retail_buybox_map',
                          'population', (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price >= 100 and not coalesce(c.is_bundle, false)),
                          'population_rule', 'map rows joined to catalog with current_price >= 100 and not bundle',
                          'rows_read', (select count(*) from command.fmic_retail_buybox_map where mf_checked_at is not null),
                          'priced', (select count(*) from command.fmic_retail_buybox_map where mf_price > 0),
                          'job_state_extra', j.extra, 'source_max_write', (select max(mf_checked_at) from command.fmic_retail_buybox_map))
from (select last_run_at, cursor_offset, extra from command.fmic_job_state where job_key = 'map_parity_musiciansfriend') j;

-- R6 spec readiness
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, cursor_end, legacy_run_key, detail)
select 'a0000000-0000-4000-8000-000000000006', 'cl_fender', 'spec_check', 'fender_spec_readiness_audit', 'backfill_spec_check_20261008T1930', 'backfill',
       (select min(coalesce(checked_at, created_at)) from command.fmic_spec_readiness),
       (select max(checked_at) from command.fmic_spec_readiness), 'partial',
       (select count(*) from command.fmic_electric_catalog where buybox_seller is not null),
       (select count(distinct asin) from command.fmic_spec_readiness),
       j.cursor_offset,
       (select batch_run_id from command.fmic_spec_readiness order by checked_at desc nulls last limit 1),
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.fmic_spec_readiness',
                          'population', (select count(*) from command.fmic_electric_catalog where buybox_seller is not null),
                          'population_rule', 'catalog rows with buybox_seller not null',
                          'rows_read', (select count(distinct asin) from command.fmic_spec_readiness),
                          'source_rows', (select count(*) from command.fmic_spec_readiness),
                          'source_rows_skipped_not_in_catalog', (select count(*) from command.fmic_spec_readiness s where not exists (select 1 from command.fmic_electric_catalog c where c.asin = s.asin)),
                          'job_state_extra', j.extra, 'source_max_write', (select max(checked_at) from command.fmic_spec_readiness))
from (select cursor_offset, extra from command.fmic_job_state where job_key = 'spec_readiness') j;

-- AI battery runs: one per fmic_audit_runs row that is a battery call or is referenced by sims_all; original uuid kept
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, findings_count, legacy_run_key, detail)
select r.id, 'cl_fender', 'ai_battery', coalesce(r.metadata->>'source', 'fender_ai_simulation_battery_real'),
       coalesce(r.workflow_execution_id, 'legacy_audit_run_' || r.id::text), 'manual',
       r.started_at, r.completed_at, 'complete', coalesce(s.n, 0), coalesce(s.n, 0), s.flags, r.id::text,
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.fmic_audit_runs',
                          'legacy_trigger_type', r.trigger_type, 'legacy_status', r.status,
                          'asins_audited', r.asins_audited, 'violations_detected', r.violations_detected,
                          'answers', coalesce(s.n, 0), 'workflow_execution_id_was_null', (r.workflow_execution_id is null),
                          'metadata', r.metadata)
from command.fmic_audit_runs r
left join (select audit_run_id, count(*) as n, count(*) filter (where hallucination_flag) as flags from canvas_private.sims_all group by audit_run_id) s on s.audit_run_id = r.id
where r.metadata->>'source' = 'fender_ai_simulation_battery_real' or s.n is not null;

-- R7: sims_all rows whose audit_run_id has no fmic_audit_runs row (created only when such rows exist)
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
select 'a0000000-0000-4000-8000-000000000007', 'cl_fender', 'ai_battery', 'fender_ai_simulation_battery_real', 'backfill_ai_battery_20261008T1930', 'backfill',
       min(s.created_at), max(s.created_at), 'partial', count(*), count(*), null,
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'canvas_private.sims_all',
                          'population', count(*), 'rows_read', count(*), 'note', 'answers whose audit_run_id has no fmic_audit_runs row',
                          'orphan_audit_run_ids', (select jsonb_agg(distinct s2.audit_run_id) from canvas_private.sims_all s2 where not exists (select 1 from command.fmic_audit_runs r where r.id = s2.audit_run_id)))
from canvas_private.sims_all s
where not exists (select 1 from command.fmic_audit_runs r where r.id = s.audit_run_id)
having count(*) > 0;

-- R8 / R9: legacy command.listing_channel_price rows for channels with no backfill run of their own (created only when rows exist)
insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
select case l.channel when 'sweetwater' then 'a0000000-0000-4000-8000-000000000008'::uuid else 'a0000000-0000-4000-8000-000000000009'::uuid end,
       'cl_fender', l.channel || '_price', 'legacy_listing_channel_price', 'backfill_' || l.channel || '_price_20261008T1930', 'backfill',
       min(l.checked_at), max(l.checked_at), 'partial', count(*), count(*), null,
       jsonb_build_object('as_of', '2026-10-08T19:30:00Z', 'source_table', 'command.listing_channel_price', 'population', count(*), 'rows_read', count(*))
from command.listing_channel_price l
where l.channel in ('sweetwater', 'reverb')
group by l.channel
having count(*) > 0;

-- 6. listing_offer_reading
-- R1 rows: every listing, catalog facts
insert into sandbox.listing_offer_reading (listing_offer_reading_id, client_id, listing_id, reading_run_id, read_at, offer_status, listed_price, sales_rank, monthly_sold, offer_count_new, amazon_stock)
select 'lor_' || c.asin || '_r1', 'cl_fender', 'lst_' || c.asin, 'a0000000-0000-4000-8000-000000000001',
       coalesce(c.extracted_at, c.updated_at),
       case when c.current_price is not null then 'active' else 'no_active_offer' end,
       c.current_price, c.sales_rank, c.monthly_sold, c.offer_count_new, c.amazon_stock
from command.fmic_electric_catalog c;

-- R2 rows: active listings, seller fields
insert into sandbox.listing_offer_reading (listing_offer_reading_id, client_id, listing_id, reading_run_id, read_at, offer_status, featured_offer_seller_id, seller_class, seller_ships_with_amazon)
select 'lor_' || c.asin || '_r2', 'cl_fender', 'lst_' || c.asin, 'a0000000-0000-4000-8000-000000000002',
       coalesce(c.buybox_checked_at, r.finished_at), 'active',
       c.buybox_seller,
       case when c.buybox_seller = 'ATVPDKIKX0DER' then 'amazon_retail'
            when c.buybox_seller is not null then 'third_party'
            else 'not_read' end,
       c.buybox_is_fba
from command.fmic_electric_catalog c
cross join (select finished_at from sandbox.reading_run where reading_run_id = 'a0000000-0000-4000-8000-000000000002') r
where c.current_price is not null;

-- R3 rows: every fmic_retail_buybox_map row, Featured Offer and benchmark fields
insert into sandbox.listing_offer_reading (listing_offer_reading_id, client_id, listing_id, reading_run_id, read_at, offer_status, featured_offer_withheld, offer_price, competitive_external_price_cents, legacy_status)
select 'lor_' || m.asin || '_r3', 'cl_fender', 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000003',
       m.updated_at,
       case when m.buybox_status = 'No Active Offer' then 'no_active_offer' else 'active' end,
       m.featured_offer_withheld, m.offer_price,
       case when m.competitive_price_threshold_cents > 0 then m.competitive_price_threshold_cents end,
       m.buybox_status
from command.fmic_retail_buybox_map m;

-- 7. listing_channel_price
-- Walmart rows (R4)
insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at, store_title, store_seller_name, match_confidence)
select 'lcp_' || m.asin || '_walmart', 'cl_fender', 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000004',
       m.wmt_checked_at, 'walmart',
       case when m.wmt_price > 0 then 'priced' else 'no_match' end,
       case when m.wmt_price > 0 then m.wmt_price end,
       m.wmt_url, m.wmt_checked_at, m.wmt_title, m.wmt_seller, m.wmt_match_conf
from command.fmic_retail_buybox_map m
where m.wmt_checked_at is not null;

-- Musician's Friend rows (R5)
insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at, store_title, store_msrp)
select 'lcp_' || m.asin || '_musiciansfriend', 'cl_fender', 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000005',
       m.mf_checked_at, 'musiciansfriend',
       case when m.mf_price > 0 then 'priced' else 'no_match' end,
       case when m.mf_price > 0 then m.mf_price end,
       null, m.mf_checked_at, m.mf_title, m.mf_msrp
from command.fmic_retail_buybox_map m
where m.mf_checked_at is not null;

-- Amazon rows (R3): the offer price copied so MAP checks run the same way on every channel
insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at, store_title, store_seller_name)
select 'lcp_' || m.asin || '_amazon', 'cl_fender', 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000003',
       m.updated_at, 'amazon', 'priced', m.offer_price, c.product_url, m.updated_at, c.title, s.seller_name
from command.fmic_retail_buybox_map m
join command.fmic_electric_catalog c on c.asin = m.asin
left join command.fmic_sellers s on s.seller_id = c.buybox_seller
where m.offer_price is not null;

-- Legacy command.listing_channel_price rows (zero today; included so a future row flows through)
insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at)
select 'lcp_' || l.asin || '_' || l.channel || '_legacy', 'cl_fender', 'lst_' || l.asin, r.reading_run_id,
       l.checked_at, l.channel,
       case when l.price > 0 then 'priced' else 'no_match' end,
       case when l.price > 0 then l.price end,
       l.url, l.checked_at
from command.listing_channel_price l
join sandbox.listing li on li.listing_id = 'lst_' || l.asin
join sandbox.reading_run r on r.workflow_execution_id = case l.channel
       when 'amazon' then 'backfill_keepa_product_benchmark_20261008T1930'
       when 'walmart' then 'backfill_walmart_price_20261008T1930'
       when 'musiciansfriend' then 'backfill_musiciansfriend_price_20261008T1930'
       when 'sweetwater' then 'backfill_sweetwater_price_20261008T1930'
       when 'reverb' then 'backfill_reverb_price_20261008T1930' end
where l.channel in ('amazon', 'walmart', 'musiciansfriend', 'sweetwater', 'reverb')
on conflict on constraint listing_channel_price_listing_id_channel_reading_run_id_key do nothing;

-- 8. spec_reading: every fmic_spec_readiness row whose asin is in the catalog (append-only history under R6)
insert into sandbox.spec_reading (spec_reading_id, client_id, listing_id, reading_run_id, read_at, amazon_checked, amazon_fields_found, amazon_fields_expected, amazon_missing_fields, brand_site_page_found, brand_site_url, brand_site_fields_found, brand_site_fields_expected, brand_site_missing_fields, additional_property_present)
select 'spr_' || s.id, 'cl_fender', 'lst_' || s.asin, 'a0000000-0000-4000-8000-000000000006',
       coalesce(s.checked_at, s.created_at),
       coalesce(s.amazon_checked, false), s.amazon_fields_found, s.amazon_fields_expected,
       string_to_array(nullif(s.amazon_missing_fields, ''), ';'),
       coalesce(s.fender_found, false), s.fender_url, s.fender_fields_found, s.fender_fields_expected,
       string_to_array(nullif(s.fender_missing_fields, ''), ';'),
       case when s.fender_found then not (coalesce(s.fender_missing_fields, '') ilike '%additionalProperty%') else null end
from command.fmic_spec_readiness s
where exists (select 1 from command.fmic_electric_catalog c where c.asin = s.asin);

-- 9. competitor_brand
insert into sandbox.competitor_brand (competitor_brand_id, client_id, name, is_client_brand, match_terms) values
  ('cb_fender', 'cl_fender', 'Fender', true, array['fender', 'squier', 'player ii', 'american professional', 'american ultra', 'acoustasonic', 'mustang micro', 'tone master']),
  ('cb_prs', 'cl_fender', 'PRS', false, array['prs']),
  ('cb_taylor', 'cl_fender', 'Taylor', false, array['taylor']),
  ('cb_yamaha', 'cl_fender', 'Yamaha', false, array['yamaha']),
  ('cb_ibanez', 'cl_fender', 'Ibanez', false, array['ibanez']),
  ('cb_gibson', 'cl_fender', 'Gibson', false, array['gibson']),
  ('cb_boss', 'cl_fender', 'Boss', false, array['boss']),
  ('cb_positive_grid', 'cl_fender', 'Positive Grid', false, array['positive grid']),
  ('cb_sire', 'cl_fender', 'Sire', false, array['sire']);

-- 10. ai_prompt: the distinct prompts after stripping the trailing " [engine]" suffix; legacy_sim_id = prompt index
insert into sandbox.ai_prompt (ai_prompt_id, client_id, category, prompt_text, names_client_product, is_active, legacy_sim_id)
select 'pr_' || lpad(d.pidx::text, 2, '0'), 'cl_fender', d.category, d.ptext, (d.category = 'hallucinations'), true, d.pidx::text
from (select distinct ((sim_id % 1000) - 1) / 10 as pidx, category,
             regexp_replace(prompt, '\s*\[(chatgpt|perplexity|gemini)\]$', '') as ptext
      from canvas_private.sims_all) d;

-- 11. ai_answer: one per canvas_private.sims_all row
insert into sandbox.ai_answer (ai_answer_id, client_id, ai_prompt_id, reading_run_id, read_at, answered_at, engine, repeat_no, outcome, winner_brand_id, wrong_spec_flag, wrong_spec_reason, answer_text, citations, citation_urls, remediation_note, legacy_source)
select s.id::text, 'cl_fender',
       'pr_' || lpad((((s.sim_id % 1000) - 1) / 10)::text, 2, '0'),
       case when exists (select 1 from command.fmic_audit_runs r where r.id = s.audit_run_id) then s.audit_run_id
            else 'a0000000-0000-4000-8000-000000000007'::uuid end,
       s.created_at, s.created_at,
       coalesce(s.engine,
                substring(s.prompt from '\[(chatgpt|perplexity|gemini)\]$'),
                (array['chatgpt', 'perplexity', 'gemini'])[((s.sim_id % 1000) - 1) % 10 + 1],
                'unknown'),
       coalesce(s.repeat_no, s.sim_id / 1000),
       case when s.winner is null or s.winner = 'Error' then 'error'
            when s.winner = 'Unclear' then 'unclear'
            else 'resolved' end,
       b.competitor_brand_id,
       coalesce(s.hallucination_flag, false), nullif(s.root_cause, ''),
       s.answer_text, l.citations,
       string_to_array(nullif(s.citation_urls, ''), ' | '),
       s.remediation_patch, s.source_table
from canvas_private.sims_all s
left join command.fmic_ai_simulations l on l.id = s.id and s.source_table = 'live'
left join sandbox.competitor_brand b
       on b.client_id = 'cl_fender'
      and s.winner is not null and s.winner not in ('Error', 'Unclear')
      and b.name = case when s.winner = 'Fender/Squier' then 'Fender' else s.winner end;

-- 12. metric_registry: the 25 rows of data/v2/metric-registry.seed.json (registry_key = 'cl_fender:' || id)
insert into sandbox.metric_registry (registry_key, client_id, registry_id, name, meaning, unit, population, formula, source_tables, owner, confidence, status_rule, notes) values
  ('cl_fender:ai_answer_share', 'cl_fender', 'ai_answer_share', 'AI answer share', 'Of the AI answers that named a brand, how often it was Fender or Squier.', 'percent', 'Every answer in the simulation battery, all runs, where the scorer resolved a brand. Unclear answers and errors are excluded.', 'fender_wins / resolved_answers', array['ai_answer'], 'intofocus', 'measured', '{"kind":"higher_is_better","warn":80,"danger":65}'::jsonb, 'Keyword scorer: an answer counts as a Fender win when it mentions Fender terms at least as often as rival names.'),
  ('cl_fender:ai_answer_share_by_category', 'cl_fender', 'ai_answer_share_by_category', 'Weakest category', 'The prompt category where Fender is named least, and the rival named most there.', 'percent', 'Resolved answers per category; categories with fewer than 10 resolved answers are not ranked; the hallucinations category is excluded because its prompts name Fender products.', 'per category: fender_wins / resolved; gap = fender share minus top rival share', array['ai_answer'], 'intofocus', 'measured', '{"kind":"higher_is_better","warn":70,"danger":50}'::jsonb, null),
  ('cl_fender:ai_wrong_spec_flags', 'cl_fender', 'ai_wrong_spec_flags', 'Answers flagged for a wrong spec', 'Answers that stated a product fact the rule set knows is false.', 'count', 'All answers, all runs.', 'count(flag)', array['ai_answer'], 'intofocus', 'measured', '{"kind":"count_is_bad","warn":1,"danger":50}'::jsonb, 'Four fixed text rules; each flag carries the rule text as its reason.'),
  ('cl_fender:ai_answer_share_by_engine', 'cl_fender', 'ai_answer_share_by_engine', 'Share by engine', 'AI answer share split by ChatGPT, Perplexity, and Gemini.', 'percent', 'Answers with a stored engine.', 'per engine: fender_wins / resolved', array['ai_answer'], 'intofocus', 'measured', null, 'Most archived answers have no engine stored.'),
  ('cl_fender:ai_battery_freshness', 'cl_fender', 'ai_battery_freshness', 'Last AI read', 'When the simulation battery last wrote an answer.', 'timestamp', 'All answers.', 'max(answered_at)', array['ai_answer'], 'intofocus', 'measured', null, null),
  ('cl_fender:retail_control_partner_led', 'cl_fender', 'retail_control_partner_led', 'Healthy Featured Offer, authorized seller', 'Share of active Amazon listings where a Featured Offer is present and the seller holding it is on the client''s authorized list.', 'percent', 'Active offers.', 'count(featured offer present AND seller authorized) / active offers', array['listing_offer_reading', 'seller_authorization'], 'client', 'measured', null, 'Unavailable until the client''s authorized-seller list is stored.'),
  ('cl_fender:featured_offer_suppressed', 'cl_fender', 'featured_offer_suppressed', 'Featured Offer withheld above Amazon''s outside benchmark', 'Listings where Amazon shows no Featured Offer and the offer, including shipping, is above the Competitive External Price.', 'count', 'Active offers with a benchmark reading.', 'withheld = true AND offer_cents > benchmark_cents', array['listing_offer_reading'], 'intofocus', 'measured', '{"kind":"count_is_bad","warn":1,"danger":10}'::jsonb, 'Keepa competitivePriceThreshold and buyBoxIsUnqualified.'),
  ('cl_fender:featured_offer_present', 'cl_fender', 'featured_offer_present', 'Featured Offer present', 'Listings where Amazon shows a Featured Offer.', 'count', 'Active offers with a Featured Offer reading.', 'count(withheld = false) / read', array['listing_offer_reading'], 'intofocus', 'measured', '{"kind":"higher_is_better","warn":95,"danger":85}'::jsonb, null),
  ('cl_fender:seller_mix', 'cl_fender', 'seller_mix', 'Who holds the Featured Offer', 'Amazon Retail, a confirmed third-party seller, or not yet read.', 'count', 'Active offers.', 'counts by seller class', array['listing_offer_reading', 'seller'], 'intofocus', 'measured', null, null),
  ('cl_fender:amazon_offer_share', 'cl_fender', 'amazon_offer_share', 'Amazon Retail share of Featured Offers', 'Share of active offers where Amazon Retail holds the Featured Offer. A drill-down fact for a Partner-led brand, not the headline.', 'percent', 'Active offers. Rows with no active offer are excluded.', 'amazon / active offers', array['listing_offer_reading'], 'intofocus', 'measured', null, null),
  ('cl_fender:seller_read_coverage', 'cl_fender', 'seller_read_coverage', 'Seller read coverage', 'How much of the active catalog has a seller reading.', 'percent', 'Active offers.', 'read / active', array['listing_offer_reading'], 'intofocus', 'measured', '{"kind":"higher_is_better","warn":98,"danger":90}'::jsonb, null),
  ('cl_fender:map_below', 'cl_fender', 'map_below', 'Offers below MAP', 'Listings priced under the client''s minimum advertised price on any channel.', 'count', 'Active offers with a stored MAP.', 'offer < map_price, per channel', array['listing_channel_price', 'listing_map_price'], 'client', 'measured', null, 'Unavailable until a MAP sheet is stored. The Keepa list price was removed as a MAP stand-in on 2026-10-08.'),
  ('cl_fender:channel_price_coverage', 'cl_fender', 'channel_price_coverage', 'Outside prices on file', 'How many active listings have a stored price at each outside retailer.', 'count', 'Active offers per channel.', 'counts per channel', array['listing_channel_price'], 'intofocus', 'measured', null, null),
  ('cl_fender:bundle_share', 'cl_fender', 'bundle_share', 'Partner bundles', 'Active offers whose title marks a bundle, kit, pack, or combo.', 'percent', 'Active offers.', 'count(is_bundle) / active', array['listing'], 'intofocus', 'measured', null, 'Title pattern.'),
  ('cl_fender:spec_fender_page_found', 'cl_fender', 'spec_fender_page_found', 'fender.com page found', 'Checked SKUs for which site search found a fender.com product page.', 'percent', 'SKUs with a known Buy Box seller, checked in hourly batches.', 'found / checked', array['spec_reading'], 'intofocus', 'measured', '{"kind":"higher_is_better","warn":50,"danger":25}'::jsonb, null),
  ('cl_fender:spec_additional_property_missing', 'cl_fender', 'spec_additional_property_missing', 'Pages missing additionalProperty', 'Found fender.com pages whose JSON-LD has no additionalProperty block.', 'count', 'Found pages.', 'missing / found', array['spec_reading'], 'intofocus', 'measured', '{"kind":"count_is_bad","warn":1,"danger":20}'::jsonb, null),
  ('cl_fender:spec_amazon_completeness', 'cl_fender', 'spec_amazon_completeness', 'Amazon attribute completeness', 'Average share of 13 Amazon product-detail fields that are filled.', 'percent', 'Checked SKUs.', 'avg(found / 13)', array['spec_reading'], 'intofocus', 'measured', '{"kind":"higher_is_better","warn":92,"danger":85}'::jsonb, null),
  ('cl_fender:ecommerce_to_ai_link', 'cl_fender', 'ecommerce_to_ai_link', 'Ecommerce cause of the AI result', 'The claim that listing control and product-data gaps change which brand an assistant names.', 'none', 'Not defined.', 'not defined', array[]::text[], 'intofocus', 'assumption', null, 'No stored reading links one listing''s gap to one answer.'),
  ('cl_fender:price_gap_above_benchmark', 'cl_fender', 'price_gap_above_benchmark', 'Price gap on suppressed listings', 'Dollars by which suppressed offers sit above Amazon''s outside benchmark, summed. A price gap, not revenue.', 'usd', 'Suppressed listings.', 'sum(offer_price - benchmark_cents / 100)', array['listing_offer_reading'], 'intofocus', 'measured', null, null),
  ('cl_fender:estimate_phase1_uplift', 'cl_fender', 'estimate_phase1_uplift', 'Phase 1 uplift', 'The annual uplift figure the current dashboard shows as $680K.', 'usd', 'Not defined until inputs exist.', 'buybox_recapture + ai_dtc_conversions + reduced_returns + review_synergy', array['estimate', 'estimate_input'], 'coo', 'estimate', null, 'Formula shape stored; no input values stored.'),
  ('cl_fender:estimate_enterprise_range', 'cl_fender', 'estimate_enterprise_range', 'Enterprise uplift range', 'The figure the current dashboard shows as $38M to $62M.', 'usd', 'Not defined until inputs exist.', 'sum of four stored lines, low and high', array['estimate', 'estimate_input'], 'coo', 'estimate', null, 'Three documents disagree on the value.'),
  ('cl_fender:action_items_open', 'cl_fender', 'action_items_open', 'Open action items', 'Stored actions that are not done, each tied to a registry row.', 'count', 'Action rows with status other than done.', 'count(*)', array['action_item'], 'mixed', 'measured', '{"kind":"count_is_bad","warn":5,"danger":20}'::jsonb, null),
  ('cl_fender:catalog_monitored', 'cl_fender', 'catalog_monitored', 'Monitored ASINs', 'ASINs in the monitored catalog, and how many have an active Amazon offer.', 'count', 'All listings for the client.', 'count(*); count(active)', array['listing'], 'intofocus', 'measured', null, null),
  ('cl_fender:catalog_by_category', 'cl_fender', 'catalog_by_category', 'Listings by category', 'Listings grouped by the retailer category.', 'count', 'All listings for the client.', 'count by category', array['listing'], 'intofocus', 'measured', null, 'The six authored division names from 2026-09-29 are retired.'),
  ('cl_fender:reading_freshness', 'cl_fender', 'reading_freshness', 'As-of per reading', 'One timestamp per source.', 'timestamp', 'All reading runs.', 'max(finished_at) per source', array['reading_run'], 'intofocus', 'measured', null, null);

-- 13. estimate: the two text-only figures, loaded with no inputs (low and high stay empty)
insert into sandbox.estimate (estimate_id, client_id, registry_key, name, formula, unit, low_value, high_value, owner, confidence, as_of)
select 'est_phase1', 'cl_fender', r.registry_key, r.name, r.formula, 'usd', null::numeric, null::numeric, 'coo', 'estimate', date '2026-10-08'
from sandbox.metric_registry r where r.registry_key = 'cl_fender:estimate_phase1_uplift'
union all
select 'est_enterprise', 'cl_fender', r.registry_key, r.name, r.formula, 'usd', null::numeric, null::numeric, 'coo', 'estimate', date '2026-10-08'
from sandbox.metric_registry r where r.registry_key = 'cl_fender:estimate_enterprise_range';

-- seller_authorization, listing_map_price, estimate_input: no rows (not stored anywhere today).
