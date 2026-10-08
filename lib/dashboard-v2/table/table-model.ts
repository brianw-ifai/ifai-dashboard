/**
 * Pure table logic for dashboard v2: column definitions, filters, and sorting.
 * No React here. components/dashboard-v2/table/DataTable.tsx calls these.
 */

import type { LabelKind } from "../reading/labels";

export type ColumnType =
  | "text"
  | "number"
  | "usd"
  | "percent"
  | "date"
  | "enum"
  | "boolean"
  | "status";

export type FilterKind = "text" | "select" | "range" | "dateRange" | "boolean" | "status";

export type ColumnDef = {
  key: string;
  label: string;
  type: ColumnType;
  /** Defaults to true. */
  sortable?: boolean;
  /** Fixed choices for enum and status columns. Derived from the rows when absent. */
  options?: string[];
  /**
   * Rank order for an enum column's sort (for example high, medium, low). A value not in the
   * list sorts after the listed ones, alphabetically.
   */
  order?: string[];
  /** Label kind in reading/labels.ts; cells and filter options show the label, never the code. */
  labelKind?: LabelKind;
  /** Keep the collapsed cell to one line; the full text lives in the expanded row. */
  truncate?: boolean;
};

export type RowStatus = "complete" | "partial" | "unavailable";

/** The key a row uses to carry its reading status. */
export const STATUS_KEY = "_status";

export type TableRow = Record<string, unknown> & { [STATUS_KEY]?: RowStatus };

export type SortDirection = "asc" | "desc" | null;

export type SortState = { key: string; direction: SortDirection };

export type ColumnFilter =
  | { kind: "text"; text: string }
  | { kind: "select"; values: string[] }
  | { kind: "range"; min: number | null; max: number | null }
  | { kind: "dateRange"; from: string | null; to: string | null }
  | { kind: "boolean"; value: boolean | null }
  | { kind: "status"; values: RowStatus[] };

export type FilterState = Record<string, ColumnFilter | undefined>;

export const ROW_STATUSES: RowStatus[] = ["complete", "partial", "unavailable"];

export function filterKindFor(type: ColumnType): FilterKind {
  switch (type) {
    case "number":
    case "usd":
    case "percent":
      return "range";
    case "date":
      return "dateRange";
    case "enum":
      return "select";
    case "boolean":
      return "boolean";
    case "status":
      return "status";
    case "text":
    default:
      return "text";
  }
}

export function emptyFilterFor(type: ColumnType): ColumnFilter {
  switch (filterKindFor(type)) {
    case "range":
      return { kind: "range", min: null, max: null };
    case "dateRange":
      return { kind: "dateRange", from: null, to: null };
    case "select":
      return { kind: "select", values: [] };
    case "boolean":
      return { kind: "boolean", value: null };
    case "status":
      return { kind: "status", values: [] };
    case "text":
    default:
      return { kind: "text", text: "" };
  }
}

export function isSortable(column: ColumnDef): boolean {
  return column.sortable !== false;
}

/** asc, then desc, then none. */
export function nextSortDirection(current: SortDirection): SortDirection {
  if (current === null) return "asc";
  if (current === "asc") return "desc";
  return null;
}

/** True when a filter would not narrow anything. */
export function isFilterEmpty(filter: ColumnFilter | undefined): boolean {
  if (!filter) return true;
  switch (filter.kind) {
    case "text":
      return filter.text.trim() === "";
    case "select":
    case "status":
      return filter.values.length === 0;
    case "range":
      return filter.min === null && filter.max === null;
    case "dateRange":
      return filter.from === null && filter.to === null;
    case "boolean":
      return filter.value === null;
    default:
      return true;
  }
}

export function countActiveFilters(filters: FilterState): number {
  return Object.values(filters).filter((f) => !isFilterEmpty(f)).length;
}

/** Distinct string values in a column, for select filters. */
export function distinctValues(rows: TableRow[], key: string): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const v = row[key];
    if (v === null || v === undefined || v === "") continue;
    seen.add(String(v));
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "en-US", { sensitivity: "base", numeric: true }));
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === "object" && "pct" in value) {
    const pct = (value as { pct: unknown }).pct;
    return typeof pct === "number" && Number.isFinite(pct) ? pct : null;
  }
  return null;
}

function toTime(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

/** A date-only upper bound covers the whole day. */
function toEndTime(value: string): number | null {
  const ms = toTime(value);
  if (ms === null) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? ms + 24 * 60 * 60 * 1000 - 1 : ms;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return null;
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    if ("pct" in (value as object)) return String((value as { pct: unknown }).pct);
    return JSON.stringify(value);
  }
  return String(value);
}

function rowMatches(row: TableRow, key: string, filter: ColumnFilter): boolean {
  const value = row[key];
  switch (filter.kind) {
    case "text": {
      const text = toText(value);
      if (text === null) return false;
      return text.toLowerCase().includes(filter.text.trim().toLowerCase());
    }
    case "select": {
      const text = toText(value);
      if (text === null) return false;
      return filter.values.includes(text);
    }
    case "status": {
      const status = (value ?? row[STATUS_KEY]) as unknown;
      if (typeof status !== "string") return false;
      return (filter.values as string[]).includes(status);
    }
    case "range": {
      const n = toNumber(value);
      if (n === null) return false;
      if (filter.min !== null && n < filter.min) return false;
      if (filter.max !== null && n > filter.max) return false;
      return true;
    }
    case "dateRange": {
      const t = toTime(value);
      if (t === null) return false;
      if (filter.from !== null) {
        const from = toTime(filter.from);
        if (from !== null && t < from) return false;
      }
      if (filter.to !== null) {
        const to = toEndTime(filter.to);
        if (to !== null && t > to) return false;
      }
      return true;
    }
    case "boolean": {
      const b = toBoolean(value);
      if (b === null) return false;
      return b === filter.value;
    }
    default:
      return true;
  }
}

/**
 * Keeps the rows that pass every active filter (AND). Rows with a null in a
 * filtered column drop out; rows with a null in an unfiltered column stay, so
 * partial and unavailable rows remain in the set. Returns [] when nothing matches.
 */
export function applyFilters<R extends TableRow>(rows: R[], filters: FilterState): R[] {
  const active = Object.entries(filters).filter(([, f]) => !isFilterEmpty(f)) as [string, ColumnFilter][];
  if (active.length === 0) return [...rows];
  const out: R[] = [];
  for (const row of rows) {
    let keep = true;
    for (const [key, filter] of active) {
      if (!rowMatches(row, key, filter)) {
        keep = false;
        break;
      }
    }
    if (keep) out.push(row);
  }
  return out;
}

const STATUS_ORDER: Record<string, number> = { complete: 0, partial: 1, unavailable: 2 };

function textCompare(a: string, b: string): number {
  return a.localeCompare(b, "en-US", { sensitivity: "base", numeric: true });
}

/**
 * Compares two cell values of one column type. Returns null when either side is
 * missing so the caller can put nulls last in both directions.
 */
export function compareValues(a: unknown, b: unknown, type: ColumnType): number | null {
  switch (type) {
    case "number":
    case "usd":
    case "percent": {
      const x = toNumber(a);
      const y = toNumber(b);
      if (x === null || y === null) return null;
      return x - y;
    }
    case "date": {
      const x = toTime(a);
      const y = toTime(b);
      if (x === null || y === null) return null;
      return x - y;
    }
    case "boolean": {
      const x = toBoolean(a);
      const y = toBoolean(b);
      if (x === null || y === null) return null;
      return Number(x) - Number(y);
    }
    case "status": {
      const x = toText(a);
      const y = toText(b);
      if (x === null || y === null) return null;
      const ox = STATUS_ORDER[x] ?? 99;
      const oy = STATUS_ORDER[y] ?? 99;
      return ox !== oy ? ox - oy : textCompare(x, y);
    }
    case "enum":
    case "text":
    default: {
      const x = toText(a);
      const y = toText(b);
      if (x === null || y === null) return null;
      return textCompare(x, y);
    }
  }
}

function isMissingCell(value: unknown, type: ColumnType): boolean {
  switch (type) {
    case "number":
    case "usd":
    case "percent":
      return toNumber(value) === null;
    case "date":
      return toTime(value) === null;
    case "boolean":
      return toBoolean(value) === null;
    default:
      return toText(value) === null || toText(value) === "";
  }
}

export type RowKey<R> = string | ((row: R) => string);

export function keyOf<R extends TableRow>(row: R, rowKey: RowKey<R>): string {
  if (typeof rowKey === "function") return rowKey(row);
  return String(row[rowKey] ?? "");
}

export type SortOptions<R extends TableRow> = {
  type?: ColumnType;
  rowKey?: RowKey<R>;
  /** Rank order for enum values; see ColumnDef.order. */
  order?: string[];
};

function rankCompare(a: unknown, b: unknown, order: string[]): number | null {
  const x = toText(a);
  const y = toText(b);
  if (x === null || y === null) return null;
  const ix = order.indexOf(x);
  const iy = order.indexOf(y);
  const rx = ix === -1 ? order.length : ix;
  const ry = iy === -1 ? order.length : iy;
  return rx !== ry ? rx - ry : textCompare(x, y);
}

/**
 * Sorts a copy of the rows by one column. Missing values go last in both
 * directions. Ties break on the row key ascending so the order is stable.
 * Direction null returns the rows in their original order.
 */
export function sortRows<R extends TableRow>(
  rows: R[],
  sortKey: string | null,
  direction: SortDirection,
  options: SortOptions<R> = {},
): R[] {
  const copy = [...rows];
  if (!sortKey || direction === null) return copy;
  const type: ColumnType = options.type ?? inferType(rows, sortKey);
  const rowKey = options.rowKey;
  const sign = direction === "asc" ? 1 : -1;

  const tieBreak = (a: R, b: R): number => {
    if (!rowKey) return 0;
    return textCompare(keyOf(a, rowKey), keyOf(b, rowKey));
  };

  copy.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const aMissing = isMissingCell(av, type);
    const bMissing = isMissingCell(bv, type);
    if (aMissing && bMissing) return tieBreak(a, b);
    if (aMissing) return 1;
    if (bMissing) return -1;
    const cmp = options.order ? rankCompare(av, bv, options.order) : compareValues(av, bv, type);
    if (cmp === null || cmp === 0) return tieBreak(a, b);
    return cmp * sign;
  });
  return copy;
}

/**
 * Sorts by several keys in order: the first key decides, the next breaks its ties, and so on.
 * Missing values go last for each key. Used for default orders such as suppressed first, then
 * price gap descending.
 */
export function sortRowsMulti<R extends TableRow>(rows: R[], sorts: SortState[], columns: ColumnDef[], rowKey?: RowKey<R>): R[] {
  const active = sorts.filter((s) => s.direction !== null);
  if (active.length === 0) return [...rows];
  // Stable sort from the last key to the first gives the first key priority.
  let out = [...rows];
  for (let i = active.length - 1; i >= 0; i -= 1) {
    const sort = active[i];
    const column = columns.find((c) => c.key === sort.key);
    out = sortRows(out, sort.key, sort.direction, { type: column?.type, rowKey: i === active.length - 1 ? rowKey : undefined, order: column?.order });
  }
  return out;
}

/** Guesses a column type from the first present value, for callers without a column def. */
export function inferType(rows: TableRow[], key: string): ColumnType {
  if (key === STATUS_KEY) return "status";
  for (const row of rows) {
    const v = row[key];
    if (v === null || v === undefined) continue;
    if (typeof v === "number") return "number";
    if (typeof v === "boolean") return "boolean";
    if (v instanceof Date) return "date";
    if (v && typeof v === "object" && "pct" in v) return "percent";
    return "text";
  }
  return "text";
}

export type TableView<R extends TableRow> = {
  rows: R[];
  matched: number;
  total: number;
};

/** Filters then sorts, the way the table renders. */
export function buildView<R extends TableRow>(
  rows: R[],
  columns: ColumnDef[],
  filters: FilterState,
  sort: SortState | SortState[] | null,
  rowKey: RowKey<R>,
): TableView<R> {
  const filtered = applyFilters(rows, filters);
  let sorted: R[];
  if (Array.isArray(sort)) {
    sorted = sortRowsMulti(filtered, sort, columns, rowKey);
  } else if (sort) {
    const column = columns.find((c) => c.key === sort.key);
    sorted = sortRows(filtered, sort.key, sort.direction, { type: column?.type, rowKey, order: column?.order });
  } else {
    sorted = filtered;
  }
  return { rows: sorted, matched: sorted.length, total: rows.length };
}

/** "3,604 of 3,604 listings", with digit grouping. */
export function countLine(matched: number, total: number, noun: string): string {
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  return `${fmt.format(matched)} of ${fmt.format(total)} ${noun}`;
}

/** The badge tone for a row status. */
export function statusTone(status: RowStatus | string | null | undefined): "success" | "warning" | "neutral" {
  if (status === "complete") return "success";
  if (status === "partial") return "warning";
  return "neutral";
}

/** Plain-language label for a row status. */
export function statusLabel(status: RowStatus | string | null | undefined): string {
  if (status === "complete") return "complete";
  if (status === "partial") return "not final";
  return "unavailable";
}
