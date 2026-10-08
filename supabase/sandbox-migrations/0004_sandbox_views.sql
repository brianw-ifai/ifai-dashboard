-- 0004_sandbox_views.sql
-- Dashboard read views over schema sandbox. All views use security_invoker = false (the default) so the browser roles,
-- which hold SELECT on the tables through RLS policies, read them through the view owner.
-- "Latest" always means the row with the greatest read_at for a listing (ties broken by reading_run_id), so a new run
-- that writes a newer row replaces the backfill row without any update.

create or replace view sandbox.v_listing_current with (security_invoker = false) as
with r1 as (
  -- latest catalog-harvest row per listing: offer status, listed price, rank, stock
  select distinct on (o.listing_id) o.listing_id, o.reading_run_id, o.read_at, o.offer_status, o.listed_price, o.sales_rank, o.monthly_sold, o.offer_count_new, o.amazon_stock
  from sandbox.listing_offer_reading o
  join sandbox.reading_run r on r.reading_run_id = o.reading_run_id
  where r.source = 'keepa_product' and r.workflow_name = 'fender_catalog_harvester'
  order by o.listing_id, o.read_at desc, o.reading_run_id desc
), r2 as (
  -- latest seller-read row per listing
  select distinct on (o.listing_id) o.listing_id, o.reading_run_id, o.read_at, o.seller_class, o.featured_offer_seller_id, o.seller_ships_with_amazon
  from sandbox.listing_offer_reading o
  join sandbox.reading_run r on r.reading_run_id = o.reading_run_id
  where r.source = 'keepa_seller'
  order by o.listing_id, o.read_at desc, o.reading_run_id desc
), r3 as (
  -- latest Featured Offer and benchmark row per listing
  select distinct on (o.listing_id) o.listing_id, o.listing_offer_reading_id, o.reading_run_id, o.read_at, o.offer_status, o.featured_offer_withheld, o.offer_price, o.offer_price_cents, o.competitive_external_price_cents, o.legacy_status
  from sandbox.listing_offer_reading o
  join sandbox.reading_run r on r.reading_run_id = o.reading_run_id
  where r.source = 'keepa_product' and r.workflow_name = 'fender_omnichannel_audit_sync'
  order by o.listing_id, o.read_at desc, o.reading_run_id desc
), ch as (
  -- latest row per listing and channel
  select distinct on (p.listing_id, p.channel) p.listing_id, p.channel, p.match_status, p.price, p.price_cents, p.url, p.checked_at
  from sandbox.listing_channel_price p
  order by p.listing_id, p.channel, p.read_at desc, p.reading_run_id desc
)
select l.listing_id, l.client_id, l.retailer, l.asin, l.parent_listing_id, l.parent_asin, l.title, l.brand, l.manufacturer, l.model_number, l.upc, l.ean, l.color, l.category, l.is_bundle, l.bundle_name, l.url, l.amazon_list_price, l.first_seen_at, l.last_harvested_at, l.updated_at,
       r1.reading_run_id as catalog_run_id, r1.read_at as catalog_read_at, r1.offer_status, r1.listed_price, r1.sales_rank, r1.monthly_sold, r1.offer_count_new, r1.amazon_stock,
       r2.reading_run_id as seller_run_id, r2.read_at as seller_read_at, r2.seller_class, r2.featured_offer_seller_id, s.seller_name as featured_offer_seller_name, r2.seller_ships_with_amazon,
       r3.listing_offer_reading_id as benchmark_reading_id, r3.reading_run_id as benchmark_run_id, r3.read_at as benchmark_read_at, r3.offer_status as benchmark_offer_status, r3.featured_offer_withheld, r3.offer_price, r3.offer_price_cents, r3.competitive_external_price_cents, r3.legacy_status,
       (r3.featured_offer_withheld is true and r3.offer_price_cents is not null and r3.competitive_external_price_cents is not null and r3.offer_price_cents > r3.competitive_external_price_cents) as suppressed,
       w.price as walmart_price, w.url as walmart_url, w.checked_at as walmart_checked_at,
       m.price as musiciansfriend_price, m.url as musiciansfriend_url, m.checked_at as musiciansfriend_checked_at,
       (select array_agg(c.channel order by c.channel) from ch c
         where c.listing_id = l.listing_id and c.match_status = 'priced'
           and c.price_cents = r3.competitive_external_price_cents) as benchmark_match_channels
from sandbox.listing l
left join r1 on r1.listing_id = l.listing_id
left join r2 on r2.listing_id = l.listing_id
left join sandbox.seller s on s.seller_id = r2.featured_offer_seller_id
left join r3 on r3.listing_id = l.listing_id
left join ch w on w.listing_id = l.listing_id and w.channel = 'walmart' and w.match_status = 'priced'
left join ch m on m.listing_id = l.listing_id and m.channel = 'musiciansfriend' and m.match_status = 'priced';

comment on view sandbox.v_listing_current is 'One row per listing with its latest catalog read (offer_status, listed_price, rank, stock), latest seller read (seller_class, seller), latest Featured Offer and benchmark read (withheld flag, offer cents, benchmark cents, read_at), the latest priced Walmart and Musician''s Friend price and link, suppressed = withheld and offer cents above benchmark cents, and benchmark_match_channels = channels whose latest priced price_cents equals the benchmark cents (the amazon channel row is the offer itself, so it only matches when the offer equals the benchmark).';

create or replace view sandbox.v_reading_freshness with (security_invoker = false) as
select distinct on (r.client_id, r.source)
       r.client_id, r.source, r.reading_run_id, r.workflow_name, r.trigger_type, r.started_at, r.finished_at, r.status, r.rows_read, r.population_count, r.findings_count, r.legacy_run_key
from sandbox.reading_run r
order by r.client_id, r.source, r.finished_at desc nulls last, r.started_at desc;

comment on view sandbox.v_reading_freshness is 'One row per client and source: the run with the latest finished_at, with its status, rows_read and population_count. The header as-of is the oldest finished_at across sources, not the newest.';

create or replace view sandbox.v_ai_answer_detail with (security_invoker = false) as
select a.ai_answer_id, a.client_id, a.reading_run_id, r.finished_at as run_finished_at, r.status as run_status,
       a.ai_prompt_id, p.category, p.prompt_text, p.names_client_product, p.legacy_sim_id,
       a.read_at, a.answered_at, a.engine, a.repeat_no, a.outcome,
       a.winner_brand_id, b.name as winner_brand_name, coalesce(b.is_client_brand, false) as client_brand_won,
       a.wrong_spec_flag, a.wrong_spec_reason, a.answer_text, a.citations, a.citation_urls, a.remediation_note, a.legacy_source
from sandbox.ai_answer a
join sandbox.ai_prompt p on p.ai_prompt_id = a.ai_prompt_id
left join sandbox.competitor_brand b on b.competitor_brand_id = a.winner_brand_id
left join sandbox.reading_run r on r.reading_run_id = a.reading_run_id;

comment on view sandbox.v_ai_answer_detail is 'Every AI answer joined to its prompt (category, text, whether it names a client product) and the brand it named. client_brand_won is true when the winner is the client brand. Answer share = client_brand_won over outcome = resolved.';

create or replace view sandbox.v_spec_current with (security_invoker = false) as
select distinct on (s.listing_id)
       s.spec_reading_id, s.client_id, s.listing_id, l.asin, l.title, l.category, s.reading_run_id, s.read_at,
       s.amazon_checked, s.amazon_fields_found, s.amazon_fields_expected, s.amazon_missing_fields,
       s.brand_site_page_found, s.brand_site_url, s.brand_site_fields_found, s.brand_site_fields_expected, s.brand_site_missing_fields, s.additional_property_present,
       case when s.amazon_checked and s.amazon_fields_expected > 0 then round(s.amazon_fields_found * 100.0 / s.amazon_fields_expected, 1) end as amazon_completeness_pct
from sandbox.spec_reading s
join sandbox.listing l on l.listing_id = s.listing_id
order by s.listing_id, s.read_at desc, s.reading_run_id desc;

comment on view sandbox.v_spec_current is 'The latest product-data check per listing, joined to the listing (asin, title, category). amazon_completeness_pct is derived as found / expected and is empty when the Amazon page was not checked.';

grant select on sandbox.v_listing_current, sandbox.v_reading_freshness, sandbox.v_ai_answer_detail, sandbox.v_spec_current to anon, authenticated;
