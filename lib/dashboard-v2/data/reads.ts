import "server-only";

import { getSandboxClient } from "./sandbox-client";
import type {
  ActionItemRow,
  AiAnswerDetailRow,
  AiBatterySummary,
  ClientRow,
  EstimateInputRow,
  EstimateRow,
  ListingChannelPriceRow,
  ListingCurrentRow,
  MetricRegistryRow,
  MetricValueRow,
  PagedReadResult,
  ReadResult,
  ReadingFreshnessRow,
  ReadingRunRow,
  SandboxBundle,
  SpecCurrentRow,
} from "./types";

/** Supabase REST returns at most 1,000 rows per request. */
export const PAGE_SIZE = 1000;

export const DEFAULT_CLIENT_ID = "cl_fender";

type Query = () => PromiseLike<{ data: unknown; error: { message: string } | null }>;

function errorText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (error instanceof Error) return error.message;
  return "The read failed.";
}

/** Runs one query and folds every failure into `error`, so nothing throws into a page. */
async function run<T>(label: string, query: Query): Promise<ReadResult<T>> {
  const asOf = new Date().toISOString();
  try {
    const { data, error } = await query();
    if (error) return { rows: [], error: `${label}: ${errorText(error)}`, asOf };
    return { rows: (Array.isArray(data) ? data : []) as T[], error: null, asOf };
  } catch (error) {
    return { rows: [], error: `${label}: ${errorText(error)}`, asOf };
  }
}

function paged<T>(result: ReadResult<T>, page: number): PagedReadResult<T> {
  return {
    ...result,
    page,
    pageSize: PAGE_SIZE,
    nextPage: result.error === null && result.rows.length === PAGE_SIZE ? page + 1 : null,
  };
}

function range(page: number): [number, number] {
  const from = Math.max(0, Math.floor(page)) * PAGE_SIZE;
  return [from, from + PAGE_SIZE - 1];
}

type ClientJoinRow = Omit<ClientRow, "seller_type_row"> & {
  seller_type_row: ClientRow["seller_type_row"] | ClientRow["seller_type_row"][] | null;
};

export async function readClient(clientId: string): Promise<ReadResult<ClientRow>> {
  const result = await run<ClientJoinRow>("client", () =>
    getSandboxClient()
      .from("client")
      .select(
        "client_id, name, slug, seller_type, brand_site_domain, is_active, onboarded_at, updated_at, seller_type_row:seller_type(seller_type, label, primary_retail_question, description)",
      )
      .eq("client_id", clientId),
  );
  return {
    ...result,
    rows: result.rows.map((row) => ({
      ...row,
      seller_type_row: Array.isArray(row.seller_type_row)
        ? (row.seller_type_row[0] ?? null)
        : (row.seller_type_row ?? null),
    })),
  };
}

export function readRegistry(clientId: string): Promise<ReadResult<MetricRegistryRow>> {
  return run<MetricRegistryRow>("metric_registry", () =>
    getSandboxClient().from("metric_registry").select("*").eq("client_id", clientId).order("registry_id"),
  );
}

export function readAllMetricValues(clientId: string): Promise<ReadResult<MetricValueRow>> {
  return run<MetricValueRow>("metric_value", () =>
    getSandboxClient().from("metric_value").select("*").eq("client_id", clientId).order("metric_value_id"),
  );
}

export function readMetricValues(registryId: string, clientId = DEFAULT_CLIENT_ID): Promise<ReadResult<MetricValueRow>> {
  return run<MetricValueRow>("metric_value", () =>
    getSandboxClient()
      .from("metric_value")
      .select("*")
      .eq("client_id", clientId)
      .eq("registry_key", `${clientId}:${registryId}`)
      .order("metric_value_id"),
  );
}

const RUN_COLUMNS =
  "reading_run_id, client_id, source, workflow_name, workflow_execution_id, trigger_type, started_at, finished_at, status, population_count, rows_read, findings_count, legacy_run_key";

/** Every backfill run plus the latest ai_battery run. */
export async function readRuns(clientId: string): Promise<ReadResult<ReadingRunRow>> {
  const backfill = await run<ReadingRunRow>("reading_run", () =>
    getSandboxClient()
      .from("reading_run")
      .select(RUN_COLUMNS)
      .eq("client_id", clientId)
      .eq("trigger_type", "backfill")
      .order("started_at"),
  );
  if (backfill.error) return backfill;
  const latestAi = await run<ReadingRunRow>("reading_run (ai_battery)", () =>
    getSandboxClient()
      .from("reading_run")
      .select(RUN_COLUMNS)
      .eq("client_id", clientId)
      .eq("source", "ai_battery")
      .order("finished_at", { ascending: false, nullsFirst: false })
      .limit(1),
  );
  if (latestAi.error) return { ...latestAi, rows: [] };
  return { rows: [...backfill.rows, ...latestAi.rows], error: null, asOf: latestAi.asOf };
}

export async function readAiBatterySummary(clientId: string): Promise<ReadResult<AiBatterySummary>> {
  const asOf = new Date().toISOString();
  try {
    const { count, error } = await getSandboxClient()
      .from("reading_run")
      .select("reading_run_id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("source", "ai_battery");
    if (error) return { rows: [], error: `reading_run count: ${errorText(error)}`, asOf };
    return { rows: [{ runCount: count ?? 0 }], error: null, asOf };
  } catch (error) {
    return { rows: [], error: `reading_run count: ${errorText(error)}`, asOf };
  }
}

export function readEstimates(clientId: string): Promise<ReadResult<EstimateRow>> {
  return run<EstimateRow>("estimate", () =>
    getSandboxClient().from("estimate").select("*").eq("client_id", clientId).order("estimate_id"),
  );
}

export function readEstimateInputs(clientId: string): Promise<ReadResult<EstimateInputRow>> {
  return run<EstimateInputRow>("estimate_input", () =>
    getSandboxClient().from("estimate_input").select("*").eq("client_id", clientId).order("estimate_input_id"),
  );
}

export function readActions(clientId = DEFAULT_CLIENT_ID): Promise<ReadResult<ActionItemRow>> {
  return run<ActionItemRow>("action_item", () =>
    getSandboxClient().from("action_item").select("*").eq("client_id", clientId).order("action_item_id"),
  );
}

export function readFreshness(clientId: string): Promise<ReadResult<ReadingFreshnessRow>> {
  return run<ReadingFreshnessRow>("v_reading_freshness", () =>
    getSandboxClient().from("v_reading_freshness").select("*").eq("client_id", clientId).order("source"),
  );
}

const LISTING_COLUMNS =
  "listing_id, client_id, asin, title, brand, category, is_bundle, url, catalog_run_id, catalog_read_at, offer_status, listed_price, seller_run_id, seller_read_at, seller_class, featured_offer_seller_id, featured_offer_seller_name, benchmark_reading_id, benchmark_run_id, benchmark_read_at, featured_offer_withheld, offer_price, offer_price_cents, competitive_external_price_cents, legacy_status, suppressed, walmart_price, walmart_url, walmart_checked_at, musiciansfriend_price, musiciansfriend_url, musiciansfriend_checked_at, benchmark_match_channels";

export type ListingFilters = {
  /** Only suppressed listings (withheld and above the benchmark). */
  suppressed?: boolean;
};

export async function readListings(
  page = 0,
  filters: ListingFilters = {},
  clientId = DEFAULT_CLIENT_ID,
): Promise<PagedReadResult<ListingCurrentRow>> {
  const [from, to] = range(page);
  const result = await run<ListingCurrentRow>("v_listing_current", () => {
    let query = getSandboxClient().from("v_listing_current").select(LISTING_COLUMNS).eq("client_id", clientId);
    if (filters.suppressed) query = query.eq("suppressed", true);
    return query.order("listing_id").range(from, to);
  });
  return paged(result, page);
}

const ANSWER_COLUMNS =
  "ai_answer_id, client_id, reading_run_id, run_finished_at, run_status, ai_prompt_id, category, prompt_text, names_client_product, answered_at, engine, repeat_no, outcome, winner_brand_id, winner_brand_name, client_brand_won, wrong_spec_flag, wrong_spec_reason, citation_urls";

export type AnswerFilters = {
  engine?: string;
  category?: string;
  outcome?: string;
  wrongSpecFlag?: boolean;
};

export async function readAnswers(
  page = 0,
  filters: AnswerFilters = {},
  clientId = DEFAULT_CLIENT_ID,
): Promise<PagedReadResult<AiAnswerDetailRow>> {
  const [from, to] = range(page);
  const result = await run<AiAnswerDetailRow>("v_ai_answer_detail", () => {
    let query = getSandboxClient().from("v_ai_answer_detail").select(ANSWER_COLUMNS).eq("client_id", clientId);
    if (filters.engine) query = query.eq("engine", filters.engine);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.outcome) query = query.eq("outcome", filters.outcome);
    if (filters.wrongSpecFlag !== undefined) query = query.eq("wrong_spec_flag", filters.wrongSpecFlag);
    return query.order("ai_answer_id").range(from, to);
  });
  return paged(result, page);
}

export async function readSpec(page = 0, clientId = DEFAULT_CLIENT_ID): Promise<PagedReadResult<SpecCurrentRow>> {
  const [from, to] = range(page);
  const result = await run<SpecCurrentRow>("v_spec_current", () =>
    getSandboxClient().from("v_spec_current").select("*").eq("client_id", clientId).order("listing_id").range(from, to),
  );
  return paged(result, page);
}

export function readChannelPrices(listingId: string, clientId = DEFAULT_CLIENT_ID): Promise<ReadResult<ListingChannelPriceRow>> {
  return run<ListingChannelPriceRow>("listing_channel_price", () =>
    getSandboxClient()
      .from("listing_channel_price")
      .select(
        "listing_channel_price_id, client_id, listing_id, reading_run_id, read_at, channel, match_status, price, price_cents, url, checked_at, store_title, store_seller_name",
      )
      .eq("client_id", clientId)
      .eq("listing_id", listingId)
      .order("channel")
      .order("read_at", { ascending: false }),
  );
}

/** Reads every part of the bundle in parallel. A failed part carries its error; the rest stay usable. */
export async function loadBundle(clientId = DEFAULT_CLIENT_ID): Promise<SandboxBundle> {
  const [client, registry, metricValues, runs, aiBattery, estimates, estimateInputs, actions, freshness] =
    await Promise.all([
      readClient(clientId),
      readRegistry(clientId),
      readAllMetricValues(clientId),
      readRuns(clientId),
      readAiBatterySummary(clientId),
      readEstimates(clientId),
      readEstimateInputs(clientId),
      readActions(clientId),
      readFreshness(clientId),
    ]);
  return {
    clientId,
    loadedAt: new Date().toISOString(),
    client,
    registry,
    metricValues,
    runs,
    aiBattery,
    estimates,
    estimateInputs,
    actions,
    freshness,
  };
}
