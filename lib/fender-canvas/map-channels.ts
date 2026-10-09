/** MAP tab model from `public.canvas_retail_listings` and `public.canvas_listing_channel_price`. */

export type MapSourceRow = {
  asin: string;
  model_name: string | null;
  title: string | null;
  map_price: number | null;
  offer_price: number | null;
  /** Stored Amazon leakage. The worst gap across channels is not this number. */
  amz_leakage?: number | null;
  worst_leakage: number | null;
  wmt_price: number | null;
  wmt_leakage?: number | null;
  wmt_url: string | null;
  mf_price: number | null;
  mf_leakage: number | null;
};

/** One channel's stored price and the gap that price produced. */
export type ChannelFact = {
  key: string;
  name: string;
  price: number | null;
  gap: number | null;
};

/** One stored retailer price from `public.canvas_listing_channel_price`. */
export type ChannelPriceRow = {
  asin: string;
  channel: string;
  price: number | string | null;
  url: string | null;
  checked_at: string | null;
};

export type MapChannelSummary = {
  name: "Amazon" | "Walmart" | "Musician's Friend";
  count: number;
};

/** A retailer added by inserting rows, not by adding a column. */
export type MapExtraChannel = {
  channel: string;
  name: string;
  count: number;
};

export type MapTabModel = {
  count: number;
  averageGap: number | null;
  combinedGap: number | null;
  channels: MapChannelSummary[];
  extraChannels: MapExtraChannel[];
  showAmazon: boolean;
  showWalmart: boolean;
  showMusiciansFriend: boolean;
};

export type PricedChannelCell = {
  price: number;
  url: string | null;
};

const PREFERRED_CHANNELS = ["sweetwater", "reverb"];

const CHANNEL_NAMES: Record<string, string> = {
  sweetwater: "Sweetwater",
  reverb: "Reverb",
};

function finite(value: unknown): number | null {
  if (typeof value === "string" && value.trim() === "") return null;
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Stored shelf price. Zero and negative values are not a price. */
function storedPrice(value: unknown): number | null {
  const price = finite(value);
  if (price == null || price <= 0) return null;
  return price;
}

/** Lowercase slug. The first values are sweetwater and reverb. */
export function channelSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

export function channelDisplayName(channel: string): string {
  return (
    CHANNEL_NAMES[channel] ??
    channel
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function channelSort(a: MapExtraChannel, b: MapExtraChannel): number {
  const ai = PREFERRED_CHANNELS.indexOf(a.channel);
  const bi = PREFERRED_CHANNELS.indexOf(b.channel);
  const ao = ai === -1 ? PREFERRED_CHANNELS.length : ai;
  const bo = bi === -1 ? PREFERRED_CHANNELS.length : bi;
  if (ao !== bo) return ao - bo;
  return a.channel.localeCompare(b.channel);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Stored leakage wins. Otherwise the gap is the stored shelf price minus stored MAP. */
function channelGap(leakage: unknown, price: unknown, mapPrice: unknown): number | null {
  const leak = finite(leakage);
  if (leak != null) return roundMoney(leak);
  const shelf = storedPrice(price);
  const map = storedPrice(mapPrice);
  if (shelf == null || map == null) return null;
  return roundMoney(shelf - map);
}

function belowMap(gap: number | null): boolean {
  return gap != null && gap < 0;
}

/**
 * Stored price and gap for each channel on one listing.
 * A channel with no stored price and no stored leakage is omitted.
 */
export function listingChannelFacts(
  row: MapSourceRow,
  extras?: Map<string, PricedChannelCell>,
): ChannelFact[] {
  const facts: ChannelFact[] = [];
  const amazonPrice = storedPrice(row.offer_price);
  const amazonGap = channelGap(row.amz_leakage, row.offer_price, row.map_price);
  if (amazonPrice != null || amazonGap != null) {
    facts.push({ key: "amazon", name: "Amazon", price: amazonPrice, gap: amazonGap });
  }
  const walmartPrice = storedPrice(row.wmt_price);
  const walmartGap = channelGap(row.wmt_leakage, row.wmt_price, row.map_price);
  if (walmartPrice != null || walmartGap != null) {
    facts.push({ key: "walmart", name: "Walmart", price: walmartPrice, gap: walmartGap });
  }
  const musiciansFriendPrice = storedPrice(row.mf_price);
  const musiciansFriendGap = channelGap(row.mf_leakage, row.mf_price, row.map_price);
  if (musiciansFriendPrice != null || musiciansFriendGap != null) {
    facts.push({
      key: "musicians-friend",
      name: "Musician's Friend",
      price: musiciansFriendPrice,
      gap: musiciansFriendGap,
    });
  }
  if (extras) {
    for (const [channel, cell] of extras) {
      facts.push({
        key: channel,
        name: channelDisplayName(channel),
        price: cell.price,
        gap: channelGap(null, cell.price, row.map_price),
      });
    }
  }
  return facts;
}

/** Price and URL keyed by ASIN, then channel slug. Rows without a price are dropped. */
export function channelPriceLookup(
  prices: ChannelPriceRow[],
): Map<string, Map<string, PricedChannelCell>> {
  const byAsin = new Map<string, Map<string, PricedChannelCell>>();
  for (const row of prices) {
    const channel = channelSlug(row.channel);
    const price = storedPrice(row.price);
    const asin = row.asin?.trim();
    if (!channel || price == null || !asin) continue;
    let byChannel = byAsin.get(asin);
    if (!byChannel) {
      byChannel = new Map();
      byAsin.set(asin, byChannel);
    }
    const url = typeof row.url === "string" && row.url.trim() ? row.url.trim() : null;
    byChannel.set(channel, { price, url });
  }
  return byAsin;
}

const FIXED_CHANNELS = [
  { key: "amazon", name: "Amazon" },
  { key: "walmart", name: "Walmart" },
  { key: "musicians-friend", name: "Musician's Friend" },
] as const;

/**
 * Channel counts are listings below MAP on that channel.
 * A stored price that is at or above MAP is not a count.
 * A channel with no stored price on a returned listing is omitted.
 */
export function mapTabModel(rows: MapSourceRow[], channelPrices: ChannelPriceRow[] = []): MapTabModel {
  const prices = channelPriceLookup(channelPrices);
  const below = new Map<string, number>();
  const present = new Set<string>();
  const extraOrder: string[] = [];

  for (const row of rows) {
    const facts = listingChannelFacts(row, prices.get(row.asin.trim()));
    for (const fact of facts) {
      if (!present.has(fact.key) && !FIXED_CHANNELS.some((channel) => channel.key === fact.key)) {
        extraOrder.push(fact.key);
      }
      present.add(fact.key);
      if (belowMap(fact.gap)) below.set(fact.key, (below.get(fact.key) ?? 0) + 1);
    }
  }

  const channels: MapChannelSummary[] = [];
  for (const channel of FIXED_CHANNELS) {
    const count = below.get(channel.key) ?? 0;
    if (count > 0) channels.push({ name: channel.name, count });
  }

  const extraChannels = extraOrder
    .map((channel) => ({
      channel,
      name: channelDisplayName(channel),
      count: below.get(channel) ?? 0,
    }))
    .sort(channelSort);

  const gaps = rows
    .map((row) => finite(row.worst_leakage))
    .filter((gap): gap is number => gap != null);
  const combinedGap = gaps.reduce((sum, gap) => sum + gap, 0);

  return {
    count: rows.length,
    averageGap: gaps.length ? combinedGap / gaps.length : null,
    combinedGap: gaps.length ? combinedGap : null,
    channels,
    extraChannels,
    showAmazon: present.has("amazon"),
    showWalmart: present.has("walmart"),
    showMusiciansFriend: present.has("musicians-friend"),
  };
}

export function listingLabel(row: MapSourceRow): string {
  return row.model_name?.trim() || row.title?.trim() || "Listing";
}
