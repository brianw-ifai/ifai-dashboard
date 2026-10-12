-- Featured Offer state, its own clock, and the offer observed by the same Keepa read.
--
-- Four separate concepts live on this row and are never interchangeable:
--   featured_offer_state  whether Amazon presents the purchasing offer (Keepa Featured Offer read)
--   buybox_status         who the observed seller is (seller harvester)
--   no_active_offer       whether a current offer exists at all (catalog evidence)
--   competitive_price_threshold_cents  Amazon's outside-price benchmark (Keepa)
--
-- A row can be featured_offer_state = 'withheld' and buybox_status = 'Unknown/Not Harvested'
-- at the same time, and that is not a contradiction: when Amazon withholds the Featured
-- Offer there is no seller of record to harvest, and the seller harvester is also behind.
-- featured_offer_state is authoritative for the Featured Offer. buybox_status is
-- authoritative for the seller. Neither writer overwrites the other's column.
--
-- MAP is not a Featured Offer concept. map_price is not read or written here.
-- No rows are backfilled. The collector (wrench fender_omnichannel_audit_sync) fills them.

ALTER TABLE command.fmic_retail_buybox_map
  ADD COLUMN IF NOT EXISTS featured_offer_state text,
  ADD COLUMN IF NOT EXISTS featured_offer_source text,
  ADD COLUMN IF NOT EXISTS featured_offer_checked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS featured_offer_attempted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS featured_offer_last_error text,
  ADD COLUMN IF NOT EXISTS competitive_external_price_state text,
  ADD COLUMN IF NOT EXISTS featured_offer_observed_price_cents integer,
  ADD COLUMN IF NOT EXISTS featured_offer_observed_shipping_cents integer,
  ADD COLUMN IF NOT EXISTS featured_offer_observed_seller text;

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_state IS
  'present, withheld, no_active_offer, check_failed, or not_checked. Authoritative for the Featured Offer reading. NULL means this collector has not checked the row. buybox_status never sets this column.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_withheld IS
  'True only when featured_offer_state is withheld. False only when it is present. NULL for no_active_offer, check_failed, and not_checked. A failed read must never write false.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_source IS
  'keepa when a Keepa product read decided the state. catalog.current_price when the catalog showed no current offer and no paid call was needed.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_checked_at IS
  'When the stored classification was last successfully observed. Not written on a failed attempt. This is the Featured Offer clock; updated_at is the hourly catalog recompute and is not a Featured Offer freshness signal.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_attempted_at IS
  'When the collector last attempted this row, successfully or not.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_last_error IS
  'Why the most recent attempt failed. Set beside the last successful classification, never in place of it. Not a current result.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.competitive_external_price_state IS
  'present, unavailable, check_failed, or not_checked. unavailable means Keepa classified the Featured Offer and published no outside benchmark. That is not a failure and not a price of zero.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.competitive_price_threshold_cents IS
  'Amazon Competitive External Price in integer cents, set only when competitive_external_price_state is present. NULL when unavailable, failed, or unchecked. Never 0, never negative, never a shelf price, never a Keepa list price, and never MAP.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_observed_price_cents IS
  'The current New offer price in cents read from the SAME Keepa response as featured_offer_state and competitive_price_threshold_cents. NULL for no_active_offer rows and for rows this reading has not observed. Compare only this value against the benchmark; offer_price comes from the hourly catalog recompute and is a different observation.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_observed_shipping_cents IS
  'Featured Offer shipping in cents when Keepa reported it on the same read. NULL when Keepa reported none. Never a substituted zero.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_observed_seller IS
  'Seller id holding the Featured Offer on the same read. NULL when Amazon presented none or Keepa did not identify one.';

-- Append-only. The leading columns keep their order and types so CREATE OR REPLACE
-- succeeds and existing grants, including cursor_schema_reader, are preserved.
CREATE OR REPLACE VIEW public.canvas_retail_listings
WITH (security_invoker = false) AS
 SELECT b.asin,
    b.model_name,
    c.title,
    c.category,
    c.is_bundle,
    c.parent_asin,
    c.product_url,
    b.map_price,
    b.offer_price,
    b.leakage_amount AS amz_leakage,
    b.buybox_status,
    b.buybox_winner,
    c.buybox_seller AS buybox_seller_id,
    sl.seller_name AS buybox_seller_name,
    c.buybox_is_fba,
    c.offer_count_new,
    c.sales_rank,
    c.monthly_sold,
    b.reviews_count,
    b.channels,
    b.bundle_name,
    b.wmt_price,
    b.wmt_leakage,
    b.wmt_url,
    b.wmt_seller,
    b.wmt_match_conf,
    b.wmt_checked_at,
    b.mf_price,
    b.mf_leakage,
    b.mf_checked_at,
    LEAST(b.leakage_amount, b.wmt_leakage, b.mf_leakage) AS worst_leakage,
    COALESCE(b.leakage_amount, 0::numeric) < 0::numeric OR COALESCE(b.wmt_leakage, 0::numeric) < 0::numeric OR COALESCE(b.mf_leakage, 0::numeric) < 0::numeric AS is_map_violation,
    b.updated_at,
    b.competitive_price_threshold_cents,
    b.featured_offer_withheld,
    (
      b.featured_offer_state = 'withheld'
      AND b.competitive_external_price_state = 'present'
      AND b.competitive_price_threshold_cents IS NOT NULL
      AND b.competitive_price_threshold_cents > 0
      AND b.featured_offer_observed_price_cents IS NOT NULL
      AND b.featured_offer_observed_price_cents > 0
      AND b.featured_offer_source = 'keepa'
      AND b.featured_offer_checked_at IS NOT NULL
      AND (b.featured_offer_observed_price_cents + COALESCE(b.featured_offer_observed_shipping_cents, 0))
          > b.competitive_price_threshold_cents
    ) AS competitive_offer_suppressed,
    b.featured_offer_state,
    b.featured_offer_source,
    b.featured_offer_checked_at,
    b.featured_offer_attempted_at,
    b.featured_offer_last_error,
    b.competitive_external_price_state,
    b.featured_offer_observed_price_cents,
    b.featured_offer_observed_shipping_cents,
    b.featured_offer_observed_seller
   FROM command.fmic_retail_buybox_map b
     LEFT JOIN command.fmic_electric_catalog c ON c.asin::text = b.asin::text
     LEFT JOIN command.fmic_sellers sl ON sl.seller_id::text = c.buybox_seller::text;

COMMENT ON VIEW public.canvas_retail_listings IS
  'Browser read of the monitored retail population. Featured Offer columns come from the Featured Offer collector and carry their own checked time. offer_price is the hourly catalog price and is not the offer the Featured Offer benchmark was compared against; read featured_offer_observed_price_cents for that.';

COMMENT ON COLUMN public.canvas_retail_listings.competitive_offer_suppressed IS
  'Derived. Confirmed high-price suppression only: the Featured Offer is withheld, Amazon published a positive outside benchmark, and the offer observed by that same Keepa read is above it. A withheld Featured Offer with no benchmark is still withheld, and is false here. Never derived from offer_price.';

NOTIFY pgrst, 'reload schema';

-- Restated so a fresh database ends with the same read access. CREATE OR REPLACE VIEW
-- keeps grants, so this adds nothing on the live database and removes nothing.
GRANT SELECT ON TABLE public.canvas_retail_listings TO anon, authenticated;
GRANT ALL ON TABLE public.canvas_retail_listings TO service_role;
