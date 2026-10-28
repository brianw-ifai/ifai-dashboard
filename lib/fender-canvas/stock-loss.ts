/**
 * Out-of-stock and lost-sales reading for Catalog Health.
 * Rows come from public.canvas_listing_sales_loss (one per live listing) and
 * public.canvas_listing_stock_episodes (the dated stretches behind each row).
 * Day counts are Keepa. Revenue inputs are SmartScout. Dollar figures are analyst
 * estimates built from both, and a missing estimate is never shown as zero.
 */

import { getCanvasSupabase } from "../supabase/canvas-client";

export type StockLossRow = {
  asin: string;
  title: string | null;
  smartscout_snapshot_date: string | null;
  smartscout_monthly_revenue: number | null;
  smartscout_ttm_revenue: number | null;
  history_through: string | null;
  in_stock_days_30: number | null;
  oos_days_90: number | null;
  observed_days_365: number | null;
  in_stock_days_365: number | null;
  oos_days_365: number | null;
  suppressed_days_365: number | null;
  baseline_method: "ttm_per_in_stock_day" | "30d_per_in_stock_day" | null;
  baseline_daily_revenue: number | null;
  est_lost_revenue_oos_365: number | null;
  est_lost_revenue_suppressed_365_max: number | null;
};

export type StockEpisode = {
  asin: string;
  state: "out_of_stock" | "no_buy_box";
  start_day: string;
  end_day: string;
  days: number;
  ongoing: boolean;
};

export const STOCK_LOSS_COLUMNS =
  "asin,title,smartscout_snapshot_date,smartscout_monthly_revenue,smartscout_ttm_revenue,history_through,in_stock_days_30,oos_days_90,observed_days_365,in_stock_days_365,oos_days_365,suppressed_days_365,baseline_method,baseline_daily_revenue,est_lost_revenue_oos_365,est_lost_revenue_suppressed_365_max";

const PAGE_SIZE = 1000;

/** Live listings with at least one out-of-stock or no-Buy-Box day in the last 365. */
export function stockLossRowsQuery(page = 0, size = PAGE_SIZE) {
  return getCanvasSupabase()
    .from("canvas_listing_sales_loss")
    .select(STOCK_LOSS_COLUMNS, { count: "exact" })
    .or("oos_days_365.gt.0,suppressed_days_365.gt.0")
    .order("asin")
    .range(page * size, page * size + size - 1);
}

/** Every live listing, so the coverage line can say how many are not shown. */
export function stockLossLiveCountQuery() {
  return getCanvasSupabase()
    .from("canvas_listing_sales_loss")
    .select("asin", { count: "exact", head: true });
}

export function stockEpisodesQuery(asin: string) {
  return getCanvasSupabase()
    .from("canvas_listing_stock_episodes")
    .select("asin,state,start_day,end_day,days,ongoing")
    .eq("asin", asin)
    .order("start_day", { ascending: false });
}

export async function loadStockLossRows(): Promise<
  { available: false } | { available: true; rows: StockLossRow[]; liveCount: number | null }
> {
  const rows: StockLossRow[] = [];
  for (let page = 0; page < 10; page += 1) {
    const { data, error, count } = await stockLossRowsQuery(page, PAGE_SIZE);
    if (error) return { available: false };
    const batch = (data ?? []) as unknown as StockLossRow[];
    rows.push(...batch);
    if (rows.length >= (count ?? rows.length) || batch.length < PAGE_SIZE) {
      const live = await stockLossLiveCountQuery();
      return { available: true, rows, liveCount: live.error ? null : live.count };
    }
  }
  return { available: false };
}

export function num(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function lostSales(row: StockLossRow): number | null {
  return row.baseline_method ? num(row.est_lost_revenue_oos_365) : null;
}

export function noBuyBoxAtRisk(row: StockLossRow): number | null {
  return row.baseline_method ? num(row.est_lost_revenue_suppressed_365_max) : null;
}

/** Larger estimated loss first. Listings with no estimate follow, most out-of-stock days first. */
export function defaultStockLossOrder(rows: readonly StockLossRow[]): StockLossRow[] {
  return [...rows].sort((a, b) => {
    const la = lostSales(a);
    const lb = lostSales(b);
    if (la != null && lb != null && la !== lb) return lb - la;
    if (la != null && lb == null) return -1;
    if (la == null && lb != null) return 1;
    return (num(b.oos_days_365) ?? 0) - (num(a.oos_days_365) ?? 0);
  });
}

/** The revenue input in words, e.g. "SmartScout 12-month revenue $52,378.34". */
export function baselineInput(row: StockLossRow): { label: string; value: number | null; days: number | null } {
  if (row.baseline_method === "30d_per_in_stock_day") {
    return {
      label: "SmartScout revenue, last 30 days",
      value: num(row.smartscout_monthly_revenue),
      days: num(row.in_stock_days_30),
    };
  }
  return {
    label: "SmartScout revenue, last 12 months",
    value: num(row.smartscout_ttm_revenue),
    days: num(row.in_stock_days_365),
  };
}

/** Why a listing has no dollar estimate. Never a zero. */
export function notEstimatedReason(row: StockLossRow): string {
  const ttm = num(row.smartscout_ttm_revenue);
  const monthly = num(row.smartscout_monthly_revenue);
  if (ttm == null && monthly == null) return "SmartScout does not track this listing.";
  if (!(ttm && ttm > 0) && !(monthly && monthly > 0)) return "SmartScout shows no revenue for it.";
  return "Too few in-stock days to set a sales rate (30 in the last year, or 7 in the last 30 days).";
}

export const EPISODE_STATE_LABELS: Record<StockEpisode["state"], string> = {
  out_of_stock: "Out of stock",
  no_buy_box: "No Buy Box",
};

export function keepaHref(asin: string): string | null {
  return /^[A-Z0-9]{10}$/.test(asin) ? `https://keepa.com/#!product/1-${asin}` : null;
}

export function amazonHref(asin: string): string | null {
  return /^[A-Z0-9]{10}$/.test(asin) ? `https://www.amazon.com/dp/${asin}` : null;
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDay(day: string | null | undefined): string | null {
  if (!day) return null;
  const at = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(at.getTime()) ? dayFormat.format(at) : null;
}
