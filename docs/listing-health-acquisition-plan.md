# Amazon Listing Health and A+ Readiness: source feasibility

Read at **2026-10-13 21:45 UTC**. This is a source and acquisition plan. It does not change schemas, collectors, schedules, or the canvas. It does not call Keepa, SmartScout, or any paid API. A missing value is left missing. It is not treated as zero or false.

Schema design waits until a pilot has saved candidate payloads and the semantics below have been checked against Amazon pages.

## What this plan is for

IntoFocus needs one canonical set of listing facts that can feed both a guided hub-and-spoke summary and a maximalist operational table. Those two views are not designed here. They have to be able to share the same definitions: a summary count and a row the operator opens must come from the same observation, the same null rule, and the same evidence link.

Fender's seller type is **Partner-led**. FMIC does not sell the catalog itself. Amazon Retail and authorized partners do. That decides which accounts can see actual unit sales.

## Reference artifact, not evidence

`Russ Durvet_Listing_Monitor.html` (Google Drive file `1sB6qeCVmE7wtVvygABfSnB20bmUjeRJd`) is an information-design reference. The file on Drive was last modified 2026-10-01. The snapshot embedded in the page says **June 11, 2026 at 02:51 PM** and contains **176 Durvet listings**, not Fender listings.

The page is a single monitor with a priority queue, a revenue-at-risk panel, seller concentration, a miscategorized-to-suggested panel, and a row table whose columns are score, product, action, buy box, control, sellers, rating, reviews, images, bullets, A+, dollars per month, sub-category, and flags. A detail row also shows video, bought-per-month, main category, and a suggested fix. Those are the surfaces a later hub and a later operational table may need to cover. They are not measurements of Fender.

Do not adopt the snapshot's classifications. In that file:

- A+ is only the strings `Yes` (7) and `No` (169). There is no "not checked" value. The row style paints every value other than `Yes` as no.
- Video is only `Yes` (1) or `No` (175).
- Image count and bullet count are numeric on every row, including a bullet count of 0. The file cannot show an unread count.
- The flag `MANY SELLERS` is on 23 rows, the same count as rows with `sellers >= 15`. The flag `THIN BULLETS` is on 70 rows, the same count as `bullets <= 3`. The flag `1 IMAGE` is on 68 rows, the same count as `imgs <= 1`. Those alignments describe this snapshot. They are not IntoFocus thresholds.
- `LOW RATING` is on 27 rows. That is not the same as "rating under 4" (13 rows). The rule is not recoverable from the page, so it is not a requirement.
- Suggested category text is filled on 7 rows, the same count as `MISCATEGORIZED`. There is no browse-node id.
- `revmo` is empty on 159 of 176 rows. `atRisk` is 0 on 120 rows. `impknown` is a separate boolean. The dollar formula is not in the page. The impact numbers were precomputed. They are not a method.
- The heading names SmartScout for a market-share panel. `subCat` is empty on 174 of 176 rows. The word Keepa does not appear.

Fender's stored `offer_count_new` already reaches 23, so a "15+" display cap is not a property of the current Fender offer field.

## Populations at this read

| Population | Rows | Clock |
| --- | --- | --- |
| `command.fmic_electric_catalog` | 3,615 | `extracted_at` from 2026-09-28 22:30 UTC through 2026-10-13 21:30:52 UTC. `updated_at` max matches the catalog job. |
| `command.fmic_retail_buybox_map` | 1,064 | Every retail ASIN is in the catalog. `updated_at` max 2026-10-13 21:41:24 UTC. |
| Catalog ASINs with no retail row | 2,551 | Same 2,551 have `buybox_checked_at` null. |
| `public.canvas_spec_readiness` (latest row per ASIN) | 1,009 | `amazon_checked` is true on all 1,009. `checked_at` from 2026-10-02 08:03 UTC through 2026-10-13 18:04:08 UTC. |

`public.canvas_freshness` at this read, newest first among listing jobs:

| Job | Last run (UTC) | Cursor |
| --- | --- | --- |
| `featured_offer_keepa` | 2026-10-13 21:41:16 | 935 |
| `catalog_harvester` | 2026-10-13 21:30:52 | 21 |
| `buybox_seller_harvester` | 2026-10-13 21:30:31 | 0 |
| `map_leakage_walmart` | 2026-10-13 20:53:13 | 455 |
| `map_parity_musiciansfriend` | 2026-10-13 19:29:24 | 0 |
| `spec_readiness` | 2026-10-13 18:04:08 | 740 |

The role `cursor_map_writer` can read the catalog and retail tables and cannot read `command.fmic_job_state`, `command.fmic_spec_readiness`, or `command.fmic_sellers`. Job extras (including the older "keepa page" note) were not re-read. Spec figures above are from the client view. Seller-feedback columns exist (`rating_pct`, `rating_count` on `command.fmic_sellers`) and were not counted.

No table in `command` or `public` stores A+, bullets, image count, video, a browse-node id, a suggested node, product rating, unique seller count, or revenue.

## Current-data coverage

Client-ready means an operator can be shown the value with the semantics in this table, a coverage line, and a way to open the evidence. A column that exists is not client-ready when the null rule is wrong, the label is broader than the field, or the value is a third-party estimate presented as a fact.

| Measurement | Stored field | Source as stored | Coverage at this read | Freshness | Precise semantics | Client-ready |
| --- | --- | --- | --- | --- | --- | --- |
| Current Amazon category and browse-node path/id | `fmic_electric_catalog.category` (also copied onto the spec view and the retail view) | Catalog harvest. The October 7 source map recorded the catalog job as a Keepa page. This read could not re-open job extras. | 3,615 / 3,615 non-blank. **6 distinct labels:** Solid Body 3,209; Electric Guitar Kits 222; Electric Guitars 114; Hollow & Semi-Hollow Body 68; Tuning Pegs 1; Bags, Cases & Covers 1. Spec view uses the same label family (no Tuning Pegs row). | Catalog `extracted_at` through 2026-10-13 21:30 UTC. Spec checks are a subset and some are days older. | A short merchandising label. Not a browse-node id, not a breadcrumb, not `categoryTree`. No node id is stored anywhere. | No. Safe only as "stored catalog label," never as Amazon's current browse path. |
| Suggested category and browse-node id | None | None | Not measured | None | A recommendation would be a derived opinion with a rule version. It is not an Amazon field we store. | No |
| Unique seller count | None. `offer_count_new` is a different fact. `buybox_seller` is one seller id. | Seller harvest writes `buybox_seller` and `offer_count_new` on the checked subset. | Unique sellers: not stored. One seller id: 1,064 retail rows have been through the seller clock; 64 of those are still `buybox_status = Unknown/Not Harvested`. | `buybox_checked_at` from 2026-10-01 16:00 UTC through 2026-10-13 21:00:37 UTC on the 1,064. | The Featured Offer seller, when known, is one account. It is not a count of sellers. | No for a seller count |
| New-offer count | `fmic_electric_catalog.offer_count_new` | Same seller/offer harvest. Null when that harvest has not stored a count. | 1,045 present, all between 1 and 23. **0 zeros. 2,570 null.** 19 of the 1,064 checked rows have a check time and no offer count. | Same `buybox_checked_at` window for the checked rows. | Count of new offers observed on that harvest. Not unique sellers. A null is unread, not zero. A stored 1 is a real one. | Not yet. The number is usable in an operator table only with the null rule and the "new offers, not sellers" label. It is not a portfolio seller-health rate. |
| Product rating and review count | `fmic_retail_buybox_map.reviews_count` | No writer found. Column is `NOT NULL DEFAULT 0`. | **1,064 / 1,064 are 0.** None are null. None are above 0. | The retail `updated_at` clock moves for other reasons. It is not a review check. | The default. Not a confirmed count of zero reviews. Seller `rating_pct` / `rating_count` are seller feedback, not the product's stars, and were not readable with this role. | No. Do not display the 0. |
| Image count | None | None | Not measured | None | A gallery count is not the spec-audit field list. | No |
| Bullet count and bullet text | None | None | Not measured | None | Spec audit does not score bullets. | No |
| Video presence | None | None | Not measured | None | Absence of a column is "not checked," not "no video." | No |
| A+ presence | None | None | Not measured | None | The Amazon A+ Matrix satellite still shows Amazon attribute completeness. That is a different reading. | No |
| A+ module count | None | None | Not measured | None | Same. | No |
| A+ comparison-table presence | None | None | Not measured | None | Same. An empty spec-field list is not an A+ result. | No |
| Monthly unit sales | `fmic_electric_catalog.monthly_sold` | Integer on the catalog row. Values are 50 (8), 200 (1), 300 (2), and 1000 (1). That shape matches Keepa's `monthlySold` bracket floor ("50+", "200+", "300+", "1000+"), which Keepa documents as Amazon's "bought in past month" display, not an exact count. The column comment is empty, so the harvester's mapping is not stored next to the value. | **12 present. 3,603 null. 0 zeros.** | Those 12 also have an offer count, a rank, and a current price, so they were touched by the checked harvest. The other checked rows left `monthly_sold` null. | A bracket floor when Amazon published one. Not exact units. Null means "no bracket stored," not zero units. Variation-specific in Keepa's definition. Several of the 12 are color variants and kits that must not be summed. | No |
| Monthly revenue | None | None | Not measured | None | Price times `monthly_sold` would be an estimate built on a bracket floor. It is not stored, and it must not be invented. `current_price` is a shelf price (1,012 positive, 2,603 null, no zeros). MAP leakage is a price gap, not revenue. | No |
| Featured Offer state | `featured_offer_state`, `featured_offer_source`, `featured_offer_checked_at`, `featured_offer_attempted_at`, `featured_offer_last_error`, `featured_offer_withheld` | `keepa` for a product read. `catalog.current_price` when the catalog showed no current offer. Documented in `supabase/migrations/20261012133000_featured_offer_state.sql`. | All **1,064** retail rows have a state. None are null. None are `check_failed`. `featured_offer_last_error` is null on all 1,064. States: present 947 (552 with benchmark unavailable, 395 with benchmark present); withheld 61 (43 with benchmark present, 18 with benchmark unavailable); no_active_offer 56. | Successful checks from 2026-10-12 19:41 UTC through 2026-10-13 21:41:16 UTC. | `present`, `withheld`, `no_active_offer`, `check_failed`, or `not_checked`. Null would mean not checked. `featured_offer_withheld` is true only for withheld (61), false only for present (947), null for no_active_offer (56). This is not `buybox_status` (who the seller is: 3P Confirmed 865, Amazon 1P 83, Unknown/Not Harvested 64, No Active Offer 52). | Yes, for the 1,064-row retail population, with the state shown and the 2,551 unchecked catalog ASINs left out of the rate. |
| Suppression evidence | `competitive_external_price_state`, `competitive_price_threshold_cents`, `featured_offer_observed_price_cents`, `featured_offer_observed_shipping_cents`, `featured_offer_observed_seller`, derived `competitive_offer_suppressed` | Same Keepa response as the Featured Offer state, when `featured_offer_source = keepa`. | Benchmark present on 442 rows (395 present-FO + 43 withheld + 4 no_active_offer). Confirmed high-price suppression: **42**. Withheld without a usable benchmark: **18**. One other withheld row, `B003AYNEEM`, has a benchmark and is excluded from the 42: stored item price $8.39 (839 cents), benchmark $12.38 (1238 cents), shipping null. That row is not confirmed above the benchmark. Its landed-price relationship is unresolved. Observed shipping is null on 118 rows and 0 on 941. All 42 confirmed rows also have null shipping. Observed seller is null on 118. | Same Featured Offer clock. | The benchmark is Amazon's Competitive External Price in cents, not MAP and not a shelf price. High-price suppression requires withheld, a positive benchmark, a positive observed offer, source `keepa`, and a check time. The view compares `observed price + COALESCE(shipping, 0)` to the benchmark. That coalesce is an implementation assumption. It is not proof that shipping was free, and it must not be described as free shipping. The stored shipping cell stays null. Treating a null as zero can make an unresolved landed price look like a finished comparison. The 42 confirmed cases do not depend on that assumption: each stored item price alone is already above its benchmark, so unknown shipping or a positive shipping amount cannot reverse the comparison. `B003AYNEEM` stays out of the 42 because stored evidence does not confirm it is above the benchmark. The same evidence does not resolve whether the landed price is above or below $12.38. `offer_price` is a different observation and is not the price in that comparison. | Yes for the 42 confirmed cases, because each stored item price alone is already above its benchmark. The screen still has to say this is not every withheld row. The 18 withheld rows without a benchmark stay withheld. `B003AYNEEM` stays out of the 42. The pilot still inspects how the page presents shipping. Not a catalog-wide rate. |

`sales_rank` is stored (1,633 positive, 1,982 null, no zeros) and is **not** the category measurement. **920 of the 1,633** share a rank value with another ASIN. The largest shared ranks each belong to one `parent_asin`. The rank's browse node (`salesRankReference`) is not stored. Do not present `sales_rank` as a child ASIN's own rank or as a category id.

The spec audit's missing-field vocabulary, on the 1,009 latest rows, is `scale_length`, `hand_orientation`, `item_weight`, `item_dimensions`, `number_of_strings`, `guitar_bridge_system`, `fretboard_material_type`, `guitar_pickup_configuration`, `neck_material_type`, `manufacturer_part_number`, `body_material_type`, `color`, and `upc`. An empty missing-field list on a checked row is "none of those attributes were listed as missing." It is not an A+ result, a bullet result, or an image result. **514** of the 1,009 have an empty missing-field list.

### Distinctions the stored data already forces

- **Unique sellers vs offer count.** `offer_count_new` counts new offers. One seller can have one new offer. Several sellers can sit behind a count of 15. `buybox_seller` is a single id. `fmic_sellers` is a seller directory, not a per-ASIN census.
- **Zero reviews vs unread reviews.** `reviews_count` cannot be null and is 0 on every retail row. That 0 is the column default. Unread is the honest state. A future 0 is client-ready only after a completed check writes it and a check time.
- **No A+ vs A+ not checked.** Nothing has been checked. A later false is allowed only with `aplus_checked_at` and the page URL. Null stays "not checked." The Durvet file's Yes/No pair is the pattern to avoid.
- **Thin bullets vs missing A+.** Bullets are the listing's feature list. A+ is a separate content document below the bullets. Neither is stored. A thin bullet list does not mean A+ is missing, and a missing A+ does not mean the bullets are thin.
- **Category evidence vs a broad label.** The six labels are a broad stored label. Amazon's evidence is the breadcrumb and the browse-node id on the detail page, or `classifications` from Catalog Items. `B00J4G5QSW` is stored as Tuning Pegs and titled as an American Vintage '64 Telecaster. That is a label to test, not a confirmed miscategorization.
- **Observed vs estimated.** Featured Offer state, the benchmark, and the observed offer are observed (Keepa's copy of Amazon's Featured Offer and Competitive External Price). `monthly_sold`, when present, is a bracket floor Amazon displayed, not exact units and not revenue. No revenue estimate is stored. Do not multiply the bracket by price and call it revenue.

## Source feasibility

Authority classes used below: **authoritative** (the account or Amazon API that owns the fact), **observed** (read from Amazon's page or from a provider field that copies a page fact), **derived** (computed from those inputs by a rule we version), **estimated** (a model, a bracket, or a third-party sales model).

### Amazon SP-API Catalog Items API v2022-04-01

`getCatalogItem` / `searchCatalogItems`. Marketplace `ATVPDKIKX0DER` for amazon.com. Official included datasets: `attributes`, `classifications`, `dimensions`, `identifiers`, `images`, `productTypes`, `relationships`, `salesRanks`, `summaries`, `vendorDetails`. There is no `videos` dataset and no A+ dataset. `vendorDetails` is vendor-only.

| Field | What the API actually returns | Class | Evidence id |
| --- | --- | --- | --- |
| Current category | `classifications`: browse classifications with display name and classification id, per marketplace. This is the current catalog classification, which can be more than one node. | Authoritative catalog classification | ASIN + marketplace id + classification id |
| Suggested category | Not in this API. | Not available |  |
| Unique sellers | Not in this API. | Not available |  |
| New-offer count | Not in this API. | Not available |  |
| Rating and reviews | Not a documented included dataset. | Not available here |  |
| Image count | `images`: variants such as `MAIN` and `PT01`, with URL, height, width. Count the images in that dataset. That count is the catalog gallery, not A+ images and not a video. | Observed catalog images | Image URL |
| Bullets | `attributes.bullet_point[]` when `includedData` contains `attributes` and the product type defines the attribute. Amazon support has confirmed bullets are omitted unless `attributes` is requested, and callers have reported bullets missing on some items even then. Missing attribute means not returned, not a bullet count of 0. | Observed catalog attribute when present | ASIN |
| Bullet text | The `value` strings on those attribute entries, with `language_tag` and `marketplace_id`. | Observed when present | ASIN |
| Video | Not an included dataset. Do not infer video from images. | Not available here |  |
| A+, module count, comparison table | Not in this API. | Not available here |  |
| Monthly units and revenue | Not in this API. `salesRanks` is a rank, not units. | Not available here | Rank node id, if requested |
| Featured Offer | Not in this API. | Not available here |  |

**Access.** Selling-partner authorization for an app with a role that can call Catalog Items (Product Listing role on the current A+ and catalog guides). Any authorized seller in the marketplace can request catalog items; the caller does not have to own the ASIN. Fender being partner-led does not by itself block a catalog read, once some authorized seller (FMIC, if they have a seller account, or a partner who authorizes IntoFocus) grants the app.

**Freshness.** Live at call time. Catalog attributes can lag a listing edit.

**Cost and limits.** No per-ASIN data fee. Usage-plan rate limits apply. A 20-ASIN pilot does not need a rate-limit design. A 3,615-ASIN backfill does.

**Limits.** Bullets are not guaranteed on every ASIN. Classifications are Amazon's current nodes, not a quality judgment. Images can include swatches and variant images; the pilot has to define which variants count as "image count" before a schema does.

### Amazon SP-API Listings Items API

Operates on a **seller SKU the authorized seller owns**. It can return that seller's listing attributes, including bullets, and listing issues for that SKU.

For a partner-led brand this is the wrong primary source for the 3,615-ASIN catalog. Most of those ASINs are not FMIC's SKUs. Use it only for listings an authorized FMIC or partner account actually controls. It does not return other sellers' offers, and it does not return A+ documents (those are the A+ Content API).

### Amazon A+ Content API v2020-11-01

This API exists. It is not a guess. The operations that matter are `searchContentDocuments`, `searchContentPublishRecords`, `getContentDocument`, and `listContentDocumentAsinRelations`.

`getContentDocument` takes a `contentReferenceKey` plus `marketplaceId` and `includedDataSet` of `CONTENTS` and/or `METADATA`. `CONTENTS` is the module list. Amazon's A+ examples include `StandardComparisonTableModule` (`productColumns` with title, ASIN, image, highlight, metrics). Module count is the length of the content module list on that document. Comparison-table presence is authoritative when the module type is the comparison-table module.

**What it does not do.** The manage-A+ guide says you retrieve content **published by the selling partner who authorized the call**. A document another account published onto the same ASIN is outside this response. A null or empty publish-record search means "this account has no matching document." It does not mean the detail page has no A+. Publish status (`APPROVED`, `REJECTED`, `DRAFT`, `SUBMITTED`) is about the document, not about what a shopper sees if a different document is live.

There is no suggested-category, offer-count, review, revenue, or Featured Offer field in this API.

**Access.** Selling-partner authorization, Product Listing role, and in practice Brand Registry for the brand whose A+ the account manages. Client authorization has to name the account that publishes Fender A+ (FMIC brand account, not a dealer's login, unless that dealer is the publisher).

**Freshness.** The document is current when fetched. Amazon asks callers not to poll `getContentDocument` more than once an hour per document for approval status.

**Evidence.** `contentReferenceKey` (Amazon says this key is not a permalink and can change), marketplace id, ASIN relations, module type.

**Limits.** Does not see another publisher's A+. Does not see a comparison chart that is only a flat image inside a different module type. That image case still needs a page observation.

### Product Pricing API (needed because Catalog Items has no offers)

Not requested as a primary source, and required if offer counts are to come from Amazon rather than Keepa. `getItemOffers` returns an offer summary and offer list with seller ids for an ASIN. The Competitive External Price is documented in Amazon's Product Pricing API and Notifications FAQ as the lowest price recently found at a reputable retailer outside Amazon. Retailer names are not disclosed. Pack size can be adjusted. A similar product from another brand can be used.

| Field | Class | Limit |
| --- | --- | --- |
| New-offer count and the offer list | Observed | The response can be paginated. A summary count and a returned page are different facts. Keep both. |
| Unique sellers | Derived from distinct `SellerId` on the returned offers | Only as complete as the pages retrieved. Do not equate the summary offer count with this distinct count. |
| Featured Offer seller and price | Observed when the response identifies the featured offer | Still pair it with the withheld/high-price state. A missing seller id on a withheld listing is expected. |
| Competitive External Price | Authoritative Amazon benchmark when this API returns it | Not MAP. Not a named retailer. |

**Access.** Pricing role on the authorized selling-partner app. Same partner-led constraint: the app needs an authorized account, and the data is marketplace offer data, not that account's sales.

**Freshness.** Live at call time. Notifications (`AnyOfferChanged`) are a later subscription, not part of this pilot.

### Seller Central and client-authorized reports

| Report | Fields that are real | Class | Who can pull it | What it is not |
| --- | --- | --- | --- | --- |
| `GET_SALES_AND_TRAFFIC_REPORT` | `unitsOrdered`, `orderedProductSales`, `shippedProductSales`, sessions, page views, buy-box percentage, by day/week/month and parent/child/SKU | Authoritative for **that seller's** orders | Seller account, SP-API | Brand-wide GMV. A partner-led brand's dealer sales are not in FMIC's report unless FMIC is the seller of those orders. Buy-box percentage here is that seller's traffic share, not IntoFocus's Featured Offer state. |
| `GET_VENDOR_SALES_REPORT` and vendor real-time sales | Ordered/shipped units and revenue for the vendor's ASINs | Authoritative for **Amazon Retail (1P)** shipments Amazon reports to the vendor | Vendor Central account | 3P marketplace sales. Fender has Amazon 1P on 83 of 1,064 retail rows, so a vendor report would cover only the 1P slice, and only if FMIC's vendor account is the one we can call. |
| `GET_BRAND_ANALYTICS_SEARCH_CATALOG_PERFORMANCE_REPORT` | Impressions, clicks, cart adds, purchases from search, by ASIN | Authoritative search-funnel counts for a Brand Registry seller | Brand Registry + Brand Analytics role. Seller only. | Total retail revenue. Purchases in this report are search-attributed, not all orders. |
| Brand Analytics market basket, search terms, repeat purchase | Relationship and query facts | Authoritative for those reports | Seller and vendor, depending on the report | Listing health and revenue. |
| Listing quality / Fix Your Products in Seller Central | Issue text for the account's listings, sometimes including content gaps | Observed account issues | The account that owns the listings | A browse-node recommendation API. No public SP-API operation was found that returns Amazon's suggested browse node. Do not invent one. |

**Client first-party sales.** A file FMIC already trusts (vendor POS, distributor sell-through, or their own Amazon retail extract) is the authoritative brand-wide revenue source when it is keyed by ASIN and month and the grain is documented (ordered vs shipped, 1P vs 3P, gross vs net). Nothing in this database is that file.

### Existing stored and cached Keepa data

What is already retained is the extracted columns in the coverage table. There is **no raw Keepa payload table**, no JSON column on the catalog or retail tables, and no Keepa file in workspace storage. `cursor_map_writer` cannot read `fmic_job_state.extra`, so this read cannot list request parameters the live collector sent and then dropped.

Fields Keepa documents on the product object that we do **not** store, and therefore cannot recover from cache:

| Keepa field | Would inform | Why it is not "already cached" |
| --- | --- | --- |
| `categoryTree`, `categories`, `rootCategory`, `salesRankReference` | Browse path and node id | Not stored. The six-label `category` is all that was kept. |
| `features` | Up to 5 bullets, each truncated at 1,000 characters. Null if not available. | Not stored. |
| `images` (and deprecated `imagesCSV`) | Image metadata and count | Not stored. |
| `videos` | Carousel videos plus up to 10 community videos. Requires the `videos` parameter. Live data also wants `offers`. Undefined if unavailable. | Not stored. A missing field is not "no video." |
| `aPlus` | Modules with text, image URLs, alt text, video URLs, and an `asin` array Keepa describes as comparison-table ASINs. `fromManufacturer` boolean. Requires `aplus=1`. Live data also wants `offers`. Returns null if unavailable. | Not stored. Null from Keepa is "unavailable," not "checked, no A+." Keepa does not return Amazon's module-type enum. A non-empty `asin` array is a clue to a comparison module, not proof, and an image-only chart can have an empty `asin` array. |
| `reviews` / csv types `RATING` and `COUNT_REVIEWS` | Variation-specific review count and rating (rating is an integer 0–50). Requires `rating=1` for the reviews object. Rating-count history stopped updating 2025-04-09. The Java helper `getCurrentReviewCount()` returns 0 when history is missing. Do not copy that helper. | Not stored. |
| `offers[].sellerId`, `stats.current` count types, `buyBoxEligibleOfferCounts` | Offers and, if the offer list is complete, distinct sellers. Eligible-offer counts are eight condition/channel buckets, not unique sellers. `totalOfferCount` is **-2 when unknown**. | Only `offer_count_new` was kept, and only on 1,045 rows. |
| `monthlySold`, `lastSoldUpdate` | Bracket floor and the time Keepa last updated it. Most ASINs have no value. Undefined/null if none. Keepa says it is not an estimate and not an exact figure. | The integer was kept for 12 ASINs. The update time was not. |
| `stats.buyBoxIsUnqualified`, `buyBoxSellerId`, `buyBoxPrice`, `buyBoxShipping`, `competitivePriceThreshold` | Featured Offer and benchmark | These are the fields the current Featured Offer columns already compress. The raw response is not kept. Shipping null vs 0 cannot be re-checked from cache. |

The current Featured Offer collector is outside this repo (the migration names wrench `fender_omnichannel_audit_sync`). This repo does not show the query string, so it is not safe to say the live calls already requested `aplus`, `videos`, or `rating`.

### Future paid Keepa reads

A product request is the credible paid source for a **page observation Keepa has already parsed**, not for actual revenue.

| Need | Parameter | Class | Token note from Keepa's current product-request page |
| --- | --- | --- | --- |
| Category tree and node ids, bullets, images, `monthlySold` | Base product. Use `history=0` on a pilot so the csv history is omitted. | Observed page facts. `monthlySold` is a bracket floor. | 1 token per ASIN when `offers` is not used. A missing ASIN still costs the token. |
| Live offers, Featured Offer, A+ live data, video live data | `offers` between 20 and 100, `only-live-offers=1`, plus `aplus=1` and `videos=1` | Observed. Distinct sellers are derived from `sellerId`. | When `offers` is set, the base 1-token charge does not apply. Cost is 6 tokens per found offer page of up to 10 offers, minimum 5 if the fetch succeeds and the ASIN has no offers. `aplus` and `videos` add no extra token. `update=0` can add 1 token if Keepa updated the product in the last hour. |
| Rating and review history | `rating=1` | Observed history. Missing history is not zero. | Up to 1 extra token per product. |
| Buy box block without a full offer pull | `buybox=1` | Observed | 2 extra tokens. The current collector already classifies Featured Offer; do not buy this for rows that are already fresh unless the pilot needs the raw block. |

**Subscription.** A Keepa API token plan. IntoFocus already runs `featured_offer_keepa`, so a plan exists. This plan does not check the remaining token balance, because that would be an account read this task did not need and a product pull would spend tokens.

**Limits.** `features` is capped at 5 bullets and 1,000 characters. `aPlus` null is unavailable, not absent. Comparison-table detection from `module.asin` has to be validated on pages. `monthlySold` must stay null when absent and must not be multiplied into a dollar figure without the label "bracket floor times a point-in-time price." Offer history can include dead offers; `only-live-offers` and `lastSeen` are required if the count is "current."

### SmartScout

Public product-search filters and the data-lake reference expose, among other fields: `categoryName`, `subcategoryName`, `subcategoryId`, `numberOfSellers`, `numberFbaSellers`, `reviewCount`, `reviewRating`, `buyBoxPrice`, `rank`, `monthlyRevenueEstimate`, `productPageScore`, parent ASIN, and variation flag. A separate sales-estimate history exposes estimated units, estimated revenue, and a coverage percentage. Seller-on-ASIN revenue is marked **proposed / unverified** on SmartScout's own data-lake page.

No A+ field, bullet field, image count, video field, or browse-node path was found in the public product schema reviewed here. Do not assume SmartScout can score A+.

| Field | Class | Use |
| --- | --- | --- |
| `numberOfSellers` | Estimated or observed census, depending on their collection. Their own lake text calls some seller counts proposed. | Candidate for unique-seller **comparison** against a page count. Not authoritative until the pilot overlaps it with `getItemOffers` or a manual offer list. |
| `reviewRating`, `reviewCount` | Third-party copy of the page | Same. Missing must stay missing. |
| `monthlyRevenueEstimate`, estimated unit sales | **Estimated** | The only SmartScout field that answers a question the Amazon APIs will not answer for a partner-led brand: approximate 3P retail dollars. It is not actual revenue. |
| Category / subcategory name and id | Their taxonomy, which may follow Amazon nodes | Useful as a second category opinion. Not Amazon's suggested node. Not a replacement for `classifications`. |

**Access.** SmartScout subscription and API key. No client Amazon authorization. IntoFocus does not appear to have SmartScout responses stored.

**Freshness.** Their lake copy says product state refreshes on their schedule (seller history is described as twice weekly). Not live.

**Cost.** Subscription pricing was not retrieved. Do not buy it for A+ or bullets.

### Controlled Amazon page observations

A person, or a later controlled fetch, opens `https://www.amazon.com/dp/{ASIN}` on amazon.com, records the ZIP, login state, and time, and writes what the page showed. This is the accuracy standard for the pilot. It is observed, not authoritative accounting.

| Field | What the page can show | What it cannot show |
| --- | --- | --- |
| Category | Breadcrumb text and the node id in the breadcrumb URL | A "suggested" node. The page shows where it is filed, not where an analyst wishes it were filed. |
| Offers and sellers | The offer list, if it is expanded past the widget. New vs used must be separated. | A widget that says "15+" or stops after a few sellers is incomplete. Our stored counts already exceed 15, so the page widget and the stored count can disagree without either being "the sellers." |
| Rating and reviews | Stars and the count printed on the page. Note whether it is this ASIN or the parent variation. | A blank rating widget is "not shown," not zero, until the page explicitly says no reviews. |
| Images | Gallery frames, excluding A+ and review photos | A+ images |
| Bullets | The bullet list text | A+ body copy |
| Video | A video in the gallery, and videos in the Videos section. Record which. | That an API would return the same set |
| A+ | Whether an A+ block is on the page, how many modules are visible, whether a comparison table is a real module or a picture, and any "from the manufacturer" mark | Who published it, and unpublished drafts |
| Bought in past month | The "N+ bought in past month" string, if Amazon shows it | Exact units. Revenue. |
| Featured Offer | The buy button, or a high-price / no featured offer message, and the landed price | The Competitive External Price. Amazon does not name the outside retailer on the page. |

**Access.** No API key. A manual pilot of about 20 pages is the controlled version. Automated browsing is a separate decision (Amazon's terms, bot checks, ZIP personalization). Do not start that as part of schema design.

**Evidence.** The dp URL, the time, the ZIP, and a note of login state. Screenshot or saved HTML only if the pilot keeper stores it outside the production schema.

## Credential and access requirements

| Source | What IntoFocus must have | What the client must authorize | Blocks |
| --- | --- | --- | --- |
| Catalog Items, and A+ for documents that account publishes | SP-API application, Product Listing role, LWA refresh token for one selling account in the US marketplace | A selling-partner authorization from the account that should read the catalog. For A+ truth about **Fender-published** content, that account has to be the Brand Registry publisher, not an arbitrary dealer. | No such token was readable in this pass. `public.brand_tokens` is a relation this role could not describe. Do not assume it holds an Amazon grant. |
| Listings Items | Same app, plus SKUs that account owns | Same authorization. Low value until we know which ASINs are that account's SKUs. | Partner-led: expect this to cover few ASINs. |
| Product Pricing `getItemOffers` and the benchmark | Pricing role on the same app | Same selling-partner authorization | Not required to keep the current Keepa Featured Offer reading. Required before an Amazon-authoritative offer census. |
| Sales and Traffic | The seller whose orders should be counted | That seller's authorization. If the seller is a dealer, FMIC has to arrange it. FMIC's own seller login does not see the dealer's orders. | Brand-wide actual revenue. |
| Vendor sales | Vendor Central SP-API authorization | FMIC vendor account, if one exists | 1P revenue only. 83 retail rows are `Amazon 1P`. That is not proof of a vendor login. |
| Brand Analytics search catalog performance | Brand Registry and Brand Analytics role | The brand-registered seller | Search-attributed purchases only. |
| Client sell-through file | A defined grain and an ASIN key | FMIC sends the file | The practical path to actual brand-wide retail dollars if dealer SP-API access is refused. |
| Keepa, future reads | Existing API token plan | None from the client | Token budget. Raw responses are not retained today, so a pilot has to start saving them. |
| SmartScout | Subscription and API key | None from the client | Estimated revenue only, after the gaps above are confirmed. |
| Page observation | A person and a written observation sheet | None | The accuracy test for every other source. |

## Cached-data findings

Inspected without a paid call: catalog and retail rows, the client spec view, `canvas_freshness`, `information_schema`, and relation names. Not found:

- A raw Keepa, SmartScout, SP-API, or A+ payload.
- Browse-node ids hiding under another column name.
- Bullet text, image URLs, video flags, or A+ modules in any `command` or `public` column.
- A product rating other than the unread `reviews_count` default and the unreadable seller-feedback columns.
- Revenue, units ordered, or a recovery rate.

Already extracted, and worth using only as labeled:

- Featured Offer state and the benchmark comparison, for 1,064 retail ASINs.
- `offer_count_new` for 1,045 ASINs, as a new-offer count.
- `category` for all 3,615, as a six-value label.
- `monthly_sold` for 12 ASINs, as a bracket-shaped integer whose source timestamp was not kept.
- Spec attribute gaps for 1,009 ASINs. Those gaps are guitar spec fields, not listing-health content.

`sales_rank` being shared by siblings is a finding about a field we do store: 920 ranked ASINs are on a duplicated rank. Any later "category rank" display has to carry the parent and the missing node id, or it will look more precise than it is.

## Minimum validation pilot

**20 ASINs, one pass, no production schema.** Save each source's raw response next to a manual page sheet. Do not score the portfolio from this sample. The sample is large enough to include every failure mode we already know about, and small enough that a person can open every page.

If the manual pass does not produce both a completed "A+ present" page and a completed "A+ absent" page, add ASINs from the same retail population until both outcomes exist. Do not pre-label A+ from the Durvet file, from old "14 of 18 lines" copy, or from attribute completeness.

| Stratum | ASIN | Why this row | Page |
| --- | --- | --- | --- |
| Normal branded, 3P, one new offer, parent present, Featured Offer present | `B013H1CEO8` | Solid Body. `offer_count_new` 1. Parent `B017X9ENM6`. `buybox_status` 3P Confirmed. | https://www.amazon.com/dp/B013H1CEO8 |
| Normal branded, Amazon 1P, one new offer, parent present | `B07SJ9FKTR` | Solid Body. Parent `B0CBNKT8GK`. Featured Offer present. | https://www.amazon.com/dp/B07SJ9FKTR |
| Normal branded, shared rank | `B0CSLNNRSK` | Debut Strat, Dakota Red. `monthly_sold` 200. `sales_rank` 618, a rank other colorways also carry. | https://www.amazon.com/dp/B0CSLNNRSK |
| Dealer bundle, 3P | `B09BK538JH` | `is_bundle` true. Two new offers. 3P Confirmed. Affinity Strat bundle title. `bundle_name` is null on every retail row, so the bundle flag is the catalog boolean, not a partner name. | https://www.amazon.com/dp/B09BK538JH |
| Dealer kit, Amazon 1P, parent present | `B097FGRWK1` | Electric Guitar Kits. Five new offers. Parent `B0GSWHLKM7`. | https://www.amazon.com/dp/B097FGRWK1 |
| Kit with the largest stored bracket | `B0CSMBD6H9` | `is_bundle` true. `monthly_sold` 1000. One new offer. Price 279.99 stored. Do not turn that pair into revenue during the pilot. | https://www.amazon.com/dp/B0CSMBD6H9 |
| Withheld Featured Offer, benchmark present, high offer count | `B0D2LQNDS7` | Player II Telecaster. 15 new offers. Observed item price 94499 cents, shipping null, benchmark 84999 cents. Item price alone is already above the benchmark, so this row stays in the 42. Null shipping is not evidence of free shipping. `buybox_status` Unknown/Not Harvested, which is consistent with no seller of record. | https://www.amazon.com/dp/B0D2LQNDS7 |
| Withheld, benchmark present | `B00I5QXTYU` | Jim Root Jazzmaster. Observed item price 234999 cents, benchmark 219999 cents, shipping null. Item price alone is already above the benchmark, so this row stays in the 42. | https://www.amazon.com/dp/B00I5QXTYU |
| Withheld, benchmark present, landed price unresolved | `B003AYNEEM` | Excluded from the 42 confirmed high-price cases. Stored item price 839 cents ($8.39), benchmark 1238 cents ($12.38), shipping null. Not confirmed above the benchmark. The landed-price relationship stays unresolved until shipping is known. Title is a mounting screw, stored category Solid Body. | https://www.amazon.com/dp/B003AYNEEM |
| Withheld, benchmark unavailable | `B0073AMZCG` | State is withheld. `competitive_external_price_state` unavailable. Must stay out of the high-price count. | https://www.amazon.com/dp/B0073AMZCG |
| High offer count | `B0DQ237B29` | `offer_count_new` 23, the maximum stored. Featured Offer present. `monthly_sold` null. | https://www.amazon.com/dp/B0DQ237B29 |
| High offer count, second listing | `B0DQ1YJLNM` | 18 new offers. Featured Offer present. | https://www.amazon.com/dp/B0DQ1YJLNM |
| Stored label disagrees with the title | `B00J4G5QSW` | Label Tuning Pegs. Title is an American Vintage '64 Telecaster. Offer count null. Not in the sense of a confirmed misfile. | https://www.amazon.com/dp/B00J4G5QSW |
| Stored label is an accessory | `B000T4HHCG` | Label Bags, Cases & Covers. Title is a Gretsch case. Five new offers. | https://www.amazon.com/dp/B000T4HHCG |
| Stored label is a kit; title is an amp | `B000VNFCHM` | Label Electric Guitar Kits. Title is a Squier Champ 15 amp. Offer count null. | https://www.amazon.com/dp/B000VNFCHM |
| A+ page check, flagship-style | `B013H1CEO8` | Same ASIN as the normal 3P row. The manual sheet records A+ present, absent, or not fully loaded. | same |
| A+ page check, bundle | `B09BK538JH` | Bundles often differ from the parent guitar's A+. Judge the page, do not inherit the parent's result. | same |
| A+ page check, case | `B000T4HHCG` | Accessory page. | same |
| A+ page check, kit with a bracket | `B0CSMBD6H9` | Content and the "bought in past month" line on the same page. | same |
| Missing data, never harvested | `B0002DV748` | Not in the retail map. `buybox_checked_at` null. Offer count, rank, price, and `monthly_sold` all null. `is_bundle` false. Category Solid Body. | https://www.amazon.com/dp/B0002DV748 |
| Missing bracket on a harvested, high-offer row | `B0DQ237B29` | Offer count is present and `monthly_sold` is null. Confirms null-vs-zero before any revenue rule. | same |
| Unread reviews | any of the retail ASINs above | `reviews_count` is 0 in the database. The page will show whether that 0 is false. | same |

That is 16 distinct ASINs. The repeated rows are the same page used for a second question, not 20 separate products. Add four more only if A+ outcomes are one-sided or a source returns an empty payload for a whole stratum. Prefer the next withheld row `B0D2LPFNJ1` and the next unharvested sibling `B0002DV74I` before inventing a new stratum.

### What the person compares on each page

Record three-way results: matches the source, contradicts the source, or the page did not show the fact. Write the time and the delivery ZIP.

1. Breadcrumb text and node id, against a Catalog Items `classifications` payload, and against the stored six-value label. The label is expected to be coarser. Note the cases where it is a different product type (Telecaster stored as Tuning Pegs, amp stored as a kit, screw stored as Solid Body).
2. Do not fill in a suggested node. If someone wants to propose one, park it in a note. It is not a pilot result.
3. New-offer count and distinct seller ids from the full offer list, against `offer_count_new`, against `getItemOffers` if the credential exists, and against a Keepa `offers` payload if one is purchased for this set. State when the page widget was truncated.
4. Star rating and review count, and whether the number is for this ASIN or the variation family. Compare with any Keepa `rating=1` payload. Do not compare with `reviews_count` except to confirm the stored 0 is not the page.
5. Gallery image count, excluding A+ and customer photos, against Catalog Items `images` and Keepa `images`.
6. Bullet count and the bullet strings, against `attributes.bullet_point` and Keepa `features`. Note truncation.
7. Video in the gallery and in the Videos section, separately, against Keepa `videos`. Catalog Items is expected to have no video dataset; confirm that on these payloads rather than on a document alone.
8. A+ block present or absent after the page finished loading, visible module count, and whether a comparison table is a structured module or a picture. Against A+ Content API documents for the authorized account, and against Keepa `aPlus`. A Keepa null, an empty publish-record list, and a page with no A+ block are three different outcomes. Write all three.
9. The "bought in past month" string, if shown, against `monthly_sold`. Confirm the stored 50/200/300/1000 values are floors. If the page shows no bought line, the stored null is consistent and a stored number would be a contradiction.
10. Featured Offer: button present, or a no-offer / high-price message. Record how shipping is presented, and the landed price only when both item price and shipping are shown. The benchmark will usually **not** be on the page. Do not treat a missing on-page benchmark as a data failure. Do not treat a null shipping cell, or the view's `COALESCE(shipping, 0)`, as proof of free shipping. For the 42 confirmed cases, each stored item price alone is already above its benchmark; unknown or positive shipping cannot reverse that, and the page check still records shipping presentation. For `B003AYNEEM`, the stored item price is $8.39 and the benchmark is $12.38, with shipping null. Leave the landed-price relationship unresolved unless the page shows shipping. Do not record that listing as confirmed above the benchmark, or as confirmed below it, from the stored row alone. For `B0073AMZCG`, confirm withheld without inventing a benchmark.
11. Do not type a revenue number on the sheet.

### Pilot source order on these ASINs

1. Manual page sheet for all 16.
2. If a selling-partner token is already authorized, Catalog Items (`attributes`, `classifications`, `images`, `salesRanks`, `summaries`) and A+ `searchContentPublishRecords` plus `getContentDocument` for hits. If no token exists, skip and record the blocker. Do not ask a dealer for a password in order to scrape Seller Central.
3. One Keepa product request for these ASINs only, after the token cost below is accepted: `history=0`, `stats=1`, `offers=20`, `only-live-offers=1`, `aplus=1`, `videos=1`, `rating=1`. Save the raw JSON. This plan does not make that call.
4. SmartScout only if, after steps 1–3, estimated dollars are still required and no client sales file is coming. Not for A+ or bullets.

Keepa's published token table implies a ceiling near **6 tokens per found offer page**, plus up to 1 for `rating`, plus up to 1 if `update=0` and the product was fresh. These ASINs include a 23-offer listing, so `offers=20` may not be the full offer list on that ASIN; the pilot should notice the truncation rather than raise the cap on the first pass. Recompute the token total from the current Keepa price page before anyone spends.

## Revenue inputs

No Fender dollar figure belongs in this plan. The four quantities are different facts. A listing can sit in more than one issue. The revenue base is attached to the listing once.

### Actual monthly retail revenue

Minimum inputs:

- ASIN, marketplace, and the calendar month.
- Grain: ordered vs shipped, gross item price vs net of tax and promos, and whether units are 1P, 3P, or a named seller's orders.
- The source document: Sales and Traffic for that seller, a vendor sales report for 1P, or a client sell-through file. Each source stays in its own column.
- Coverage: ASINs in the population with no source row stay **missing**. They are excluded from the sum, and the coverage line says how many were excluded. They are not zeros.

Partner-led consequence: actual brand-wide Amazon retail revenue is not available from FMIC's catalog harvest. It requires either the sellers' own reports or a file FMIC already receives from Amazon or from partners.

### Third-party estimated revenue

Minimum inputs, all shown next to the number:

- The estimator's name and the pull time (SmartScout `monthlyRevenueEstimate`, or a explicitly labeled derivation).
- If anyone later builds a derivation from Keepa: the `monthlySold` bracket floor, the price used, whether that price is the Featured Offer price or `current_price`, and the rule "floor times price is not units sold at that price."
- The estimator's coverage field when they publish one.
- A null bracket or a null estimate stays null. It is not zero revenue and it is not "small revenue."

`monthly_sold` on the 12 ASINs is not enough to compute this, and this plan does not compute it.

### Revenue exposed to a withheld Featured Offer

Minimum inputs:

- The listing's actual or estimated monthly revenue base, labeled as which one it is.
- `featured_offer_state = withheld` on a named check time.
- Whether a benchmark exists. Exposed-to-withheld is the withheld set (61 at this read). Exposed-to-high-price-suppression is the derived 42. Those sets are not interchangeable.
- The window: the month of the revenue base and the day of the Featured Offer check are different clocks. Say both.
- No assumption yet that those dollars were lost. "Exposed" means "this revenue base sits on a listing whose Featured Offer was withheld at the check."

Listings with `monthly_sold` null and no actuals have **no exposed dollars**. They can still be counted as withheld listings.

### Estimated recoverable revenue

This is a further derivation. Minimum inputs beyond the exposed base:

- A recovery assumption written in a sentence, for example a share of the exposed base that returns if the Featured Offer is restored. That share is not in our data. Do not pick one in a schema.
- The action that the assumption depends on (price moved to the benchmark, outside listing corrected, Amazon reference challenged).
- The issue set the assumption applies to. A content fix and a price fix do not share a recovery rate.
- The coverage line: listings with no revenue base are counted as listings and omitted from dollars.

Until a rate is measured or the client supplies one, recoverable revenue is **not estimated**.

### How not to double-count

- Pick one revenue base per ASIN per month per source. Issues (withheld offer, thin bullets, no A+, odd category label) are flags on that base. Summing "dollars per issue" counts the same orders once per flag.
- Do not add parent revenue to child revenue. Keepa's `monthlySold` is variation-specific when it exists; a parent rank is a different fact. The shared `sales_rank` values show how easily a family is double-counted.
- Do not add vendor 1P revenue to a 3P estimate for the same ASIN. Store them in separate columns and, if a total is required, define the overlap rule first.
- Do not add MAP leakage dollars. Those are price gaps (`leakage_amount` and the other channel gaps), already labeled that way on the retail screens.
- Do not add the Competitive External Price gap to revenue. The gap is cents above a benchmark.
- A bundle ASIN and the guitar inside it are different ASINs. The pilot includes both so a later rule can refuse to add them until the client file says they are separate sales.
- Show every assumption beside the figure: source, grain, month, null rule, recovery share, and the count of ASINs left out. Phase 1 and full-enterprise dollar figures elsewhere on the canvas stay analyst estimates. This work does not invent their formula.

## Recommended acquisition order

### Now, with data already stored

Use, with the labels above: Featured Offer state for the 1,064; the 42-row high-price set as a subset; the 18 withheld rows without a benchmark as their own set; `offer_count_new` only as a new-offer count with nulls visible.

Do not surface: `reviews_count`, the six-value category as a browse path, `monthly_sold` as units or revenue, `sales_rank` as a child rank, spec completeness as A+, or any Durvet threshold.

Run the manual page sheet. It needs no credential and no spend.

### Needs client credentials before it is real

1. Confirm which Amazon account publishes Fender A+ and whether FMIC has Seller Central, Vendor Central, both, or neither.
2. Catalog Items on the pilot ASINs: classifications, images, attributes (bullets). Then decide image-count and bullet-count rules from the payloads.
3. A+ Content API for that publisher's documents: module list and `StandardComparisonTableModule`. Pair every ASIN with the page sheet so "no document on this account" is not stored as "no A+."
4. Product Pricing `getItemOffers` on the pilot, if the Pricing role is granted: new-offer count and distinct seller ids, compared with the page and with `offer_count_new`.
5. Actual revenue, in this preference order: a client sell-through file keyed by ASIN and month; vendor sales for the 1P slice; Sales and Traffic for each authorized seller whose orders should count. Brand Analytics search purchases stay a funnel metric, not the revenue base.

Listings Items waits until step 1 shows SKUs that account owns.

### Needs a paid third-party call

1. Keepa pilot request described above, raw JSON retained, after the token ceiling is accepted. Use it to fill page facts the client token cannot see (another publisher's A+, videos, bullets when Catalog Items omits them, the bought-in-past-month bracket, a second offer list).
2. Extend Keepa only after the pilot says which fields matched the page. Store nulls. Do not backfill the 3,603 null `monthly_sold` values with zeros.
3. SmartScout only for estimated revenue and, if still useful, a seller-count cross-check. Not for A+ readiness.

### Still infeasible or unreliable

- Amazon's suggested browse node. No API found. An IntoFocus suggestion is a future rule, versioned, and not client-ready until the pilot has real breadcrumbs to test it against.
- Unique seller count from `offer_count_new`, from `buyBoxEligibleOfferCounts`, or from a truncated page widget.
- A+ absent, module count 0, or comparison table absent, from a Keepa null, from a missing SP-API document, or from attribute completeness.
- Thin-bullet and low-rating thresholds copied from the Durvet snapshot.
- Exact monthly unit sales for dealer-sold ASINs from any public source. The bought-in-past-month line is a floor.
- Actual brand-wide monthly retail revenue without a seller report, a vendor report, or a client file.
- Estimated recoverable dollars before a recovery assumption is written down and shown.
- Any dollar sum that adds issues, parents and children, or 1P and 3P together.

## Blockers

1. **No retained provider payloads.** Cached Keepa responses cannot be mined for category trees, bullets, images, A+, or reviews. The next paid read has to persist the JSON or the same facts will be thrown away again.
2. **Collector source is not in this repo.** Request parameters for `catalog_harvester` and `featured_offer_keepa` were not visible (`fmic_job_state.extra` is denied to `cursor_map_writer`). We know what was stored, not the full response those jobs received.
3. **No confirmed Amazon authorization for FMIC.** Catalog facts, A+ documents, offer censuses, and actual sales all wait on a named selling-partner or vendor grant. Partner-led means a dealer login and an FMIC brand login answer different questions.
4. **A+ is unmeasured**, and the screen that says Amazon A+ Matrix is showing attribute completeness for 1,009 ASINs.
5. **`reviews_count` cannot represent unread.** The default 0 will keep looking like a real zero until the column and the widget stop treating it as a measurement.
6. **Category is a six-value label.** At least three stored labels disagree with the product title on sight (`B00J4G5QSW`, `B000T4HHCG`, `B000VNFCHM`). That is a pilot input, not a miscategorized count.
7. **`monthly_sold` is a 12-row bracket with no update time.** It cannot support revenue, and 3,603 nulls must stay null.
8. **Null shipping is not free shipping.** 118 rows have null observed shipping, including all 42 confirmed high-price rows and `B003AYNEEM`. The view's `COALESCE(shipping, 0)` is an implementation assumption. It is not proof of free shipping. The 42 confirmed cases remain defensible because each stored item price alone is already above its benchmark; unknown or positive shipping cannot reverse that comparison. `B003AYNEEM` (item $8.39, benchmark $12.38, shipping null) stays excluded from those 42. Stored evidence does not confirm it is above the benchmark, and its landed price remains unresolved. The pilot still inspects shipping presentation on the page.
9. **Suggested category, recoverable revenue, and issue-level dollar sums have no validated method.** Building columns for them now would freeze a Durvet-shaped guess.
10. **SmartScout's public schema does not show A+ or bullets.** Buying it does not unblock listing content.

## What has to be true before schema design

For each candidate field, the pilot folder should contain one raw payload, the manual page result, and a one-line decision: match, contradict, or source cannot see it. In particular, decide from those files:

- Which image variants count.
- Whether a missing `bullet_point` attribute is "not returned" or "no bullets," using pages where the person saw bullets.
- How a comparison table is detected when it is a module, and how an image-only chart is labeled.
- How Keepa `aPlus: null` is stored so it cannot become false.
- How distinct sellers are counted when the offer list is longer than the page requested.
- How `monthly_sold` null, bracket floor, and a client unit file sit in different columns.
- That confirmed high-price suppression, withheld-without-benchmark, unresolved landed price (`B003AYNEEM`), and no-active-offer stay separate. A null shipping figure stays null. `COALESCE(shipping, 0)` is not stored as free shipping.

Until those decisions are written from payloads, do not add columns.
