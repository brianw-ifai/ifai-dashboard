import { listingLabel, type MapSourceRow } from "@/lib/fender-canvas/map-channels";
import { unreadCount, type SortInput } from "@/lib/fender-canvas/table-sort";
import type { CanvasRetailListingRow } from "@/lib/fender-canvas/types";

function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

/** A displayed price. Null stays missing, including a stored zero the cell does not show. */
function shownPrice(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapListingSortValue(
  row: MapSourceRow,
  columnId: string,
  channelPrice: (columnId: string) => number | null | undefined,
): SortInput {
  if (columnId === "listing") return text(listingLabel(row));
  if (columnId === "asin") return text(row.asin);
  if (columnId === "map") return shownPrice(row.map_price);
  return shownPrice(channelPrice(columnId));
}

export function exploreListingSortValue(
  row: CanvasRetailListingRow,
  columnId: string,
  channelPrice: (columnId: string) => number | null | undefined,
): SortInput {
  if (columnId === "listing") return text(row.model_name) ?? text(row.title);
  if (columnId === "asin") return text(row.asin);
  if (columnId === "partner") return text(row.bundle_name) ?? text(row.buybox_seller_name);
  if (columnId === "map") return shownPrice(row.map_price);
  if (columnId === "reviews") return unreadCount(row.reviews_count);
  if (columnId === "channels") return text(row.channels);
  return shownPrice(channelPrice(columnId));
}
