-- 0001_sandbox_schema.sql
-- Dashboard v2: schema `sandbox`, generated from docs/v2/schema/ifai-dashboard-v2.schema.json (v0.1, 2026-10-08).
-- Every object is schema-qualified. Enums are CHECK constraints. Column descriptions are COMMENT ON COLUMN.
-- metric_registry.status_rule jsonb is present in the published schema.json (added 2026-10-08), so nothing is added beyond it.
-- Deviation: schema.json notes say spec_reading is unique on (listing_id, reading_run_id). The backfill keeps every
-- historical fmic_spec_readiness row (append-only, several per listing) under one backfill run R6, so the constraint
-- here is (listing_id, reading_run_id, read_at). Live runs that write one row per listing per run still satisfy it.

create schema if not exists sandbox;

-- Lists the five ways a brand can sell on Amazon and the retail question the dashboard leads with for each.
-- Grain: One row per seller type
create table sandbox.seller_type (
  seller_type text not null,
  label text not null,
  primary_retail_question text not null,
  description text,
  constraint seller_type_pkey primary key (seller_type),
  constraint seller_type_seller_type_check check (seller_type in ('partner_led', 'brand_led_marketplace', 'amazon_retail_only', 'hybrid', 'no_managed_presence'))
);

comment on table sandbox.seller_type is 'Lists the five ways a brand can sell on Amazon and the retail question the dashboard leads with for each. Grain: One row per seller type.';
comment on column sandbox.seller_type.seller_type is 'Short code for how the brand sells on Amazon.';
comment on column sandbox.seller_type.label is 'Name the dashboard shows, such as Partner-led.';
comment on column sandbox.seller_type.primary_retail_question is 'The first retail question the dashboard answers for a client of this type.';
comment on column sandbox.seller_type.description is 'One sentence that explains this seller type to a new client.';

-- Holds each brand IntoFocus reports on, with the seller type that sets its primary retail question.
-- Grain: One row per client brand
create table sandbox.client (
  client_id text not null,
  name text not null,
  slug text not null unique,
  seller_type text not null,
  organization_id uuid,
  brand_site_domain text,
  is_active boolean default true not null,
  onboarded_at timestamptz,
  updated_at timestamptz,
  constraint client_pkey primary key (client_id),
  constraint client_seller_type_fkey foreign key (seller_type) references sandbox.seller_type (seller_type)
);

comment on table sandbox.client is 'Holds each brand IntoFocus reports on, with the seller type that sets its primary retail question. Grain: One row per client brand.';
comment on column sandbox.client.client_id is 'IntoFocus id for the brand we report on.';
comment on column sandbox.client.name is 'Brand name the dashboard shows.';
comment on column sandbox.client.slug is 'Short name used in links, such as sample-brand.';
comment on column sandbox.client.seller_type is 'How the brand sells on Amazon. This picks the primary retail question.';
comment on column sandbox.client.organization_id is 'The client''s login account in command.organizations. Stored as a plain value because login tables stay outside this model.';
comment on column sandbox.client.brand_site_domain is 'Website where the brand publishes its own product pages. The product data check looks here.';
comment on column sandbox.client.is_active is 'True while IntoFocus is reporting on this brand.';
comment on column sandbox.client.onboarded_at is 'When the client was set up.';
comment on column sandbox.client.updated_at is 'When this row last changed.';

-- Holds each Amazon seller account seen holding a Featured Offer, with its public rating.
-- Grain: One row per Amazon seller id
create table sandbox.seller (
  seller_id text not null,
  marketplace text default 'amazon' not null,
  seller_name text,
  is_amazon_retail boolean default false not null,
  ships_with_amazon boolean,
  rating_pct integer,
  rating_count integer,
  first_seen_at timestamptz,
  updated_at timestamptz,
  constraint seller_pkey primary key (seller_id),
  constraint seller_marketplace_check check (marketplace in ('amazon'))
);

comment on table sandbox.seller is 'Holds each Amazon seller account seen holding a Featured Offer, with its public rating. Grain: One row per Amazon seller id.';
comment on column sandbox.seller.seller_id is 'Amazon''s id for the seller account.';
comment on column sandbox.seller.marketplace is 'Marketplace the seller account belongs to.';
comment on column sandbox.seller.seller_name is 'Storefront name shoppers see. Empty when the lookup didn''t return a name.';
comment on column sandbox.seller.is_amazon_retail is 'True when the seller is Amazon itself (Amazon Retail).';
comment on column sandbox.seller.ships_with_amazon is 'True when the seller''s offers ship through Fulfillment by Amazon.';
comment on column sandbox.seller.rating_pct is 'Share of the seller''s feedback that is positive, in percent.';
comment on column sandbox.seller.rating_count is 'How many feedback ratings the seller has.';
comment on column sandbox.seller.first_seen_at is 'First time a reading saw this seller holding a Featured Offer.';
comment on column sandbox.seller.updated_at is 'When the seller lookup last refreshed this row.';

-- Records which sellers the client says are authorized to sell its products, and from when.
-- Grain: One row per client, seller, and effective start date
create table sandbox.seller_authorization (
  seller_authorization_id text not null,
  client_id text not null,
  seller_id text not null,
  authorization_status text not null,
  effective_from date not null,
  effective_to date,
  source text,
  supplied_by text,
  loaded_at timestamptz not null,
  constraint seller_authorization_pkey primary key (seller_authorization_id),
  constraint seller_authorization_authorization_status_check check (authorization_status in ('authorized', 'not_authorized')),
  constraint seller_authorization_client_id_seller_id_effective_from_key unique (client_id, seller_id, effective_from),
  constraint seller_authorization_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint seller_authorization_seller_id_fkey foreign key (seller_id) references sandbox.seller (seller_id)
);

comment on table sandbox.seller_authorization is 'Records which sellers the client says are authorized to sell its products, and from when. Grain: One row per client, seller, and effective start date.';
comment on column sandbox.seller_authorization.seller_authorization_id is 'Id for this authorization record.';
comment on column sandbox.seller_authorization.client_id is 'Client whose list this row comes from.';
comment on column sandbox.seller_authorization.seller_id is 'Amazon seller the client made a decision about.';
comment on column sandbox.seller_authorization.authorization_status is 'Whether the client says this seller may sell its products.';
comment on column sandbox.seller_authorization.effective_from is 'First day the decision applies.';
comment on column sandbox.seller_authorization.effective_to is 'Last day the decision applies. Empty means it still applies.';
comment on column sandbox.seller_authorization.source is 'Where the decision came from, such as the client''s reseller sheet.';
comment on column sandbox.seller_authorization.supplied_by is 'Person who sent the list.';
comment on column sandbox.seller_authorization.loaded_at is 'When IntoFocus stored this row.';

-- Holds each retailer listing we watch for a client, with the facts that rarely change.
-- Grain: One row per client and retailer listing (ASIN on Amazon)
create table sandbox.listing (
  listing_id text not null,
  client_id text not null,
  retailer text default 'amazon' not null,
  asin text not null,
  parent_listing_id text,
  parent_asin text,
  title text,
  brand text,
  manufacturer text,
  model_number text,
  upc text,
  ean text,
  color text,
  category text,
  is_bundle boolean default false not null,
  bundle_name text,
  url text,
  amazon_list_price numeric(10,2),
  first_seen_at timestamptz,
  last_harvested_at timestamptz,
  updated_at timestamptz,
  constraint listing_pkey primary key (listing_id),
  constraint listing_retailer_check check (retailer in ('amazon')),
  constraint listing_client_id_retailer_asin_key unique (client_id, retailer, asin),
  constraint listing_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint listing_parent_listing_id_fkey foreign key (parent_listing_id) references sandbox.listing (listing_id)
);

comment on table sandbox.listing is 'Holds each retailer listing we watch for a client, with the facts that rarely change. Grain: One row per client and retailer listing (ASIN on Amazon).';
comment on column sandbox.listing.listing_id is 'IntoFocus id for the listing.';
comment on column sandbox.listing.client_id is 'Client whose product this listing sells.';
comment on column sandbox.listing.retailer is 'Store the listing lives on. Amazon today.';
comment on column sandbox.listing.asin is 'Amazon''s product id for the listing.';
comment on column sandbox.listing.parent_listing_id is 'The parent listing when this is a size or color variation.';
comment on column sandbox.listing.parent_asin is 'Amazon''s id for the parent listing, as Keepa reports it, even when we don''t watch the parent.';
comment on column sandbox.listing.title is 'Listing title on Amazon.';
comment on column sandbox.listing.brand is 'Brand name on the listing.';
comment on column sandbox.listing.manufacturer is 'Manufacturer name on the listing.';
comment on column sandbox.listing.model_number is 'Manufacturer model number.';
comment on column sandbox.listing.upc is 'UPC barcode number.';
comment on column sandbox.listing.ean is 'EAN barcode number.';
comment on column sandbox.listing.color is 'Color or finish on the listing.';
comment on column sandbox.listing.category is 'Amazon category the listing sits in. This replaces the old hand-named divisions.';
comment on column sandbox.listing.is_bundle is 'True when the title marks a bundle, kit, pack, or combo.';
comment on column sandbox.listing.bundle_name is 'Name of the bundle when the listing is one.';
comment on column sandbox.listing.url is 'Link to the listing page.';
comment on column sandbox.listing.amazon_list_price is 'Price Amazon shows as the list price, in dollars. This isn''t MAP.';
comment on column sandbox.listing.first_seen_at is 'When the catalog reading first found this listing.';
comment on column sandbox.listing.last_harvested_at is 'When the catalog reading last refreshed these facts.';
comment on column sandbox.listing.updated_at is 'When this row last changed.';

-- Logs every run that reads data, with how many items it should have read and how many it did, so missing, partial, and zero readings stay distinct.
-- Grain: One row per run of one reading source
create table sandbox.reading_run (
  reading_run_id uuid not null,
  client_id text not null,
  source text not null,
  workflow_name text,
  workflow_execution_id text unique,
  trigger_type text,
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null,
  population_count integer not null,
  rows_read integer default 0 not null,
  findings_count integer,
  cursor_start integer,
  cursor_end integer,
  legacy_run_key text,
  detail jsonb,
  constraint reading_run_pkey primary key (reading_run_id),
  constraint reading_run_source_check check (source in ('keepa_product', 'keepa_seller', 'walmart_price', 'musiciansfriend_price', 'sweetwater_price', 'reverb_price', 'spec_check', 'ai_battery')),
  constraint reading_run_trigger_type_check check (trigger_type in ('scheduled', 'manual', 'webhook', 'backfill')),
  constraint reading_run_status_check check (status in ('complete', 'partial', 'failed')),
  constraint reading_run_client_id_fkey foreign key (client_id) references sandbox.client (client_id)
);

comment on table sandbox.reading_run is 'Logs every run that reads data, with how many items it should have read and how many it did, so missing, partial, and zero readings stay distinct. Grain: One row per run of one reading source.';
comment on column sandbox.reading_run.reading_run_id is 'Id for this run. Every reading row points here.';
comment on column sandbox.reading_run.client_id is 'Client the run read data for.';
comment on column sandbox.reading_run.source is 'What the run reads, such as Keepa product data, Walmart prices, or AI answers.';
comment on column sandbox.reading_run.workflow_name is 'Name of the job that ran, such as fender_spec_readiness_audit.';
comment on column sandbox.reading_run.workflow_execution_id is 'The job platform''s id for this run, so a run is never logged twice.';
comment on column sandbox.reading_run.trigger_type is 'What started the run. Backfill marks rows loaded from older tables.';
comment on column sandbox.reading_run.started_at is 'When the run started.';
comment on column sandbox.reading_run.finished_at is 'When the run ended. Empty while it''s still going.';
comment on column sandbox.reading_run.status is 'complete when it read every item it should have, partial when it read fewer, failed when it read nothing usable.';
comment on column sandbox.reading_run.population_count is 'How many items the run should have read, such as every active listing in the batch.';
comment on column sandbox.reading_run.rows_read is 'How many items the run actually read and stored.';
comment on column sandbox.reading_run.findings_count is 'How many items the run flagged, such as offers above the benchmark.';
comment on column sandbox.reading_run.cursor_start is 'Position in the item list where the run began.';
comment on column sandbox.reading_run.cursor_end is 'Position where the next run should pick up.';
comment on column sandbox.reading_run.legacy_run_key is 'Old batch id, such as spec_run_123, so loaded rows trace back to the old tables.';
comment on column sandbox.reading_run.detail is 'Extra facts the job records about the run, such as batch size or API notes.';

-- Stores what one Keepa run saw on one Amazon listing: whether Amazon withheld the Featured Offer, the offer price, Amazon's outside benchmark, and who holds the offer.
-- Grain: One row per listing per reading run
create table sandbox.listing_offer_reading (
  listing_offer_reading_id text not null,
  client_id text not null,
  listing_id text not null,
  reading_run_id uuid not null,
  read_at timestamptz not null,
  offer_status text not null,
  featured_offer_withheld boolean,
  offer_price numeric(10,2),
  offer_price_cents integer generated always as (round(offer_price * 100)::integer) stored,
  competitive_external_price_cents integer,
  listed_price numeric(10,2),
  featured_offer_seller_id text,
  seller_class text,
  seller_ships_with_amazon boolean,
  offer_count_new integer,
  sales_rank integer,
  monthly_sold integer,
  amazon_stock text,
  legacy_status text,
  constraint listing_offer_reading_pkey primary key (listing_offer_reading_id),
  constraint listing_offer_reading_offer_status_check check (offer_status in ('active', 'no_active_offer')),
  constraint listing_offer_reading_seller_class_check check (seller_class in ('amazon_retail', 'third_party', 'not_read', 'no_offer')),
  constraint listing_offer_reading_listing_id_reading_run_id_key unique (listing_id, reading_run_id),
  constraint listing_offer_reading_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint listing_offer_reading_listing_id_fkey foreign key (listing_id) references sandbox.listing (listing_id),
  constraint listing_offer_reading_reading_run_id_fkey foreign key (reading_run_id) references sandbox.reading_run (reading_run_id),
  constraint listing_offer_reading_featured_offer_seller_id_fkey foreign key (featured_offer_seller_id) references sandbox.seller (seller_id)
);

comment on table sandbox.listing_offer_reading is 'Stores what one Keepa run saw on one Amazon listing: whether Amazon withheld the Featured Offer, the offer price, Amazon''s outside benchmark, and who holds the offer. Grain: One row per listing per reading run.';
comment on column sandbox.listing_offer_reading.listing_offer_reading_id is 'Id for this reading.';
comment on column sandbox.listing_offer_reading.client_id is 'Client whose listing was read.';
comment on column sandbox.listing_offer_reading.listing_id is 'Listing this reading describes.';
comment on column sandbox.listing_offer_reading.reading_run_id is 'Run that took this reading. Use it to see when the run happened and whether it finished.';
comment on column sandbox.listing_offer_reading.read_at is 'When Keepa returned this reading.';
comment on column sandbox.listing_offer_reading.offer_status is 'Whether the listing had any offer shoppers could buy when read.';
comment on column sandbox.listing_offer_reading.featured_offer_withheld is 'True when Amazon showed no Featured Offer on the listing. Empty when this run didn''t read it.';
comment on column sandbox.listing_offer_reading.offer_price is 'Lowest offer price including shipping, in dollars.';
comment on column sandbox.listing_offer_reading.offer_price_cents is 'The same offer price in cents, so it compares directly with Amazon''s benchmark.';
comment on column sandbox.listing_offer_reading.competitive_external_price_cents is 'Amazon''s outside benchmark (Competitive External Price) in cents, as Keepa supplies it. Amazon may withhold the Featured Offer when the offer is above it. Empty when Keepa didn''t report one.';
comment on column sandbox.listing_offer_reading.listed_price is 'Current price Keepa shows for the listing, in dollars, before shipping.';
comment on column sandbox.listing_offer_reading.featured_offer_seller_id is 'Seller holding the Featured Offer when read. Empty when no seller was read.';
comment on column sandbox.listing_offer_reading.seller_class is 'Who holds the Featured Offer: Amazon Retail, a third-party seller, not read yet, or no offer to hold.';
comment on column sandbox.listing_offer_reading.seller_ships_with_amazon is 'True when the offer holding the Featured Offer ships through Fulfillment by Amazon.';
comment on column sandbox.listing_offer_reading.offer_count_new is 'How many sellers offer the item new. A stored 0 means Keepa counted none.';
comment on column sandbox.listing_offer_reading.sales_rank is 'Amazon Best Sellers Rank in the listing''s category. Lower sells more.';
comment on column sandbox.listing_offer_reading.monthly_sold is 'Keepa''s estimate of units bought in the past month.';
comment on column sandbox.listing_offer_reading.amazon_stock is 'Amazon Retail''s stock state, as Keepa reports it, such as in stock or no Amazon offer.';
comment on column sandbox.listing_offer_reading.legacy_status is 'The status text the old table stored for this listing, kept so loaded rows can be checked against it.';

-- Stores the price one run found for a listing at one store, with the link and the time it was checked.
-- Grain: One row per listing, channel, and reading run
create table sandbox.listing_channel_price (
  listing_channel_price_id text not null,
  client_id text not null,
  listing_id text not null,
  reading_run_id uuid not null,
  read_at timestamptz not null,
  channel text not null,
  match_status text not null,
  price numeric(10,2),
  price_cents integer generated always as (round(price * 100)::integer) stored,
  url text,
  checked_at timestamptz not null,
  store_title text,
  store_seller_name text,
  store_msrp numeric(10,2),
  match_confidence numeric(3,2),
  constraint listing_channel_price_pkey primary key (listing_channel_price_id),
  constraint listing_channel_price_channel_check check (channel in ('amazon', 'walmart', 'musiciansfriend', 'sweetwater', 'reverb')),
  constraint listing_channel_price_match_status_check check (match_status in ('priced', 'no_match')),
  constraint listing_channel_price_listing_id_channel_reading_run_id_key unique (listing_id, channel, reading_run_id),
  constraint listing_channel_price_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint listing_channel_price_listing_id_fkey foreign key (listing_id) references sandbox.listing (listing_id),
  constraint listing_channel_price_reading_run_id_fkey foreign key (reading_run_id) references sandbox.reading_run (reading_run_id)
);

comment on table sandbox.listing_channel_price is 'Stores the price one run found for a listing at one store, with the link and the time it was checked. Grain: One row per listing, channel, and reading run.';
comment on column sandbox.listing_channel_price.listing_channel_price_id is 'Id for this price reading.';
comment on column sandbox.listing_channel_price.client_id is 'Client whose product was priced.';
comment on column sandbox.listing_channel_price.listing_id is 'Amazon listing this outside price matches.';
comment on column sandbox.listing_channel_price.reading_run_id is 'Run that checked the store.';
comment on column sandbox.listing_channel_price.read_at is 'When the run stored this reading.';
comment on column sandbox.listing_channel_price.channel is 'Store the price comes from.';
comment on column sandbox.listing_channel_price.match_status is 'priced when the store had a matching item with a price, no_match when it was checked and had none.';
comment on column sandbox.listing_channel_price.price is 'Price shown at the store, in dollars. Empty when there was no match.';
comment on column sandbox.listing_channel_price.price_cents is 'The same price in cents, so it compares directly with Amazon''s benchmark.';
comment on column sandbox.listing_channel_price.url is 'Link to the item at the store.';
comment on column sandbox.listing_channel_price.checked_at is 'When the store page was checked.';
comment on column sandbox.listing_channel_price.store_title is 'Item title as the store shows it. Use it to confirm the match.';
comment on column sandbox.listing_channel_price.store_seller_name is 'Seller named on the store''s offer, such as a Walmart marketplace seller.';
comment on column sandbox.listing_channel_price.store_msrp is 'List price or MSRP the store shows next to its price, in dollars.';
comment on column sandbox.listing_channel_price.match_confidence is 'How sure the reader is that the store item is the same product, from 0 to 1.';

-- Holds the minimum advertised price (MAP) the client sets for each listing, with the dates it applies.
-- Grain: One row per listing and effective start date
create table sandbox.listing_map_price (
  listing_map_price_id text not null,
  client_id text not null,
  listing_id text not null,
  map_price numeric(10,2) not null,
  effective_from date not null,
  effective_to date,
  source text,
  supplied_by text,
  loaded_at timestamptz not null,
  constraint listing_map_price_pkey primary key (listing_map_price_id),
  constraint listing_map_price_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint listing_map_price_listing_id_fkey foreign key (listing_id) references sandbox.listing (listing_id)
);

comment on table sandbox.listing_map_price is 'Holds the minimum advertised price (MAP) the client sets for each listing, with the dates it applies. Grain: One row per listing and effective start date.';
comment on column sandbox.listing_map_price.listing_map_price_id is 'Id for this MAP record.';
comment on column sandbox.listing_map_price.client_id is 'Client that set the price.';
comment on column sandbox.listing_map_price.listing_id is 'Listing the MAP applies to.';
comment on column sandbox.listing_map_price.map_price is 'Lowest price a seller may advertise, in dollars.';
comment on column sandbox.listing_map_price.effective_from is 'First day this MAP applies.';
comment on column sandbox.listing_map_price.effective_to is 'Last day this MAP applies. Empty means it still applies.';
comment on column sandbox.listing_map_price.source is 'Document the price came from, such as the client''s MAP sheet name.';
comment on column sandbox.listing_map_price.supplied_by is 'Person who sent the sheet.';
comment on column sandbox.listing_map_price.loaded_at is 'When IntoFocus stored this row.';

-- Stores one check of how complete a listing's product facts are on Amazon and on the brand's own product page.
-- Grain: One row per listing per reading run
create table sandbox.spec_reading (
  spec_reading_id text not null,
  client_id text not null,
  listing_id text not null,
  reading_run_id uuid not null,
  read_at timestamptz not null,
  amazon_checked boolean not null,
  amazon_fields_found integer,
  amazon_fields_expected integer,
  amazon_missing_fields text[],
  brand_site_page_found boolean not null,
  brand_site_url text,
  brand_site_fields_found integer,
  brand_site_fields_expected integer,
  brand_site_missing_fields text[],
  additional_property_present boolean,
  constraint spec_reading_pkey primary key (spec_reading_id),
  constraint spec_reading_listing_id_reading_run_id_read_at_key unique (listing_id, reading_run_id, read_at),
  constraint spec_reading_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint spec_reading_listing_id_fkey foreign key (listing_id) references sandbox.listing (listing_id),
  constraint spec_reading_reading_run_id_fkey foreign key (reading_run_id) references sandbox.reading_run (reading_run_id)
);

comment on table sandbox.spec_reading is 'Stores one check of how complete a listing''s product facts are on Amazon and on the brand''s own product page. Grain: One row per listing per reading run.';
comment on column sandbox.spec_reading.spec_reading_id is 'Id for this check.';
comment on column sandbox.spec_reading.client_id is 'Client whose listing was checked.';
comment on column sandbox.spec_reading.listing_id is 'Listing that was checked.';
comment on column sandbox.spec_reading.reading_run_id is 'Run that did the check.';
comment on column sandbox.spec_reading.read_at is 'When the check ran.';
comment on column sandbox.spec_reading.amazon_checked is 'True when the Amazon page loaded and was read. False means the Amazon counts below aren''t measured.';
comment on column sandbox.spec_reading.amazon_fields_found is 'How many of the expected Amazon product-detail fields are filled.';
comment on column sandbox.spec_reading.amazon_fields_expected is 'How many Amazon product-detail fields the check looks for. 13 today.';
comment on column sandbox.spec_reading.amazon_missing_fields is 'Names of the Amazon fields that are empty.';
comment on column sandbox.spec_reading.brand_site_page_found is 'True when site search found the product''s page on the brand''s own site.';
comment on column sandbox.spec_reading.brand_site_url is 'Link to the brand''s product page that was checked.';
comment on column sandbox.spec_reading.brand_site_fields_found is 'How many expected product facts the brand page''s structured data includes.';
comment on column sandbox.spec_reading.brand_site_fields_expected is 'How many product facts the check looks for on the brand page. 8 today.';
comment on column sandbox.spec_reading.brand_site_missing_fields is 'Names of the product facts the brand page is missing.';
comment on column sandbox.spec_reading.additional_property_present is 'True when the brand page''s structured data has an additionalProperty block, where detailed specs go. Empty when no page was found.';

-- Lists the brands an AI answer can name for a client, including the client's own brand, so answers are scored against one list.
-- Grain: One row per client and brand
create table sandbox.competitor_brand (
  competitor_brand_id text not null,
  client_id text not null,
  name text not null,
  is_client_brand boolean default false not null,
  match_terms text[],
  constraint competitor_brand_pkey primary key (competitor_brand_id),
  constraint competitor_brand_client_id_name_key unique (client_id, name),
  constraint competitor_brand_client_id_fkey foreign key (client_id) references sandbox.client (client_id)
);

comment on table sandbox.competitor_brand is 'Lists the brands an AI answer can name for a client, including the client''s own brand, so answers are scored against one list. Grain: One row per client and brand.';
comment on column sandbox.competitor_brand.competitor_brand_id is 'Id for the brand.';
comment on column sandbox.competitor_brand.client_id is 'Client whose answers are scored against this brand.';
comment on column sandbox.competitor_brand.name is 'Brand name as the dashboard shows it.';
comment on column sandbox.competitor_brand.is_client_brand is 'True for the client''s own brand or its sub-brands.';
comment on column sandbox.competitor_brand.match_terms is 'Words the scorer looks for in an answer to count a mention of this brand.';

-- Holds each question we ask AI assistants for a client, grouped by shopping category.
-- Grain: One row per client and prompt text
create table sandbox.ai_prompt (
  ai_prompt_id text not null,
  client_id text not null,
  category text not null,
  prompt_text text not null,
  names_client_product boolean default false not null,
  is_active boolean default true not null,
  legacy_sim_id text,
  constraint ai_prompt_pkey primary key (ai_prompt_id),
  constraint ai_prompt_client_id_prompt_text_key unique (client_id, prompt_text),
  constraint ai_prompt_client_id_fkey foreign key (client_id) references sandbox.client (client_id)
);

comment on table sandbox.ai_prompt is 'Holds each question we ask AI assistants for a client, grouped by shopping category. Grain: One row per client and prompt text.';
comment on column sandbox.ai_prompt.ai_prompt_id is 'Id for the prompt.';
comment on column sandbox.ai_prompt.client_id is 'Client the prompt tests.';
comment on column sandbox.ai_prompt.category is 'Shopping topic the prompt belongs to, such as beginner guitars or wrong specs.';
comment on column sandbox.ai_prompt.prompt_text is 'The exact question sent to the assistant.';
comment on column sandbox.ai_prompt.names_client_product is 'True when the question itself names a client product. These prompts are left out of share rankings.';
comment on column sandbox.ai_prompt.is_active is 'True while the prompt is still in the battery.';
comment on column sandbox.ai_prompt.legacy_sim_id is 'Old prompt id from the simulation tables, so loaded answers trace back.';

-- Stores each answer an AI assistant gave to a prompt, which brand it named, and whether it stated a wrong product fact.
-- Grain: One row per prompt, engine, repeat, and reading run
create table sandbox.ai_answer (
  ai_answer_id text not null,
  client_id text not null,
  ai_prompt_id text not null,
  reading_run_id uuid not null,
  read_at timestamptz not null,
  answered_at timestamptz not null,
  engine text not null,
  repeat_no integer default 1 not null,
  outcome text not null,
  winner_brand_id text,
  wrong_spec_flag boolean default false not null,
  wrong_spec_reason text,
  answer_text text,
  citations text,
  citation_urls text[],
  remediation_note text,
  legacy_source text,
  constraint ai_answer_pkey primary key (ai_answer_id),
  constraint ai_answer_engine_check check (engine in ('chatgpt', 'perplexity', 'gemini', 'unknown')),
  constraint ai_answer_outcome_check check (outcome in ('resolved', 'unclear', 'error')),
  constraint ai_answer_legacy_source_check check (legacy_source in ('live', 'run1_archive', 'conflict_snapshot')),
  constraint ai_answer_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint ai_answer_ai_prompt_id_fkey foreign key (ai_prompt_id) references sandbox.ai_prompt (ai_prompt_id),
  constraint ai_answer_reading_run_id_fkey foreign key (reading_run_id) references sandbox.reading_run (reading_run_id),
  constraint ai_answer_winner_brand_id_fkey foreign key (winner_brand_id) references sandbox.competitor_brand (competitor_brand_id)
);

comment on table sandbox.ai_answer is 'Stores each answer an AI assistant gave to a prompt, which brand it named, and whether it stated a wrong product fact. Grain: One row per prompt, engine, repeat, and reading run.';
comment on column sandbox.ai_answer.ai_answer_id is 'Id for this answer.';
comment on column sandbox.ai_answer.client_id is 'Client the answer was scored for.';
comment on column sandbox.ai_answer.ai_prompt_id is 'Question that produced the answer.';
comment on column sandbox.ai_answer.reading_run_id is 'Battery run that asked the question.';
comment on column sandbox.ai_answer.read_at is 'When the run stored the answer.';
comment on column sandbox.ai_answer.answered_at is 'When the assistant returned the answer.';
comment on column sandbox.ai_answer.engine is 'Assistant that answered. unknown means the old row didn''t record it.';
comment on column sandbox.ai_answer.repeat_no is 'Which repeat of the same question in the run, since answers vary.';
comment on column sandbox.ai_answer.outcome is 'resolved when the scorer found a named brand, unclear when it couldn''t pick one, error when the call failed.';
comment on column sandbox.ai_answer.winner_brand_id is 'Brand the answer named most. Empty unless the outcome is resolved.';
comment on column sandbox.ai_answer.wrong_spec_flag is 'True when the answer stated a product fact the rule set knows is false.';
comment on column sandbox.ai_answer.wrong_spec_reason is 'The rule the answer broke, in plain words.';
comment on column sandbox.ai_answer.answer_text is 'Full text of the answer.';
comment on column sandbox.ai_answer.citations is 'Sources the assistant listed, as it wrote them.';
comment on column sandbox.ai_answer.citation_urls is 'Links the assistant cited.';
comment on column sandbox.ai_answer.remediation_note is 'What the old battery suggested doing about this answer.';
comment on column sandbox.ai_answer.legacy_source is 'Old table the row was loaded from. Empty for new answers.';

-- Defines every number the dashboard shows: what it means, who it covers, how it's computed, which tables feed it, and how much to trust it.
-- Grain: One row per client and registry id
create table sandbox.metric_registry (
  registry_key text not null,
  client_id text not null,
  registry_id text not null,
  name text not null,
  meaning text not null,
  unit text not null,
  population text,
  formula text,
  source_tables text[],
  owner text not null,
  confidence text not null,
  status_rule jsonb,
  notes text,
  constraint metric_registry_pkey primary key (registry_key),
  constraint metric_registry_unit_check check (unit in ('percent', 'count', 'usd', 'timestamp', 'none')),
  constraint metric_registry_confidence_check check (confidence in ('measured', 'estimate', 'target', 'assumption')),
  constraint metric_registry_client_id_registry_id_key unique (client_id, registry_id),
  constraint metric_registry_client_id_fkey foreign key (client_id) references sandbox.client (client_id)
);

comment on table sandbox.metric_registry is 'Defines every number the dashboard shows: what it means, who it covers, how it''s computed, which tables feed it, and how much to trust it. Grain: One row per client and registry id.';
comment on column sandbox.metric_registry.registry_key is 'Client and registry id joined, such as cl_sample:featured_offer_suppressed.';
comment on column sandbox.metric_registry.client_id is 'Client this definition applies to.';
comment on column sandbox.metric_registry.registry_id is 'Short metric id, such as featured_offer_suppressed.';
comment on column sandbox.metric_registry.name is 'Metric name the dashboard shows.';
comment on column sandbox.metric_registry.meaning is 'One sentence on what the number tells you.';
comment on column sandbox.metric_registry.unit is 'What the number is measured in.';
comment on column sandbox.metric_registry.population is 'Which listings, answers, or runs the number covers and which it leaves out.';
comment on column sandbox.metric_registry.formula is 'How the number is computed, in plain terms.';
comment on column sandbox.metric_registry.source_tables is 'Tables in this model the number is built from.';
comment on column sandbox.metric_registry.owner is 'Who answers for the number: intofocus, client, coo, or mixed.';
comment on column sandbox.metric_registry.confidence is 'measured comes from stored readings; estimate uses stored inputs; target is a goal; assumption has no reading behind it.';
comment on column sandbox.metric_registry.status_rule is 'Rule that turns the value into a dashboard status. Holds kind (higher_is_better, lower_is_better, or count_is_bad), warn, and danger thresholds. Empty means the metric shows a neutral status.';
comment on column sandbox.metric_registry.notes is 'Caveats the reader should know, such as when a number stays unavailable.';

-- Stores each computed value of a metric, with the run it was computed from, so the dashboard shows a number and its as-of time together.
-- Grain: One row per metric, dimension value, and computation
create table sandbox.metric_value (
  metric_value_id text not null,
  client_id text not null,
  registry_key text not null,
  reading_run_id uuid,
  computed_at timestamptz not null,
  dimension_name text,
  dimension_value text,
  numeric_value numeric,
  numerator integer,
  denominator integer,
  constraint metric_value_pkey primary key (metric_value_id),
  constraint metric_value_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint metric_value_registry_key_fkey foreign key (registry_key) references sandbox.metric_registry (registry_key),
  constraint metric_value_reading_run_id_fkey foreign key (reading_run_id) references sandbox.reading_run (reading_run_id)
);

comment on table sandbox.metric_value is 'Stores each computed value of a metric, with the run it was computed from, so the dashboard shows a number and its as-of time together. Grain: One row per metric, dimension value, and computation.';
comment on column sandbox.metric_value.metric_value_id is 'Id for this computed value.';
comment on column sandbox.metric_value.client_id is 'Client the value describes.';
comment on column sandbox.metric_value.registry_key is 'Metric this value belongs to.';
comment on column sandbox.metric_value.reading_run_id is 'Latest run that fed the value. Empty for values built from client-supplied data only.';
comment on column sandbox.metric_value.computed_at is 'When the value was computed.';
comment on column sandbox.metric_value.dimension_name is 'What the value is split by, such as category or engine.';
comment on column sandbox.metric_value.dimension_value is 'The split this row covers, such as Electric Guitars.';
comment on column sandbox.metric_value.numeric_value is 'The number itself. A 0 here is a measured zero.';
comment on column sandbox.metric_value.numerator is 'Count on top of the fraction for percent metrics.';
comment on column sandbox.metric_value.denominator is 'Count underneath the fraction for percent metrics.';

-- Holds each dollar estimate the dashboard shows, with its formula, owner, and as-of date, so no estimate appears without its inputs.
-- Grain: One row per client and estimate
create table sandbox.estimate (
  estimate_id text not null,
  client_id text not null,
  registry_key text not null,
  name text not null,
  formula text not null,
  unit text default 'usd' not null,
  low_value numeric(14,2),
  high_value numeric(14,2),
  owner text not null,
  confidence text not null,
  as_of date not null,
  constraint estimate_pkey primary key (estimate_id),
  constraint estimate_confidence_check check (confidence in ('measured', 'estimate', 'target', 'assumption')),
  constraint estimate_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint estimate_registry_key_fkey foreign key (registry_key) references sandbox.metric_registry (registry_key)
);

comment on table sandbox.estimate is 'Holds each dollar estimate the dashboard shows, with its formula, owner, and as-of date, so no estimate appears without its inputs. Grain: One row per client and estimate.';
comment on column sandbox.estimate.estimate_id is 'Id for the estimate.';
comment on column sandbox.estimate.client_id is 'Client the estimate is about.';
comment on column sandbox.estimate.registry_key is 'Registry row that defines the estimate.';
comment on column sandbox.estimate.name is 'Estimate name the dashboard shows.';
comment on column sandbox.estimate.formula is 'How the inputs combine, in plain terms.';
comment on column sandbox.estimate.unit is 'What the estimate is measured in.';
comment on column sandbox.estimate.low_value is 'Low end of the estimate. Empty until inputs exist.';
comment on column sandbox.estimate.high_value is 'High end of the estimate. Equals the low end for a single figure.';
comment on column sandbox.estimate.owner is 'Person or role who answers for the estimate.';
comment on column sandbox.estimate.confidence is 'How much to trust the figure.';
comment on column sandbox.estimate.as_of is 'Date the estimate was last reviewed.';

-- Stores each input to an estimate with its source and owner, so a reader can check every part of the figure.
-- Grain: One row per estimate and input key
create table sandbox.estimate_input (
  estimate_input_id text not null,
  client_id text not null,
  estimate_id text not null,
  input_key text not null,
  value numeric(14,2) not null,
  unit text not null,
  source text not null,
  as_of date not null,
  owner text not null,
  confidence text not null,
  constraint estimate_input_pkey primary key (estimate_input_id),
  constraint estimate_input_confidence_check check (confidence in ('measured', 'estimate', 'target', 'assumption')),
  constraint estimate_input_estimate_id_input_key_key unique (estimate_id, input_key),
  constraint estimate_input_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint estimate_input_estimate_id_fkey foreign key (estimate_id) references sandbox.estimate (estimate_id)
);

comment on table sandbox.estimate_input is 'Stores each input to an estimate with its source and owner, so a reader can check every part of the figure. Grain: One row per estimate and input key.';
comment on column sandbox.estimate_input.estimate_input_id is 'Id for the input.';
comment on column sandbox.estimate_input.client_id is 'Client the input is about.';
comment on column sandbox.estimate_input.estimate_id is 'Estimate this input feeds.';
comment on column sandbox.estimate_input.input_key is 'Name of the input in the formula, such as reduced_returns.';
comment on column sandbox.estimate_input.value is 'The input amount.';
comment on column sandbox.estimate_input.unit is 'What the input is measured in.';
comment on column sandbox.estimate_input.source is 'Where the amount came from.';
comment on column sandbox.estimate_input.as_of is 'Date the amount was true.';
comment on column sandbox.estimate_input.owner is 'Who supplied the amount.';
comment on column sandbox.estimate_input.confidence is 'How much to trust the amount.';

-- Tracks each action that follows from a metric or finding, who owns it, and where it stands.
-- Grain: One row per action
create table sandbox.action_item (
  action_item_id text not null,
  client_id text not null,
  registry_key text,
  finding_ref text,
  listing_id text,
  title text not null,
  owner text not null,
  status text default 'open' not null,
  severity text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  due_date date,
  constraint action_item_pkey primary key (action_item_id),
  constraint action_item_owner_check check (owner in ('intofocus', 'client', 'unassigned')),
  constraint action_item_status_check check (status in ('open', 'in_progress', 'done')),
  constraint action_item_severity_check check (severity in ('high', 'medium', 'low')),
  constraint action_item_client_id_fkey foreign key (client_id) references sandbox.client (client_id),
  constraint action_item_registry_key_fkey foreign key (registry_key) references sandbox.metric_registry (registry_key),
  constraint action_item_listing_id_fkey foreign key (listing_id) references sandbox.listing (listing_id)
);

comment on table sandbox.action_item is 'Tracks each action that follows from a metric or finding, who owns it, and where it stands. Grain: One row per action.';
comment on column sandbox.action_item.action_item_id is 'Id for the action.';
comment on column sandbox.action_item.client_id is 'Client the action is for.';
comment on column sandbox.action_item.registry_key is 'Metric the action responds to.';
comment on column sandbox.action_item.finding_ref is 'Reading the action responds to, such as lor_001.';
comment on column sandbox.action_item.listing_id is 'Listing the action is about, if any.';
comment on column sandbox.action_item.title is 'What needs doing, in one line.';
comment on column sandbox.action_item.owner is 'Who does the work.';
comment on column sandbox.action_item.status is 'Where the action stands.';
comment on column sandbox.action_item.severity is 'How much it matters.';
comment on column sandbox.action_item.created_at is 'When the action was added.';
comment on column sandbox.action_item.updated_at is 'When the action last changed.';
comment on column sandbox.action_item.due_date is 'When it should be done.';

