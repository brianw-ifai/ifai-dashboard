/**
 * Persisted column widths for Portfolio Retail tables.
 * Each table has its own storage key, so a resize in one table cannot change another.
 */

export const COLUMN_WIDTH_STORAGE_PREFIX = "ifai.retail.columns.";

export type ColumnWidthSpec = {
  id: string;
  width: number;
  minWidth?: number;
};

/**
 * Listing column in the wide MAP table at 1440×900, before this cap.
 * The default below is about 60% of that measured width.
 */
export const MAP_LISTING_COLUMN_MEASURED_WIDTH = 238;
export const MAP_LISTING_COLUMN_WIDTH = 144;

export function columnWidthStorageKey(tableId: string): string {
  return `${COLUMN_WIDTH_STORAGE_PREFIX}${tableId}`;
}

export function mergeColumnWidths(
  columns: readonly ColumnWidthSpec[],
  raw: unknown,
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const column of columns) next[column.id] = column.width;
  if (!raw || typeof raw !== "object") return next;
  const stored = raw as Record<string, unknown>;
  for (const column of columns) {
    const value = stored[column.id];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    next[column.id] = Math.max(column.minWidth ?? 72, Math.round(value));
  }
  return next;
}
