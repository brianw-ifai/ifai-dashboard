# Portfolio Retail and AI Readiness sources

This is a reading of what Fender sees on Portfolio Retail and AI Readiness, and where each number comes from. It does not change the screen, the copy, the queries, or the database.

**Read at:** 2026-10-07 23:43:13 UTC.

The browser reads `public.canvas_*` views. It does not read `data/fender-v3-spec.json` for these panels. The role `cursor_schema_reader` can read the `command` tables and the view definitions, and it cannot `SELECT` the `public.canvas_*` views. The counts below are that view SQL run against the `command` tables in one read-only transaction. A missing value is left missing. It is not filled with a different metric, and it is not treated as zero.

A second check at 2026-10-07 23:44:22 UTC still showed 1,030 retail rows, 47 suppressed listings, 532 listings below MAP, and 17 listings with a price and no stored MAP comparison.

## What is in this map

- The Portfolio Retail bubble, its three satellites (Suppressed Listings, MAP Leakage, Catalog Governance), and its four tabs.
- The AI Readiness bubble, the Machine Readability satellite, the Amazon A+ Matrix satellite, and its three tabs.
- The command-center items and metric widgets that open those hubs.
- The freshness line, because it sits on the canvas while those hubs are open.

Action Items, Commercial Sizing, Competitive Radar, the AI simulation battery, and social harvests are out of this map. Header tickers are off (`SHOW_HEADER_TICKERS` is false), so the ticker sentences are not on screen. These hubs do not show a delegation or paid-tier control. Partner-led is not copy on these screens. Dollar gaps on these screens are price gaps. Revenue figures elsewhere stay estimates.

## How a status is used

| Status | Meaning in this file |
| --- | --- |
| confirmed issue | The stored rows show the condition the screen describes. |
| confirmed zero | A finished check stored a zero. |
| partial reading | Some of the population has no stored result. Those rows are missing from the count. They are not zeros. |
| stale reading | The number on screen is from an earlier check, and the checker is not current. |
| failed collection | The checker ran and did not bring back a result. |
| not measured | No column, no job, or the cell does not read the column that exists. |

## Portfolio Retail

The bubble title stays **Portfolio Retail**. The headline is the first retail finding that is not a confirmed zero. Suppressed Listings is unfinished, so it stays the headline. MAP and catalog nesting do not replace it.

The panel title is **Portfolio Retail**. The line under it is: "Suppressed Featured Offers, MAP leakage, and unnested bundles, and how those catalog and retail issues change what AI search can recommend."

Tabs: **Retail Overview**, **Suppressed Listings**, **MAP**, **Catalog Governance**.

Retail rows come from `public.canvas_retail_listings`, which selects `command.fmic_retail_buybox_map` and joins `command.fmic_electric_catalog` and `command.fmic_sellers`. This read found **1,030** retail rows and **3,599** rows in `command.fmic_electric_catalog`.

### Bubble and satellites

| Screen | Words Fender sees | Table and column | Writer | Status |
| --- | --- | --- | --- | --- |
| Portfolio Retail bubble | **Suppressed Listings** and **47 listings** | `command.fmic_retail_buybox_map.featured_offer_withheld`, `competitive_price_threshold_cents`, `offer_price`. The view also exposes the derived flag `competitive_offer_suppressed`. | Not named. No database function writes these columns. | partial reading |
| Portfolio Retail bubble, tooltip | "The hourly audit has stored a Featured Offer reading for 1,009 of 1,030 listings. 47 listings in that partial read are above the Competitive External Price with the Featured Offer withheld. 21 listings are still missing, so this is not a final count." | Same columns. 1,009 rows have the withheld flag stored (69 true, 940 false). 21 flags are null. 440 rows have a positive Competitive External Price. 590 do not. A missing price is not a zero and does not put the listing on this list. | Not named. Newest `updated_at` on the retail table is 2026-10-07 23:41:24 UTC. That clock does not match any named job's `last_run_at`. | partial reading |
| Suppressed Listings satellite | **47 listings** and **1,009 of 1,030** | Same columns. A row is counted only when the withheld flag is true, the Competitive External Price is a positive cent value, and the offer in cents is above that price. `offer_price` is dollars and already includes shipping. | Not named. | partial reading |
| MAP Leakage satellite | **532 below MAP**, **-$209.47 gap**, **1,013 of 1,030** | `leakage_amount` (shown as Amazon leakage), `wmt_leakage`, `mf_leakage`. The gap is the average of each violating listing's worst stored channel gap. | Amazon leakage writer not named. Walmart: `map_leakage_walmart`. Musician's Friend: `map_parity_musiciansfriend`. | partial reading |
| MAP Leakage satellite, tooltip | "Average worst stored price gap -$209.47. This is a price gap, not a revenue estimate." Then: "MAP leakage is stored for 1,013 of 1,030 listings. 532 stored listings are below MAP. 17 listings have a price and no stored MAP comparison, so they are missing from this count and are not counted as zero. This is not a final count." | 1,013 rows have at least one channel leakage. 17 have none. Every retail row has an `offer_price`, so those 17 are the undecided rows. 17 rows also have a null `map_price`. | Same as the MAP satellite. | partial reading |
| Catalog Governance satellite | **49 bundles** and **414 of 941** | `command.fmic_electric_catalog.is_bundle`, `parent_asin`. The 941 is `canvas_metrics.catalog_bundles`, a count of `is_bundle` on the catalog table. The retail read includes 414 of those bundles. All 49 have no parent ASIN stored. | Named catalog job: `catalog_harvester`. Its extra does not name the parent-ASIN column. | partial reading |

The catalog satellite tooltip is the nesting explanation: "Bundle listings that are not nested under a parent ASIN. Nesting keeps their reviews on the parent listing." The coverage sentence is on the Retail Overview card.

### Retail Overview

The three cards repeat the satellite counts, the coverage lines, and the missing-result sentences above.

**Explore all listings** stays closed until opened. Opened, the badge is **1,030 rows**. Filters:

| Filter | Rows | Rule |
| --- | --- | --- |
| All | 1,030 | Every retail row. |
| MAP violations only | 532 | `is_map_violation` on the view: any stored channel leakage below zero. A null leakage is not a violation. |
| Bundles only | 414 | `is_bundle` is true. |

Each row shows the listing name (`model_name`, then `title`), the ASIN, Partner / Bundle (`bundle_name`, then seller name), MAP (`map_price`), Amazon (`offer_price` and `leakage_amount`), Walmart (`wmt_price`, `wmt_leakage`, link `wmt_url`), Musician's Friend (`mf_price`, `mf_leakage`), Reviews (`reviews_count`), and Channels (`channels`).

| Screen | Words Fender sees | Table and column | Writer | Status |
| --- | --- | --- | --- | --- |
| Explore all listings, Reviews | **0** on every row | `command.fmic_retail_buybox_map.reviews_count`. The column is `NOT NULL` with default `0`. All 1,030 rows are 0. None are above 0. | No writer found. | not measured |
| Stranded Customer Reviews widget | **Pending data**. Detail: "Split across partner bundle pages". | `canvas_metrics.bundle_reviews`, which is `NULLIF(sum(reviews_count), 0)`. The sum of the stored zeros is null, so the widget does not print 0. | No writer found. | not measured |

The printed 0 in the table is the column default. It is not a confirmed count of zero reviews. The widget's "Pending data" is the same gap after the view drops a zero sum.

The Channels tag matches stored prices, not checks: the strings that include MF cover the 302 Musician's Friend prices, and the strings that include WMT cover the 109 Walmart prices. It is not a separate price reading.

### Suppressed Listings tab

The callout explains that a listing at MAP can still have no Featured Offer when the offer, including shipping, is above the Competitive External Price. Amazon does not name that retailer.

The badge is **47**. The table lists those 47 rows. Columns Fender sees: Listing, Offer price, Competitive External Price, Featured Offer withheld, Above benchmark. The gap is the offer minus the Competitive External Price. Withheld is **Yes** on these rows because the list requires the flag to be true.

Those 47 are a confirmed set inside an unfinished audit. The screen itself says the 47 are not a final count, because 21 listings have no withheld flag. Status for the number on the badge: **partial reading**.

### MAP tab

The callout defines MAP as the lowest price a retail partner agrees to display publicly.

| Screen | Words Fender sees | Table and column | Writer | Status |
| --- | --- | --- | --- | --- |
| MAP summary | **Listings below MAP** **532**. Subcopy: "Stored channel leakage below MAP". | Worst of `leakage_amount`, `wmt_leakage`, `mf_leakage` below zero. | See the MAP satellite. | partial reading |
| MAP summary | **Average price gap** **-$209.47**. Subcopy: "Price gap, not revenue". | Average of those worst gaps on the 532 rows. | See the MAP satellite. | partial reading |
| MAP channel list | **Amazon · 456 listings below MAP** | `leakage_amount < 0` on the 532 violation rows. The Amazon price column is `offer_price`. | Not named. | confirmed issue |
| MAP channel list | **Walmart · 40 listings below MAP** | `wmt_leakage < 0`. Price column `wmt_price`. Link `wmt_url`. | `map_leakage_walmart` | partial reading |
| MAP channel list | **Musician's Friend · 84 listings below MAP** | `mf_leakage < 0`. Price column `mf_price`. | `map_parity_musiciansfriend` | stale reading |
| Average Amazon Price Drift widget | **-$221.19**. "Across 456 ASINs below MAP on Amazon". | `canvas_metrics.amz_avg_drift` and `amz_below_map`: average and count of `leakage_amount` where it is below zero, rounded to cents. | Not named. | confirmed issue |

Amazon, Walmart, and Musician's Friend columns are on the table because at least one violation row has a price or a leakage for that channel (Amazon 532 rows, Walmart 53, Musician's Friend 101). Sweetwater and Reverb are not on the table. See below.

Walmart matching is rejecting most checks. Of 1,029 rows with `wmt_checked_at`, **920 have no `wmt_price`**. Those 920 are not below-MAP zeros. The job `map_leakage_walmart` last ran at 2026-10-07 22:51:40 UTC, which is also the newest `wmt_checked_at`. Its cursor is **900**. Its extra says sample size 993, last batch 50, last matched **2**. The 109 stored Walmart prices are all greater than zero, and each has a `wmt_url`. The 40 below-MAP rows are a real stored gap among the prices that matched. Status of the 40 on screen: **partial reading**. Status of the 920 checks with no price: **failed collection**.

Musician's Friend has stored prices, and the checker is failing. **302** rows have `mf_price` greater than zero. **596** have `mf_checked_at`, from 2026-10-05 14:56:44 UTC through 2026-10-06 16:36:37 UTC. **84** have `mf_leakage` below zero. **4** prices have no leakage; they did not add to the 84. The job `map_parity_musiciansfriend` has cursor **0**, last ran at that same 2026-10-06 16:36:37 UTC, and its extra says checked 3, matched 0, redirected 2. That is more than 26 hours before this read, so the freshness hover marks MF MAP stale. Status of the 84 and the stored prices on screen: **stale reading**. Status of the current checker: **failed collection**.

The MAP glossary says partners get around MAP by bundling a cheap accessory and discounting the pair. That sentence is glossary copy. It is not a count of accessory bundles. Status: **not measured**.

### Catalog Governance tab

| Screen | Words Fender sees | Table and column | Writer | Status |
| --- | --- | --- | --- | --- |
| Unnested bundles | **49**. "Bundles in this retail read with no usable parent ASIN." Then: "This read includes 414 of 941 bundle listings. 49 of the included listings have no usable parent ASIN. This is not a final count." | `is_bundle`, `parent_asin`. A parent can nest the bundle only when it is a different 10-character ASIN. All 49 are missing a parent ASIN. The table also shows listing name, bundle name, ASIN, and product URL when one is stored. | `catalog_harvester` is the named catalog job. | partial reading |
| Checked listings with a missing Amazon spec field | The live `amazonSpecGaps` issue count. The count opens AI Readiness. This tab does not list the rows. | `canvas_spec_readiness.amazon_checked` and `amazon_missing_fields`, from the latest `command.fmic_spec_readiness` row per ASIN. Fields are split on semicolons. The panel reads `amazonSpecGaps.issueCount`. At the source-map read that count was 435 of 925 checked rows, all with `amazon_checked` true. | `spec_readiness` | partial reading |

The count is the stored list of checked listings with at least one missing Amazon field. It is not a final catalog count, and Catalog Governance does not repeat the rows. Those rows stay on AI Readiness. The spec job has not wrapped, and 666 of the 925 latest rows were checked more than 26 hours before this read. The other catalog rows have no spec row. They are not in that count, and they are not zeros.

The callout says a stronger unified review record does not guarantee a higher rank or an AI recommendation. That is explanation, not a measured rank change.

### Widgets that open Portfolio Retail

| Widget | Words Fender sees | Opens | Table and column | Writer | Status |
| --- | --- | --- | --- | --- | --- |
| MAP violations | **532**. "Listings below MAP in this partial listing read. This is not a final count." | MAP | Same 532 as the MAP summary. This widget uses the retail reading, not `canvas_metrics.map_violation_skus`. | See the MAP satellite. | partial reading |
| Average Amazon Price Drift | **-$221.19**. "Across 456 ASINs below MAP on Amazon". | MAP | `leakage_amount` | Not named. | confirmed issue |
| Confirmed Amazon 1P Buy Box | **7.9%**. "81 1P vs 857 3P". | Retail Overview | `buybox_status`. 81 are `Amazon 1P`, 857 are `3P Confirmed`, 66 are `Unknown/Not Harvested`, 26 are `No Active Offer`. The percent is 81 of all 1,030 retail rows, rounded to one decimal. None of the rows are still on the column default `Fender 1P Win`. This is not the Featured Offer withheld flag. | Not named. `buybox_seller_harvester` last ran at 2026-10-07 23:30:18 UTC and processed 0. | confirmed issue |
| Seller Data Harvested | **1,030**. "28.6% of catalog". | Retail Overview | `command.fmic_electric_catalog.buybox_checked_at`. 1,030 of 3,599 catalog rows have a timestamp, from 2026-10-01 16:00:43 UTC through 2026-10-07 23:00:21 UTC. | `buybox_seller_harvester` is the named seller job. Its latest run processed 0 and did not move that newest timestamp. | partial reading |
| Stranded Customer Reviews | **Pending data** | Catalog Governance | `reviews_count`, then null in `canvas_metrics.bundle_reviews` | No writer found. | not measured |

The label "Confirmed Amazon 1P Buy Box" still says Buy Box. The retail panels say Featured Offer. Both are on screen. New writing says Featured Offer.

## AI Readiness

The bubble title is **AI Readiness**. The panel title, from the narrative template with live numbers filled in, is **AI Readiness: Product Specs & Schema.org**.

The panel description Fender sees:

> Across 925 checked SKUs, site search found a fender.com product page for 123 of 925 (13.3%). 123 found pages are missing Schema.org additionalProperty. Amazon structured fields averaged 91.6% complete.

Tabs:

1. **AI Readiness**
2. **Machine Readability**
3. **Amazon A+ Matrix**

The bubble, its two satellites, and these three tabs carry the same three names. Links copied from the earlier tab titles (`catalog-readiness-executive-guide`, `machine-readable-schema-org-json-ld-audit`, and `amazon-a-comparison-matrix-blueprint`) still open the renamed tabs.

Spec rows are the latest row per ASIN in `command.fmic_spec_readiness` (`canvas_private.spec_latest`, exposed as `public.canvas_spec_readiness`). This read found **1,772** stored spec rows and **925** distinct ASINs. Newest check: 2026-10-07 23:01:30 UTC. Oldest latest-row check: 2026-10-02 06:04:01 UTC. **259** of the 925 were checked in the 26 hours before this read. **666** are older than that.

The writer is the job `spec_readiness`. It last ran at 2026-10-07 23:01:30 UTC, the same instant as the newest check. Cursor **490**. Extra: wrapped false, last batch amazon_checked 10, fender_found 0, last_processed 10.

### Bubble and satellites

| Screen | Words Fender sees | Table and column | Writer | Status |
| --- | --- | --- | --- | --- |
| AI Readiness bubble | **13.3% Found**, **91.6% Amazon specs**, meta **925 SKUs checked** | `fender_found` and `amazon_completeness_pct` on the 925 latest rows. The percent is 123 found of 925. The 91.6% is the average Amazon completeness, rounded to one decimal. | `spec_readiness` | partial reading |
| AI Readiness bubble, tooltip | "fender.com findability 13.3%. Amazon structured completeness 91.6% on average." | Same columns. | `spec_readiness` | partial reading |
| Machine Readability satellite | **123 missing additionalProperty** and **925 checked** | `fender_found` and `fender_missing_fields` containing `additionalProperty`. All 123 found pages have that field in the missing list. | `spec_readiness` | confirmed issue |
| Machine Readability satellite, tooltip | "13.3% of audited SKUs have a fender.com page (123 of 925). 123 pages lack additionalProperty specs." | Same columns. The 802 unresolved URLs are not in the 123. | `spec_readiness` | partial reading |
| Amazon A+ Matrix satellite | **91.6% Amazon** and **925 checked**. Meta: "Amazon field completeness". Tooltip: "Amazon product attribute completeness averages 91.6% across 925 SKUs in the spec audit." | `amazon_completeness_pct`. This is Amazon attribute completeness. | `spec_readiness` | partial reading |
| A+ comparison tables | The satellite does not show a comparison-table count. The A+ tab and the command-center item describe comparison tables and do not state a number. | No A+ column exists on `command.fmic_spec_readiness` or on the canvas spec views. | No job collects A+ comparison tables. | not measured |

The 91.6% on the Amazon A+ Matrix satellite is the Amazon attribute average. It is not a reading of comparison-table presence, module count, or A+ presence. Those are not measured.

### Why the 13.3% is not proof of missing pages

Of the 925 latest rows, **123** have `fender_found` true and a product-path `fender_url`. **802** have `fender_found` false and a null `fender_url`. None of the misses have a URL stored. A null `fender_url` means the check did not resolve a page. It is not a stored proof that the product is absent from fender.com.

Status of the 13.3% findability share: **partial reading**. Status of the 802 unresolved URLs: **failed collection**.

`fender.com completeness when a page is found` is **87.5%**. That is the average of `fender_completeness_pct` on the 123 found pages only. The 802 are not in that average and are not zeros. The checks that feed the average span 2026-10-02 through 2026-10-07. Status: **partial reading**.

### AI Readiness and Machine Readability tabs

AI Readiness keeps the spec summary, the fender.com page found control, the top missing schema fields chart, and Spec readiness by ASIN. Machine Readability keeps the explanation of JSON-LD and `additionalProperty`. It lists found pages whose stored `fender_missing_fields` text includes `additionalProperty`. A row without that stored gap does not appear. The row count on that list is the live query count. Machine Readability does not show the ASIN table or the top missing schema fields chart.

| Spec summary row | Words Fender sees | Column | Status |
| --- | --- | --- | --- |
| SKUs checked | 925 | Count of latest spec rows | partial reading |
| fender.com page found | 13.3% (123 of 925) | `fender_found` | partial reading |
| Amazon attribute completeness | 91.6% | `amazon_completeness_pct` | partial reading |
| fender.com completeness when a page is found | 87.5% | `fender_completeness_pct` where `fender_found` | partial reading |
| Found pages missing additionalProperty | 123 | `fender_missing_fields` | confirmed issue |

**Top missing schema fields** is on AI Readiness. It is the first eight rows of `public.canvas_spec_missing_fields`, ordered by `sku_count`. Amazon fields come from `amazon_missing_fields`. The fender field is counted only on rows with `fender_found` true. Machine Readability does not show this chart.

| Field | Source | SKUs |
| --- | --- | --- |
| scale_length | amazon | 340 |
| hand_orientation | amazon | 176 |
| item_weight | amazon | 147 |
| additionalProperty | fender | 123 |
| item_dimensions | amazon | 69 |
| number_of_strings | amazon | 52 |
| fretboard_material_type | amazon | 41 |
| guitar_pickup_configuration | amazon | 38 |

Status of these eight counts: **partial reading**, because they are frequencies inside the same unfinished spec read.

**Spec readiness by ASIN** is on AI Readiness. At the source-map read it said **925 rows**. Machine Readability does not show this table. The ASIN cell shows `asin`.

| Column Fender sees | What the cell reads | What is stored | Status |
| --- | --- | --- | --- |
| Model | `title` | The view column is `title`. A blank title stays blank. | partial reading |
| Amazon completeness | `amazon_completeness_pct` | That column, formatted as a percent. | partial reading |
| fender.com found | `fender_found` | True is Yes, false is No, and a null flag stays blank. | partial reading |
| Missing Amazon fields | `amazon_missing_fields`, split on `;` | That column. Empty becomes "Pending data". | partial reading |

A **No** in this table is a stored `fender_found` false. It is not proof the product is absent from fender.com. A null flag stays blank and is not in the missing-page filter.

### Amazon A+ Matrix tab

The tab is the explanation of Amazon A+ content: enhanced modules, and comparison tables that an assistant can read. It does not show a module count, a comparison-table count, a page URL, or a checked time.

Status: **not measured**.

### Columns that would make a later A+ reading real

Do not apply these. They are the columns still missing. Put them on `command.fmic_spec_readiness`, and expose them through `public.canvas_spec_readiness`. Keep them null until a job writes them. Null is not false, and null is not zero.

| Proposed column | Type | What a later reading would store |
| --- | --- | --- |
| `aplus_present` | boolean, null | True when the Amazon page has A+ content. False only after a check that found none. |
| `aplus_module_count` | integer, null | How many A+ modules were on that page. Zero only after a check that found none. |
| `aplus_comparison_table_present` | boolean, null | True when a comparison table is in that A+ content. False only after a check that found none. |
| `aplus_page_url` | text, null | The page that was checked. |
| `aplus_checked_at` | timestamptz, null | When that check ran. |

No job writes these today. Until one does, the Amazon A+ Matrix tab and satellite have no comparison-table count to show. The Amazon completeness percent stays a separate reading.

### Widgets that open AI Readiness

| Widget | Words Fender sees | Opens | Table and column | Writer | Status |
| --- | --- | --- | --- | --- | --- |
| fender.com Product Findability | **13.3%**. "123 of 925". | AI Readiness | `fender_found` | `spec_readiness` | partial reading |
| Machine-Readable Spec Coverage | **91.6%**. "Amazon attribute completeness". | Machine Readability tab | `amazon_completeness_pct` | `spec_readiness` | partial reading |
| Pages Missing additionalProperty | **123**. "fender.com pages in the spec read". | Machine Readability tab | `fender_missing_fields` | `spec_readiness` | confirmed issue |

The 91.6% widget opens the Machine Readability tab and shows Amazon attribute completeness. It is not the Schema.org `additionalProperty` count. That count is the separate widget, 123.

## Command center items that open these hubs

The command center title is **What do I need to worry about?** The summary starts with the retail headline sentence, then: "The catalog read has 3,599 electric SKUs across 13 divisions."

The 3,599 is `count(*)` on `command.fmic_electric_catalog`. The 13 is the number of latest rows in `command.fmic_division_metrics`, which is what `public.canvas_divisions` returns. The same summary also includes beginner share of voice and a spec-hallucination count when those reads are present. Those open other hubs and are not mapped here.

| Item | Words Fender sees | Opens | Source | Status |
| --- | --- | --- | --- | --- |
| Retail headline | **Suppressed Listings: 47 listings**, plus the 1,009 of 1,030 sentence. | Retail Overview | The suppressed reading above. | partial reading |
| Schema | **fender.com pages are missing machine-readable spec fields.** "Site search found a fender.com page for 123 of 925 checked SKUs (13.3%). additionalProperty is missing on 123 of the found pages, so an assistant still has no spec block to read there." | Machine Readability tab | `fender_found`, `fender_missing_fields`. The 123 missing fields are a confirmed issue on the found pages. The 13.3% share is the partial findability reading. | `spec_readiness` | partial reading |
| MAP | **Discounted bundles are dragging your prices down everywhere.** The body tells the reader to open the MAP tab and does not state the 532. | MAP | The title is not a stored bundle-to-price measurement. The measured leakage is the MAP tab's 532. | not measured |
| A+ | **A+ comparison tables are how assistants read your lineup.** No count. | Amazon A+ Matrix tab | No A+ columns. | not measured |

## Freshness line

The line shows **Data as of** the newest `last_run_at` in `public.canvas_freshness`. Among the jobs named in this map, the newest is `catalog_harvester` at 2026-10-07 23:30:36 UTC. The hover lists each job. MF MAP is the one older than 26 hours, so that hover line adds stale.

| Hover label | Job key | Last run (UTC) | What it writes, if known |
| --- | --- | --- | --- |
| Catalog | `catalog_harvester` | 2026-10-07 23:30:36 | Catalog pages. Extra: keepa page, wrapped true, cursor 15. |
| Buy Box sellers | `buybox_seller_harvester` | 2026-10-07 23:30:18 | Seller harvest. Latest run processed 0. |
| Walmart MAP | `map_leakage_walmart` | 2026-10-07 22:51:40 | Walmart price, leakage, URL, match confidence, and checked time. |
| MF MAP | `map_parity_musiciansfriend` | 2026-10-06 16:36:37 | Musician's Friend price, leakage, and checked time. Cursor stuck at 0. |
| Spec audit | `spec_readiness` | 2026-10-07 23:01:30 | Spec readiness rows. Not wrapped. |
| KPI recompute | derived from `command.fmic_brand_kpi_summary.created_at` | Listed on the hover. Not a retail or spec writer. | |
| AI battery | derived from simulation rows | Out of this map. | |

## Sweetwater and Reverb

Keep Sweetwater and Reverb off the MAP table until a price greater than zero is stored.

`command.listing_channel_price` is the table for those channels. `public.canvas_listing_channel_price` is the view the browser reads (`asin`, `channel`, `price`, `url`, `checked_at`). This role cannot `SELECT` the table or the view. At 2026-10-07 23:43:32 UTC, table statistics showed 0 live tuples and 0 inserts. No database function references the table. There is no writer.

That statistic is not a stored price of zero. The screen already hides a channel that has no stored price above zero. Leave Sweetwater and Reverb off until a row with `price > 0` exists.

## Writers, in one place

| Reading | Writer |
| --- | --- |
| Competitive External Price and Featured Offer withheld | Not named. The columns exist on `command.fmic_retail_buybox_map`. No function in this database writes them, and no `job_key` names them. |
| Walmart price, leakage, URL, checked time | `map_leakage_walmart` |
| Musician's Friend price, leakage, checked time | `map_parity_musiciansfriend` |
| Spec rows, including fender.com findability and Amazon completeness | `spec_readiness` |
| Catalog bundle flag and parent ASIN | `catalog_harvester` is the named catalog job. |
| Seller checked time | `buybox_seller_harvester` is the named seller job. |
| `listing_channel_price` | No writer. |
| A+ presence, module count, comparison-table presence, page URL, checked time | No job. Columns are not there yet. |
| `reviews_count` | No writer found. The column default is 0. |
