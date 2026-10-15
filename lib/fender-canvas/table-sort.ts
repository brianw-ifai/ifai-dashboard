/**
 * Shared sort for client data tables.
 * Dates, currency, and counts compare as values. Text compares alphabetically.
 * A missing price, missing benchmark, or unread count stays missing. It is never zero.
 */

export type SortKind = "text" | "number" | "date";

/** Null and undefined are missing. A numeric zero is a real zero. */
export type SortInput = string | number | null | undefined;

export type SortDirection = "asc" | "desc";

export type TableSort = {
  columnId: string;
  direction: SortDirection;
};

export function tableScrollClass(freezeHeader: boolean): string {
  return `table-scroll${freezeHeader ? " table-freeze-head" : ""}`;
}

/**
 * reviews_count defaults to 0 before any job writes a count.
 * Zero and empty values are unread, not a measured count of zero.
 * A measured zero must be passed to the number sort directly, not through this helper.
 */
export function unreadCount(count: unknown): number | null {
  const value =
    typeof count === "number"
      ? count
      : typeof count === "string" && count.trim() !== ""
        ? Number(count)
        : Number.NaN;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function isMissingSortValue(kind: SortKind, value: SortInput): boolean {
  if (value == null) return true;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value !== "string") return true;
  const text = value.trim();
  if (text === "") return true;
  if (kind === "number") return !Number.isFinite(Number(text));
  if (kind === "date") return Number.isNaN(Date.parse(text));
  return false;
}

function asNumber(value: SortInput): number {
  return typeof value === "number" ? value : Number(String(value).trim());
}

function asTime(value: SortInput): number {
  if (typeof value === "number") return value;
  return Date.parse(String(value).trim());
}

/**
 * Missing values compare as missing, so they never tie with zero.
 * The caller decides which blanks are missing. This function does not coerce null to 0.
 */
export function compareSortValues(kind: SortKind, left: SortInput, right: SortInput): number {
  const leftMissing = isMissingSortValue(kind, left);
  const rightMissing = isMissingSortValue(kind, right);
  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;
  if (kind === "number") return asNumber(left) - asNumber(right);
  if (kind === "date") return asTime(left) - asTime(right);
  return String(left).localeCompare(String(right), undefined, { sensitivity: "base" });
}

function tieBreakOrder<T>(
  left: { row: T; index: number },
  right: { row: T; index: number },
  tieBreak?: (row: T) => string,
): number {
  if (tieBreak) {
    const compared = tieBreak(left.row).localeCompare(tieBreak(right.row), undefined, { sensitivity: "base" });
    if (compared !== 0) return compared;
  }
  return left.index - right.index;
}

export function sortRowsByColumn<T>(
  rows: readonly T[],
  kind: SortKind,
  direction: SortDirection,
  value: (row: T) => SortInput,
  tieBreak?: (row: T) => string,
): T[] {
  return rows
    .map((row, index) => ({ row, index, value: value(row) }))
    .sort((a, b) => {
      const leftMissing = isMissingSortValue(kind, a.value);
      const rightMissing = isMissingSortValue(kind, b.value);
      if (leftMissing || rightMissing) {
        const placed = compareSortValues(kind, a.value, b.value);
        return placed === 0 ? tieBreakOrder(a, b, tieBreak) : placed;
      }
      const compared = compareSortValues(kind, a.value, b.value);
      if (compared === 0) return tieBreakOrder(a, b, tieBreak);
      return direction === "asc" ? compared : -compared;
    })
    .map(({ row }) => row);
}

export function nextTableSort(current: TableSort | null, columnId: string): TableSort {
  if (current?.columnId === columnId) {
    return { columnId, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { columnId, direction: "asc" };
}

export function ariaSortValue(
  sort: TableSort | null,
  columnId: string,
): "ascending" | "descending" | "none" {
  if (!sort || sort.columnId !== columnId) return "none";
  return sort.direction === "asc" ? "ascending" : "descending";
}
