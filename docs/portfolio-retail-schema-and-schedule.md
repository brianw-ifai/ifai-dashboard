# Portfolio Retail: statements, facts, schema, schedule

Decision record. Read on 5 Oct 2026 from `command` with the read-only role `cursor_schema_reader`. No product code and no database contents were changed.

The canvas is authored copy. The app does not query these tables. Counts below are the live rows.

Retail rows are not scoped by `organization_id`. `command.organizations`, `command.user_profiles`, and `command.organization_memberships` are empty. Leave them empty.

Checked-in migrations only create the identity tables. The retail tables exist only in the live database.

## What the ten opened pages can support

Nine listings still match the 1 Oct seller check. Amazon shows no featured offer, with the page text "High price", "See All Buying Options", and "No featured offers available". Named new offers sit underneath, and the stored price still matches that new price.

The tenth listing changed. Jim Root Jazzmaster, `B00I5QXTYU`, was stored on 1 Oct with no seller and a price of $2,349.99. On 5 Oct the live page has a featured used offer: $1,839.99, Used: Like New, Sweetwater Sound.

The other 73 rows labeled "Unknown/Not Harvested" were not opened. They stay unclassified.

| # | ASIN | Model | Live page on 5 Oct | Stored row |
| --- | --- | --- | --- | --- |
| 1 | B0D2LP2PRQ | Player II Jazzmaster, Coral Red | No featured offer. Liberty Music, new, $879.99 | No seller. $879.99. 11 new offers. Checked 1 Oct 16:00 UTC |
| 2 | B0D2LNNB24 | Player II Telecaster, Aged Cherry Burst | No featured offer. GearTree, then Liberty, new, $949.99 | No seller. $949.99. 10 new offers. Checked 1 Oct 15:45 UTC |
| 3 | B0D2LPFNJ1 | Player II Stratocaster, Transparent Cherry Burst | No featured offer. Liberty, then GearTree, new, $949.99 | No seller. $949.99. 10 new offers. Checked 1 Oct 15:45 UTC |
| 4 | B0D2LQNDS7 | Player II Telecaster, Butterscotch Blonde | No featured offer. Butler Music, then Sweetwater, new, $949.99 | No seller. $949.99. 10 new offers. Checked 1 Oct 15:04 UTC |
| 5 | B0D8G43XJP | Affinity Telecaster FMT SH, Crimson Red | No featured offer. Sweetwater $433.06, then Butler $449 | No seller. $433.06. 10 new offers. Checked 1 Oct 14:51 UTC |
| 6 | B0D2LMMBNR | Player II Stratocaster, White Blonde | No featured offer. Liberty, then Alto Music, new, $944.99 | No seller. $944.99. 8 new offers. Checked 1 Oct 15:45 UTC |
| 7 | B0D2M95G9J | Player II Jaguar, Coral Red | No featured offer. GearTree, then Liberty, new, $879.99 | No seller. $879.99. 7 new offers. Checked 1 Oct 15:45 UTC |
| 8 | B00EOQ96ZG | American Professional Classic Hotshot Telecaster | No featured offer. GearTree, then Liberty, new, $1,549.99 | No seller. $1,549.99. 5 new offers. Checked 1 Oct 16:00 UTC |
| 9 | B00I5QXTYU | Jim Root Jazzmaster | Featured used offer. Sweetwater, $1,839.99, Used: Like New | No seller. $2,349.99. 5 new offers. Checked 1 Oct 15:45 UTC |
| 10 | B08L34LQZG | American Professional II Stratocaster, Mystic Surf Green | No featured offer. Used Sweetwater $1,475, then new Sweetwater $1,639.99 | No seller. $1,639.99. 5 new offers. Channels `AMZ,MF`. Checked 1 Oct 14:51 UTC |

All ten have `amazon_stock = NO_AMAZON_OFFER` and `buybox_status = Unknown/Not Harvested`. `reviews_count` is 0. None are flagged `is_bundle`.

`NO_AMAZON_OFFER` means Amazon's own inventory state. It is the wrong signal for "no featured offer". Of the 840 rows labeled "3P Confirmed", 776 also have `amazon_stock = NO_AMAZON_OFFER`, and they do have a featured seller.

## Statements the dashboard has to be able to make

These are the candidate sentences, taken from the ten pages. Confirm or cut them before any column or job is added.

1. **Featured offer.** For this listing, Amazon is showing a featured offer, or it is not.
2. **Why it is withheld.** When there is no featured offer, the dashboard states Amazon's reason. On the nine pages that were opened, that reason is a high price, and buying options are still listed.
3. **Who is still selling.** Each listed offer has a seller name, a condition (new or used), and a price. This includes offers under a withheld Buy Box.
4. **Who owns the featured offer.** When a featured offer exists, the dashboard names the seller, the condition, and the price. The Jim Root page is the example: Sweetwater Sound, used, like new, $1,839.99.
5. **Amazon MAP gap.** The Amazon price is above, at, or below MAP, by a dollar amount.
6. **Walmart and Musician's Friend MAP gaps.** Each of those channels has a matched price and a gap, or it was checked and did not match.
7. **Bundle and review location.** The listing is a bundle or it is not. When review counts exist, the dashboard says whether those reviews sit on this ASIN or on a parent ASIN.

Out of scope until you say otherwise:

- Dollar recovery, the $680k pilot, and the enterprise range. Those are analyst estimates.
- The canvas 14-ASIN table and the "2,420 stranded reviews" figure, as measurements. Twelve of those fourteen ASINs are not in the catalog. The two that are (`B0D8TFXHHT`, `B0D8TN41XS`) are bundles and are not in the 993-row Buy Box table. Every `reviews_count` in that table is 0.
- Treating the other 73 unknown rows as high-price pages. Only the ten above were opened.
- Reverb and Sweetwater.com as their own price columns. Sweetwater Sound is already an Amazon seller (227 of the 993 featured wins).

## Facts behind each statement

Status is one of: **stored** (current enough to say the sentence), **stale** (the column exists and the value is from an old check), **missing** (no column can say it).

| Statement | Fact | Status | Where it lives today |
| --- | --- | --- | --- |
| 1. Featured offer | A yes/no featured-offer flag | Missing | Null `buybox_seller` is doing two jobs. The hourly recount writes "Unknown/Not Harvested" whenever it is null. |
| 1 | Seller check happened | Stored for 993 ASINs. Absent for 2,437 | `fmic_electric_catalog.buybox_checked_at`. 990 stamps are 1 Oct. 3 stamps are 5 Oct 14:59 UTC |
| 2. Why withheld | Amazon's reason, including "High price" | Missing | No reason column. Keepa, Exa, Walmart, and Toolbelt do not return the phrase "Unknown/Not Harvested". That phrase is our label |
| 3. Who is still selling | Seller, condition, and price for each offer | Missing | Only the featured seller id is stored. The Liberty, GearTree, Butler, Alto, and Sweetwater offers on the nine pages are not on the row |
| 3 | Count of new offers | Stale | `offer_count_new`. 61 of the 83 unknown rows have at least one. 22 are null. There is no used-offer count |
| 4. Featured owner | Seller id and name | Stale | `buybox_seller` / `buybox_winner`, joined to `fmic_sellers` (30 sellers). 840 third-party, 70 `ATVPDKIKX0DER` (Amazon.com). The 83 unknown rows have a null seller. Jim Root's live featured seller is not stored |
| 4 | Condition of the featured offer | Missing | `offer_count_new` counts new offers. It does not say the featured offer is used |
| 4 | Featured price | Stale | `current_price` equals `offer_price` on all 993 rows. It still matches the nine new prices. It is wrong for Jim Root ($2,349.99 stored, $1,839.99 live) |
| 5. Amazon MAP | MAP price | Stored for 980 of 993 | `map_price`. It equals `list_price` on every row that has both. 13 rows have no MAP |
| 5 | Gap in dollars | Stale, because the offer price is stale | `leakage_amount = offer_price - map_price`. Negative means below MAP. 457 rows are below, 381 at MAP, 142 above, 13 with no MAP |
| 6. Walmart | Checked, matched price, seller, gap | Partial | `wmt_*`. 150 of 993 checked on 5 Oct. 18 have a price (9 below MAP). 132 were checked and did not match. Cursor `map_leakage_walmart` is 800 |
| 6. Musician's Friend | Checked, matched price, gap | Partial | `mf_*`. 103 of 993 checked on 5 Oct. 58 have a price (17 below MAP). 45 were checked and did not match. No Reverb columns |
| 7. Bundle | This ASIN is a bundle | Stored, from the 29 Sep catalog extract | `is_bundle`. 913 of 3,430 catalog rows. The 21:41 UTC recount reports 395 bundles inside the 993. `bundle_name` on the Buy Box table is empty for all 993 |
| 7. Review location | Parent ASIN | Stored for 1,589 catalog rows | `parent_asin` (401 distinct parents). 649 bundles point at a different parent |
| 7 | Review count on this ASIN and on the parent | Missing | `reviews_count` exists and is 0 on all 993 rows. Nothing is refreshing it |

`buybox_share_pct` is 0 on all 993 rows. It does not support a share sentence.

## What the recount is doing with those facts

`fender_omnichannel_audit_sync` runs every hour at :41 UTC. It does not call Keepa. The latest run (5 Oct 21:41 UTC, recompute v7) rewrote all 993 Buy Box rows in place:

| `buybox_status` | Rows | Rule it actually applied |
| --- | --- | --- |
| 3P Confirmed | 840 | `buybox_seller` is set and is not Amazon.com |
| Amazon 1P | 70 | `buybox_seller = ATVPDKIKX0DER` |
| Unknown/Not Harvested | 83 | `buybox_seller` is null |

Those 83 were seller-checked on 1 Oct between 14:51 and 16:30 UTC. They have a price. They are not the 2,437 catalog ASINs that have never been seller-checked (`buybox_checked_at` is null, and those rows have no price).

The same run appends snapshot rows forever:

- `fmic_brand_kpi_summary`: 874 rows. The 21:41 run added 6 metrics. The "latest" view still returns 29 Sep text for metrics that run no longer writes, including "71 of 117" Amazon 1P and "0 of 117" third-party.
- `fmic_division_metrics`: 871 rows. The 21:41 run appended the six catalog divisions (Solid Body, Kits, Electric Guitars, Hollow, Tuning Pegs, Bags). Older division names from 29 Sep remain the "latest" row for those names.
- `fmic_audit_runs`: 674 rows.

`fmic_retail_buybox_map` is one row per ASIN (unique on `asin`). All 993 rows were inserted at 13:41 UTC on 5 Oct and updated together at 21:41 UTC. Channel columns survived that update. The Buy Box table is current state. The KPI and division tables are the append log.

The canvas still says 7.4% (74 of 993) Amazon 1P, 92.6% unharvested, and 0% confirmed third-party. The live recount says 70 Amazon 1P (7.0%), 840 third-party, and 83 withheld. The app is showing the copy.

Largest featured sellers on the 993: Austin Bazaar 401, Sweetwater Sound 227, Amazon.com 70, Proaudiostar 46, Liberty Music Inc 33, GearTree 25.

## Schema to add, after the statements are confirmed

Columns on the existing ASIN-keyed tables, plus one current-state offer table. No new snapshot table. The hourly recount already appends KPI and division rows forever.

### On `command.fmic_electric_catalog`

This table is already the seller-check result, one row per ASIN.

| Column | Type | What it stores |
| --- | --- | --- |
| `featured_offer` | boolean, null until checked | Statement 1. True when Amazon shows a featured offer |
| `suppression_reason` | varchar, null when featured or not yet read | Statement 2. A short code. `high_price` is the only code the nine pages justify. Leave it null on the other 73 until those pages are opened |
| `featured_condition` | varchar, null when there is no featured offer | Statement 4. `new`, `used_like_new`, and further used grades as the page states them |
| `offer_count_used` | integer, null until checked | Pair to the existing `offer_count_new` |

Keep `buybox_seller`, `current_price`, `offer_count_new`, `buybox_checked_at`, `is_bundle`, and `parent_asin`.

Once `buybox_checked_at` is set, a null seller means "checked, no featured seller", which is statement 1 with `featured_offer = false`. The 2,437 rows with a null `buybox_checked_at` stay "not seller-checked". Those two states get different labels.

`amazon_stock` stays an inventory field. It is not the featured-offer flag.

### New current-state table `command.fmic_amazon_offers`

Statements 3 and 4 need one row per offer. A single seller column cannot name Liberty and GearTree on the same page.

| Column | Type | Notes |
| --- | --- | --- |
| `asin` | varchar, not null | Same key as the catalog |
| `seller_id` | varchar, not null | Join to `fmic_sellers` |
| `condition` | varchar, not null | `new`, `used_like_new`, and so on |
| `price` | numeric, not null | Observed price |
| `is_featured` | boolean, not null | At most one featured row per ASIN |
| `offer_position` | integer, null | Order on the buying-options list |
| `checked_at` | timestamptz, not null | Same stamp as the seller check |

Primary key `(asin, seller_id, condition)`. On each seller check, replace that ASIN's offer rows. This table is current state. It does not keep an offer history, and it is not another hourly append.

The featured row is the same fact as `buybox_seller` + `featured_condition` + `current_price`. Store it in both places so the catalog row can answer "who owns it" without scanning offers, and the offer table can answer "who else is listed".

### On `command.fmic_retail_buybox_map`

Keep `map_price`, `offer_price`, `leakage_amount`, `wmt_*`, and `mf_*`. They already answer statements 5 and 6 for Amazon, Walmart, and Musician's Friend.

`buybox_status` becomes a derived label written from `featured_offer`, `suppression_reason`, and the seller:

| Inputs | Label to show |
| --- | --- |
| `featured_offer` true, seller Amazon.com | Amazon 1P |
| `featured_offer` true, any other seller | 3P, plus the seller name and condition |
| `featured_offer` false, `suppression_reason = high_price` | No featured offer: high price. Sellers still listed |
| `featured_offer` false, reason null, check stamp set | No featured offer: reason not captured |
| `buybox_checked_at` null | Not seller-checked |

Retire "Unknown/Not Harvested" for rows that have a check stamp.

Do not add Reverb or Sweetwater.com columns unless you say those channels are required.

`reviews_count` stays. Add `reviews_observed_at` only when a review source exists. Until then the column is a zero, and statement 7's review half stays narrative. `parent_asin` and `is_bundle` are already enough to say where a future count would sit.

`bundle_name` is empty. The bundle fact is `is_bundle` on the catalog. No second bundle column.

Do not add these facts to `fmic_brand_kpi_summary` or `fmic_division_metrics`.

### What not to add

- No organization column on the retail tables.
- No revenue columns.
- No backfill of `high_price` onto the 73 unopened rows.
- No extra snapshot table for offers, MAP, or Buy Box status.

## Schedule, only for facts that have to be fresh

A recount of stored fields is a different job from a paid Keepa or marketplace fetch.

Freshness is still an open choice. The Jim Root page went from "no seller, $2,349.99" to a featured used offer at $1,839.99 inside four days, so a check from 1 Oct is already too old to state the featured offer. The batch math below uses a 24-hour window because that is the tightest window the current hourly jobs can finish for 993 ASINs. A tighter window means a smaller population or a larger batch.

### Recount of stored fields

Today: every hour at :41 UTC. Rewrites all 993 status labels from `buybox_seller`. Appends KPI and division rows. Does not call Keepa. Does not refresh the seller check.

Proposed: run when a seller-check batch, a Walmart batch, or a Musician's Friend batch has written new values. Skip the run when those stamps have not moved.

Done means: every ASIN with `buybox_checked_at` set has a `buybox_status` from the table above, and the KPI row for that run matches the same counts. Headline counts come from `featured_offer` and `suppression_reason`, not from "seller id is null".

The recount is free relative to Keepa. Running it hourly against unchanged 1 Oct sellers only grows the append log.

### Amazon seller check

This is the fetch for statements 1 through 4. It is separate from the recount.

The job `buybox_seller_harvester` last ran 5 Oct 14:59 UTC and processed 3 listings. At 3 an hour, 993 ASINs take about 14 days. That cannot support a daily dashboard.

Proposed batch: 50 ASINs an hour, same size as the Walmart job, aimed at the monitored set.

| Population, if you choose it | Full pass at 50/hour | Fits a 24-hour window? |
| --- | --- | --- |
| The 83 withheld rows first | 2 hours | Yes |
| The 993 seller-checked ASINs | 20 hours (19.9) | Yes |
| The 3,430 catalog | 69 hours (68.6) | No |

Done for one ASIN means `buybox_checked_at` is inside the pass and the row has `featured_offer`, `suppression_reason` (null only when a featured offer exists, or when the page was not read for a reason), `featured_condition` when featured, price, and a replaced set of `fmic_amazon_offers` rows.

Done for a pass means every ASIN in the chosen population meets that bar.

Order inside the 993: the 83 withheld rows first, because the current label hides a reason we have already seen on nine of them. Then the rest of the 993, oldest `buybox_checked_at` first. The 2,437 never-checked catalog ASINs wait until you pick the catalog as the client-facing unit.

The Keepa catalog harvester is a different job. It last finished 29 Sep, and `catalog_harvester` still sits on page 48. It fills price, rank, `monthly_sold`, `is_bundle`, and `parent_asin`. It does not return a featured-offer flag or Amazon's high-price reason. Leave it off this schedule. Restart it only if statement 7's bundle flag has to be newer than 29 Sep.

### Walmart

Already scheduled: every hour at :51 UTC, next 50 of 993. Full pass is 20 hours. Last job stamp is 5 Oct 18:56 UTC, cursor 800, last batch 50, 2 matches in that batch. 150 rows have `wmt_checked_at` on 5 Oct.

Done means all 993 have `wmt_checked_at` inside the pass. A matched price is optional. A checked row with a null price is a finished non-match, and it counts toward done.

### Musician's Friend

Already scheduled: every hour at :35 UTC, 10 SKUs three times (30 an hour). Full pass of 993 is 33 hours. That does not fit a 24-hour window. Last job stamp is 5 Oct 20:37 UTC, 10 checked, 8 matched. 103 rows have `mf_checked_at` on 5 Oct.

To finish 993 inside 24 hours, raise the batch to 50 an hour (same as Walmart), or accept a 33-hour pass. Done means every monitored ASIN has `mf_checked_at` inside the pass, match or not.

### Reviews

No schedule. `reviews_count` is 0 for all 993, and no job is refreshing it. Statement 7's review half stays narrative until a review source exists. Do not add a job that writes more zeros.

### MAP list

`map_price` already equals `list_price` wherever both exist. Refresh MAP when the price list changes. An hourly MAP fetch does not make statement 5 fresher. The gap goes stale when the offer price goes stale, which is the seller-check schedule above.

### Reverb and Sweetwater.com

No schedule and no columns until you say those channels are required.

### Revenue

No model and no schedule. The dollar figures on the canvas are estimates.

## Jobs already on the clock

UTC, assistant `AEO_Product_Research-FenderTest`, as observed in `fmic_job_state` and `fmic_audit_runs` on 5 Oct 2026.

| When | Job | Last stamp in the database | What it refreshes |
| --- | --- | --- | --- |
| Hourly :00 | Spec readiness, next 10 active-offer SKUs, plus a metrics copy into a spec file | `spec_readiness` 21:01 UTC, cursor 10, wrapped | Not a Buy Box fact. 1,292 readiness rows, 872 distinct ASINs |
| Hourly :35 | Musician's Friend, 30 SKUs an hour | `map_parity_musiciansfriend` 20:37 UTC | Statement 6, Musician's Friend only |
| Hourly :41 | Buy Box recount from stored sellers | Audit run 21:41 UTC, 993 ASINs, 83 withheld | Labels and the append log. Not a marketplace fetch |
| Hourly :51 | Walmart match, next 50 | `map_leakage_walmart` 18:56 UTC, cursor 800 | Statement 6, Walmart only |
| Once at 09:00, not repeated through 21:00 | Workflow "Fender Omnichannel Brand Intelligence" | Not a seller-check refresh | One Keepa call, one Walmart search, one AI-search call, then the same recount |
| Not scheduled | Keepa catalog harvester | `catalog_harvester` 29 Sep 17:53 UTC, page 48 | Catalog attributes |
| Not scheduled | Amazon seller harvester, beyond the 3 listings | `buybox_seller_harvester` 5 Oct 14:59 UTC, 3 processed | Statements 1–4 |
| Not scheduled | Review counts | `reviews_count` all 0 | Statement 7, review half |

## Open questions

These block any migration or job change.

1. Which population is the client-facing unit: the 993 seller-checked ASINs, the 3,430 catalog, or a named hero list?
2. For a withheld Buy Box, is "High price. Sellers are still listed." the sentence to show, and should the reason code be stored?
3. How fresh must a seller check be before it is allowed on the dashboard? A 24-hour window can cover 993 ASINs at 50 an hour. It cannot cover 3,430 at that batch size.
4. Are Walmart and Musician's Friend enough channels, or do Reverb and Sweetwater.com need real columns?
5. Should review splintering be measured, or stay narrative until a review source exists?

Revenue stays out until you say those dollar figures are in scope.
