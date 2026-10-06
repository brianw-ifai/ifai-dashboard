/**
 * MAP figures for Portfolio Retail. Counts and gaps come from the rows
 * returned by the latest read of command.v_fmic_listing_monitor.
 * The 39 suppressed listings stay a recorded Keepa reading.
 */

export const NO_ACTIVE_OFFER = "No Active Offer";

/** Sentence left in copy until a successful read replaces it. */
export const MAP_COUNT_SLOT = "Below-MAP rows are not available.";

/** Sentence left in copy until a successful read replaces it. */
export const MAP_GAP_SLOT = "The average MAP gap is not available.";

/** Compact count left in copy until a successful read replaces it. */
export const MAP_COUNT_VALUE_SLOT = "MAP n/a";

export const KEEPA_BUBBLE_META = "39 listings suppressed · recorded Keepa reading";

export type RetailPriceRow = {
  asin: string;
  title: string;
  mapPrice: number;
  offerPrice: number;
  buyboxStatus: string | null;
  wmtPrice: number | null;
  wmtUrl: string | null;
  mfPrice: number | null;
};

export type BelowMapListing = {
  asin: string;
  title: string;
  mapPrice: number;
  offerPrice: number;
  dollarGap: number;
  percentGap: number;
  wmtPrice: number | null;
  wmtUrl: string | null;
  mfPrice: number | null;
};

export type ReadyRetailReading = {
  status: "ready";
  activeOffers: number;
  belowMap: number;
  pctOfActive: number;
  avgPercentGap: number;
  avgDollarGap: number;
  combinedDollarGap: number;
  rows: BelowMapListing[];
};

export type PortfolioRetailReading = ReadyRetailReading | { status: "unavailable" };

export const unavailableRetailReading: PortfolioRetailReading = { status: "unavailable" };

export function isActiveOffer(row: RetailPriceRow): boolean {
  return (
    Number.isFinite(row.mapPrice) &&
    Number.isFinite(row.offerPrice) &&
    row.buyboxStatus !== NO_ACTIVE_OFFER
  );
}

export function summarizeRetailRows(rows: RetailPriceRow[]): ReadyRetailReading {
  const active = rows.filter(isActiveOffer);
  const below: BelowMapListing[] = active
    .filter((row) => row.offerPrice < row.mapPrice)
    .map((row) => {
      const dollarGap = row.mapPrice - row.offerPrice;
      const percentGap = row.mapPrice > 0 ? (dollarGap / row.mapPrice) * 100 : 0;
      return {
        asin: row.asin,
        title: row.title,
        mapPrice: row.mapPrice,
        offerPrice: row.offerPrice,
        dollarGap,
        percentGap,
        wmtPrice: row.wmtPrice,
        wmtUrl: row.wmtUrl,
        mfPrice: row.mfPrice,
      };
    });

  below.sort((a, b) => b.dollarGap - a.dollarGap || a.asin.localeCompare(b.asin));

  const combinedDollarGap = below.reduce((sum, row) => sum + row.dollarGap, 0);
  const avgDollarGap = below.length ? combinedDollarGap / below.length : 0;
  const avgPercentGap = below.length
    ? below.reduce((sum, row) => sum + row.percentGap, 0) / below.length
    : 0;

  return {
    status: "ready",
    activeOffers: active.length,
    belowMap: below.length,
    pctOfActive: active.length ? (below.length / active.length) * 100 : 0,
    avgPercentGap,
    avgDollarGap,
    combinedDollarGap,
    rows: below,
  };
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatSharePct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatGapPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function mapCountSentence(reading: ReadyRetailReading): string {
  return `${formatCount(reading.belowMap)} of ${formatCount(reading.activeOffers)} active offers are under MAP (${formatSharePct(reading.pctOfActive)}).`;
}

export function mapGapSentence(reading: ReadyRetailReading): string {
  return `The average gap is ${formatGapPct(reading.avgPercentGap)} of MAP, ${formatMoney(reading.avgDollarGap)} per listing, ${formatMoney(reading.combinedDollarGap)} combined.`;
}

export function fillRetailSlots(text: string, reading: PortfolioRetailReading): string {
  if (reading.status !== "ready") return text;
  return text
    .replaceAll(MAP_COUNT_SLOT, mapCountSentence(reading))
    .replaceAll(MAP_GAP_SLOT, mapGapSentence(reading))
    .replaceAll(MAP_COUNT_VALUE_SLOT, formatCount(reading.belowMap));
}

export type RetailBubble = {
  statA: string;
  statB: string;
  meta: string;
  tooltipTitle: string;
  tooltipDesc: string;
};

const TOOLTIP_TITLE = "Highlights marketplace listings";

function keepaTail(): string {
  return "Next are 39 suppressed listings (3.9%), a recorded Keepa reading, where the new offer is above Amazon's Competitive External Price.";
}

export function retailBubble(reading: PortfolioRetailReading): RetailBubble {
  if (reading.status !== "ready") {
    return {
      statA: "Rows not available",
      statB: "MAP",
      meta: KEEPA_BUBBLE_META,
      tooltipTitle: TOOLTIP_TITLE,
      tooltipDesc: `These listings need action to protect price integrity, availability, and Featured Offer coverage. ${MAP_COUNT_SLOT} ${keepaTail()}`,
    };
  }

  return {
    statA: `${formatCount(reading.belowMap)} below MAP`,
    statB: `${Math.round(reading.pctOfActive)}% of ${formatCount(reading.activeOffers)}`,
    meta: KEEPA_BUBBLE_META,
    tooltipTitle: TOOLTIP_TITLE,
    tooltipDesc: `These listings need action to protect price integrity, availability, and Featured Offer coverage. The top priority is MAP leakage: ${formatCount(reading.belowMap)} of ${formatCount(reading.activeOffers)} active offers are under MAP (${formatSharePct(reading.pctOfActive)}), averaging ${formatGapPct(reading.avgPercentGap)} and ${formatMoney(reading.avgDollarGap)} below MAP. ${keepaTail()}`,
  };
}

export function mapSatellite(reading: PortfolioRetailReading): {
  stats: [string, string];
  meta: string;
  tooltipDesc: string;
} {
  if (reading.status !== "ready") {
    return {
      stats: [MAP_COUNT_VALUE_SLOT, "—"],
      meta: "Rows not available",
      tooltipDesc: `${MAP_COUNT_SLOT} ${MAP_GAP_SLOT}`,
    };
  }

  return {
    stats: [`${formatCount(reading.belowMap)} Listings`, formatGapPct(reading.avgPercentGap)],
    meta: `avg ${formatMoney(reading.avgDollarGap)} · sum ${formatMoney(reading.combinedDollarGap)}`,
    tooltipDesc: `${mapCountSentence(reading)} ${mapGapSentence(reading)}`,
  };
}
