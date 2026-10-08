/**
 * MAP tab model from `public.canvas_retail_listings` and `public.canvas_listing_channel_price`.
 *
 * Stored retailer prices only. The stored `map_price` is Amazon's list price from Keepa, so this
 * model never subtracts it from a retailer price: that difference is not a MAP gap.
 */

export type MapSourceRow = {
  asin: string;
  model_name: string | null;
  title: string | null;
  /** Amazon's stored list price, copied from Keepa. Not a MAP, and not a gap input. */
  map_price: number | null;
  offer_price: number | null;
  wmt_price: number | null;
  wmt_url: string | null;
  mf_price: number | null;
};

/** One channel's stored price on one listing. */
export type ChannelFact = {
  key: string;
  name: string;
  price: number;
};

/** One stored retailer price from `public.canvas_listing_channel_price`. */
export type ChannelPriceRow = {
  asin: string;
  channel: string;
  price: number | string | null;
  url: string | null;
  checked_at: string | null;
};

/** Listings on which this read stored a price for that channel. Not a below-MAP count. */
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
  channels: MapChannelSummary[];
  extraChannels: MapExtraChannel[];
  showAmazon: boolean;
  showWalmart: boolean;
  showMusiciansFriend: boolean;
  /** Amazon's stored list price column. Off until this read stored one above zero. */
  showAmazonListPrice: boolean;
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

/**
 * The stored price for each channel on one listing.
 * A channel with no stored price above zero is omitted, so a missing price stays blank.
 */
export function listingChannelFacts(
  row: MapSourceRow,
  extras?: Map<string, PricedChannelCell>,
): ChannelFact[] {
  const facts: ChannelFact[] = [];
  const amazonPrice = storedPrice(row.offer_price);
  if (amazonPrice != null) {
    facts.push({ key: "amazon", name: "Amazon", price: amazonPrice });
  }
  const walmartPrice = storedPrice(row.wmt_price);
  if (walmartPrice != null) {
    facts.push({ key: "walmart", name: "Walmart", price: walmartPrice });
  }
  const musiciansFriendPrice = storedPrice(row.mf_price);
  if (musiciansFriendPrice != null) {
    facts.push({ key: "musicians-friend", name: "Musician's Friend", price: musiciansFriendPrice });
  }
  if (extras) {
    for (const [channel, cell] of extras) {
      facts.push({ key: channel, name: channelDisplayName(channel), price: cell.price });
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
 * Channel counts are the listings on which this read stored a price for that channel.
 * No count says a retailer is below MAP: that needs Fender's MAP file.
 * A channel with no stored price on a returned listing is omitted.
 */
export function mapTabModel(rows: MapSourceRow[], channelPrices: ChannelPriceRow[] = []): MapTabModel {
  const prices = channelPriceLookup(channelPrices);
  const priced = new Map<string, number>();
  const extraOrder: string[] = [];

  for (const row of rows) {
    const facts = listingChannelFacts(row, prices.get(row.asin.trim()));
    for (const fact of facts) {
      if (!priced.has(fact.key) && !FIXED_CHANNELS.some((channel) => channel.key === fact.key)) {
        extraOrder.push(fact.key);
      }
      priced.set(fact.key, (priced.get(fact.key) ?? 0) + 1);
    }
  }

  const channels: MapChannelSummary[] = [];
  for (const channel of FIXED_CHANNELS) {
    const count = priced.get(channel.key) ?? 0;
    if (count > 0) channels.push({ name: channel.name, count });
  }

  const extraChannels = extraOrder
    .map((channel) => ({
      channel,
      name: channelDisplayName(channel),
      count: priced.get(channel) ?? 0,
    }))
    .sort(channelSort);

  return {
    count: rows.length,
    channels,
    extraChannels,
    showAmazon: (priced.get("amazon") ?? 0) > 0,
    showWalmart: (priced.get("walmart") ?? 0) > 0,
    showMusiciansFriend: (priced.get("musicians-friend") ?? 0) > 0,
    showAmazonListPrice: rows.some((row) => storedPrice(row.map_price) != null),
  };
}

export function listingLabel(row: MapSourceRow): string {
  return row.model_name?.trim() || row.title?.trim() || "Listing";
}
