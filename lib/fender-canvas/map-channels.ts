/** MAP tab model from `public.canvas_retail_listings` and `public.canvas_listing_channel_price`. */

export type MapSourceRow = {
  asin: string;
  model_name: string | null;
  title: string | null;
  map_price: number | null;
  offer_price: number | null;
  worst_leakage: number | null;
  wmt_price: number | null;
  wmt_url: string | null;
  mf_price: number | null;
  mf_leakage: number | null;
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

/**
 * Channels with at least one stored price. A channel with zero rows is omitted.
 * The count is stored prices, not violations.
 */
export function extraChannelsFromPrices(prices: ChannelPriceRow[]): MapExtraChannel[] {
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const row of prices) {
    const channel = channelSlug(row.channel);
    const price = storedPrice(row.price);
    const asin = row.asin?.trim();
    if (!channel || price == null || !asin) continue;
    const key = `${asin}\0${channel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts.set(channel, (counts.get(channel) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([channel, count]) => ({ channel, name: channelDisplayName(channel), count }))
    .filter((channel) => channel.count > 0)
    .sort(channelSort);
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

/** A channel is included only when at least one returned row stored that price. */
export function mapTabModel(rows: MapSourceRow[], channelPrices: ChannelPriceRow[] = []): MapTabModel {
  const amazon = rows.filter((row) => finite(row.offer_price) != null).length;
  const walmart = rows.filter((row) => finite(row.wmt_price) != null).length;
  const musiciansFriend = rows.filter((row) => finite(row.mf_price) != null).length;
  const gaps = rows
    .map((row) => finite(row.worst_leakage))
    .filter((gap): gap is number => gap != null);
  const combinedGap = gaps.reduce((sum, gap) => sum + gap, 0);

  const channels: MapChannelSummary[] = [];
  if (amazon > 0) channels.push({ name: "Amazon", count: amazon });
  if (walmart > 0) channels.push({ name: "Walmart", count: walmart });
  if (musiciansFriend > 0) channels.push({ name: "Musician's Friend", count: musiciansFriend });

  return {
    count: rows.length,
    averageGap: gaps.length ? combinedGap / gaps.length : null,
    combinedGap: gaps.length ? combinedGap : null,
    channels,
    extraChannels: extraChannelsFromPrices(channelPrices),
    showAmazon: amazon > 0,
    showWalmart: walmart > 0,
    showMusiciansFriend: musiciansFriend > 0,
  };
}

export function listingLabel(row: MapSourceRow): string {
  return row.model_name?.trim() || row.title?.trim() || "Listing";
}
