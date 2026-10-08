/**
 * Row shapes for the sandbox schema (docs/v2/schema/ifai-dashboard-v2.schema.json and
 * supabase/sandbox-migrations/0004_sandbox_views.sql). Column names match the database.
 * Plain data only: this file is shared by server reads, selectors, client tables, and tests.
 */

export type SellerTypeRow = {
  seller_type: string;
  label: string;
  primary_retail_question: string;
  description: string | null;
};

export type ClientRow = {
  client_id: string;
  name: string;
  slug: string;
  seller_type: string;
  brand_site_domain: string | null;
  is_active: boolean;
  onboarded_at: string | null;
  updated_at: string | null;
  /** Joined seller_type row. Null when the join returned nothing. */
  seller_type_row: SellerTypeRow | null;
};

export type StatusRule = {
  kind: "higher_is_better" | "lower_is_better" | "count_is_bad";
  warn: number;
  danger: number;
};

export type MetricRegistryRow = {
  registry_key: string;
  client_id: string;
  registry_id: string;
  name: string;
  meaning: string;
  unit: string;
  population: string | null;
  formula: string | null;
  source_tables: string[] | null;
  owner: string;
  confidence: string;
  status_rule: StatusRule | null;
  notes: string | null;
};

export type MetricValueRow = {
  metric_value_id: string;
  client_id: string;
  registry_key: string;
  reading_run_id: string | null;
  computed_at: string;
  dimension_name: string | null;
  dimension_value: string | null;
  numeric_value: number | null;
  numerator: number | null;
  denominator: number | null;
};

export type ReadingRunRow = {
  reading_run_id: string;
  client_id: string;
  source: string;
  workflow_name: string | null;
  workflow_execution_id: string | null;
  trigger_type: string | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  population_count: number;
  rows_read: number;
  findings_count: number | null;
  legacy_run_key: string | null;
};

export type ReadingFreshnessRow = {
  client_id: string;
  source: string;
  reading_run_id: string;
  workflow_name: string | null;
  trigger_type: string | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  rows_read: number;
  population_count: number;
  findings_count: number | null;
  legacy_run_key: string | null;
};

export type EstimateRow = {
  estimate_id: string;
  client_id: string;
  registry_key: string;
  name: string;
  formula: string;
  unit: string;
  low_value: number | null;
  high_value: number | null;
  owner: string;
  confidence: string;
  as_of: string;
};

export type EstimateInputRow = {
  estimate_input_id: string;
  client_id: string;
  estimate_id: string;
  input_key: string;
  value: number;
  unit: string;
  source: string;
  as_of: string;
  owner: string;
  confidence: string;
};

export type ActionItemRow = {
  action_item_id: string;
  client_id: string;
  registry_key: string | null;
  finding_ref: string | null;
  listing_id: string | null;
  title: string;
  owner: string;
  status: string;
  severity: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
};

/** One row of sandbox.v_listing_current. */
export type ListingCurrentRow = {
  listing_id: string;
  client_id: string;
  asin: string;
  title: string | null;
  brand: string | null;
  category: string | null;
  is_bundle: boolean;
  url: string | null;
  catalog_run_id: string | null;
  catalog_read_at: string | null;
  offer_status: string | null;
  listed_price: number | null;
  seller_run_id: string | null;
  seller_read_at: string | null;
  seller_class: string | null;
  featured_offer_seller_id: string | null;
  featured_offer_seller_name: string | null;
  benchmark_reading_id: string | null;
  benchmark_run_id: string | null;
  benchmark_read_at: string | null;
  featured_offer_withheld: boolean | null;
  offer_price: number | null;
  offer_price_cents: number | null;
  competitive_external_price_cents: number | null;
  legacy_status: string | null;
  suppressed: boolean | null;
  walmart_price: number | null;
  walmart_url: string | null;
  walmart_checked_at: string | null;
  musiciansfriend_price: number | null;
  musiciansfriend_url: string | null;
  musiciansfriend_checked_at: string | null;
  benchmark_match_channels: string[] | null;
};

export type ListingChannelPriceRow = {
  listing_channel_price_id: string;
  client_id: string;
  listing_id: string;
  reading_run_id: string;
  read_at: string;
  channel: string;
  match_status: string;
  price: number | null;
  price_cents: number | null;
  url: string | null;
  checked_at: string;
  store_title: string | null;
  store_seller_name: string | null;
};

/** One row of sandbox.v_spec_current. */
export type SpecCurrentRow = {
  spec_reading_id: string;
  client_id: string;
  listing_id: string;
  asin: string;
  title: string | null;
  category: string | null;
  reading_run_id: string;
  read_at: string;
  amazon_checked: boolean;
  amazon_fields_found: number | null;
  amazon_fields_expected: number | null;
  amazon_missing_fields: string[] | null;
  brand_site_page_found: boolean;
  brand_site_url: string | null;
  brand_site_fields_found: number | null;
  brand_site_fields_expected: number | null;
  brand_site_missing_fields: string[] | null;
  additional_property_present: boolean | null;
  amazon_completeness_pct: number | null;
};

/** The columns of sandbox.v_ai_answer_detail the dashboard reads (answer_text is left out). */
export type AiAnswerDetailRow = {
  ai_answer_id: string;
  client_id: string;
  reading_run_id: string;
  run_finished_at: string | null;
  run_status: string | null;
  ai_prompt_id: string;
  category: string;
  prompt_text: string;
  names_client_product: boolean;
  answered_at: string;
  engine: string;
  repeat_no: number;
  outcome: string;
  winner_brand_id: string | null;
  winner_brand_name: string | null;
  client_brand_won: boolean;
  wrong_spec_flag: boolean;
  wrong_spec_reason: string | null;
  citation_urls: string[] | null;
};

/**
 * One read. `error` is null when the read worked. When it is set, `rows` is empty and the
 * caller renders the unavailable state; nothing throws into a page.
 */
export type ReadResult<T> = {
  rows: T[];
  error: string | null;
  /** When the read finished, ISO. The reading's own as-of lives on its run, not here. */
  asOf: string;
};

/** A paged read adds the page it served and whether another page exists. */
export type PagedReadResult<T> = ReadResult<T> & {
  page: number;
  pageSize: number;
  nextPage: number | null;
};

export type AiBatterySummary = {
  runCount: number;
};

/**
 * Everything the page loads in one pass. Each part is its own ReadResult so one failed read
 * leaves the others usable.
 */
export type SandboxBundle = {
  clientId: string;
  loadedAt: string;
  client: ReadResult<ClientRow>;
  registry: ReadResult<MetricRegistryRow>;
  metricValues: ReadResult<MetricValueRow>;
  /** Every backfill run plus the latest ai_battery run. */
  runs: ReadResult<ReadingRunRow>;
  aiBattery: ReadResult<AiBatterySummary>;
  estimates: ReadResult<EstimateRow>;
  estimateInputs: ReadResult<EstimateInputRow>;
  actions: ReadResult<ActionItemRow>;
  freshness: ReadResult<ReadingFreshnessRow>;
};

export const BUNDLE_PARTS = [
  "client",
  "registry",
  "metricValues",
  "runs",
  "aiBattery",
  "estimates",
  "estimateInputs",
  "actions",
  "freshness",
] as const;

export type BundlePartName = (typeof BUNDLE_PARTS)[number];

/** True when every part failed, so the page has nothing to show. */
export function bundleFailed(bundle: SandboxBundle): boolean {
  return BUNDLE_PARTS.every((part) => bundle[part].error !== null);
}

/** The distinct error messages across the parts, for the unavailable page. */
export function bundleErrors(bundle: SandboxBundle): string[] {
  const seen = new Set<string>();
  for (const part of BUNDLE_PARTS) {
    const error = bundle[part].error;
    if (error) seen.add(error);
  }
  return [...seen];
}
