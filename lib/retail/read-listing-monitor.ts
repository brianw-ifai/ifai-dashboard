import {
  summarizeRetailRows,
  unavailableRetailReading,
  type PortfolioRetailReading,
  type RetailPriceRow,
} from "@/components/v3/portfolio-retail-reading";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;
const MAX_ROWS = 20_000;

type ListingMonitorRow = {
  asin: string | null;
  title: string | null;
  map_price: number | string | null;
  offer_price: number | string | null;
  buybox_status: string | null;
  wmt_price: number | string | null;
  mf_price: number | string | null;
};

type WalmartLinkRow = {
  asin: string | null;
  wmt_url: string | null;
};

function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

function asNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function httpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Retail rows are not organization-scoped. This reads every priced listing
 * the view returns. It does not filter or write organization membership.
 */
export async function readPortfolioRetail(): Promise<PortfolioRetailReading> {
  if (!supabaseConfigured()) return unavailableRetailReading;

  try {
    const supabase = await createClient();
    const listings = await readListingPages(supabase);
    if (!listings) return unavailableRetailReading;

    const links = await readWalmartLinks(supabase);
    if (!links) return unavailableRetailReading;

    const rows: RetailPriceRow[] = [];
    for (const listing of listings) {
      const mapPrice = asNumber(listing.map_price);
      const offerPrice = asNumber(listing.offer_price);
      const asin = listing.asin?.trim() ?? "";
      if (mapPrice == null || offerPrice == null || !asin) continue;
      rows.push({
        asin,
        title: listing.title?.trim() || "Listing",
        mapPrice,
        offerPrice,
        buyboxStatus: listing.buybox_status,
        wmtPrice: asNumber(listing.wmt_price),
        wmtUrl: links.get(asin) ?? null,
        mfPrice: asNumber(listing.mf_price),
      });
    }

    return summarizeRetailRows(rows);
  } catch {
    return unavailableRetailReading;
  }
}

async function readListingPages(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ListingMonitorRow[] | null> {
  const rows: ListingMonitorRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .schema("command")
      .from("v_fmic_listing_monitor")
      .select("asin,title,map_price,offer_price,buybox_status,wmt_price,mf_price")
      .not("map_price", "is", null)
      .not("offer_price", "is", null)
      .order("asin", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data) return null;
    const page = data as ListingMonitorRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
  return null;
}

async function readWalmartLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, string> | null> {
  const links = new Map<string, string>();
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .schema("command")
      .from("fmic_retail_buybox_map")
      .select("asin,wmt_url")
      .not("wmt_url", "is", null)
      .order("asin", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data) return null;
    const page = data as WalmartLinkRow[];
    for (const row of page) {
      const asin = row.asin?.trim();
      const url = httpUrl(row.wmt_url);
      if (asin && url) links.set(asin, url);
    }
    if (page.length < PAGE_SIZE) return links;
  }
  return null;
}
