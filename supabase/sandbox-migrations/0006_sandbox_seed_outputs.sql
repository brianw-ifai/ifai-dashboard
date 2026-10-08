-- 0006_sandbox_seed_outputs.sql
-- Seed action items generated from the readings (never typed counts), then compute metric_value once.
-- The statement-level trigger from 0005 also refreshes metric_value when the insert below runs; the explicit call at
-- the end is the documented entry point and returns the number of metric_value rows written.

insert into sandbox.action_item (action_item_id, client_id, registry_key, finding_ref, listing_id, title, owner, status, severity, created_at, updated_at)
-- one per suppressed listing (Featured Offer withheld and offer above Amazon's outside benchmark)
select 'act_suppressed_' || v.asin, 'cl_fender', 'cl_fender:featured_offer_suppressed', v.benchmark_reading_id, v.listing_id,
       'Match the outside price or correct the outside listing for ' || v.asin, 'client', 'open', 'high', now(), now()
  from sandbox.v_listing_current v
 where v.client_id = 'cl_fender' and v.offer_status = 'active' and v.suppressed
union all
select 'act_authorized_seller_list', 'cl_fender', 'cl_fender:retail_control_partner_led', null::text, null::text,
       'Supply the authorized-seller list', 'client', 'open', 'high', now(), now()
union all
select 'act_map_sheet', 'cl_fender', 'cl_fender:map_below', null::text, null::text,
       'Supply the MAP sheet', 'client', 'open', 'medium', now(), now()
union all
select 'act_additional_property', 'cl_fender', 'cl_fender:spec_additional_property_missing', null::text, null::text,
       'Add additionalProperty to ' || x.n || ' found fender.com pages', 'intofocus', 'open', 'medium', now(), now()
  from (select count(*) as n from sandbox.v_spec_current
         where client_id = 'cl_fender' and brand_site_page_found and additional_property_present = false) x
 where x.n > 0
union all
select 'act_seller_read', 'cl_fender', 'cl_fender:seller_read_coverage', null::text, null::text,
       'Finish the seller read for ' || x.n || ' active offers', 'intofocus', 'open', 'medium', now(), now()
  from (select count(*) as n from sandbox.v_listing_current
         where client_id = 'cl_fender' and offer_status = 'active' and coalesce(seller_class, 'not_read') = 'not_read') x
 where x.n > 0
union all
select 'act_phase1_inputs', 'cl_fender', 'cl_fender:estimate_phase1_uplift', null::text, null::text,
       'Supply the Phase 1 uplift inputs (COO)', 'intofocus', 'open', 'medium', now(), now()
union all
select 'act_enterprise_inputs', 'cl_fender', 'cl_fender:estimate_enterprise_range', null::text, null::text,
       'Supply the enterprise range inputs (COO)', 'intofocus', 'open', 'medium', now(), now();

select sandbox.refresh_metric_values('cl_fender') as metric_value_rows_written;
