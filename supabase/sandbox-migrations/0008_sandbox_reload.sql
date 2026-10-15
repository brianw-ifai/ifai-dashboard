-- 0008_sandbox_reload.sql
-- sandbox.reload_readings(p_client_id): rebuilds the derived reading tables from the sandbox project's own command.*
-- and canvas_private.* copies (which the dual-write wrenches keep current every hour), then seeds action items and
-- recomputes metric_value. Same mapping as 0003 and 0006; the only differences are noted inline.
--
-- Replaced on every call (all derived from command.*): reading_run, listing_offer_reading, listing_channel_price,
-- spec_reading, ai_prompt, ai_answer, metric_value.
-- Runs keep trigger_type backfill: they are copies of command.* rows, and the dashboard reads backfill runs.
-- Upserted, never deleted (client-supplied rows reference them): listing, seller.
-- Never touched: seller_type, client, competitor_brand, metric_registry, estimate, and the client-supplied tables
-- seller_authorization, listing_map_price, estimate_input.
-- action_item: generated rows are upserted; a generated row whose finding is gone is set to 'done', and a done row
-- whose finding is back is reopened ('in_progress' is never changed).
--
-- Scheduled daily by pg_cron (job 'sandbox_reload_readings', 14:00 UTC, after the 13:00 and 13:15 UTC Keepa
-- harvesters). Run by hand with: select sandbox.reload_readings('cl_fender');
-- Sandbox schema only. Nothing in command, public or canvas_private is written.

create or replace function sandbox.reload_readings(p_client_id text default 'cl_fender')
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_as_of timestamptz := now();
  v_stamp text := to_char(now() at time zone 'UTC', 'YYYYMMDD"T"HH24MI');
  v_metrics integer;
begin
  if p_client_id <> 'cl_fender' then
    raise exception 'reload_readings maps the Fender command.fmic_* tables only; got client %', p_client_id;
  end if;

  -- 1. clear derived rows (children first)
  delete from sandbox.metric_value where client_id = p_client_id;
  delete from sandbox.ai_answer where client_id = p_client_id;
  delete from sandbox.ai_prompt where client_id = p_client_id;
  delete from sandbox.spec_reading where client_id = p_client_id;
  delete from sandbox.listing_channel_price where client_id = p_client_id;
  delete from sandbox.listing_offer_reading where client_id = p_client_id;
  delete from sandbox.reading_run where client_id = p_client_id;

  -- 2. seller (upsert)
  insert into sandbox.seller (seller_id, marketplace, seller_name, is_amazon_retail, ships_with_amazon, rating_pct, rating_count, first_seen_at, updated_at)
  select s.seller_id, 'amazon', s.seller_name, coalesce(s.is_amazon, false), s.is_fba, s.rating_pct, s.rating_count, s.first_seen, s.updated_at
  from command.fmic_sellers s
  union all
  select distinct c.buybox_seller, 'amazon', null::text, (c.buybox_seller = 'ATVPDKIKX0DER'), null::boolean, null::integer, null::integer, null::timestamptz, null::timestamptz
  from command.fmic_electric_catalog c
  where c.buybox_seller is not null
    and not exists (select 1 from command.fmic_sellers s where s.seller_id = c.buybox_seller)
  on conflict (seller_id) do update set
    seller_name = coalesce(excluded.seller_name, sandbox.seller.seller_name),
    is_amazon_retail = excluded.is_amazon_retail,
    ships_with_amazon = coalesce(excluded.ships_with_amazon, sandbox.seller.ships_with_amazon),
    rating_pct = coalesce(excluded.rating_pct, sandbox.seller.rating_pct),
    rating_count = coalesce(excluded.rating_count, sandbox.seller.rating_count),
    updated_at = coalesce(excluded.updated_at, sandbox.seller.updated_at);

  -- 3. listing (upsert; parent link set in a second pass so a new parent row exists first)
  insert into sandbox.listing (listing_id, client_id, retailer, asin, parent_listing_id, parent_asin, title, brand, manufacturer, model_number, upc, ean, color, category, is_bundle, bundle_name, url, amazon_list_price, first_seen_at, last_harvested_at, updated_at)
  select 'lst_' || c.asin, p_client_id, 'amazon', c.asin, null, c.parent_asin, c.title, c.brand, c.manufacturer, c.model_number, c.upc, c.ean, c.color, c.category,
         coalesce(c.is_bundle, false), m.bundle_name, c.product_url, c.list_price, c.created_at, c.extracted_at, c.updated_at
  from command.fmic_electric_catalog c
  left join command.fmic_retail_buybox_map m on m.asin = c.asin
  on conflict (listing_id) do update set
    parent_asin = excluded.parent_asin, title = excluded.title, brand = excluded.brand, manufacturer = excluded.manufacturer,
    model_number = excluded.model_number, upc = excluded.upc, ean = excluded.ean, color = excluded.color, category = excluded.category,
    is_bundle = excluded.is_bundle, bundle_name = excluded.bundle_name, url = excluded.url, amazon_list_price = excluded.amazon_list_price,
    last_harvested_at = excluded.last_harvested_at, updated_at = excluded.updated_at;

  update sandbox.listing l
     set parent_listing_id = case when exists (select 1 from sandbox.listing p where p.listing_id = 'lst_' || l.parent_asin) then 'lst_' || l.parent_asin end
   where l.client_id = p_client_id
     and l.parent_listing_id is distinct from case when exists (select 1 from sandbox.listing p where p.listing_id = 'lst_' || l.parent_asin) then 'lst_' || l.parent_asin end;

  -- 4. reading runs (fixed ids R1 to R6 as in 0003; workflow_execution_id carries the reload stamp; trigger scheduled)
  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
  select 'a0000000-0000-4000-8000-000000000001', p_client_id, 'keepa_product', 'fender_catalog_harvester', 'reload_keepa_product_' || v_stamp, 'backfill',
         min(c.created_at), max(c.updated_at), 'complete', count(*), count(*), 'catalog_harvester',
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.fmic_electric_catalog',
                            'population', count(*), 'rows_read', count(*),
                            'active_listings', count(*) filter (where c.current_price is not null),
                            'source_max_write', max(c.updated_at))
  from command.fmic_electric_catalog c;

  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
  select 'a0000000-0000-4000-8000-000000000002', p_client_id, 'keepa_seller', 'fender_buybox_seller_harvester', 'reload_keepa_seller_' || v_stamp, 'backfill',
         coalesce(min(c.buybox_checked_at) filter (where c.current_price is not null), min(c.created_at)), max(c.buybox_checked_at),
         case when count(*) filter (where c.current_price is not null and c.buybox_seller is null) = 0 then 'complete' else 'partial' end,
         count(*) filter (where c.current_price is not null),
         count(*) filter (where c.current_price is not null and c.buybox_seller is not null),
         'buybox_seller_harvester',
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.fmic_electric_catalog',
                            'population', count(*) filter (where c.current_price is not null),
                            'rows_read', count(*) filter (where c.current_price is not null and c.buybox_seller is not null),
                            'not_read', count(*) filter (where c.current_price is not null and c.buybox_seller is null),
                            'source_max_write', max(c.buybox_checked_at))
  from command.fmic_electric_catalog c;

  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, findings_count, legacy_run_key, detail)
  select 'a0000000-0000-4000-8000-000000000003', p_client_id, 'keepa_product', 'fender_omnichannel_audit_sync', 'reload_keepa_product_benchmark_' || v_stamp, 'backfill',
         (select min(created_at) from command.fmic_retail_buybox_map),
         k.finished_at, 'partial',
         (select count(*) from command.fmic_electric_catalog where current_price is not null),
         (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price is not null and m.competitive_price_threshold_cents > 0),
         (select count(*) from command.fmic_retail_buybox_map m where m.featured_offer_withheld and m.competitive_price_threshold_cents > 0 and round(m.offer_price * 100) > m.competitive_price_threshold_cents),
         k.audit_run_id::text,
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.fmic_retail_buybox_map',
                            'population', (select count(*) from command.fmic_electric_catalog where current_price is not null),
                            'rows_read', (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price is not null and m.competitive_price_threshold_cents > 0),
                            'map_rows', (select count(*) from command.fmic_retail_buybox_map),
                            'withheld_read', (select count(*) from command.fmic_retail_buybox_map where featured_offer_withheld is not null),
                            'benchmark_rows', (select count(*) from command.fmic_retail_buybox_map where competitive_price_threshold_cents > 0),
                            'latest_audit_run_id', k.audit_run_id,
                            'source_max_write', (select max(updated_at) from command.fmic_retail_buybox_map))
  from (select audit_run_id, created_at as finished_at from command.fmic_brand_kpi_summary order by created_at desc limit 1) k;

  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, cursor_end, legacy_run_key, detail)
  select 'a0000000-0000-4000-8000-000000000004', p_client_id, 'walmart_price', 'fender_retail_buybox_map_audit', 'reload_walmart_price_' || v_stamp, 'backfill',
         coalesce(min(m.wmt_checked_at), min(m.created_at)), j.last_run_at,
         case when count(*) filter (where m.wmt_checked_at is null) = 0 then 'complete' else 'partial' end,
         count(*), count(*) filter (where m.wmt_checked_at is not null), j.cursor_offset, 'map_leakage_walmart',
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.fmic_retail_buybox_map',
                            'population', count(*), 'rows_read', count(*) filter (where m.wmt_checked_at is not null),
                            'priced', count(*) filter (where m.wmt_price > 0),
                            'job_state_extra', j.extra, 'source_max_write', max(m.wmt_checked_at))
  from command.fmic_retail_buybox_map m
  cross join (select last_run_at, cursor_offset, extra from command.fmic_job_state where job_key = 'map_leakage_walmart') j
  group by j.last_run_at, j.cursor_offset, j.extra;

  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, cursor_end, legacy_run_key, detail)
  select 'a0000000-0000-4000-8000-000000000005', p_client_id, 'musiciansfriend_price', 'fender_map_checker_musiciansfriend', 'reload_musiciansfriend_price_' || v_stamp, 'backfill',
         coalesce((select min(mf_checked_at) from command.fmic_retail_buybox_map), (select min(created_at) from command.fmic_retail_buybox_map)),
         j.last_run_at, 'partial',
         (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price >= 100 and not coalesce(c.is_bundle, false)),
         (select count(*) from command.fmic_retail_buybox_map where mf_checked_at is not null),
         j.cursor_offset, 'map_parity_musiciansfriend',
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.fmic_retail_buybox_map',
                            'population', (select count(*) from command.fmic_retail_buybox_map m join command.fmic_electric_catalog c on c.asin = m.asin where c.current_price >= 100 and not coalesce(c.is_bundle, false)),
                            'population_rule', 'map rows joined to catalog with current_price >= 100 and not bundle',
                            'rows_read', (select count(*) from command.fmic_retail_buybox_map where mf_checked_at is not null),
                            'priced', (select count(*) from command.fmic_retail_buybox_map where mf_price > 0),
                            'job_state_extra', j.extra, 'source_max_write', (select max(mf_checked_at) from command.fmic_retail_buybox_map))
  from (select last_run_at, cursor_offset, extra from command.fmic_job_state where job_key = 'map_parity_musiciansfriend') j;

  -- R6: population rule from the 2026-10-13 refresh (distinct SKUs the audit has checked); the 0003 rule
  -- (catalog rows with a seller) understated it once the audit checked more SKUs than that.
  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, cursor_end, legacy_run_key, detail)
  select 'a0000000-0000-4000-8000-000000000006', p_client_id, 'spec_check', 'fender_spec_readiness_audit', 'reload_spec_check_' || v_stamp, 'backfill',
         (select min(coalesce(checked_at, created_at)) from command.fmic_spec_readiness),
         (select max(checked_at) from command.fmic_spec_readiness), 'complete',
         x.n, x.n, j.cursor_offset,
         (select batch_run_id from command.fmic_spec_readiness order by checked_at desc nulls last limit 1),
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.fmic_spec_readiness',
                            'population', x.n,
                            'population_rule', 'distinct catalog SKUs the spec audit has checked',
                            'rows_read', x.n,
                            'source_rows', (select count(*) from command.fmic_spec_readiness),
                            'source_rows_skipped_not_in_catalog', (select count(*) from command.fmic_spec_readiness s where not exists (select 1 from command.fmic_electric_catalog c where c.asin = s.asin)),
                            'job_state_extra', j.extra, 'source_max_write', (select max(checked_at) from command.fmic_spec_readiness))
  from (select count(distinct s.asin) as n from command.fmic_spec_readiness s where exists (select 1 from command.fmic_electric_catalog c where c.asin = s.asin)) x
  cross join (select cursor_offset, extra from command.fmic_job_state where job_key = 'spec_readiness') j;

  -- AI battery runs: original audit run uuids
  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, findings_count, legacy_run_key, detail)
  select r.id, p_client_id, 'ai_battery', coalesce(r.metadata->>'source', 'fender_ai_simulation_battery_real'),
         coalesce(r.workflow_execution_id, 'legacy_audit_run_' || r.id::text), 'manual',
         r.started_at, r.completed_at, 'complete', coalesce(s.n, 0), coalesce(s.n, 0), s.flags, r.id::text,
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.fmic_audit_runs',
                            'legacy_trigger_type', r.trigger_type, 'legacy_status', r.status,
                            'asins_audited', r.asins_audited, 'violations_detected', r.violations_detected,
                            'answers', coalesce(s.n, 0), 'workflow_execution_id_was_null', (r.workflow_execution_id is null),
                            'metadata', r.metadata)
  from command.fmic_audit_runs r
  left join (select audit_run_id, count(*) as n, count(*) filter (where hallucination_flag) as flags from canvas_private.sims_all group by audit_run_id) s on s.audit_run_id = r.id
  where r.metadata->>'source' = 'fender_ai_simulation_battery_real' or s.n is not null;

  -- R7: answers whose audit_run_id has no fmic_audit_runs row (only when such rows exist)
  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
  select 'a0000000-0000-4000-8000-000000000007', p_client_id, 'ai_battery', 'fender_ai_simulation_battery_real', 'reload_ai_battery_' || v_stamp, 'backfill',
         min(s.created_at), max(s.created_at), 'partial', count(*), count(*), null,
         jsonb_build_object('as_of', v_as_of, 'source_table', 'canvas_private.sims_all',
                            'population', count(*), 'rows_read', count(*), 'note', 'answers whose audit_run_id has no fmic_audit_runs row')
  from canvas_private.sims_all s
  where not exists (select 1 from command.fmic_audit_runs r where r.id = s.audit_run_id)
  having count(*) > 0;

  -- R8 / R9: legacy command.listing_channel_price rows (only when rows exist)
  insert into sandbox.reading_run (reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, legacy_run_key, detail)
  select case l.channel when 'sweetwater' then 'a0000000-0000-4000-8000-000000000008'::uuid else 'a0000000-0000-4000-8000-000000000009'::uuid end,
         p_client_id, l.channel || '_price', 'legacy_listing_channel_price', 'reload_' || l.channel || '_price_' || v_stamp, 'backfill',
         min(l.checked_at), max(l.checked_at), 'partial', count(*), count(*), null,
         jsonb_build_object('as_of', v_as_of, 'source_table', 'command.listing_channel_price', 'population', count(*), 'rows_read', count(*))
  from command.listing_channel_price l
  where l.channel in ('sweetwater', 'reverb')
  group by l.channel
  having count(*) > 0;

  -- 5. listing_offer_reading (R1, R2, R3)
  insert into sandbox.listing_offer_reading (listing_offer_reading_id, client_id, listing_id, reading_run_id, read_at, offer_status, listed_price, sales_rank, monthly_sold, offer_count_new, amazon_stock)
  select 'lor_' || c.asin || '_r1', p_client_id, 'lst_' || c.asin, 'a0000000-0000-4000-8000-000000000001',
         coalesce(c.extracted_at, c.updated_at),
         case when c.current_price is not null then 'active' else 'no_active_offer' end,
         c.current_price, c.sales_rank, c.monthly_sold, c.offer_count_new, c.amazon_stock
  from command.fmic_electric_catalog c;

  insert into sandbox.listing_offer_reading (listing_offer_reading_id, client_id, listing_id, reading_run_id, read_at, offer_status, featured_offer_seller_id, seller_class, seller_ships_with_amazon)
  select 'lor_' || c.asin || '_r2', p_client_id, 'lst_' || c.asin, 'a0000000-0000-4000-8000-000000000002',
         coalesce(c.buybox_checked_at, r.finished_at, v_as_of), 'active',
         c.buybox_seller,
         case when c.buybox_seller = 'ATVPDKIKX0DER' then 'amazon_retail'
              when c.buybox_seller is not null then 'third_party'
              else 'not_read' end,
         c.buybox_is_fba
  from command.fmic_electric_catalog c
  cross join (select finished_at from sandbox.reading_run where reading_run_id = 'a0000000-0000-4000-8000-000000000002') r
  where c.current_price is not null;

  -- R3 rows: only map rows whose listing exists (a map row for an ASIN outside the catalog is skipped)
  insert into sandbox.listing_offer_reading (listing_offer_reading_id, client_id, listing_id, reading_run_id, read_at, offer_status, featured_offer_withheld, offer_price, competitive_external_price_cents, legacy_status)
  select 'lor_' || m.asin || '_r3', p_client_id, 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000003',
         m.updated_at,
         case when m.buybox_status = 'No Active Offer' then 'no_active_offer' else 'active' end,
         m.featured_offer_withheld, m.offer_price,
         case when m.competitive_price_threshold_cents > 0 then m.competitive_price_threshold_cents end,
         m.buybox_status
  from command.fmic_retail_buybox_map m
  where exists (select 1 from sandbox.listing l where l.listing_id = 'lst_' || m.asin);

  -- 6. listing_channel_price
  insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at, store_title, store_seller_name, match_confidence)
  select 'lcp_' || m.asin || '_walmart', p_client_id, 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000004',
         m.wmt_checked_at, 'walmart',
         case when m.wmt_price > 0 then 'priced' else 'no_match' end,
         case when m.wmt_price > 0 then m.wmt_price end,
         m.wmt_url, m.wmt_checked_at, m.wmt_title, m.wmt_seller, m.wmt_match_conf
  from command.fmic_retail_buybox_map m
  where m.wmt_checked_at is not null
    and exists (select 1 from sandbox.listing l where l.listing_id = 'lst_' || m.asin);

  insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at, store_title, store_msrp)
  select 'lcp_' || m.asin || '_musiciansfriend', p_client_id, 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000005',
         m.mf_checked_at, 'musiciansfriend',
         case when m.mf_price > 0 then 'priced' else 'no_match' end,
         case when m.mf_price > 0 then m.mf_price end,
         null, m.mf_checked_at, m.mf_title, m.mf_msrp
  from command.fmic_retail_buybox_map m
  where m.mf_checked_at is not null
    and exists (select 1 from sandbox.listing l where l.listing_id = 'lst_' || m.asin);

  insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at, store_title, store_seller_name)
  select 'lcp_' || m.asin || '_amazon', p_client_id, 'lst_' || m.asin, 'a0000000-0000-4000-8000-000000000003',
         m.updated_at, 'amazon', 'priced', m.offer_price, c.product_url, m.updated_at, c.title, s.seller_name
  from command.fmic_retail_buybox_map m
  join command.fmic_electric_catalog c on c.asin = m.asin
  left join command.fmic_sellers s on s.seller_id = c.buybox_seller
  where m.offer_price is not null;

  insert into sandbox.listing_channel_price (listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, url, checked_at)
  select 'lcp_' || l.asin || '_' || l.channel || '_legacy', p_client_id, 'lst_' || l.asin, r.reading_run_id,
         l.checked_at, l.channel,
         case when l.price > 0 then 'priced' else 'no_match' end,
         case when l.price > 0 then l.price end,
         l.url, l.checked_at
  from command.listing_channel_price l
  join sandbox.listing li on li.listing_id = 'lst_' || l.asin
  join sandbox.reading_run r on r.client_id = p_client_id and r.reading_run_id = case l.channel
         when 'amazon' then 'a0000000-0000-4000-8000-000000000003'::uuid
         when 'walmart' then 'a0000000-0000-4000-8000-000000000004'::uuid
         when 'musiciansfriend' then 'a0000000-0000-4000-8000-000000000005'::uuid
         when 'sweetwater' then 'a0000000-0000-4000-8000-000000000008'::uuid
         when 'reverb' then 'a0000000-0000-4000-8000-000000000009'::uuid end
  where l.channel in ('amazon', 'walmart', 'musiciansfriend', 'sweetwater', 'reverb')
  on conflict on constraint listing_channel_price_listing_id_channel_reading_run_id_key do nothing;

  -- 7. spec_reading: every check whose asin is in the catalog (history kept under R6)
  insert into sandbox.spec_reading (spec_reading_id, client_id, listing_id, reading_run_id, read_at, amazon_checked, amazon_fields_found, amazon_fields_expected, amazon_missing_fields, brand_site_page_found, brand_site_url, brand_site_fields_found, brand_site_fields_expected, brand_site_missing_fields, additional_property_present)
  select 'spr_' || s.id, p_client_id, 'lst_' || s.asin, 'a0000000-0000-4000-8000-000000000006',
         coalesce(s.checked_at, s.created_at),
         coalesce(s.amazon_checked, false), s.amazon_fields_found, s.amazon_fields_expected,
         string_to_array(nullif(s.amazon_missing_fields, ''), ';'),
         coalesce(s.fender_found, false), s.fender_url, s.fender_fields_found, s.fender_fields_expected,
         string_to_array(nullif(s.fender_missing_fields, ''), ';'),
         case when s.fender_found then not (coalesce(s.fender_missing_fields, '') ilike '%additionalProperty%') else null end
  from command.fmic_spec_readiness s
  where exists (select 1 from sandbox.listing l where l.listing_id = 'lst_' || s.asin)
  on conflict on constraint spec_reading_listing_id_reading_run_id_read_at_key do nothing;

  -- 8. ai_prompt and ai_answer
  insert into sandbox.ai_prompt (ai_prompt_id, client_id, category, prompt_text, names_client_product, is_active, legacy_sim_id)
  select distinct on (d.ptext) 'pr_' || lpad(d.pidx::text, 2, '0'), p_client_id, d.category, d.ptext, (d.category = 'hallucinations'), true, d.pidx::text
  from (select distinct ((sim_id % 1000) - 1) / 10 as pidx, category,
               regexp_replace(prompt, '\s*\[(chatgpt|perplexity|gemini)\]$', '') as ptext
        from canvas_private.sims_all) d
  order by d.ptext, d.pidx
  on conflict do nothing;

  insert into sandbox.ai_answer (ai_answer_id, client_id, ai_prompt_id, reading_run_id, read_at, answered_at, engine, repeat_no, outcome, winner_brand_id, wrong_spec_flag, wrong_spec_reason, answer_text, citations, citation_urls, remediation_note, legacy_source)
  select s.id::text, p_client_id,
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
         on b.client_id = p_client_id
        and s.winner is not null and s.winner not in ('Error', 'Unclear')
        and b.name = case when s.winner = 'Fender/Squier' then 'Fender' else s.winner end
  where exists (select 1 from sandbox.ai_prompt p where p.ai_prompt_id = 'pr_' || lpad((((s.sim_id % 1000) - 1) / 10)::text, 2, '0'));

  -- 9. action items (same generation rules as 0006)
  create temp table if not exists _reload_actions (like sandbox.action_item) on commit drop;
  truncate _reload_actions;
  insert into _reload_actions (action_item_id, client_id, registry_key, finding_ref, listing_id, title, owner, status, severity, created_at, updated_at)
  select 'act_suppressed_' || v.asin, p_client_id, p_client_id || ':featured_offer_suppressed', v.benchmark_reading_id, v.listing_id,
         'Match the outside price or correct the outside listing for ' || v.asin, 'client', 'open', 'high', now(), now()
    from sandbox.v_listing_current v
   where v.client_id = p_client_id and v.offer_status = 'active' and v.suppressed
  union all
  select 'act_authorized_seller_list', p_client_id, p_client_id || ':retail_control_partner_led', null, null,
         'Supply the authorized-seller list', 'client', 'open', 'high', now(), now()
   where not exists (select 1 from sandbox.seller_authorization a where a.client_id = p_client_id)
  union all
  select 'act_map_sheet', p_client_id, p_client_id || ':map_below', null, null,
         'Supply the MAP sheet', 'client', 'open', 'medium', now(), now()
   where not exists (select 1 from sandbox.listing_map_price m where m.client_id = p_client_id)
  union all
  select 'act_additional_property', p_client_id, p_client_id || ':spec_additional_property_missing', null, null,
         'Add additionalProperty to ' || x.n || ' found fender.com pages', 'intofocus', 'open', 'medium', now(), now()
    from (select count(*) as n from sandbox.v_spec_current
           where client_id = p_client_id and brand_site_page_found and additional_property_present = false) x
   where x.n > 0
  union all
  select 'act_seller_read', p_client_id, p_client_id || ':seller_read_coverage', null, null,
         'Finish the seller read for ' || x.n || ' active offers', 'intofocus', 'open', 'medium', now(), now()
    from (select count(*) as n from sandbox.v_listing_current
           where client_id = p_client_id and offer_status = 'active' and coalesce(seller_class, 'not_read') = 'not_read') x
   where x.n > 0
  union all
  select 'act_phase1_inputs', p_client_id, p_client_id || ':estimate_phase1_uplift', null, null,
         'Supply the Phase 1 uplift inputs (COO)', 'intofocus', 'open', 'medium', now(), now()
   where not exists (select 1 from sandbox.estimate_input i where i.estimate_id = 'est_phase1')
  union all
  select 'act_enterprise_inputs', p_client_id, p_client_id || ':estimate_enterprise_range', null, null,
         'Supply the enterprise range inputs (COO)', 'intofocus', 'open', 'medium', now(), now()
   where not exists (select 1 from sandbox.estimate_input i where i.estimate_id = 'est_enterprise');

  -- generated rows whose finding is gone are closed (status done), as the 2026-10-13 refresh did; in_progress is left alone
  update sandbox.action_item a
     set status = 'done', updated_at = now()
   where a.client_id = p_client_id and a.status = 'open'
     and (a.action_item_id like 'act\_suppressed\_%' or a.action_item_id in
          ('act_authorized_seller_list', 'act_map_sheet', 'act_additional_property', 'act_seller_read', 'act_phase1_inputs', 'act_enterprise_inputs'))
     and not exists (select 1 from _reload_actions n where n.action_item_id = a.action_item_id);

  -- a finding that is back reopens its closed row (v2 has no write path for status, so every done row was closed here)
  insert into sandbox.action_item (action_item_id, client_id, registry_key, finding_ref, listing_id, title, owner, status, severity, created_at, updated_at)
  select action_item_id, client_id, registry_key, finding_ref, listing_id, title, owner, status, severity, created_at, updated_at
  from _reload_actions
  on conflict (action_item_id) do update set
    finding_ref = excluded.finding_ref, title = excluded.title,
    status = case when sandbox.action_item.status = 'done' then 'open' else sandbox.action_item.status end,
    updated_at = case when sandbox.action_item.title is distinct from excluded.title
                        or sandbox.action_item.finding_ref is distinct from excluded.finding_ref
                        or sandbox.action_item.status = 'done'
                      then now() else sandbox.action_item.updated_at end;

  -- 10. metric values (the action_item trigger already ran it; the explicit call is the documented entry point)
  v_metrics := sandbox.refresh_metric_values(p_client_id);

  return jsonb_build_object(
    'as_of', v_as_of,
    'listings', (select count(*) from sandbox.listing where client_id = p_client_id),
    'reading_runs', (select count(*) from sandbox.reading_run where client_id = p_client_id),
    'offer_readings', (select count(*) from sandbox.listing_offer_reading where client_id = p_client_id),
    'channel_prices', (select count(*) from sandbox.listing_channel_price where client_id = p_client_id),
    'spec_readings', (select count(*) from sandbox.spec_reading where client_id = p_client_id),
    'ai_answers', (select count(*) from sandbox.ai_answer where client_id = p_client_id),
    'open_actions', (select count(*) from sandbox.action_item where client_id = p_client_id and status <> 'done'),
    'metric_values', v_metrics);
end;
$$;

comment on function sandbox.reload_readings(text) is 'Rebuilds the sandbox reading tables from the project''s command.* copy, upserts listings, sellers and generated action items, and recomputes metric_value. Scheduled daily at 14:00 UTC by pg_cron job sandbox_reload_readings. See supabase/sandbox-migrations/0008_sandbox_reload.sql.';

revoke execute on function sandbox.reload_readings(text) from public, anon, authenticated;

-- Daily schedule
create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'sandbox_reload_readings';
select cron.schedule('sandbox_reload_readings', '0 14 * * *', $cron$select sandbox.reload_readings('cl_fender')$cron$);
