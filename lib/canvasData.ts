import { getCanvasSupabase } from "@/lib/supabase/canvas-client";
import { SUPPRESSED_LISTING_COLUMNS } from "@/lib/fender-canvas/suppressed-listings";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

export async function loadCanvas(): Promise<CanvasBundle> {
  const supabase = getCanvasSupabase();
  const [metrics, cats, engines, sov, divisions, missing, fresh] = await Promise.all([
    supabase.from("canvas_metrics").select("*").single(),
    supabase.from("canvas_ai_category").select("*").order("fender_win_pct"),
    supabase.from("canvas_ai_engine").select("*"),
    supabase
      .from("canvas_competitor_sov")
      .select("*")
      .order("wins", { ascending: false }),
    supabase
      .from("canvas_divisions")
      .select("*")
      .order("monitored_skus", { ascending: false }),
    supabase
      .from("canvas_spec_missing_fields")
      .select("*")
      .order("sku_count", { ascending: false }),
    supabase.from("canvas_freshness").select("*"),
  ]);

  const err = [metrics, cats, engines, sov, divisions, missing, fresh].find((r) => r.error);
  if (err?.error) throw err.error;

  return {
    m: metrics.data as CanvasBundle["m"],
    cats: (cats.data ?? []) as CanvasBundle["cats"],
    engines: (engines.data ?? []) as CanvasBundle["engines"],
    sov: (sov.data ?? []) as CanvasBundle["sov"],
    divisions: (divisions.data ?? []) as CanvasBundle["divisions"],
    missing: (missing.data ?? []) as CanvasBundle["missing"],
    fresh: (fresh.data ?? []) as CanvasBundle["fresh"],
  };
}

/**
 * Retail listings for the panel tables.
 * `offAmazonPriceOnly` keeps rows with a stored Walmart or Musician's Friend price above zero.
 * There is no below-MAP filter: `is_map_violation` compares a retailer price with Amazon's own
 * stored list price, which is not Fender's minimum advertised price.
 */
export function listingsQuery(
  page = 0,
  size = 50,
  filter?: { status?: string; offAmazonPriceOnly?: boolean; bundlesOnly?: boolean },
) {
  const supabase = getCanvasSupabase();
  let q = supabase
    .from("canvas_retail_listings")
    .select("*", { count: "exact" })
    .order("asin")
    .range(page * size, page * size + size - 1);
  if (filter?.status) q = q.eq("buybox_status", filter.status);
  if (filter?.offAmazonPriceOnly) q = q.or("wmt_price.gt.0,mf_price.gt.0");
  if (filter?.bundlesOnly) q = q.eq("is_bundle", true);
  return q;
}

/**
 * Head count of the retail listing read.
 * `storedWalmartPrice` keeps rows whose Walmart price is greater than zero.
 * A null or non-positive price is not in that count.
 */
export function retailListingHeadCountQuery(options?: { storedWalmartPrice?: boolean }) {
  const supabase = getCanvasSupabase();
  let query = supabase
    .from("canvas_retail_listings")
    .select("asin", { count: "exact", head: true });
  if (options?.storedWalmartPrice) query = query.gt("wmt_price", 0);
  return query;
}

/** Other retailers' stored prices. One row per listing per channel. */
export function listingChannelPricesQuery(page = 0, size = 1000) {
  const supabase = getCanvasSupabase();
  return supabase
    .from("canvas_listing_channel_price")
    .select("asin,channel,price,url,checked_at")
    .order("channel")
    .order("asin")
    .range(page * size, page * size + size - 1);
}

/**
 * One existing row, so a missing Competitive External Price column stays a normal
 * listing read instead of a filtered request for a column the view does not have yet.
 */
export async function competitivePriceColumnProbe(): Promise<{
  present: boolean;
  error: { message: string } | null;
}> {
  const supabase = getCanvasSupabase();
  const { data, error } = await supabase.from("canvas_retail_listings").select("*").limit(1);
  if (error) return { present: false, error };
  const sample = (data ?? [])[0] as Record<string, unknown> | undefined;
  return { present: sample != null && "competitive_price_threshold_cents" in sample, error: null };
}

/** Listings whose stored offer is above the Competitive External Price with no Featured Offer. */
export function suppressedListingsQuery(page = 0, size = 1000) {
  const supabase = getCanvasSupabase();
  return supabase
    .from("canvas_retail_listings")
    .select(SUPPRESSED_LISTING_COLUMNS, { count: "exact" })
    .eq("competitive_offer_suppressed", true)
    .order("asin")
    .range(page * size, page * size + size - 1);
}

/** Positive Competitive External Price values already written. Zero means the reading is not stored yet. */
export function competitivePriceReadingCountQuery() {
  const supabase = getCanvasSupabase();
  return supabase
    .from("canvas_retail_listings")
    .select("asin", { count: "exact", head: true })
    .gt("competitive_price_threshold_cents", 0);
}

/** Flagged simulation rows, including stored root_cause text. Pages through the read. */
export async function hallucinationCauseRowsQuery() {
  const supabase = getCanvasSupabase();
  const pageSize = 1000;
  const rows: Array<{
    root_cause: string | null;
    engine: string | null;
    category: string | null;
    prompt: string | null;
  }> = [];

  for (let page = 0; page < 20; page += 1) {
    const from = page * pageSize;
    const { data, error } = await supabase
      .from("canvas_ai_simulations")
      .select("root_cause,engine,category,prompt")
      .eq("hallucination_flag", true)
      .range(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return { data: rows, error: null };
}

export function simulationsQuery(category?: string, page = 0, size = 50) {
  const supabase = getCanvasSupabase();
  let q = supabase
    .from("canvas_ai_simulations")
    .select(
      "id,engine,category,prompt,winner,is_resolved,hallucination_flag,root_cause,remediation_patch,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(page * size, page * size + size - 1);
  if (category) q = q.eq("category", category);
  return q;
}

export function simulationDetailQuery(id: string) {
  const supabase = getCanvasSupabase();
  return supabase
    .from("canvas_ai_simulations")
    .select("answer_text,citation_urls,root_cause,remediation_patch")
    .eq("id", id)
    .single();
}

export type SpecRowsFilter = {
  /** Checked SKUs with no stored fender.com page. A null flag stays out. */
  missingFenderPage?: boolean;
};

/**
 * Catalog Readiness is the only tab that may ask for this filter.
 * A null fender_found stays out. Schema.org uses schemaGapRowsQuery.
 */
export function specRowsFilter(
  catalogReadiness: boolean,
  missingPagesOnly: boolean,
): SpecRowsFilter | undefined {
  if (!catalogReadiness || !missingPagesOnly) return undefined;
  return { missingFenderPage: true };
}

type SpecReadResult = PromiseLike<{
  data: unknown;
  count: number | null;
  error: { message: string } | null;
}>;

type SpecReadOrdered = SpecReadResult & {
  eq: (column: "fender_found", value: false) => SpecReadOrdered;
  range: (from: number, to: number) => SpecReadOrdered;
};

type SpecReadClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options: { count: "exact" },
    ) => {
      order: (
        column: string,
        options: { ascending: boolean },
      ) => SpecReadOrdered;
    };
  };
};

export function specRowsQuery(
  page = 0,
  size = 50,
  filter?: SpecRowsFilter,
  client?: SpecReadClient,
) {
  const supabase = client ?? (getCanvasSupabase() as unknown as SpecReadClient);
  let query = supabase
    .from("canvas_spec_readiness")
    .select("*", { count: "exact" })
    .order("amazon_completeness_pct", { ascending: true });
  if (filter?.missingFenderPage) query = query.eq("fender_found", false);
  return query.range(page * size, page * size + size - 1);
}

/** Confirmed column on public.canvas_spec_readiness. */
export const FENDER_MISSING_FIELDS_COLUMN = "fender_missing_fields";

export const ADDITIONAL_PROPERTY_GAP = "additionalProperty";

export const SCHEMA_GAP_COLUMNS =
  "asin,title,fender_url,fender_found,fender_missing_fields";

export type SchemaGapRow = {
  asin: string;
  title: string | null;
  fender_url: string | null;
  fender_found: boolean | null;
  fender_missing_fields: string | null;
};

/** Found page whose stored missing-field text includes additionalProperty. */
export function isFoundAdditionalPropertyGap(row: {
  fender_found?: boolean | null;
  fender_missing_fields?: string | null;
}): boolean {
  return (
    row.fender_found === true &&
    (row.fender_missing_fields ?? "").includes(ADDITIONAL_PROPERTY_GAP)
  );
}

type SchemaGapResult = PromiseLike<{
  data: unknown;
  count: number | null;
  error: { message: string } | null;
}>;

type SchemaGapOrdered = SchemaGapResult & {
  eq: (column: "fender_found", value: true) => SchemaGapOrdered;
  like: (column: typeof FENDER_MISSING_FIELDS_COLUMN, pattern: string) => SchemaGapOrdered;
  range: (from: number, to: number) => SchemaGapOrdered;
};

type SchemaGapClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options: { count: "exact" },
    ) => {
      order: (column: string, options: { ascending: boolean }) => SchemaGapOrdered;
    };
  };
};

/**
 * Schema.org list. Found pages only, and only when fender_missing_fields
 * includes additionalProperty. The returned count is the full match, not one page.
 */
export function schemaGapRowsQuery(page = 0, size = 50, client?: SchemaGapClient) {
  const supabase = client ?? (getCanvasSupabase() as unknown as SchemaGapClient);
  return supabase
    .from("canvas_spec_readiness")
    .select(SCHEMA_GAP_COLUMNS, { count: "exact" })
    .order("asin", { ascending: true })
    .eq("fender_found", true)
    .like(FENDER_MISSING_FIELDS_COLUMN, `%${ADDITIONAL_PROPERTY_GAP}%`)
    .range(page * size, page * size + size - 1);
}
