-- Competitive External Price and Featured Offer withheld, on the retail row the
-- hourly sync already updates. The browser reads these through
-- public.canvas_retail_listings. No rows are backfilled here.

ALTER TABLE command.fmic_retail_buybox_map
  ADD COLUMN IF NOT EXISTS competitive_price_threshold_cents integer,
  ADD COLUMN IF NOT EXISTS featured_offer_withheld boolean;

COMMENT ON COLUMN command.fmic_retail_buybox_map.competitive_price_threshold_cents IS
  'Amazon Competitive External Price. Keepa product.competitivePriceThreshold, integer cents. NULL when Keepa omits it or returns a non-positive sentinel. The hourly sync writes this on the same row it already updates.';

COMMENT ON COLUMN command.fmic_retail_buybox_map.featured_offer_withheld IS
  'True only when Keepa product.stats.buyBoxIsUnqualified is true. False when a Featured Offer is present. NULL until that sync writes it. A null buyBoxSellerId by itself is not true.';

-- Append-only. Existing column order stays so CREATE OR REPLACE keeps grants.
CREATE OR REPLACE VIEW public.canvas_retail_listings AS
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
      b.featured_offer_withheld IS TRUE
      AND b.competitive_price_threshold_cents IS NOT NULL
      AND b.competitive_price_threshold_cents > 0
      AND b.offer_price IS NOT NULL
      AND (b.offer_price * 100) > b.competitive_price_threshold_cents
    ) AS competitive_offer_suppressed
   FROM command.fmic_retail_buybox_map b
     LEFT JOIN command.fmic_electric_catalog c ON c.asin::text = b.asin::text
     LEFT JOIN command.fmic_sellers sl ON sl.seller_id::text = c.buybox_seller::text;

COMMENT ON COLUMN public.canvas_retail_listings.competitive_offer_suppressed IS
  'Derived. True only when the Featured Offer is withheld and the stored offer_price (new offer, including shipping, in dollars) is above competitive_price_threshold_cents.';

NOTIFY pgrst, 'reload schema';
