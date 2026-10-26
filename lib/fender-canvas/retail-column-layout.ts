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

function hasStoredWidth(columns: readonly ColumnWidthSpec[], raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const stored = raw as Record<string, unknown>;
  return columns.some((column) => typeof stored[column.id] === "number" && Number.isFinite(stored[column.id]));
}

/**
 * Column that absorbs leftover panel width when the caller does not name one.
 * Prefer the widest declared column so long text (prompt, model, title) wraps there.
 */
export function pickFillColumnId(
  columns: readonly ColumnWidthSpec[],
  preferred?: string,
): string {
  if (preferred && columns.some((column) => column.id === preferred)) return preferred;
  let bestId = columns[0]?.id ?? "";
  let bestWidth = -1;
  for (const column of columns) {
    if (column.width > bestWidth) {
      bestWidth = column.width;
      bestId = column.id;
    }
  }
  return bestId;
}

/**
 * Default widths that fill the panel. One column absorbs leftover space.
 * Optional content floors widen the other columns so short values stay on one line.
 * A stored resize wins, and the other columns stay at their own widths.
 */
export function filledColumnWidths(
  columns: readonly ColumnWidthSpec[],
  fillColumnId: string,
  containerWidth: number,
  stored?: unknown,
  contentMins?: Record<string, number>,
): Record<string, number> {
  const base = mergeColumnWidths(columns, stored ?? null);
  if (hasStoredWidth(columns, stored) || containerWidth <= 0) return base;
  if (!columns.some((column) => column.id === fillColumnId)) return base;

  const next = { ...base };
  for (const column of columns) {
    if (column.id === fillColumnId) continue;
    const contentMin = contentMins?.[column.id];
    if (typeof contentMin !== "number" || !Number.isFinite(contentMin)) continue;
    next[column.id] = Math.max(next[column.id], Math.ceil(contentMin));
  }

  const others = columns.reduce(
    (sum, column) => (column.id === fillColumnId ? sum : sum + next[column.id]),
    0,
  );
  const room = Math.floor(containerWidth) - others;
  return {
    ...next,
    [fillColumnId]: Math.max(next[fillColumnId], room),
  };
}

/**
 * Shared ResizableTable default: fill the panel, keep short cells on one line,
 * and let an explicit fill column or the widest declared column take the leftover.
 */
export function fitResizableColumnWidths(
  columns: readonly ColumnWidthSpec[],
  containerWidth: number,
  options?: {
    fillColumnId?: string;
    stored?: unknown;
    contentMins?: Record<string, number>;
  },
): Record<string, number> {
  return filledColumnWidths(
    columns,
    pickFillColumnId(columns, options?.fillColumnId),
    containerWidth,
    options?.stored,
    options?.contentMins,
  );
}
