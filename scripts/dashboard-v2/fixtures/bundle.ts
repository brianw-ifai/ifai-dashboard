import type {
  ActionItemRow,
  EstimateInputRow,
  EstimateRow,
  ListingCurrentRow,
  MetricRegistryRow,
  MetricValueRow,
  ReadResult,
  ReadingFreshnessRow,
  ReadingRunRow,
  SandboxBundle,
} from "@/lib/dashboard-v2/data/types";

/**
 * A fixture SandboxBundle whose figures match docs/v2/04-expected-readings.md and
 * docs/v2/05-sandbox-load.md as the sandbox held them on 2026-10-08. Test data only: the
 * dashboard never reads this file.
 */

export const CLIENT_ID = "cl_fender";
const key = (id: string) => `${CLIENT_ID}:${id}`;

export const RUN_IDS = {
  catalog: "a0000000-0000-4000-8000-000000000001",
  seller: "a0000000-0000-4000-8000-000000000002",
  benchmark: "a0000000-0000-4000-8000-000000000003",
  walmart: "a0000000-0000-4000-8000-000000000004",
  musiciansfriend: "a0000000-0000-4000-8000-000000000005",
  spec: "a0000000-0000-4000-8000-000000000006",
  ai: "bfcb5d4b-d07b-47c9-a1da-7d5b80b206fe",
} as const;

export const AS_OF = {
  catalog: "2026-10-08T20:30:37.844Z",
  seller: "2026-10-08T19:00:30.825Z",
  benchmark: "2026-10-08T19:41:11.225Z",
  walmart: "2026-10-08T19:51:48.374Z",
  musiciansfriend: "2026-10-08T19:39:00.667Z",
  spec: "2026-10-08T20:03:05.716Z",
  ai: "2026-10-05T16:26:36.811Z",
} as const;

const COMPUTED_AT = "2026-10-08T20:46:47.499Z";

function ok<T>(rows: T[]): ReadResult<T> {
  return { rows, error: null, asOf: COMPUTED_AT };
}

function failed<T>(error: string): ReadResult<T> {
  return { rows: [], error, asOf: COMPUTED_AT };
}

function run(
  id: string,
  source: string,
  workflow: string,
  started: string,
  finished: string,
  status: "complete" | "partial",
  population: number,
  read: number,
  findings: number | null = null,
  trigger = "backfill",
): ReadingRunRow {
  return {
    reading_run_id: id,
    client_id: CLIENT_ID,
    source,
    workflow_name: workflow,
    workflow_execution_id: `${trigger}_${source}_fixture`,
    trigger_type: trigger,
    started_at: started,
    finished_at: finished,
    status,
    population_count: population,
    rows_read: read,
    findings_count: findings,
    legacy_run_key: null,
  };
}

export const RUNS: ReadingRunRow[] = [
  run(RUN_IDS.catalog, "keepa_product", "fender_catalog_harvester", "2026-09-29T12:17:14Z", AS_OF.catalog, "complete", 3604, 3604),
  run(RUN_IDS.seller, "keepa_seller", "fender_buybox_seller_harvester", "2026-10-08T03:30:17Z", AS_OF.seller, "partial", 1007, 940),
  run(RUN_IDS.benchmark, "keepa_product", "fender_omnichannel_audit_sync", "2026-10-05T13:41:12Z", AS_OF.benchmark, "partial", 1007, 438, 48),
  run(RUN_IDS.walmart, "walmart_price", "fender_retail_buybox_map_audit", "2026-10-07T22:51:40Z", AS_OF.walmart, "partial", 1036, 1033),
  run(RUN_IDS.musiciansfriend, "musiciansfriend_price", "fender_map_checker_musiciansfriend", "2026-10-05T14:56:44Z", AS_OF.musiciansfriend, "partial", 598, 341),
  run(RUN_IDS.spec, "spec_check", "fender_spec_readiness_audit", "2026-09-29T19:18:19Z", AS_OF.spec, "partial", 960, 947),
  run(RUN_IDS.ai, "ai_battery", "fender_ai_simulation_battery_real", AS_OF.ai, AS_OF.ai, "complete", 3, 3, 0, "manual"),
];

function reg(
  registry_id: string,
  name: string,
  meaning: string,
  unit: string,
  population: string | null,
  formula: string | null,
  source_tables: string[],
  owner: string,
  confidence: string,
  status_rule: MetricRegistryRow["status_rule"],
  notes: string | null = null,
): MetricRegistryRow {
  return { registry_key: key(registry_id), client_id: CLIENT_ID, registry_id, name, meaning, unit, population, formula, source_tables, owner, confidence, status_rule, notes };
}

export const REGISTRY: MetricRegistryRow[] = [
  reg("action_items_open", "Open action items", "Stored actions that are not done, each tied to a registry row.", "count", "Action rows with status other than done.", "count(*)", ["action_item"], "mixed", "measured", { kind: "count_is_bad", warn: 5, danger: 20 }),
  reg("ai_answer_share", "AI answer share", "Of the AI answers that named a brand, how often it was Fender or Squier.", "percent", "Every answer in the simulation battery, all runs, where the scorer resolved a brand. Unclear answers and errors are excluded.", "fender_wins / resolved_answers", ["ai_answer"], "intofocus", "measured", { kind: "higher_is_better", warn: 80, danger: 65 }, "Keyword scorer: an answer counts as a Fender win when it mentions Fender terms at least as often as rival names."),
  reg("ai_answer_share_by_category", "Weakest category", "The prompt category where Fender is named least, and the rival named most there.", "percent", "Resolved answers per category; categories with fewer than 10 resolved answers are not ranked; the hallucinations category is excluded because its prompts name Fender products.", "per category: fender_wins / resolved; gap = fender share minus top rival share", ["ai_answer"], "intofocus", "measured", { kind: "higher_is_better", warn: 70, danger: 50 }),
  reg("ai_answer_share_by_engine", "Share by engine", "AI answer share split by ChatGPT, Perplexity, and Gemini.", "percent", "All answers. The engine comes from the stored engine column, or from the engine tag the battery appends to every prompt and encodes in the sim id.", "per engine: fender_wins / resolved", ["ai_answer"], "intofocus", "measured", null, "The stored engine column covers 114 answers; the prompt tag and sim id cover every answer, and the two agree on all 114."),
  reg("ai_battery_freshness", "Last AI read", "When the simulation battery last wrote an answer.", "timestamp", "All answers.", "max(answered_at)", ["ai_answer"], "intofocus", "measured", null),
  reg("ai_wrong_spec_flags", "Answers flagged for a wrong spec", "Answers that stated a product fact the rule set knows is false.", "count", "All answers, all runs.", "count(flag)", ["ai_answer"], "intofocus", "measured", { kind: "count_is_bad", warn: 1, danger: 50 }, "Four fixed text rules; each flag carries the rule text as its reason."),
  reg("amazon_offer_share", "Amazon Retail share of Featured Offers", "Share of active offers where Amazon Retail holds the Featured Offer. A drill-down fact for a Partner-led brand, not the headline.", "percent", "Active offers. Rows with no active offer are excluded.", "amazon / active offers", ["listing_offer_reading"], "intofocus", "measured", null),
  reg("bundle_share", "Partner bundles", "Active offers whose title marks a bundle, kit, pack, or combo.", "percent", "Active offers.", "count(is_bundle) / active", ["listing"], "intofocus", "measured", null, "Title pattern."),
  reg("catalog_by_category", "Listings by category", "Listings grouped by the retailer category.", "count", "All listings for the client.", "count by category", ["listing"], "intofocus", "measured", null, "The six authored division names from 2026-09-29 are retired."),
  reg("catalog_monitored", "Monitored ASINs", "ASINs in the monitored catalog, and how many have an active Amazon offer.", "count", "All listings for the client.", "count(*); count(active)", ["listing"], "intofocus", "measured", null),
  reg("channel_price_coverage", "Outside prices on file", "How many active listings have a stored price at each outside retailer.", "count", "Active offers per channel.", "counts per channel", ["listing_channel_price"], "intofocus", "measured", null),
  reg("ecommerce_to_ai_link", "Ecommerce cause of the AI result", "The claim that listing control and product-data gaps change which brand an assistant names.", "none", "Not defined.", "not defined", [], "intofocus", "assumption", null, "No stored reading links one listing's gap to one answer."),
  reg("estimate_enterprise_range", "Enterprise uplift range", "The figure the current dashboard shows as $38M to $62M.", "usd", "Not defined until inputs exist.", "sum of four stored lines, low and high", ["estimate", "estimate_input"], "coo", "estimate", null, "Three documents disagree on the value."),
  reg("estimate_phase1_uplift", "Phase 1 uplift", "The annual uplift figure the current dashboard shows as $680K.", "usd", "Not defined until inputs exist.", "buybox_recapture + ai_dtc_conversions + reduced_returns + review_synergy", ["estimate", "estimate_input"], "coo", "estimate", null, "Formula shape stored; no input values stored."),
  reg("featured_offer_present", "Featured Offer present", "Listings where Amazon shows a Featured Offer.", "count", "Active offers with a Featured Offer reading.", "count(withheld = false) / read", ["listing_offer_reading"], "intofocus", "measured", { kind: "higher_is_better", warn: 95, danger: 85 }),
  reg("featured_offer_suppressed", "Featured Offer withheld above Amazon's outside benchmark", "Listings where Amazon shows no Featured Offer and the offer, including shipping, is above the Competitive External Price.", "count", "Active offers with a benchmark reading.", "withheld = true AND offer_cents > benchmark_cents", ["listing_offer_reading"], "intofocus", "measured", { kind: "count_is_bad", warn: 1, danger: 10 }, "Keepa competitivePriceThreshold and buyBoxIsUnqualified."),
  reg("map_below", "Offers below MAP", "Listings priced under the client's minimum advertised price on any channel.", "count", "Active offers with a stored MAP.", "offer < map_price, per channel", ["listing_channel_price", "listing_map_price"], "client", "measured", null, "Unavailable until a MAP sheet is stored. The Keepa list price was removed as a MAP stand-in on 2026-10-08."),
  reg("price_gap_above_benchmark", "Price gap on suppressed listings", "Dollars by which suppressed offers sit above Amazon's outside benchmark, summed. A price gap, not revenue.", "usd", "Suppressed listings.", "sum(offer_price - benchmark_cents / 100)", ["listing_offer_reading"], "intofocus", "measured", null),
  reg("reading_freshness", "As-of per reading", "One timestamp per source.", "timestamp", "All reading runs.", "max(finished_at) per source", ["reading_run"], "intofocus", "measured", null),
  reg("retail_control_partner_led", "Healthy Featured Offer, authorized seller", "Share of active Amazon listings where a Featured Offer is present and the seller holding it is on the client's authorized list.", "percent", "Active offers.", "count(featured offer present AND seller authorized) / active offers", ["listing_offer_reading", "seller_authorization"], "client", "measured", null, "Unavailable until the client's authorized-seller list is stored."),
  reg("seller_mix", "Who holds the Featured Offer", "Amazon Retail, a confirmed third-party seller, or not yet read.", "count", "Active offers.", "counts by seller class", ["listing_offer_reading", "seller"], "intofocus", "measured", null),
  reg("seller_read_coverage", "Seller read coverage", "How much of the active catalog has a seller reading.", "percent", "Active offers.", "read / active", ["listing_offer_reading"], "intofocus", "measured", { kind: "higher_is_better", warn: 98, danger: 90 }),
  reg("spec_additional_property_missing", "Pages missing additionalProperty", "Found fender.com pages whose JSON-LD has no additionalProperty block.", "count", "Found pages.", "missing / found", ["spec_reading"], "intofocus", "measured", { kind: "count_is_bad", warn: 1, danger: 20 }),
  reg("spec_amazon_completeness", "Amazon attribute completeness", "Average share of 13 Amazon product-detail fields that are filled.", "percent", "Checked SKUs.", "avg(found / 13)", ["spec_reading"], "intofocus", "measured", { kind: "higher_is_better", warn: 92, danger: 85 }),
  reg("spec_fender_page_found", "fender.com page found", "Checked SKUs for which site search found a fender.com product page.", "percent", "SKUs with a known Buy Box seller, checked in hourly batches.", "found / checked", ["spec_reading"], "intofocus", "measured", { kind: "higher_is_better", warn: 50, danger: 25 }),
];

function mv(
  registry_id: string,
  reading_run_id: string | null,
  numeric_value: number | null,
  numerator: number | null,
  denominator: number | null,
  dimension: { name: string; value: string } | null = null,
): MetricValueRow {
  const suffix = dimension ? `:${dimension.name}=${dimension.value}` : "";
  return {
    metric_value_id: `${key(registry_id)}${suffix}`,
    client_id: CLIENT_ID,
    registry_key: key(registry_id),
    reading_run_id,
    computed_at: COMPUTED_AT,
    dimension_name: dimension?.name ?? null,
    dimension_value: dimension?.value ?? null,
    numeric_value,
    numerator,
    denominator,
  };
}

const CATEGORY_SHARES: Array<[string, number, number, number, string, number, number]> = [
  // category, wins, resolved, pct, top rival, rival wins, rival pct
  ["acoustics", 359, 570, 62.98, "Taylor", 157, 27.54],
  ["amps", 454, 475, 95.58, "Yamaha", 11, 2.32],
  ["basses", 340, 446, 76.23, "Yamaha", 89, 19.96],
  ["beginner", 168, 287, 58.54, "Yamaha", 111, 38.68],
  ["electrics", 866, 1062, 81.54, "PRS", 110, 10.36],
  ["squier", 435, 458, 94.98, "Yamaha", 22, 4.8],
];

export const METRIC_VALUES: MetricValueRow[] = [
  mv("action_items_open", null, 54, 54, 54),
  mv("ai_answer_share", RUN_IDS.ai, 82.6, 3209, 3885),
  ...CATEGORY_SHARES.flatMap(([category, wins, resolved, pct, rival, rivalWins, rivalPct]) => [
    mv("ai_answer_share_by_category", RUN_IDS.ai, pct, wins, resolved, { name: "category", value: category }),
    mv("ai_answer_share_by_category", RUN_IDS.ai, rivalPct, rivalWins, resolved, { name: "category_top_rival", value: `${category}:${rival}` }),
  ]),
  mv("ai_answer_share_by_engine", RUN_IDS.ai, 82.04, 1046, 1275, { name: "engine", value: "chatgpt" }),
  mv("ai_answer_share_by_engine", RUN_IDS.ai, 80.65, 1113, 1380, { name: "engine", value: "gemini" }),
  mv("ai_answer_share_by_engine", RUN_IDS.ai, 85.37, 1050, 1230, { name: "engine", value: "perplexity" }),
  mv("ai_wrong_spec_flags", RUN_IDS.ai, 222, 222, 4287),
  mv("amazon_offer_share", RUN_IDS.seller, 5.46, 55, 1007),
  mv("bundle_share", RUN_IDS.catalog, 39.62, 399, 1007),
  mv("catalog_by_category", RUN_IDS.catalog, 3202, null, null, { name: "category", value: "Solid Body" }),
  mv("catalog_by_category", RUN_IDS.catalog, 223, null, null, { name: "category", value: "Electric Guitar Kits" }),
  mv("catalog_by_category", RUN_IDS.catalog, 109, null, null, { name: "category", value: "Electric Guitars" }),
  mv("catalog_by_category", RUN_IDS.catalog, 68, null, null, { name: "category", value: "Hollow & Semi-Hollow Body" }),
  mv("catalog_by_category", RUN_IDS.catalog, 1, null, null, { name: "category", value: "Bags, Cases & Covers" }),
  mv("catalog_by_category", RUN_IDS.catalog, 1, null, null, { name: "category", value: "Tuning Pegs" }),
  mv("catalog_monitored", RUN_IDS.catalog, 3604, null, null),
  mv("catalog_monitored", RUN_IDS.catalog, 1007, null, null, { name: "offer_status", value: "active" }),
  mv("channel_price_coverage", RUN_IDS.benchmark, 1036, 1036, 1036, { name: "channel", value: "amazon" }),
  mv("channel_price_coverage", RUN_IDS.musiciansfriend, 306, 306, 341, { name: "channel", value: "musiciansfriend" }),
  mv("channel_price_coverage", RUN_IDS.walmart, 116, 116, 1033, { name: "channel", value: "walmart" }),
  mv("featured_offer_present", RUN_IDS.benchmark, 945, 945, 1015),
  mv("featured_offer_suppressed", RUN_IDS.benchmark, 48, 48, 438),
  mv("price_gap_above_benchmark", RUN_IDS.benchmark, 10667.03, 48, null),
  mv("seller_mix", RUN_IDS.seller, 55, null, null, { name: "seller_class", value: "amazon_retail" }),
  mv("seller_mix", RUN_IDS.seller, 67, null, null, { name: "seller_class", value: "not_read" }),
  mv("seller_mix", RUN_IDS.seller, 885, null, null, { name: "seller_class", value: "third_party" }),
  mv("seller_read_coverage", RUN_IDS.seller, 93.35, 940, 1007),
  mv("spec_additional_property_missing", RUN_IDS.spec, 141, 141, 141),
  mv("spec_amazon_completeness", RUN_IDS.spec, 91.46, 11260, 12311),
  mv("spec_fender_page_found", RUN_IDS.spec, 14.89, 141, 947),
];

export const ESTIMATES: EstimateRow[] = [
  {
    estimate_id: "est_phase1",
    client_id: CLIENT_ID,
    registry_key: key("estimate_phase1_uplift"),
    name: "Phase 1 uplift",
    formula: "buybox_recapture + ai_dtc_conversions + reduced_returns + review_synergy",
    unit: "usd",
    low_value: null,
    high_value: null,
    owner: "coo",
    confidence: "estimate",
    as_of: "2026-10-08",
  },
  {
    estimate_id: "est_enterprise",
    client_id: CLIENT_ID,
    registry_key: key("estimate_enterprise_range"),
    name: "Enterprise uplift range",
    formula: "sum of four stored lines, low and high",
    unit: "usd",
    low_value: null,
    high_value: null,
    owner: "coo",
    confidence: "estimate",
    as_of: "2026-10-08",
  },
];

/** 48 suppressed listings whose gaps sum to 10,667.03 with min 5.92 and max 1,215.67. */
const GAP_CENTS: number[] = [592, 121567, ...Array.from({ length: 44 }, () => 20000), 32272, 32272];

function asinFor(index: number): string {
  return `B0FIX${String(index).padStart(5, "0")}`;
}

export const SUPPRESSED_LISTINGS: ListingCurrentRow[] = GAP_CENTS.map((gap, index) => {
  const asin = asinFor(index);
  const benchmarkCents = 50000 + index * 100;
  const offerCents = benchmarkCents + gap;
  return {
    listing_id: `lst_${asin}`,
    client_id: CLIENT_ID,
    asin,
    title: `Fixture listing ${index}`,
    brand: "Fender",
    category: "Solid Body",
    is_bundle: false,
    url: `https://www.amazon.com/dp/${asin}`,
    catalog_run_id: RUN_IDS.catalog,
    catalog_read_at: AS_OF.catalog,
    offer_status: "active",
    listed_price: offerCents / 100,
    seller_run_id: RUN_IDS.seller,
    seller_read_at: AS_OF.seller,
    seller_class: "third_party",
    featured_offer_seller_id: "SELLER1",
    featured_offer_seller_name: "Fixture Music",
    benchmark_reading_id: `lor_${asin}_r3`,
    benchmark_run_id: RUN_IDS.benchmark,
    benchmark_read_at: AS_OF.benchmark,
    featured_offer_withheld: true,
    offer_price: offerCents / 100,
    offer_price_cents: offerCents,
    competitive_external_price_cents: benchmarkCents,
    legacy_status: "Unknown/Not Harvested",
    suppressed: true,
    walmart_price: null,
    walmart_url: null,
    walmart_checked_at: null,
    musiciansfriend_price: index < 19 ? benchmarkCents / 100 : null,
    musiciansfriend_url: null,
    musiciansfriend_checked_at: index < 19 ? "2026-10-06T08:37:00Z" : null,
    benchmark_match_channels: index < 19 ? ["musiciansfriend"] : null,
  };
});

/** Two listings that are not suppressed, so the lines must leave them out. */
export const OTHER_LISTINGS: ListingCurrentRow[] = [
  { ...SUPPRESSED_LISTINGS[0], listing_id: "lst_B0FIXPRESENT", asin: "B0FIXPRESENT", featured_offer_withheld: false, suppressed: false, offer_price_cents: 40000, offer_price: 400, competitive_external_price_cents: 40000 },
  { ...SUPPRESSED_LISTINGS[0], listing_id: "lst_B0FIXNOOFFER", asin: "B0FIXNOOFFER", offer_status: "no_offer", suppressed: false, featured_offer_withheld: null, offer_price_cents: null, offer_price: null, competitive_external_price_cents: null },
];

export const LISTINGS: ListingCurrentRow[] = [...SUPPRESSED_LISTINGS, ...OTHER_LISTINGS];

export const ACTIONS: ActionItemRow[] = [
  ...SUPPRESSED_LISTINGS.map((row) => ({
    action_item_id: `act_suppressed_${row.asin}`,
    client_id: CLIENT_ID,
    registry_key: key("featured_offer_suppressed"),
    finding_ref: row.benchmark_reading_id,
    listing_id: row.listing_id,
    title: `Match the outside price or correct the outside listing for ${row.asin}`,
    owner: "client",
    status: "open",
    severity: "high",
    created_at: COMPUTED_AT,
    updated_at: COMPUTED_AT,
    due_date: null,
  })),
  { action_item_id: "act_authorized_seller_list", client_id: CLIENT_ID, registry_key: key("retail_control_partner_led"), finding_ref: null, listing_id: null, title: "Supply the authorized-seller list", owner: "client", status: "open", severity: "high", created_at: COMPUTED_AT, updated_at: COMPUTED_AT, due_date: null },
  { action_item_id: "act_map_sheet", client_id: CLIENT_ID, registry_key: key("map_below"), finding_ref: null, listing_id: null, title: "Supply a MAP sheet", owner: "client", status: "open", severity: "medium", created_at: COMPUTED_AT, updated_at: COMPUTED_AT, due_date: null },
  { action_item_id: "act_additional_property", client_id: CLIENT_ID, registry_key: key("spec_additional_property_missing"), finding_ref: null, listing_id: null, title: "Add additionalProperty to 141 found fender.com pages", owner: "intofocus", status: "open", severity: "medium", created_at: COMPUTED_AT, updated_at: COMPUTED_AT, due_date: null },
  { action_item_id: "act_seller_read", client_id: CLIENT_ID, registry_key: key("seller_read_coverage"), finding_ref: null, listing_id: null, title: "Finish the seller read for 67 active offers", owner: "intofocus", status: "open", severity: "medium", created_at: COMPUTED_AT, updated_at: COMPUTED_AT, due_date: null },
  { action_item_id: "act_phase1_inputs", client_id: CLIENT_ID, registry_key: key("estimate_phase1_uplift"), finding_ref: null, listing_id: null, title: "Supply the Phase 1 uplift inputs (COO)", owner: "intofocus", status: "open", severity: "medium", created_at: COMPUTED_AT, updated_at: COMPUTED_AT, due_date: null },
  { action_item_id: "act_enterprise_inputs", client_id: CLIENT_ID, registry_key: key("estimate_enterprise_range"), finding_ref: null, listing_id: null, title: "Supply the enterprise range inputs (COO)", owner: "intofocus", status: "open", severity: "medium", created_at: COMPUTED_AT, updated_at: COMPUTED_AT, due_date: null },
];

export const FRESHNESS: ReadingFreshnessRow[] = RUNS.map((r) => ({
  client_id: CLIENT_ID,
  source: r.source,
  reading_run_id: r.reading_run_id,
  workflow_name: r.workflow_name,
  trigger_type: r.trigger_type,
  started_at: r.started_at,
  finished_at: r.finished_at,
  status: r.status,
  rows_read: r.rows_read,
  population_count: r.population_count,
  findings_count: r.findings_count,
  legacy_run_key: r.legacy_run_key,
}));

export function fixtureBundle(): SandboxBundle {
  return {
    clientId: CLIENT_ID,
    loadedAt: COMPUTED_AT,
    client: ok([
      {
        client_id: CLIENT_ID,
        name: "Fender",
        slug: "fender",
        seller_type: "partner_led",
        brand_site_domain: "fender.com",
        is_active: true,
        onboarded_at: "2026-10-01T15:14:05Z",
        updated_at: COMPUTED_AT,
        seller_type_row: {
          seller_type: "partner_led",
          label: "Partner-led",
          primary_retail_question: "Does an authorized seller hold a healthy Featured Offer on each active listing?",
          description: "Authorized resellers sell the brand on Amazon; the brand doesn't sell there itself.",
        },
      },
    ]),
    registry: ok(REGISTRY.map((r) => ({ ...r }))),
    metricValues: ok(METRIC_VALUES.map((r) => ({ ...r }))),
    runs: ok(RUNS.map((r) => ({ ...r }))),
    aiBattery: ok([{ runCount: 522 }]),
    estimates: ok(ESTIMATES.map((r) => ({ ...r }))),
    estimateInputs: ok<EstimateInputRow>([]),
    actions: ok(ACTIONS.map((r) => ({ ...r }))),
    freshness: ok(FRESHNESS.map((r) => ({ ...r }))),
  };
}

/** No metric_value row for featured_offer_suppressed: the reading must be unavailable, never 0. */
export function bundleWithoutSuppressedValue(): SandboxBundle {
  const bundle = fixtureBundle();
  bundle.metricValues = ok(bundle.metricValues.rows.filter((r) => r.registry_key !== key("featured_offer_suppressed")));
  return bundle;
}

/** A stored zero with a complete run behind it: the reading is complete and renders "0". */
export function bundleWithStoredZero(): SandboxBundle {
  const bundle = fixtureBundle();
  bundle.runs = ok(
    bundle.runs.rows.map((r) =>
      r.reading_run_id === RUN_IDS.benchmark ? { ...r, status: "complete", rows_read: 1007, findings_count: 0 } : r,
    ),
  );
  bundle.metricValues = ok(
    bundle.metricValues.rows.map((r) =>
      r.registry_key === key("featured_offer_suppressed") ? { ...r, numeric_value: 0, numerator: 0, denominator: 1007 } : r,
    ),
  );
  return bundle;
}

export const LISTINGS_READ_ERROR = "v_listing_current: forced failure for the failed-read test";

/**
 * The listing-derived metric values failed to read. Every metric reading built from them is
 * unavailable; the action and run parts stay usable.
 */
export function bundleWithListingsError(): SandboxBundle {
  const bundle = fixtureBundle();
  bundle.metricValues = failed(LISTINGS_READ_ERROR);
  return bundle;
}

/**
 * Two stored rows disagree for ai_answer_share (a stale duplicate with other numbers, and a
 * numeric_value that does not equal numerator over denominator). Every surface must still show
 * the one figure the selector picks.
 */
export function bundleWithConflict(): SandboxBundle {
  const bundle = fixtureBundle();
  const stale: MetricValueRow = {
    ...mv("ai_answer_share", RUN_IDS.ai, 79.1, 3100, 3920),
    metric_value_id: `${key("ai_answer_share")}:stale`,
    computed_at: "2026-10-07T20:00:00Z",
  };
  bundle.metricValues = ok([
    ...bundle.metricValues.rows.map((r) => (r.metric_value_id === key("ai_answer_share") ? { ...r, numeric_value: 81.9 } : r)),
    stale,
  ]);
  return bundle;
}
