/** MAP tab model from `public.canvas_retail_listings` rows. */

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

export type MapChannelSummary = {
  name: "Amazon" | "Walmart" | "Musician's Friend";
  count: number;
};

export type MapTabModel = {
  count: number;
  averageGap: number | null;
  combinedGap: number | null;
  channels: MapChannelSummary[];
  showAmazon: boolean;
  showWalmart: boolean;
  showMusiciansFriend: boolean;
};

function finite(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A channel is included only when at least one returned row stored that price. */
export function mapTabModel(rows: MapSourceRow[]): MapTabModel {
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
    showAmazon: amazon > 0,
    showWalmart: walmart > 0,
    showMusiciansFriend: musiciansFriend > 0,
  };
}

export function listingLabel(row: MapSourceRow): string {
  return row.model_name?.trim() || row.title?.trim() || "Listing";
}
