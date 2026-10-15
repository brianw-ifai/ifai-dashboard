# Dashboard truth map

This is the current source of truth for every valuable output on the Fender canvas. For each output it records what the client sees, where the value comes from, who writes it, how fresh it is, what population it covers, whether it is confirmed, what is wrong with the input, what acquisition step would make it reliable, and whether the UI should keep it, qualify it, or remove it.

It exists so that the next pass improves inputs instead of polishing claims the data does not support.

**Read at:** 2026-10-09 00:02 to 00:12 UTC, against `main` at `04a8553`.

**How it was read.** Two read-only paths. The `public.canvas_*` views were read with the same anonymous key the browser uses, so every count below is what the canvas itself would compute. The `command` tables and job state were read as `cursor_schema_reader` inside read-only transactions. Nothing was written. No view, table, column, or client-visible string was changed by this audit.

**What this replaces.**

- `docs/dashboard-data-inventory.md` is a 17 September 2026 inventory of authored demo copy. It is retired. It describes a canvas with 124 monitored ASINs, 5 divisions, and no database reads. None of that is the current product.
- `docs/retail-and-readiness-sources.md` is a 7 October 2026 reading. Its retail half is superseded: every MAP figure in it is gone from the database. See [Reconciling the 7 October source map](#reconciling-the-7-october-source-map).

## How to read a status

| Status | Meaning |
| --- | --- |
| confirmed | A finished check stored the condition the screen describes, across the whole population the screen names. |
| partial | Some of the named population has no stored result. Missing rows are not zeros. |
| stale | The number on screen is from an earlier check and the collector has not come back. |
| failed | The collector ran and did not bring back a result. |
| estimated | An analyst figure. Not computed from stored rows. |
| not measured | No column, no job, or the cell does not read a column that exists. |

A reading can be two things at once. Walmart MAP is both partial (116 prices stored) and failed (918 checks that returned nothing). Both are recorded.

---

## Part 1. Prioritized data-acquisition backlog

Ordered by how much client-visible value each unlock restores. Featured Offer coverage leads because it is the retail headline, the command center's first item, the Portfolio Retail bubble, the roadmap's subtitle, and the only retail finding still producing a number.

### 1. Featured Offer coverage (lead)

**The gap is not the withheld flag. It is the Competitive External Price.**

The screen says the audit has stored a Featured Offer reading for 1,015 of 1,036 listings, which sounds like 98% coverage. But a listing can only join the suppressed list when it has **both** a true `featured_offer_withheld` flag **and** a positive `competitive_price_threshold_cents`. The threshold is stored on **440 of 1,036** listings. That is the real denominator, and the screen never says it.

The consequence is concrete: 69 listings carry a withheld flag, but 20 of them have no threshold, so they can never be tested or counted. The published "48" is 48 out of a 440-row testable population, presented against a 1,036-row coverage sentence.

Three things are needed, in order:

1. **Name a writer.** Every collector on this system runs outside the database (there are only 10 functions across `public`, `command`, and `canvas_private`, and none references a collected column), so the evidence of ownership is `command.fmic_job_state`. It holds seven job keys: `spec_readiness`, `catalog_harvester`, `buybox_seller_harvester`, `map_leakage_walmart`, `map_parity_musiciansfriend`, `sandbox_drift_check`, and `ai_sim_conflict_rerun`. **None of them claims the suppression columns.** Walmart and Musician's Friend prices have an owner and a `last_run_at`; the Featured Offer reading has neither. Until a job registers it, its freshness cannot be stated and its coverage cannot be improved on purpose.
2. **Backfill the Competitive External Price to the full retail read.** Going from 440 to 1,036 is the single change that would turn the headline from a partial reading into a real coverage number.
3. **Reconcile suppression against seller harvest.** 66 of the 69 withheld listings carry `buybox_status = 'Unknown/Not Harvested'`. The suppression reader says the Featured Offer is withheld; the seller harvester says it never looked. These are two unreconciled populations describing the same button, and the dashboard shows both without acknowledging the conflict.

Add `featured_offer_checked_at` so coverage and staleness can be read per listing rather than inferred from the table's `updated_at`.

### 2. MAP prices

**Every `map_price` in the retail table is null.** All 1,036 rows. So are all 1,036 `leakage_amount` (Amazon) values and all 1,036 `wmt_leakage` values. The MAP program on this dashboard currently has no reference price at all.

The 7 October source map recorded 532 listings below MAP and an average gap of -$209.47. Those figures no longer exist in the database. The table was rebuilt on 8 October (oldest `updated_at` 14:51 UTC that day) and the rebuild carried no MAP price.

The product already handles this correctly: PR #25 made the MAP satellite, the MAP tab summary, and the command-center MAP item say "Fender MAP prices have not been stored." instead of printing a count. That is the right behavior and should stay. But it means MAP is a blank area of the dashboard until a MAP feed exists.

Needed: a Fender MAP price source (brand-supplied list or partner agreement feed), written to `map_price` with a `map_source` and `map_effective_at` so a gap can be attributed and dated. Leakage should be recomputed only from a stored MAP price. See the residue defect in [Part 3, Retail shelf prices and MAP](#retail-shelf-prices-and-map): four Musician's Friend rows still carry a leakage computed without one, and one of them is the dashboard's last surviving "MAP violation".

### 3. Simulation provenance: run separation, engine, and category

Three defects sit on top of the same table and all three change headline numbers.

**Archived and live runs are pooled.** `public.canvas_ai_simulations` reads a union of `command.fmic_ai_simulations` (2,320 rows) and `command.fmic_ai_simulations_run1_archive` (1,967 rows surfaced). Every simulation aggregate on the canvas, including the 82.6% win rate, the 4,287 count, and the 222 hallucinations, is a union across runs that ended at different times. The copy calls this "the latest battery" and "the latest run". It is not.

**Engine attribution is lost.** `engine` is null on 4,173 of 4,287 rows. The engine name was never parsed out: it is still sitting at the end of the prompt text as a bracket tag, on all 4,287 rows, for example `Best electric guitar under $900 for versatile tones [gemini]`. So the client reads the tag in the prompt table while the graph satellite asserts "ChatGPT · Perplexity · Gemini" from authored copy, and `canvas_ai_engine` reports 97.3% "unknown" (and is never rendered).

**A probe battery is filed as a product category.** `category = 'hallucinations'` is a row in `canvas_ai_category` and in `canvas_competitor_sov`: 630 sims, 587 resolved, 587 Fender wins, 100.0%, no competitor. It is a deliberate spec-trap battery, not a category Fender competes in. Because it wins 100% of the time it is selected as `strongest_category`, so the Strongest Category SOV widget reads "100.0%" over "hallucinations · 587 of 587" and the Competitive Radar tooltip says "Strongest: hallucinations at 100.0%". It also sits in the Simulations category filter next to Electrics and Basses, and its 587 wins inflate the all-category share of voice.

Needed: parse `engine` from the prompt at write time and strip the tag from the stored prompt; expose `audit_run_id` and a run filter so the canvas reads one battery; and flag the hallucination probes with a separate column (for example `probe_type`) so they are excluded from category, competitor, and win-rate aggregates.

### 4. A win that hallucinates is still counted as a win

220 of the 222 rows flagged `hallucination_flag = true` also carry `winner = 'Fender/Squier'` and count toward `sim_wins`. An answer that tells a shopper the Mustang Micro has vacuum tubes is scored as a Fender win because it named Fender.

This is a scoring-semantics defect, not a collection defect, and it is cheap to fix relative to its effect: the 82.6% overall win rate and every category win rate are inflated by answers the same pipeline has already marked wrong. Decide whether a hallucinated answer is a win, a loss, or its own bucket, then recompute. Until then the win rate should be qualified on screen.

### 5. Remediation is not remediation

`remediation_patch` is a verbatim copy of `answer_text` on the rows sampled. The simulation detail drawer prints "Remediation:" followed by the assistant's own answer. The graph tooltip tells the reader to "inspect root causes and remediation patches in the simulations table".

`root_cause` is genuinely written, but only on 364 of 4,287 rows; the rest are empty strings rather than nulls, so a non-null count overstates it.

Needed: either write a real remediation per flagged row or stop promising one. This is the lowest-cost item on the list and it currently misrepresents IntoFocus's own output to the client.

### 6. Citations are collected and never shown

1,904 simulation rows carry a non-empty `citation_urls` string. The "Citation Ecosystem & Fender DTC Opportunity" tab has no template and no React override, so **it renders blank**. The Citations satellite on the graph says "SOV mix / See drill-down" and promises "Citation share is derived from the latest simulation battery", pointing at the empty tab.

This is the largest ready-to-use asset on the dashboard that the client cannot see. The data needs normalizing (the field is a pipe-delimited string, and some rows store the literal text `null`), but a domain-level citation breakdown is achievable from what is already stored.

Needed: a `canvas_ai_citations` view that explodes `citation_urls` to one row per `(sim_id, domain, url)`, plus the panel. Until the panel exists the satellite should not promise a drill-down.

### 7. Reviews and bundle nesting

`reviews_count` is `NOT NULL DEFAULT 0` and **zero rows are above zero**. No registered job writes it, so every stored 0 is the column default rather than a count. The nesting story (52 bundles with no parent ASIN, their reviews splintered off the parent listing) is the dashboard's clearest ecommerce-to-AEO causal claim, and the quantity that would size it does not exist.

The UI already handles this honestly: the table prints "Pending data" rather than "0 reviews", and the Stranded Customer Reviews widget stays on "Pending data" because `canvas_metrics.bundle_reviews` nulls out a zero sum. Keep that. But the claim stays unsized until review counts are harvested.

Needed: harvest `reviews_count` and `rating` per ASIN during the existing catalog or seller pass, with a `reviews_checked_at`. That single column turns "52 bundles are unnested" into "52 bundles are holding N reviews off the parent listing", which is the sentence the briefing actually wants.

### 8. Amazon A+

Nothing is measured. There is no `aplus_*` column anywhere, no job, and no count on screen. The satellite says "Not measured yet", the tab is an explainer, and the command-center item is titled "A+ comparison tables have not been measured". That is currently accurate and should stay accurate rather than being filled with the Amazon attribute percentage, which measures something else.

The 7 October source map already proposed the columns (`aplus_present`, `aplus_module_count`, `aplus_comparison_table_present`, `aplus_page_url`, `aplus_checked_at`). They are still the right columns and still unapplied.

### 9. Spec expectations are not category-aware

`amazon_fields_expected` is **13 on all 949 spec rows**, whatever the product is. The first row in the view is a set of guitar strings scored against `guitar_pickup_configuration`, `scale_length`, `number_of_strings`, and `guitar_bridge_system`.

So "Amazon attribute completeness 91.4%" and the whole Top missing schema fields chart (scale_length missing on 347 SKUs, hand_orientation on 181) mix genuinely incomplete guitar listings with accessories that were never going to have those attributes. The gap list overstates the fixable work and misdirects it.

Needed: a per-category expected-field template keyed off the stored `category`, and `amazon_fields_expected` written per row from that template.

### 10. Divisions are two taxonomies stacked on each other

`canvas_divisions` returns 13 rows that are not a partition of anything. Six are Amazon browse nodes written by the live KPI recompute at 2026-10-08 23:41 (Solid Body, Electric Guitars, Electric Guitar Kits, Hollow & Semi-Hollow Body, Bags Cases & Covers, Tuning Pegs). Seven are marketing divisions written **once**, on 2026-09-29 15:17, and never again (Fender USA, Fender Mexico, Squier Entry Tier, Fender Core & Artist Series, Custom Shop, Amps & Digital Audio, Acoustic & Hybrids).

The "latest row per division name" view keeps both sets, so the Division Performance table shows nine-day-old marketing rows beside today's browse-node rows, and its Monitored SKUs column sums to **6,763** against a 3,604-SKU catalog. Two columns in that table are empty by construction: `schema_sync_pct` is 0.00 on every row and `primary_threat` is null on every row. Several `buybox_pct` cells are computed on samples of one (Fender Mexico shows 100% from a single active offer).

Needed: pick one taxonomy, stop the `div_latest` view from resurrecting retired division names, drop or populate the two dead columns, and suppress a percentage computed on n=1.

### 11. Freshness is reported as the newest job, not the oldest

The header reads "Data as of" the **maximum** `last_run_at` across all jobs. Catalog and seller harvest run every few minutes, so the bar currently reads a timestamp minutes old while the AI battery has not run since 2026-10-05 16:26 (about 3.5 days) and seven divisions have not been written since 2026-09-29. Per-job staleness exists only in the hover title.

Needed: surface the oldest contributing job, or show freshness per area next to the figures that depend on it. This is a UI change rather than an acquisition step, but it is what makes every other staleness above visible to the client.

### 12. `canvas_metrics` carries two disagreeing copies of the same KPIs

The typed columns and the embedded `kpi` JSON blob disagree inside the same row: Buy Box 6.9% against 7.2%, active-offer coverage 28.7% against 27.9%, 1,036 active-offer SKUs against 1,006, and 943 bundles against 398. The canvas reads the typed columns for these, so the JSON is currently harmless, but `{phase_one_lift}` and `{enterprise_potential}` are read from that same JSON and fall back to hardcoded strings because those keys are absent. One of the two copies should go.

---

## Part 2. Current live readings

Every figure in this section was read on 2026-10-09 between 00:02 and 00:12 UTC. The spec job is running continuously, so its numbers move between reads: `spec_checked` was 948 and `spec_fender_found` 146 at 00:02, and 949 and 153 at 00:10. Treat them as a moving window, not a snapshot.

### Jobs (`public.canvas_freshness`)

| Job key | Last run (UTC) | State |
| --- | --- | --- |
| `spec_readiness` | 2026-10-09 00:03 | Cursor 741. `wrapped: false`. Still working through the catalog. |
| `catalog_harvester` | 2026-10-09 00:00 | Cursor 52. `wrapped: true` at 2026-10-08 20:30. |
| `buybox_seller_harvester` | 2026-10-09 00:00 | Processed 1, 0 new sellers resolved, `stopReason: done`. |
| `map_leakage_walmart` | 2026-10-08 23:54 | Last batch 50, last matched 2, sample size 993. |
| `map_parity_musiciansfriend` | 2026-10-08 23:38 | Checked 10, matched 1, redirected 2, remaining 115. |
| `sandbox_drift_check` | 2026-10-08 23:41 | Retail row counts match between sandbox and prod (1,036 each). |
| `kpi_recompute` | 2026-10-08 23:41 | Wrote the current `canvas_metrics` row. |
| `ai_simulations` | 2026-10-05 16:26 | About 3.5 days old. |
| `ai_sim_conflict_rerun` | 2026-10-05 16:01 | About 3.5 days old. |

`sandbox_drift_check` and `ai_sim_conflict_rerun` have no label in `DataFreshnessBar`, so the hover shows their raw job keys.

### Retail (`public.canvas_retail_listings`, 1,036 rows, `updated_at` 2026-10-08 14:51 to 23:54)

| Column | Stored | Note |
| --- | --- | --- |
| `offer_price` | 1,036 | Dollars, includes shipping. |
| `map_price` | **0** | No MAP reference exists. |
| `amz_leakage` | **0** | Derived from `map_price`. |
| `wmt_price > 0` | 116 | `wmt_checked_at` on 1,034, so 918 checks returned no price. |
| `wmt_leakage` | **0** | |
| `mf_price > 0` | 310 | `mf_checked_at` on 491. |
| `mf_leakage` | 4 | One at -200.00, three at 0.00. All four have `map_price` null. |
| `is_map_violation` | 1 | The single -200.00 row. |
| `featured_offer_withheld` | 1,015 (69 true, 946 false, 21 null) | No registered job owns it. |
| `competitive_price_threshold_cents > 0` | 440 | The binding constraint on suppression coverage. |
| `competitive_offer_suppressed` | 48 | Matches the app's own recomputation. |
| `is_bundle` | 419 true | 52 have no parent ASIN at all; 0 have an unusable one. |
| `reviews_count > 0` | **0** | Column default is 0 and no registered job writes it. |
| `buybox_status` | 72 Amazon 1P, 867 3P Confirmed, 67 Unknown/Not Harvested, 30 No Active Offer | None left on the old `Fender 1P Win` default. |
| `buybox_seller_name` | 29 distinct | Austin Bazaar 426, Sweetwater Sound 181, GearTree 82, Amazon.com 74. |
| `channels` | AMZ 646, AMZ+MF 248, AMZ+WMT 51, AMZ+MF+WMT 55 | Tag reflects stored prices, not checks performed. |

The retail read itself covers 1,036 of 3,604 catalog SKUs (28.7%). Every retail percentage on the canvas is a percentage of that 28.7% slice.

### Spec (`public.canvas_spec_readiness`, 949 latest rows over 2,027 stored)

| Reading | Value |
| --- | --- |
| `amazon_checked` true | 949 of 949 |
| `amazon_fields_expected` | 13 on every row, regardless of category |
| Rows with at least one missing Amazon field | 444 |
| `fender_found` true | 153 (146 at the 00:02 read) |
| `fender_found` false with null `fender_url` | the remainder; `fender_missing_fields` reads `not_found_on_fender.com` |
| `checked_at` age | median 47h, max 162h, **693 of 949 older than 26h** |
| Spec categories | Solid Body 771, Electric Guitar Kits 95, Electric Guitars 65, Hollow & Semi-Hollow 17, Bags Cases & Covers 1 |

### Simulations (`public.canvas_ai_simulations`, 4,287 rows)

| Reading | Value |
| --- | --- |
| Source tables | `fmic_ai_simulations` 2,320 (2026-09-29 to 2026-10-05) and `fmic_ai_simulations_run1_archive` 1,967 surfaced of 2,007 (2026-10-01 to 2026-10-02) |
| `engine` null | 4,173 of 4,287. Named: gemini 45, chatgpt 36, perplexity 33 |
| Prompts carrying a bracket engine tag | 4,287 of 4,287 |
| `hallucination_flag` true | 222, of which 220 also carry `winner = 'Fender/Squier'` |
| `citation_urls` non-empty | 1,904, pipe-delimited, some rows store the literal text `null` |
| `root_cause` non-empty | 364 (the rest are empty strings, not nulls) |
| `remediation_patch` | Duplicates `answer_text` |

### Other views

- `canvas_ai_category`: 7 rows. Six real categories plus `hallucinations` at 100.0% (587 / 587, no competitor).
- `canvas_competitor_sov`: 33 rows. The `all` rows pool the hallucinations battery into total share of voice.
- `canvas_ai_engine`: 4 rows, `unknown` holding 4,173. Loaded into the bundle and never rendered.
- `canvas_divisions`: 13 rows summing to 6,763 monitored SKUs. `schema_sync_pct` 0.00 and `primary_threat` null on all 13.
- `canvas_spec_missing_fields`: 14 rows, led by scale_length 347, hand_orientation 181, item_weight 154, additionalProperty (fender) 146.
- `canvas_listing_channel_price`: **0 rows**. This is why Sweetwater and Reverb columns never appear. Sweetwater Sound does appear as an Amazon seller name on 181 listings, which is a different fact.
- `command.fmic_social_intelligence`: 2 rows. Nothing on the canvas reads it, and the Reddit action item is authored copy.

---

## Part 3. Area by area

### Featured Offer coverage and suppression

| Field | Finding |
| --- | --- |
| **Client-visible output** | Portfolio Retail bubble ("Suppressed Listings", "48 listings"); Suppressed Listings satellite; Retail Overview card; Suppressed Listings tab badge and table; command center item 1; Strategy Roadmap node subtitle; `{retail_headline}` inside the hub Executive Briefing, Action Items, and the roadmap. |
| **Location** | `lib/fender-canvas/portfolio-retail-display.ts` (bubbles and headline), `components/v3/live/SuppressedListingsPanel.tsx` (table), `lib/fender-canvas/command-center-from-live.ts` (item 1), `lib/fender-canvas/retail-copy.ts` (`retail_headline`). |
| **Source** | `public.canvas_retail_listings`: `featured_offer_withheld`, `competitive_price_threshold_cents`, `offer_price`. Qualifying rule in `lib/fender-canvas/suppressed-listings.ts`: withheld is true, threshold is a positive cent value, and the offer in cents exceeds it. |
| **Writer** | **None named.** No `job_key` in `command.fmic_job_state` claims either column, so unlike the Walmart and Musician's Friend prices this reading has no registered owner and no `last_run_at`. |
| **Timestamp and refresh** | No per-reading timestamp column. The table's `updated_at` spans 2026-10-08 14:51 to 23:54, but that clock is moved by the Walmart and seller jobs too, so it cannot date the suppression reading. |
| **Population and denominator** | Screen says 1,015 of 1,036. True testable population is **440 of 1,036** (threshold present), inside a retail read that is itself 1,036 of 3,604 catalog SKUs. |
| **Status** | **partial.** The 48 are a confirmed set inside an unfinished audit. |
| **Known input defect** | The published coverage sentence cites the wrong denominator. 20 withheld listings have no threshold and are silently untestable. 66 of the 69 withheld rows are simultaneously `Unknown/Not Harvested` in the seller harvest, so two readers of the same button disagree and both are shown. |
| **Next step** | Register a job that owns these columns, backfill the Competitive External Price to all 1,036 rows, add `featured_offer_checked_at`, and reconcile against `buybox_status`. |
| **UI disposition** | **Qualify.** Keep the headline. Change the coverage sentence to lead with the threshold denominator, since that is the limit on the count. |

### Retail shelf prices and MAP

| Field | Finding |
| --- | --- |
| **Client-visible output** | MAP Leakage satellite; MAP tab (definition callout, "Listings below MAP", "Average price gap", channel list, listings table); MAP violations widget; Average Amazon Price Drift widget; command-center MAP item; Action Items item 1 title; roadmap Phase 1 bullet 1. |
| **Location** | `components/v3/live/MapChannelPanel.tsx`, `lib/fender-canvas/portfolio-retail.ts` (`mapLeakageFinding`), `lib/fender-canvas/metrics-from-live.ts` (both MAP widgets), `lib/fender-canvas/retail-copy.ts` (`mapReadLine`). |
| **Source** | `canvas_retail_listings`: `map_price`, `amz_leakage` (from `leakage_amount`), `wmt_leakage`, `mf_leakage`, plus `offer_price`, `wmt_price`, `mf_price` for the table. |
| **Writer** | Walmart price, leakage, URL, and checked time: `map_leakage_walmart`. Musician's Friend price, leakage, and checked time: `map_parity_musiciansfriend`. **MAP price and Amazon leakage: no registered job.** |
| **Timestamp and refresh** | Walmart last ran 2026-10-08 23:54 (matched 2 of its last 50). Musician's Friend last ran 2026-10-08 23:38 (checked 10, matched 1, 115 remaining). Both are current; both are matching poorly. |
| **Population and denominator** | 1,036 retail rows. MAP price on 0. Walmart price on 116 of 1,034 checked. Musician's Friend price on 310 of 491 checked. |
| **Status** | MAP reference price: **not measured.** Amazon leakage: **not measured.** Walmart price: **partial** (116 stored) and **failed** (918 checks with no price). Musician's Friend price: **partial.** The 4 surviving `mf_leakage` values: **failed**, see the defect below. |
| **Known input defect** | Two defects. First, the MAP collapse: the 8 October table rebuild carried no `map_price`, so the entire MAP program lost its reference. Second, residue: four rows still hold an `mf_leakage` despite having no `map_price`, and in all four `mf_price` equals `offer_price` exactly. One of them (B08L351CTR, American Professional II Jazzmaster left-handed) carries -200.00 with no MAP stored, and it is the sole row still setting `is_map_violation`, `map_violation_skus = 1`, `mf_leaks = 1`, and `offamz_avg_leak = -200.00` in `canvas_metrics`. That is a gap computed from a missing input. |
| **Next step** | Acquire a Fender MAP feed; store `map_price`, `map_source`, `map_effective_at`. Recompute every channel leakage only when a MAP price exists, and clear the four residue values. Raise the Walmart and Musician's Friend match rates before treating either channel as a reading. |
| **UI disposition** | **Keep as-is for now.** The "Fender MAP prices have not been stored." sentence from PR #25 is correct and should not be reverted. Two follow-ups: the `canvas_metrics` residue (`map_violation_skus`, `offamz_avg_leak`) is not covered by that guard and should not reach any surface, and the MAP tab currently renders all 1,036 rows with a "Pending data" MAP column, which reads as an error rather than an explanation. |

### AI Search Visibility: simulations, wins, citations, hallucinations

| Field | Finding |
| --- | --- |
| **Client-visible output** | Simulation battery satellite ("4,287 Sims", "522 engine runs", "82.6% win (resolved)", "ChatGPT · Perplexity · Gemini"); AI Drift satellite ("222 Confirmed Hallucinations"); AI Search Visibility spoke stats and description; Dual-Index tab; Simulations explorer with category filter and detail drawer; Hallucination tab; Overall AI Win Rate, Resolved AI Simulations, and Confirmed Spec Hallucinations widgets; command-center item 2; Citations satellite. |
| **Location** | `lib/fender-canvas/nodes-from-live.ts` lines 30 to 83 and 182 to 197, `components/v3/live/FenderSimulationsPanel.tsx`, `components/v3/live/FenderHallucinationPanel.tsx`, `lib/fender-canvas/metrics-from-live.ts`, `data/fender-v3-spec.json` (`aeo` spoke). |
| **Source** | `canvas_metrics.sim_*` for every aggregate; `canvas_ai_simulations` for the explorer, the detail drawer, and the hallucination root-cause groups. |
| **Writer** | `ai_simulations`, with `ai_sim_conflict_rerun` for conflict reruns. |
| **Timestamp and refresh** | **Both last ran 2026-10-05**, about 3.5 days before this read. `sim_last_at` is 2026-10-05 16:26. Nothing on screen says so, because the freshness bar reports the newest job across the whole canvas. |
| **Population and denominator** | 4,287 rows pooling two audit runs. 3,885 resolved. 3,209 wins. 522 distinct engine runs. |
| **Status** | **stale**, and **partial** on provenance. The counts are real; the framing ("the latest battery", "the latest run", "the latest simulation read") is not. |
| **Known input defect** | Four, all listed in Part 1: archived and live runs pooled into one number; engine null on 97.3% of rows with the engine tag still in the prompt text; 220 of 222 hallucinated answers counted as Fender wins; `remediation_patch` a copy of `answer_text`. Add a fifth: `root_cause` is an empty string rather than null on 3,923 rows, so any non-null check overstates coverage. |
| **Next step** | Re-run the battery, then expose `audit_run_id` with a run filter, parse `engine`, strip the bracket tag from the stored prompt, decide the hallucination-win rule, and write a real remediation or drop the field. |
| **UI disposition** | **Qualify now, show properly after the re-run.** Replace "latest battery" and "latest run" with the run date. The Remediation row in the detail drawer should be removed until it holds a remediation. |

**Citations** are a separate case inside this area:

| Field | Finding |
| --- | --- |
| **Client-visible output** | Citations satellite ("SOV mix", "See drill-down", tooltip promising citation share from the latest battery); the "Citation Ecosystem & Fender DTC Opportunity" tab; per-simulation citation links in the detail drawer. |
| **Location** | `lib/fender-canvas/nodes-from-live.ts` lines 49 to 64; `data/fender-v3-spec.json` `aeo.tabs[3]` with only two `tabTemplates` and no override in `components/v3/build-live-spokes.tsx`. |
| **Source** | `canvas_ai_simulations.citation_urls`, pipe-delimited. 1,904 non-empty. |
| **Writer** | `ai_simulations`. |
| **Timestamp and refresh** | Same 2026-10-05 battery. |
| **Population and denominator** | 1,904 of 4,287 rows carry at least one URL. No domain-level aggregate exists. |
| **Status** | **not measured** as a dashboard output, despite the underlying data existing. |
| **Known input defect** | The tab renders blank. Some rows store the four-character text `null` instead of an empty value. There is no domain normalization, so no share can be computed without one. |
| **Next step** | Add a `canvas_ai_citations` view exploding the field to one row per `(sim_id, domain, url)`, then build the panel. |
| **UI disposition** | **Remove the promise, then show the panel.** Today the satellite advertises a drill-down into an empty tab. Either ship the panel in the same pass or drop the satellite's citation-share claim. |

### Competitive Radar

| Field | Finding |
| --- | --- |
| **Client-visible output** | Competitive Radar spoke stats ("Yamaha 38.7%", "19.9 pt gap", "beginner gap") and tooltip; Taylor / PRS satellite; Amps Category satellite; Head-to-Head Category Battlecards tab with two live tables; Beginner Category SOV Gap and Strongest Category SOV widgets; command-center beginner item. |
| **Location** | `lib/fender-canvas/nodes-from-live.ts` lines 142 to 180 and 226 to 244, `components/v3/live/FenderCategorySovPanel.tsx`, `lib/fender-canvas/beginner-sov.ts`, `lib/fender-canvas/metrics-from-live.ts`. |
| **Source** | `canvas_ai_category` (per-category win rate and top competitor) and `canvas_competitor_sov` (per-brand wins and share), both derived from the same simulation rows. `canvas_metrics.weakest_*` and `strongest_*`. |
| **Writer** | `ai_simulations`. |
| **Timestamp and refresh** | 2026-10-05. Same staleness as the simulation battery. |
| **Population and denominator** | 3,885 resolved answers across 7 "categories", one of which is the hallucination probe battery. Beginner is 287 resolved of 378 sims. |
| **Status** | **stale**, and **partial** because the category set is contaminated. |
| **Known input defect** | The `hallucinations` battery is treated as a competitive category: it is the selected `strongest_category`, it appears in the Simulations category filter beside real categories, and its 587 wins are inside the `all` share-of-voice rows that produce the 82.6% brand share. Separately, this is share of voice inside IntoFocus's own prompt set, not measured market share, and the UI never says which prompts. |
| **Next step** | Exclude probe batteries from category and competitor aggregates, then publish the prompt set behind the share so the client can judge the sample. |
| **UI disposition** | **Qualify, and remove the hallucinations row.** The beginner gap against Yamaha is the real finding here and it is well supported by 287 resolved answers. The 100% "Strongest Category" claim should not be on screen in any form. |

Two Competitive Radar tabs are named but empty: "Multi-Marketplace Channel Scope (Sweetwater, Reverb, Walmart)" has no template, and the tab that does render ("Rival Strategies & Countermeasures") contains authored prose about Sweetwater, Reverb, and Walmart with no stored measurement behind it. `canvas_listing_channel_price` has zero rows, so there is no channel-scope reading to show.

### Fender.com findability and machine-readable specs

| Field | Finding |
| --- | --- |
| **Client-visible output** | AI Readiness spoke ("15.4% Found", "91.4% Amazon specs", "949 SKUs checked"); Machine Readability satellite ("146 missing additionalProperty"); AI Readiness tab summary table; Machine Readability list; Top missing schema fields chart; Spec readiness by ASIN table; fender.com Product Findability, Machine-Readable Spec Coverage, and Pages Missing additionalProperty widgets; command-center item 3. |
| **Location** | `components/v3/live/FenderSpecNarratives.tsx`, `components/v3/live/CatalogReadinessSpec.tsx`, `components/v3/live/SchemaAdditionalPropertyList.tsx`, `components/v3/live/FenderSpecPanel.tsx`, `lib/fender-canvas/metrics-from-live.ts`, `lib/fender-canvas/nodes-from-live.ts` lines 108 to 126. |
| **Source** | `canvas_spec_readiness` (latest row per ASIN) and the `canvas_metrics.spec_*` aggregates; `canvas_spec_missing_fields` for the chart. |
| **Writer** | `spec_readiness`. |
| **Timestamp and refresh** | Job is live (last run 2026-10-09 00:03) but `wrapped: false`, so it has never completed a full pass. Row ages range from 6 minutes to 162 hours, median 47 hours. **693 of 949 rows are older than 26 hours.** |
| **Population and denominator** | 949 ASINs of a 3,604-SKU catalog (26.3%). The screen says "949 SKUs checked" and never states the catalog denominator. |
| **Status** | Findability share: **partial.** The 796 unresolved pages: **failed**, since a null `fender_url` means the lookup did not resolve, not that the product is absent from fender.com. Found pages missing additionalProperty: **confirmed** on the found set. Amazon completeness: **partial** and distorted, see the defect. |
| **Known input defect** | `amazon_fields_expected` is 13 for every row regardless of category, so string sets and cases are scored against guitar attributes. This inflates both the missing-field counts and the shortfall in the 91.4% average. Separately, the whole area is a rolling window presented as a snapshot: the "949 checked" figure mixes rows checked minutes ago with rows checked six days ago. |
| **Next step** | Category-aware expected-field templates; let the job wrap at least once; add the catalog denominator to the summary; store positive evidence for a miss (searched URL and HTTP status) so a false `fender_found` can be distinguished from a failed lookup. |
| **UI disposition** | **Qualify.** The additionalProperty finding is the strongest claim on this spoke and should stay prominent. The findability percentage needs "of 3,604 catalog SKUs" and a window note. The Amazon completeness average should be withheld or split by category until the expected-field template is category-aware. |

### Amazon A+

| Field | Finding |
| --- | --- |
| **Client-visible output** | Amazon A+ Matrix satellite ("Not measured yet"); Amazon A+ Matrix tab, which is an explainer with no count; command-center item titled "A+ comparison tables have not been measured". |
| **Location** | `lib/fender-canvas/nodes-from-live.ts` lines 127 to 141, `components/v3/live/FenderSpecNarratives.tsx` (`AplusExplanation`), `lib/fender-canvas/command-center-from-live.ts` lines 118 to 126. |
| **Source** | None. No `aplus_*` column exists on any table or view. |
| **Writer** | None. |
| **Timestamp and refresh** | Not applicable. |
| **Population and denominator** | None. |
| **Status** | **not measured.** |
| **Known input defect** | The risk here is substitution. The Amazon attribute completeness percentage (91.4%) measures structured product attributes, not A+ modules or comparison tables, and must not be shown as an A+ reading. |
| **Next step** | Apply the five columns proposed in the 7 October source map (`aplus_present`, `aplus_module_count`, `aplus_comparison_table_present`, `aplus_page_url`, `aplus_checked_at`), null until a job writes them, then build the collector. |
| **UI disposition** | **Keep as-is.** This is the one area where the current copy is exactly right. |

### Reviews and bundle nesting

| Field | Finding |
| --- | --- |
| **Client-visible output** | Catalog Governance satellite ("52 bundles", coverage pill); Retail Overview Catalog Governance card; Catalog Governance tab (unnested bundle table, "Checked listings with a missing Amazon spec field"); Stranded Customer Reviews widget ("Pending data"); Reviews column in Explore all listings ("Pending data" per row); Splinter Bundles column in the Division Performance table. |
| **Location** | `components/v3/live/CatalogGovernancePanel.tsx`, `components/v3/live/RetailOverview.tsx`, `lib/fender-canvas/portfolio-retail.ts` (`unnestedBundlesFinding`), `lib/fender-canvas/listing-reviews.ts`, `lib/fender-canvas/metrics-from-live.ts`. |
| **Source** | Nesting: `canvas_retail_listings.is_bundle` and `parent_asin`, with `canvas_metrics.catalog_bundles` as the denominator. Reviews: `canvas_retail_listings.reviews_count` and `canvas_metrics.bundle_reviews`. |
| **Writer** | Bundle flag and parent ASIN: `catalog_harvester`. Reviews: **none**. |
| **Timestamp and refresh** | `catalog_harvester` last ran 2026-10-09 00:00 and wrapped at 2026-10-08 20:30, so the catalog side is current. |
| **Population and denominator** | 419 bundles in the retail read of 943 catalog bundles. 52 have no parent ASIN stored; none have an unusable one. Reviews: 0 of 1,036 rows above zero. |
| **Status** | Unnested bundles: **partial** (the screen says so: 419 of 943). Reviews: **not measured.** |
| **Known input defect** | `reviews_count` is `NOT NULL DEFAULT 0` with no writer, so the stored 0 is a default and not a count. The UI already refuses to print it as a count, which is correct. The nesting finding is sound but unsized without reviews. Note also that 1,642 of 3,604 catalog rows carry a parent ASIN while the retail read sees only 586 of them, so the retail slice is not representative of catalog nesting. |
| **Next step** | Harvest `reviews_count`, `rating`, and `reviews_checked_at` per ASIN in the existing catalog or seller pass. Drop the `DEFAULT 0` so an unharvested listing is null rather than zero. |
| **UI disposition** | **Keep and qualify.** "Pending data" is the right treatment today. Once reviews land, the Catalog Governance card should state reviews held off the parent, which is the sentence that connects this area to AI search. |

The "Checked listings with a missing Amazon spec field" count (444) sits on this tab and is the one retail-side reading presented without a qualifier. `amazonSpecGapsFinding` reports it complete because every row it was handed is `amazon_checked = true`, but the handed rows are 949 of 3,604 catalog SKUs. It should carry the same coverage sentence as its neighbours.

### Action Items and the 90-Day Roadmap

| Field | Finding |
| --- | --- |
| **Client-visible output** | Action Items spoke ("+$680K est.", "+$38M to $62M"); "Top 5 Urgent Portfolio Interventions"; Prioritized Action Items widget ("Estimates"); Strategy Roadmap spoke ("90 Days", "3 Phases", retail headline subtitle); 30-60-90 Day Milestones tab. |
| **Location** | `data/fender-v3-spec.json` (`suggestions` and `roadmap` spokes), `lib/fender-canvas/metrics-from-live.ts` lines 241 to 280, `lib/fender-canvas/nodes-from-live.ts` lines 245 to 276, `lib/fender-canvas/tour-from-live.ts`. |
| **Source** | Authored HTML. The only live values injected are `{retail_headline}`, `{map_read_line}`, `{bundle_read_line}`, and `{catalog_skus}`. |
| **Writer** | Human authors. No job. |
| **Timestamp and refresh** | The prose predates the current data. The injected lines are current. |
| **Population and denominator** | Five action cards, not the 18 the retired inventory describes. Three roadmap phases. |
| **Status** | **estimated** for the dollar figures, **not measured** for the action list itself (there is no action-items table). |
| **Known input defect** | The live injections now fight the prose they sit inside. Action item 1's title is `{map_read_line}`, which currently renders "Fender MAP prices have not been stored." above body copy about nesting bundles with Austin Bazaar and GearTree. Roadmap Phase 1 is headed "Days 1 to 30 (MAP leakage)" and its first bullet is the same sentence, so the plan opens on a measurement that does not exist. Action item 2 refers the reader to "average leakage figures tracked in the MAP audit above", which is now blank. Two roadmap tabs ("Executive KPI Target Matrix" and "Flexible Resourcing & Operating Model") have no template and render empty, and `toggleResourcingMode` is still registered against DOM that is no longer authored. |
| **Next step** | This is a copy-integrity problem rather than an acquisition problem. Either reorder the plan so Phase 1 leads with Featured Offer coverage, which is the finding that still has a number, or hold the MAP phase until a MAP feed exists. |
| **UI disposition** | **Qualify now.** The dollar figures are already labelled as analyst estimates, which satisfies the parked follow-up. The MAP-titled action item and Phase 1 bullet should move or be held, and the two empty roadmap tabs should be removed from the tab list until they have content. |

### Phase 1 and enterprise estimates

| Field | Finding |
| --- | --- |
| **Client-visible output** | "+$680K" on the Action Items node, the Recoverable Revenue widget, the ROI tab, the hub Commercial Sizing tab, the Action Items spoke description, and the guided tour. "+$38M to $62M" and "$50M midpoint" in the same places, plus the hub tab title. Line items: +$380K, +$190K, +$65K, +$45K for Phase 1; +$25M, +$16.5M, +$5M, +$3.5M for enterprise. |
| **Location** | `lib/fender-canvas/metrics-from-live.ts` lines 251 to 270 (hardcoded), `lib/fender-canvas/template-vars.ts` lines 88 to 89 (fallback), `lib/fender-canvas/tour-from-live.ts` lines 101 to 104, `data/fender-v3-spec.json` (`hub` tab 2, `suggestions` tabs 0 and 1). |
| **Source** | Hardcoded strings. `{phase_one_lift}` and `{enterprise_potential}` read `canvas_metrics.kpi.phase1_lift` and `.enterprise_potential`, and **neither key exists** in the live `kpi` JSON, so both always fall back to the hardcoded values. |
| **Writer** | Human authors. |
| **Timestamp and refresh** | Not dated anywhere in the product. The figures predate the current catalog, which has grown from 124 monitored ASINs to 3,604. |
| **Population and denominator** | Phase 1 was sized on 14 pilot ASINs. The ROI tab now prints "Across {catalog_skus} Monitored SKUs" beside it, which binds a 14-ASIN estimate to a 3,604-SKU denominator. The enterprise figure is described as spanning Fender, Squier, Jackson, EVH, and Gretsch while `catalog_skus` counts Fender electric SKUs only. |
| **Status** | **estimated.** |
| **Known input defect** | No stored inputs, no formula, no date. The denominator mismatch above is the specific hazard: a reader can reasonably infer the figure was recomputed against the current catalog. It was not. |
| **Next step** | Out of scope by standing instruction: opening these figures to their inputs is a later pass and the formula must not be invented. The useful step now is to date them and to stop binding them to a live SKU count. |
| **UI disposition** | **Qualify, and keep.** The "Earlier analyst estimate, not calculated from the current listing count" labels added in PR #23 are the right treatment. Most surfaces already carry an estimate label: both widgets say "estimate", and the guided tour says "Revenue figures on this spoke are estimates". The gap is the Action Items node, where the Phase 1 stat reads "+$680K est." but the enterprise stat and the node meta print "+$38M to $62M" bare. Per standing instruction the client portal shows no fee, retainer, or service-fee multiple, and none is present. |

### Cross-cutting: tabs that render empty

Four tabs are named in the tab strip, have no template in `data/fender-v3-spec.json`, and have no React override in `components/v3/build-live-spokes.tsx`. They render an empty div.

| Spoke | Tab | Why |
| --- | --- | --- |
| `aeo` | Citation Ecosystem & Fender DTC Opportunity | 4 tab names, 2 templates, overrides only for tabs 1 and 2. |
| `competitors` | Multi-Marketplace Channel Scope (Sweetwater, Reverb, Walmart) | 3 tab names, 2 templates, override only for tab 0. |
| `suggestions` | Interactive ROI Model (Pilot vs Enterprise) | 3 tab names, 2 templates. The ROI UI is on tab 1. |
| `roadmap` | Executive KPI Target Matrix, Flexible Resourcing & Operating Model | 3 tab names, 1 template. |

The `aeo` Simulations tab is also still titled "100 AI Simulations Interactive Explorer" while the badge beside it reads 4,287 rows.

---

## Part 4. Stale September figures, kept separate

These are the figures that are not current readings. They are listed here so they are never mistaken for live ones.

### Retired entirely (17 September 2026 authored demo)

Everything in `docs/dashboard-data-inventory.md`: 124 monitored ASINs, 5 divisions, 68% Buy Box coverage, 14 flagged ASINs, 2,420 splintered reviews, 41/100 Brand AEO score, 52% readiness, 34% schema coverage, 78% missing A+ grids, -$52 average MAP undercut, 15 sellers, 6 rivals, -29% competitive gap, 18 open fixes. None of these appear on the current canvas and none have a database source. That file also records an internal 118x service-fee multiple, which must never reach the client portal.

### Stale but still on screen

| Figure | Last written | Age at this read | Where it shows |
| --- | --- | --- | --- |
| Every simulation aggregate: 4,287 sims, 522 runs, 82.6% win, 3,209 wins, 260 unclear, 142 errors, 222 hallucinations, 630 risk answers | 2026-10-05 16:26 | 3.5 days | AI Search Visibility spoke and satellites, three widgets, command-center item 2, Dual-Index tab |
| Every category win rate and share of voice, including beginner 58.5% vs Yamaha 38.7% and the 19.9 pt gap | 2026-10-05 16:26 | 3.5 days | Competitive Radar spoke and satellites, two widgets, Battlecards tab, command-center beginner item |
| Seven marketing divisions with their SKU counts, Buy Box percentages, and splinter-bundle counts | **2026-09-29 15:17** | 9.4 days | Division Performance tab |
| 693 of 949 spec rows | Older than 26 hours, up to 162 hours | up to 6.75 days | AI Readiness spoke, spec summary, ASIN table, missing-fields chart, three widgets |
| Phase 1 +$680K and its four line items | Undated; sized on 14 pilot ASINs | predates the 3,604-SKU catalog | Action Items node, ROI tab, hub Commercial Sizing, Recoverable Revenue widget, guided tour |
| Enterprise +$38M to $62M and its four line items | Undated | same | same surfaces |

None of this staleness is visible to the client, because the "Data as of" bar reports the newest job on the canvas (currently minutes old) rather than the oldest one feeding the figure in front of them.

### Superseded by the 8 October rebuild

| Figure from the 7 October source map | State on 2026-10-09 |
| --- | --- |
| 532 listings below MAP | 1 (and that one is a residue value computed without a MAP price) |
| Average worst stored gap -$209.47 | Not stored |
| Amazon 456 listings below MAP, average drift -$221.19 | 0 and null |
| Walmart 40 listings below MAP | 0 |
| Musician's Friend 84 listings below MAP | 1 |
| MAP leakage stored for 1,013 of 1,030 | 4 of 1,036 |
| 1,030 retail rows, 3,599 catalog rows, 941 catalog bundles | 1,036, 3,604, 943 |
| 47 suppressed listings, 1,009 of 1,030 audited | 48 suppressed, 1,015 of 1,036 audited |
| 49 unnested bundles, 414 of 941 | 52 unnested, 419 of 943 |
| 81 Amazon 1P, 7.9% | 72 Amazon 1P, 6.9% |
| 925 spec SKUs, 13.3% findability, 91.6% Amazon completeness | 949, 15.4%, 91.4% |
| 435 checked listings with a missing Amazon spec field | 444 |
| Musician's Friend MAP stale (last run 2026-10-06 16:36, cursor stuck at 0) | Current (last run 2026-10-08 23:38, cursor 115). The MF staleness note in that file is resolved. |

---

## Reconciling the 7 October source map

`docs/retail-and-readiness-sources.md` was accurate when it was written. It is now partly superseded and should be read with these corrections.

**Still accurate.**

- The reading methodology, the status vocabulary, and the writer table.
- No registered job owns the Competitive External Price, the Featured Offer withheld flag, or `reviews_count`.
- `command.listing_channel_price` has no writer and no rows, so Sweetwater and Reverb stay off the MAP table.
- No A+ columns exist, and its five proposed columns are still the right ones and still unapplied.
- The "a null `fender_url` is not proof the product is absent" caveat.
- The structural description of every bubble, satellite, tab, and widget.

**Superseded.**

- The entire MAP section. Every MAP figure in that file (532, -$209.47, 456, 40, 84, 1,013 of 1,030) is gone. `map_price` is null on all 1,036 rows. The Amazon leakage column is empty. The screen no longer prints a below-MAP count; PR #25 replaced it with "Fender MAP prices have not been stored."
- The Musician's Friend staleness finding. That job is current again, though its match rate is poor (1 of 10 on its last batch).
- All row counts, which moved with the 8 October rebuild and the continuing spec job. Use Part 2 above.

**Not covered by that file and material.** It explicitly placed Action Items, Commercial Sizing, Competitive Radar, the AI simulation battery, and social harvests out of scope. Those are where the largest defects sit: pooled audit runs, lost engine attribution, hallucinated answers scored as wins, a probe battery filed as a product category, an empty citation tab over 1,904 stored citation strings, and a division table that sums to 6,763 SKUs against a 3,604-SKU catalog.
