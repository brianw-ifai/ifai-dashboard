-- 0005_sandbox_refresh.sql
-- sandbox.refresh_metric_values(p_client_id): deletes the client's metric_value rows and recomputes them from the
-- reading tables (through the latest-row views of 0004). One row per registry id and dimension. Percent metrics carry
-- numerator and denominator (numeric_value = the percentage); counts and dollars carry numeric_value.
-- No row is written for retail_control_partner_led, map_below, ecommerce_to_ai_link, estimate_phase1_uplift or
-- estimate_enterprise_range: their inputs do not exist yet, so a missing row (not a zero) is the correct reading.
-- A statement-level trigger on action_item calls the function whenever action rows change.

create or replace function sandbox.refresh_metric_values(p_client_id text)
returns integer
language plpgsql
set search_path = pg_catalog
as $$
declare
  v_now timestamptz := now();
  v_r1 uuid;   -- latest catalog harvest run (offer status, bundles, categories)
  v_r2 uuid;   -- latest seller read run
  v_r3 uuid;   -- latest Featured Offer and benchmark run
  v_spec uuid; -- latest spec check run
  v_ai uuid;   -- latest AI battery run
  v_inserted integer := 0;
  v_n integer;
begin
  select reading_run_id into v_r1 from sandbox.reading_run
   where client_id = p_client_id and source = 'keepa_product' and workflow_name = 'fender_catalog_harvester'
   order by finished_at desc nulls last, started_at desc limit 1;
  select reading_run_id into v_r2 from sandbox.reading_run
   where client_id = p_client_id and source = 'keepa_seller'
   order by finished_at desc nulls last, started_at desc limit 1;
  select reading_run_id into v_r3 from sandbox.reading_run
   where client_id = p_client_id and source = 'keepa_product' and workflow_name = 'fender_omnichannel_audit_sync'
   order by finished_at desc nulls last, started_at desc limit 1;
  select reading_run_id into v_spec from sandbox.reading_run
   where client_id = p_client_id and source = 'spec_check'
   order by finished_at desc nulls last, started_at desc limit 1;
  select reading_run_id into v_ai from sandbox.reading_run
   where client_id = p_client_id and source = 'ai_battery'
   order by finished_at desc nulls last, started_at desc limit 1;

  delete from sandbox.metric_value where client_id = p_client_id;

  -- catalog_monitored: all listings, plus the active count as dimension offer_status = active
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':catalog_monitored', p_client_id, p_client_id || ':catalog_monitored', v_r1, v_now, null::text, null::text, count(*), null::integer, null::integer
    from sandbox.v_listing_current where client_id = p_client_id
  union all
  select p_client_id || ':catalog_monitored:offer_status=active', p_client_id, p_client_id || ':catalog_monitored', v_r1, v_now, 'offer_status', 'active', count(*) filter (where offer_status = 'active'), null::integer, null::integer
    from sandbox.v_listing_current where client_id = p_client_id;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- amazon_offer_share: Amazon Retail holds the Featured Offer / active listings
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':amazon_offer_share', p_client_id, p_client_id || ':amazon_offer_share', v_r2, v_now, null, null,
         round(100.0 * count(*) filter (where seller_class = 'amazon_retail') / nullif(count(*), 0), 2),
         count(*) filter (where seller_class = 'amazon_retail'), count(*)
    from sandbox.v_listing_current where client_id = p_client_id and offer_status = 'active';
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- seller_mix: active listings per seller class (no seller row at all counts as not_read)
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':seller_mix:seller_class=' || coalesce(seller_class, 'not_read'), p_client_id, p_client_id || ':seller_mix', v_r2, v_now, 'seller_class', coalesce(seller_class, 'not_read'), count(*), null, null
    from sandbox.v_listing_current where client_id = p_client_id and offer_status = 'active'
   group by coalesce(seller_class, 'not_read');
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- seller_read_coverage: active listings with a seller class other than not_read / active listings
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':seller_read_coverage', p_client_id, p_client_id || ':seller_read_coverage', v_r2, v_now, null, null,
         round(100.0 * count(*) filter (where seller_class in ('amazon_retail', 'third_party', 'no_offer')) / nullif(count(*), 0), 2),
         count(*) filter (where seller_class in ('amazon_retail', 'third_party', 'no_offer')), count(*)
    from sandbox.v_listing_current where client_id = p_client_id and offer_status = 'active';
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- featured_offer_present: withheld = false over listings whose latest benchmark row read the flag
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':featured_offer_present', p_client_id, p_client_id || ':featured_offer_present', v_r3, v_now, null, null,
         count(*) filter (where featured_offer_withheld = false),
         count(*) filter (where featured_offer_withheld = false), count(*) filter (where featured_offer_withheld is not null)
    from sandbox.v_listing_current where client_id = p_client_id;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- featured_offer_suppressed: withheld and offer cents above benchmark cents; denominator = active listings with a benchmark
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':featured_offer_suppressed', p_client_id, p_client_id || ':featured_offer_suppressed', v_r3, v_now, null, null,
         count(*) filter (where suppressed),
         count(*) filter (where suppressed), count(*) filter (where competitive_external_price_cents is not null)
    from sandbox.v_listing_current where client_id = p_client_id and offer_status = 'active';
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- price_gap_above_benchmark: dollars above the benchmark summed over the suppressed listings
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':price_gap_above_benchmark', p_client_id, p_client_id || ':price_gap_above_benchmark', v_r3, v_now, null, null,
         coalesce(sum((offer_price_cents - competitive_external_price_cents) / 100.0), 0), count(*), null
    from sandbox.v_listing_current where client_id = p_client_id and offer_status = 'active' and suppressed;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- channel_price_coverage: per channel, priced over checked, from the latest channel row per listing
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  with latest as (
    select distinct on (p.listing_id, p.channel) p.listing_id, p.channel, p.match_status, p.reading_run_id, p.read_at
      from sandbox.listing_channel_price p
     where p.client_id = p_client_id
     order by p.listing_id, p.channel, p.read_at desc, p.reading_run_id desc
  )
  select p_client_id || ':channel_price_coverage:channel=' || channel, p_client_id, p_client_id || ':channel_price_coverage',
         (array_agg(reading_run_id order by read_at desc))[1], v_now, 'channel', channel,
         count(*) filter (where match_status = 'priced'),
         count(*) filter (where match_status = 'priced'), count(*)
    from latest group by channel;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- bundle_share: bundles among active listings
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':bundle_share', p_client_id, p_client_id || ':bundle_share', v_r1, v_now, null, null,
         round(100.0 * count(*) filter (where is_bundle) / nullif(count(*), 0), 2),
         count(*) filter (where is_bundle), count(*)
    from sandbox.v_listing_current where client_id = p_client_id and offer_status = 'active';
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- spec_fender_page_found: brand page found over listings checked (latest spec row per listing)
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':spec_fender_page_found', p_client_id, p_client_id || ':spec_fender_page_found', v_spec, v_now, null, null,
         round(100.0 * count(*) filter (where brand_site_page_found) / nullif(count(*), 0), 2),
         count(*) filter (where brand_site_page_found), count(*)
    from sandbox.v_spec_current where client_id = p_client_id;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- spec_additional_property_missing: found pages without additionalProperty over found pages
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':spec_additional_property_missing', p_client_id, p_client_id || ':spec_additional_property_missing', v_spec, v_now, null, null,
         count(*) filter (where additional_property_present = false),
         count(*) filter (where additional_property_present = false), count(*)
    from sandbox.v_spec_current where client_id = p_client_id and brand_site_page_found;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- spec_amazon_completeness: average of found / expected over Amazon-checked listings (numerator and denominator are field totals)
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':spec_amazon_completeness', p_client_id, p_client_id || ':spec_amazon_completeness', v_spec, v_now, null, null,
         round(avg(amazon_fields_found * 100.0 / amazon_fields_expected), 2),
         sum(amazon_fields_found), sum(amazon_fields_expected)
    from sandbox.v_spec_current where client_id = p_client_id and amazon_checked and amazon_fields_expected > 0;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- ai_answer_share: client brand wins over resolved answers, all runs
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':ai_answer_share', p_client_id, p_client_id || ':ai_answer_share', v_ai, v_now, null, null,
         round(100.0 * count(*) filter (where client_brand_won) / nullif(count(*), 0), 2),
         count(*) filter (where client_brand_won), count(*)
    from sandbox.v_ai_answer_detail where client_id = p_client_id and outcome = 'resolved';
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- ai_answer_share_by_category: per category (prompts naming a client product excluded; fewer than 10 resolved excluded),
  -- plus the top rival per category as dimension category_top_rival = '<category>:<brand>'
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  with r as (
    select category, winner_brand_name, client_brand_won
      from sandbox.v_ai_answer_detail
     where client_id = p_client_id and outcome = 'resolved' and not names_client_product
  ), c as (
    select category, count(*) as resolved, count(*) filter (where client_brand_won) as wins
      from r group by category having count(*) >= 10
  ), rival as (
    select distinct on (r.category) r.category, r.winner_brand_name, count(*) as rival_wins
      from r join c using (category)
     where not r.client_brand_won
     group by r.category, r.winner_brand_name
     order by r.category, count(*) desc, r.winner_brand_name
  )
  select p_client_id || ':ai_answer_share_by_category:category=' || c.category, p_client_id, p_client_id || ':ai_answer_share_by_category', v_ai, v_now, 'category', c.category,
         round(100.0 * c.wins / c.resolved, 2), c.wins, c.resolved
    from c
  union all
  select p_client_id || ':ai_answer_share_by_category:category_top_rival=' || rival.category || ':' || rival.winner_brand_name, p_client_id, p_client_id || ':ai_answer_share_by_category', v_ai, v_now, 'category_top_rival', rival.category || ':' || rival.winner_brand_name,
         round(100.0 * rival.rival_wins / c.resolved, 2), rival.rival_wins, c.resolved
    from rival join c using (category);
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- ai_wrong_spec_flags: flagged answers (numerator) over all answers (denominator)
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':ai_wrong_spec_flags', p_client_id, p_client_id || ':ai_wrong_spec_flags', v_ai, v_now, null, null,
         count(*) filter (where wrong_spec_flag), count(*) filter (where wrong_spec_flag), count(*)
    from sandbox.v_ai_answer_detail where client_id = p_client_id;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- ai_answer_share_by_engine: per stored engine (unknown excluded)
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':ai_answer_share_by_engine:engine=' || engine, p_client_id, p_client_id || ':ai_answer_share_by_engine', v_ai, v_now, 'engine', engine,
         round(100.0 * count(*) filter (where client_brand_won) / nullif(count(*), 0), 2),
         count(*) filter (where client_brand_won), count(*)
    from sandbox.v_ai_answer_detail where client_id = p_client_id and outcome = 'resolved' and engine <> 'unknown'
   group by engine;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- ai_battery_freshness and reading_freshness: epoch seconds of the latest finished_at per source
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':ai_battery_freshness:source=' || f.source, p_client_id, p_client_id || ':ai_battery_freshness', f.reading_run_id, v_now, 'source', f.source,
         extract(epoch from f.finished_at), null::integer, null::integer
    from sandbox.v_reading_freshness f where f.client_id = p_client_id and f.source = 'ai_battery' and f.finished_at is not null
  union all
  select p_client_id || ':reading_freshness:source=' || f.source, p_client_id, p_client_id || ':reading_freshness', f.reading_run_id, v_now, 'source', f.source,
         extract(epoch from f.finished_at), null::integer, null::integer
    from sandbox.v_reading_freshness f where f.client_id = p_client_id and f.finished_at is not null;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- action_items_open: stored actions not done (no reading run behind it)
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':action_items_open', p_client_id, p_client_id || ':action_items_open', null, v_now, null, null,
         count(*) filter (where status <> 'done'), count(*) filter (where status <> 'done'), count(*)
    from sandbox.action_item where client_id = p_client_id;
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  -- catalog_by_category: listings per retailer category
  insert into sandbox.metric_value (metric_value_id, client_id, registry_key, reading_run_id, computed_at, dimension_name, dimension_value, numeric_value, numerator, denominator)
  select p_client_id || ':catalog_by_category:category=' || coalesce(category, 'uncategorized'), p_client_id, p_client_id || ':catalog_by_category', v_r1, v_now, 'category', coalesce(category, 'uncategorized'), count(*), null, null
    from sandbox.v_listing_current where client_id = p_client_id
   group by coalesce(category, 'uncategorized');
  get diagnostics v_n = row_count; v_inserted := v_inserted + v_n;

  return v_inserted;
end;
$$;

comment on function sandbox.refresh_metric_values(text) is 'Deletes and recomputes sandbox.metric_value for one client from the latest reading rows. Returns the number of rows written. Writes no row for metrics whose inputs do not exist yet (retail_control_partner_led, map_below, ecommerce_to_ai_link, estimate_*).';

revoke execute on function sandbox.refresh_metric_values(text) from public, anon, authenticated;

-- Recompute whenever action_item rows change (statement level, every client)
create or replace function sandbox.tg_action_item_refresh()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare c text;
begin
  for c in select client_id from sandbox.client loop
    perform sandbox.refresh_metric_values(c);
  end loop;
  return null;
end;
$$;

revoke execute on function sandbox.tg_action_item_refresh() from public, anon, authenticated;

drop trigger if exists action_item_refresh_metrics on sandbox.action_item;
create trigger action_item_refresh_metrics
  after insert or update or delete on sandbox.action_item
  for each statement execute function sandbox.tg_action_item_refresh();
