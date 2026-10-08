-- 0007_sandbox_listing_view_speed.sql
-- Same columns and meaning as v_listing_current in 0004. The benchmark_match_channels column was a correlated
-- subquery evaluated once per listing (about 1 second for 3,604 rows). The browser role has a 3 second statement
-- timeout, so concurrent page reads could time out and the dashboard showed a transient failed read. The matches
-- are now aggregated once in a CTE and joined by listing_id. Sandbox schema only.

create or replace view sandbox.v_listing_current with (security_invoker = false) as
with r1 as (
  select distinct on (o.listing_id) o.listing_id, o.reading_run_id, o.read_at, o.offer_status, o.listed_price, o.sales_rank, o.monthly_sold, o.offer_count_new, o.amazon_stock
  from sandbox.listing_offer_reading o
  join sandbox.reading_run r on r.reading_run_id = o.reading_run_id
  where r.source = 'keepa_product' and r.workflow_name = 'fender_catalog_harvester'
  order by o.listing_id, o.read_at desc, o.reading_run_id desc
), r2 as (
  select distinct on (o.listing_id) o.listing_id, o.reading_run_id, o.read_at, o.seller_class, o.featured_offer_seller_id, o.seller_ships_with_amazon
  from sandbox.listing_offer_reading o
  join sandbox.reading_run r on r.reading_run_id = o.reading_run_id
  where r.source = 'keepa_seller'
  order by o.listing_id, o.read_at desc, o.reading_run_id desc
), r3 as (
  select distinct on (o.listing_id) o.listing_id, o.listing_offer_reading_id, o.reading_run_id, o.read_at, o.offer_status, o.featured_offer_withheld, o.offer_price, o.offer_price_cents, o.competitive_external_price_cents, o.legacy_status
  from sandbox.listing_offer_reading o
  join sandbox.reading_run r on r.reading_run_id = o.reading_run_id
  where r.source = 'keepa_product' and r.workflow_name = 'fender_omnichannel_audit_sync'
  order by o.listing_id, o.read_at desc, o.reading_run_id desc
), ch as (
  select distinct on (p.listing_id, p.channel) p.listing_id, p.channel, p.match_status, p.price, p.price_cents, p.url, p.checked_at
  from sandbox.listing_channel_price p
  order by p.listing_id, p.channel, p.read_at desc, p.reading_run_id desc
), bm as (
  -- channels whose latest priced price equals the listing's benchmark, aggregated once per listing
  select c.listing_id, array_agg(c.channel order by c.channel) as channels
  from ch c
  join r3 on r3.listing_id = c.listing_id
  where c.match_status = 'priced' and c.price_cents = r3.competitive_external_price_cents
  group by c.listing_id
)
select l.listing_id, l.client_id, l.retailer, l.asin, l.parent_listing_id, l.parent_asin, l.title, l.brand, l.manufacturer, l.model_number, l.upc, l.ean, l.color, l.category, l.is_bundle, l.bundle_name, l.url, l.amazon_list_price, l.first_seen_at, l.last_harvested_at, l.updated_at,
       r1.reading_run_id as catalog_run_id, r1.read_at as catalog_read_at, r1.offer_status, r1.listed_price, r1.sales_rank, r1.monthly_sold, r1.offer_count_new, r1.amazon_stock,
       r2.reading_run_id as seller_run_id, r2.read_at as seller_read_at, r2.seller_class, r2.featured_offer_seller_id, s.seller_name as featured_offer_seller_name, r2.seller_ships_with_amazon,
       r3.listing_offer_reading_id as benchmark_reading_id, r3.reading_run_id as benchmark_run_id, r3.read_at as benchmark_read_at, r3.offer_status as benchmark_offer_status, r3.featured_offer_withheld, r3.offer_price, r3.offer_price_cents, r3.competitive_external_price_cents, r3.legacy_status,
       (r3.featured_offer_withheld is true and r3.offer_price_cents is not null and r3.competitive_external_price_cents is not null and r3.offer_price_cents > r3.competitive_external_price_cents) as suppressed,
       w.price as walmart_price, w.url as walmart_url, w.checked_at as walmart_checked_at,
       m.price as musiciansfriend_price, m.url as musiciansfriend_url, m.checked_at as musiciansfriend_checked_at,
       bm.channels as benchmark_match_channels
from sandbox.listing l
left join r1 on r1.listing_id = l.listing_id
left join r2 on r2.listing_id = l.listing_id
left join sandbox.seller s on s.seller_id = r2.featured_offer_seller_id
left join r3 on r3.listing_id = l.listing_id
left join ch w on w.listing_id = l.listing_id and w.channel = 'walmart' and w.match_status = 'priced'
left join ch m on m.listing_id = l.listing_id and m.channel = 'musiciansfriend' and m.match_status = 'priced'
left join bm on bm.listing_id = l.listing_id;

comment on view sandbox.v_listing_current is 'One row per listing with its latest catalog read (offer_status, listed_price, rank, stock), latest seller read (seller_class, seller), latest Featured Offer and benchmark read (withheld flag, offer cents, benchmark cents, read_at), the latest priced Walmart and Musician''s Friend price and link, suppressed = withheld and offer cents above benchmark cents, and benchmark_match_channels = channels whose latest priced price_cents equals the benchmark cents (the amazon channel row is the offer itself, so it only matches when the offer equals the benchmark).';

grant select on sandbox.v_listing_current to anon, authenticated;
