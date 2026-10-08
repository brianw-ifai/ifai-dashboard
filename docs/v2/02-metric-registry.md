# Dashboard v2 metric registry

Chunk 2 of the dashboard-v2 build. One row per executive output. Values quoted here are the production reading at 2026-10-08 19:30 UTC for orientation only; the dashboard never reads this file for a value. Every value on screen comes from a selector over the `sandbox` schema, and every row below becomes a `sandbox.metric_registry` row that the explainer opens.

Columns: **id** (stable code id), **name** (label a client sees), **meaning** (plain language), **value / unit** (current reading), **as-of** (timestamp of the reading, not of the page), **population** (what was counted), **formula**, **source** (sandbox table the selector reads), **owner**, **confidence** (measured, estimate, or target), **coverage** (complete, partial, or unavailable).

## 1. AI visibility, and what moved it

| id | name | meaning | value / unit | as-of | population | formula | source | owner | confidence | coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ai_answer_share | AI answer share | Of the AI answers that named a brand, how often it was Fender or Squier. | 82.6 % (3,209 of 3,885) | 2026-10-05 16:26 UTC | Every answer in the simulation battery, all runs, where the scorer resolved a brand. 4,287 answers; 260 unclear and 142 errors excluded. | fender_wins / resolved_answers | sandbox.ai_answer | IntoFocus (pipeline) | measured (keyword scorer: an answer counts as a Fender win when it mentions Fender terms at least as often as rival names) | complete for the latest battery |
| ai_answer_share_by_category | Weakest category | The prompt category where Fender is named least, and the rival named most there. | beginner 58.5 % (168 of 287); Yamaha 38.7 % (111 of 287); gap 19.9 points | 2026-10-05 16:26 UTC | Resolved answers per category; categories with fewer than 10 resolved answers are not ranked. The `hallucinations` category is excluded from ranking because its prompts name Fender products. | per category: fender_wins / resolved; gap = fender share minus top rival share | sandbox.ai_answer | IntoFocus | measured | complete |
| ai_wrong_spec_flags | Answers flagged for a wrong spec | Answers that stated a product fact the rule set knows is false. | 222 of 4,287 answers | 2026-10-05 16:26 UTC | All answers, all runs. | count(flag) | sandbox.ai_answer | IntoFocus | measured (four fixed text rules; each flag carries the rule text as its reason) | complete |
| ai_answer_share_by_engine | Share by engine | AI answer share split by ChatGPT, Perplexity, and Gemini. | chatgpt 1,046 of 1,275; gemini 1,113 of 1,380; perplexity 1,050 of 1,230 | 2026-10-05 16:26 UTC | All answers. The engine comes from the stored engine column (114 rows) or from the engine tag the battery appends to every prompt and encodes in the sim id; the two agree on all 114. | per engine: fender_wins / resolved | sandbox.ai_answer | IntoFocus | measured | complete |
| ai_battery_freshness | Last AI read | When the simulation battery last wrote an answer. | 2026-10-05 16:26 UTC | same | n/a | max(answered_at) | sandbox.ai_answer | IntoFocus | measured | complete |

## 2. Retail control, using the seller type's primary question

Client seller type is stored on `sandbox.client` (`seller_type = partner_led` for Fender). The Partner-led question is: what share of listings has a healthy Featured Offer held by an authorized seller?

| id | name | meaning | value / unit | as-of | population | formula | source | owner | confidence | coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| retail_control_partner_led | Healthy Featured Offer, authorized seller | Share of active Amazon listings where a Featured Offer is present and the seller holding it is on the client's authorized list. | unavailable: no authorized-seller list is stored | n/a | Active offers (1,007). | count(featured offer present AND seller authorized) / active offers | sandbox.listing_offer_reading, sandbox.seller_authorization | Client (authorized list); IntoFocus (readings) | measured once inputs exist | unavailable (shown as the primary question with its two measured parts and the missing part named) |
| featured_offer_suppressed | Featured Offer withheld above Amazon's outside benchmark | Listings where Amazon shows no Featured Offer and the offer, including shipping, is above the Competitive External Price. The confirmed retail finding. | 48 listings | 2026-10-08 18:41 UTC | Active offers with a benchmark reading (440 of 1,007). | withheld = true AND offer_cents > benchmark_cents | sandbox.listing_offer_reading | IntoFocus | measured (Keepa `competitivePriceThreshold` and `buyBoxIsUnqualified`) | partial (440 of 1,007 have a benchmark; 70 withheld of 1,015 read) |
| featured_offer_present | Featured Offer present | Listings where Amazon shows a Featured Offer. | 945 of 1,015 read | 2026-10-08 18:41 UTC | Active offers with a Featured Offer reading. | count(withheld = false) / read | sandbox.listing_offer_reading | IntoFocus | measured | partial (1,015 of 1,036 rows; 1,007 active) |
| seller_mix | Who holds the Featured Offer | Amazon Retail, a confirmed third-party seller, or not yet read. | Amazon 55; third party 885; not read 67; of 1,007 active | 2026-10-08 18:41 UTC | Active offers. | counts by seller class | sandbox.listing_offer_reading, sandbox.seller | IntoFocus | measured | partial (67 not read) |
| amazon_offer_share | Amazon Retail share of Featured Offers | Share of active offers where Amazon Retail holds the Featured Offer. A drill-down fact for a Partner-led brand, not the headline. | 5.5 % (55 of 1,007) | 2026-10-08 18:41 UTC | Active offers. The 29 map rows with no active offer are excluded. | amazon / active offers | sandbox.listing_offer_reading | IntoFocus | measured | complete |
| seller_read_coverage | Seller read coverage | How much of the active catalog has a seller reading. | 940 of 1,007 (93.3 %) | 2026-10-08 18:41 UTC | Active offers. | read / active | sandbox.listing_offer_reading | IntoFocus | measured | complete |
| map_below | Offers below MAP | Listings priced under the client's minimum advertised price on any channel. | unavailable: no MAP price is stored for any listing | n/a | Active offers with a stored MAP (0 of 1,007). | offer < map_price, per channel | sandbox.listing_channel_price, sandbox.listing_map_price | Client (MAP sheet); IntoFocus | measured once MAP exists | unavailable (the Keepa list price was removed as a MAP stand-in on 2026-10-08) |
| channel_price_coverage | Outside prices on file | How many active listings have a stored price at each outside retailer. | Walmart 116 priced of 1,033 checked; Musician's Friend 306 priced of 341 checked | 2026-10-08 18:53 UTC; 18:38 UTC | Active offers per channel. | counts per channel | sandbox.listing_channel_price | IntoFocus | measured | partial |
| bundle_share | Partner bundles | Active offers whose title marks a bundle, kit, pack, or combo. | 399 of 1,007 (39.6 %) | 2026-10-08 18:41 UTC | Active offers. | count(is_bundle) / active | sandbox.listing | IntoFocus | measured (title pattern) | complete |

## 3. The ecommerce cause behind that AI result

| id | name | meaning | value / unit | as-of | population | formula | source | owner | confidence | coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| spec_fender_page_found | fender.com page found | Checked SKUs for which site search found a fender.com product page. | 14.7 % (139 of 947) | 2026-10-08 19:03 UTC | SKUs with a known Buy Box seller, checked in hourly batches of 10 (947 of 960 so far). | found / checked | sandbox.spec_reading | IntoFocus | measured | partial (947 of 1,007 active) |
| spec_additional_property_missing | Pages missing additionalProperty | Found fender.com pages whose JSON-LD has no additionalProperty block, so an assistant has no spec facts to read there. | 139 of 139 found pages (100 %) | 2026-10-08 19:03 UTC | Found pages. | missing / found | sandbox.spec_reading | IntoFocus | measured | partial |
| spec_amazon_completeness | Amazon attribute completeness | Average share of 13 Amazon product-detail fields that are filled. | 91.5 % | 2026-10-08 19:03 UTC | Checked SKUs (947). | avg(found / 13) | sandbox.spec_reading | IntoFocus | measured | partial |
| ecommerce_to_ai_link | Ecommerce cause of the AI result | The claim that listing control and product-data gaps change which brand an assistant names. | unavailable: no stored reading links one listing's gap to one answer | n/a | n/a | not defined | none | IntoFocus | assumption | unavailable (first view shows the two measured sides side by side and says the link is not yet measured) |

## 4. The money, as a formula

| id | name | meaning | value / unit | as-of | population | formula | source | owner | confidence | coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| price_gap_above_benchmark | Price gap on suppressed listings | Dollars by which suppressed offers sit above Amazon's outside benchmark, summed. A price gap, not revenue. | computed by selector from the 48 rows (sum and per-listing lines) | 2026-10-08 18:41 UTC | Suppressed listings (48). | sum(offer_price - benchmark_cents / 100) | sandbox.listing_offer_reading | IntoFocus | measured | partial (same as featured_offer_suppressed) |
| estimate_phase1_uplift | Phase 1 uplift | The $680K annual figure on the current dashboard. | unavailable: formula shape stored, no input values stored | n/a | n/a | buybox_recapture + ai_dtc_conversions + reduced_returns + review_synergy, each = (units × price × rate) with stored inputs | sandbox.estimate, sandbox.estimate_input | Brian Magazu (COO) for inputs | estimate | unavailable (figure absent from every first view; explainer shows the formula and the missing inputs) |
| estimate_enterprise_range | Enterprise uplift range | The $38M to $62M figure. | unavailable, same reason; three documents disagree ($38M to $62M, $50M, $28.4M to $42.6M) | n/a | n/a | sum of four stored lines, low and high | sandbox.estimate, sandbox.estimate_input | Brian Magazu (COO) | estimate | unavailable |

## 5. The next action, tied to those outputs

| id | name | meaning | value / unit | as-of | population | formula | source | owner | confidence | coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| action_items_open | Open action items | Stored actions that are not done, each tied to a registry row. | count of rows | updated on write | sandbox.action_item where status != done | count(*) | sandbox.action_item | per row (IntoFocus or client) | measured | complete |

Seed actions are generated from readings (never typed counts): one per confirmed finding or missing input, with the count in the title computed at seed time and recomputed by the selector. Examples: reprice or correct the outside listing for each suppressed listing (48, linked to featured_offer_suppressed); supply the authorized-seller list (client, linked to retail_control_partner_led); supply a MAP sheet (client, linked to map_below); add additionalProperty to found fender.com pages (139, linked to spec_additional_property_missing); supply estimate inputs for the Phase 1 uplift (COO, linked to estimate_phase1_uplift); finish the seller read for 67 offers (IntoFocus, linked to seller_read_coverage).

## 6. Context rows (not headlines)

| id | name | value | source | coverage |
| --- | --- | --- | --- | --- |
| catalog_monitored | Monitored ASINs | 3,604; 1,007 with an active offer (27.9 %) | sandbox.listing | complete |
| catalog_by_category | Listings by category | 7 Keepa categories; the six authored division names from 2026-09-29 are retired | sandbox.listing | complete |
| reading_freshness | As-of per reading | one timestamp per source (catalog, seller, benchmark, Walmart, Musician's Friend, spec, AI) | sandbox.reading_run | complete |

## 7. Current headlines listed for removal

Not in the registry because no stored reading or formula produces them: AI Scan Index 41/100; Readiness 52 %, 42 %, 84 %, 94 %; Buy Box 68 %; 124 SKUs; 14 Flagged ASINs; 2,420 stranded reviews; price drift −$52, −$39.21, −$77.58; 15 sellers; 18 action items and the "Top 5" interventions; +$680K and its four parts; $38M to $62M, $50M, $28.4M to $42.6M and their parts; 2.8x, 208x, 118x; the $20K per month retainer; Buy Box targets 88 %, 92 %, 95 %; 88/100; 390 hours; $42,500; 16x; Taylor 58 %; Boss 62 %; citation shares 31/24/19/14/12; "strongest category hallucinations 100 %"; "522 engine runs"; "Confirmed hallucinations"; division Schema Sync 0.0 %; the six zombie divisions; "Stranded Customer Reviews"; "Average Amazon Price Drift"; "Flagged ASINs"; the hidden ticker labels; every typed node status.

Replaced, not removed: "Confirmed Amazon 1P Buy Box" becomes amazon_offer_share (drill-down); "Seller Data Harvested" becomes seller_read_coverage; "Beginner Category SOV Gap" becomes ai_answer_share_by_category; "fender.com Product Findability" becomes spec_fender_page_found; "Machine-Readable Spec Coverage" becomes spec_amazon_completeness with the correct label; "Pages Missing additionalProperty" becomes spec_additional_property_missing; "Resolved AI Simulations" becomes the numerator and denominator line of ai_answer_share.
