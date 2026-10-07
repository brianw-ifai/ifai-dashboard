-- Other retailers' prices, one row per listing per channel.
-- sweetwater and reverb are the first channel values. A later retailer is another
-- channel value on a new row, not a new column.
-- The browser reads these through public.canvas_listing_channel_price.
-- No prices are inserted here.
--
-- A later price match upserts command.listing_channel_price:
--   asin        varchar(12)              required  listing key, same ASIN as command.fmic_retail_buybox_map.asin
--   channel     text                     required  lowercase slug; sweetwater and reverb first
--   price       numeric(10,2)            required  shelf price in dollars, greater than 0
--   url         text                     optional  product page when the match has one
--   checked_at  timestamp with time zone required  when this price was checked
-- One row per (asin, channel). On conflict, replace price, url, and checked_at.

CREATE TABLE IF NOT EXISTS command.listing_channel_price (
  asin character varying(12) NOT NULL,
  channel text NOT NULL,
  price numeric(10,2) NOT NULL,
  url text,
  checked_at timestamp with time zone NOT NULL,
  CONSTRAINT listing_channel_price_pkey PRIMARY KEY (asin, channel),
  CONSTRAINT listing_channel_price_channel_slug CHECK (channel ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT listing_channel_price_price_positive CHECK (price > 0)
);

COMMENT ON TABLE command.listing_channel_price IS
  'One stored price per listing (asin) per retailer channel. First channel values: sweetwater, reverb. Add a retailer by inserting rows; do not add a column.';

COMMENT ON COLUMN command.listing_channel_price.asin IS
  'Amazon ASIN. Same listing key as command.fmic_retail_buybox_map.asin.';

COMMENT ON COLUMN command.listing_channel_price.channel IS
  'Retailer slug. sweetwater and reverb are the first values. A later channel is another slug in this column.';

COMMENT ON COLUMN command.listing_channel_price.price IS
  'Stored shelf price in dollars. Do not insert a row when no price was stored.';

COMMENT ON COLUMN command.listing_channel_price.url IS
  'Product page URL for this channel when the match has one. Null when unknown.';

COMMENT ON COLUMN command.listing_channel_price.checked_at IS
  'When this price was checked.';

CREATE INDEX IF NOT EXISTS listing_channel_price_channel_idx
  ON command.listing_channel_price (channel);

ALTER TABLE command.listing_channel_price ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_channel_price_authenticated_select ON command.listing_channel_price;
CREATE POLICY listing_channel_price_authenticated_select
  ON command.listing_channel_price
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS listing_channel_price_service_role_all ON command.listing_channel_price;
CREATE POLICY listing_channel_price_service_role_all
  ON command.listing_channel_price
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON command.listing_channel_price TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON command.listing_channel_price TO service_role;

-- Owner rights, same as the other canvas views, so the browser read is not blocked by RLS.
CREATE OR REPLACE VIEW public.canvas_listing_channel_price
WITH (security_invoker = false) AS
 SELECT asin,
    channel,
    price,
    url,
    checked_at
   FROM command.listing_channel_price;

COMMENT ON VIEW public.canvas_listing_channel_price IS
  'Browser read of command.listing_channel_price. One row per listing per channel. Selectable columns: asin, channel, price, url, checked_at.';

REVOKE ALL ON TABLE public.canvas_listing_channel_price FROM PUBLIC;
REVOKE ALL ON TABLE public.canvas_listing_channel_price FROM anon, authenticated;
GRANT SELECT ON TABLE public.canvas_listing_channel_price TO anon, authenticated;
GRANT ALL ON TABLE public.canvas_listing_channel_price TO service_role;

NOTIFY pgrst, 'reload schema';
