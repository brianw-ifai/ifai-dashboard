"use client";

import { useMemo, useState, type ReactNode } from "react";
import { labelFor } from "@/lib/dashboard-v2/reading/labels";
import { formatCell } from "@/lib/dashboard-v2/table/format-cell";
import {
  buildView,
  countActiveFilters,
  countLine,
  distinctValues,
  emptyFilterFor,
  filterKindFor,
  isSortable,
  keyOf,
  nextSortDirection,
  ROW_STATUSES,
  STATUS_KEY,
  statusTone,
  type ColumnDef,
  type ColumnFilter,
  type FilterState,
  type RowKey,
  type SortState,
  type TableRow,
} from "@/lib/dashboard-v2/table/table-model";

export type DataTableProps<R extends TableRow> = {
  rows: R[];
  columns: ColumnDef[];
  rowKey: RowKey<R>;
  /** Rendered under a row when the reader expands it. */
  renderExpanded?: (row: R) => ReactNode;
  /** One sort, or several keys where the first decides and the next break its ties. */
  initialSort?: SortState | SortState[];
  /** Text before the count, for example "listings". Defaults to "rows". */
  noun?: string;
};

/** The text a cell shows: the label for a coded column, otherwise the typed format. */
export function cellText(value: unknown, column: ColumnDef): string {
  if (column.labelKind && value !== null && value !== undefined && value !== "") {
    if (Array.isArray(value)) return value.map((v) => labelFor(column.labelKind as NonNullable<ColumnDef["labelKind"]>, String(v))).join(", ");
    return labelFor(column.labelKind, String(value));
  }
  return formatCell(value, column.type);
}

const scopedStyle = `
.dv2-table-wrap { display: grid; gap: 8px; }
.dv2-table-count { font-size: 12px; color: var(--text-muted); }
.dv2-table th.dv2-filter-cell { padding-top: 0; text-transform: none; }
.dv2-filter-group { display: flex; gap: 4px; flex-wrap: wrap; }
.dv2-filter-input {
  width: 100%; min-width: 64px; padding: 4px 8px; font-size: 11px;
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 8px; color: var(--text-main); outline: none;
}
.dv2-filter-input:focus { border-color: var(--color-indigo); }
.dv2-filter-group .dv2-filter-input { flex: 1 1 60px; }
.dv2-expand-btn {
  appearance: none; background: none; border: 1px solid var(--border-color);
  border-radius: 6px; color: inherit; font: inherit; font-size: 11px;
  padding: 2px 7px; cursor: pointer; white-space: nowrap;
}
.dv2-expanded-cell { background: var(--bg-card); }
.dv2-table-actions { display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.dv2-table tbody tr.dv2-row td { white-space: nowrap; }
.dv2-table td.dv2-cell-truncate { max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.dv2-table-scroll { overflow-x: auto; max-width: 100%; }
`;

function FilterCell({
  column,
  options,
  filter,
  onChange,
}: {
  column: ColumnDef;
  options: string[];
  filter: ColumnFilter;
  onChange: (next: ColumnFilter) => void;
}) {
  const optionText = (choice: string) => (column.labelKind ? labelFor(column.labelKind, choice) : choice);
  const kind = filterKindFor(column.type);
  const label = column.label;
  const numberOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
  const stringOrNull = (s: string) => (s.trim() === "" ? null : s);

  if (filter.kind === "text") {
    return (
      <input
        className="dv2-filter-input"
        type="search"
        placeholder="contains"
        aria-label={`Filter ${label}`}
        value={filter.text}
        onChange={(e) => onChange({ kind: "text", text: e.target.value })}
      />
    );
  }
  if (filter.kind === "select" || filter.kind === "status") {
    const choices = filter.kind === "status" ? ROW_STATUSES : options;
    const selected = filter.values as string[];
    return (
      <select
        className="dv2-filter-input"
        multiple
        size={Math.min(choices.length, 3) || 1}
        aria-label={`Filter ${label}`}
        value={selected}
        onChange={(e) => {
          const values = Array.from(e.target.selectedOptions).map((o) => o.value);
          onChange(
            filter.kind === "status"
              ? { kind: "status", values: values as typeof ROW_STATUSES }
              : { kind: "select", values },
          );
        }}
      >
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {filter.kind === "status" ? labelFor("reading_status", choice) : optionText(choice)}
          </option>
        ))}
      </select>
    );
  }
  if (filter.kind === "range") {
    return (
      <div className="dv2-filter-group">
        <input
          className="dv2-filter-input"
          type="number"
          placeholder="min"
          aria-label={`${label} minimum`}
          value={filter.min ?? ""}
          onChange={(e) => onChange({ ...filter, min: numberOrNull(e.target.value) })}
        />
        <input
          className="dv2-filter-input"
          type="number"
          placeholder="max"
          aria-label={`${label} maximum`}
          value={filter.max ?? ""}
          onChange={(e) => onChange({ ...filter, max: numberOrNull(e.target.value) })}
        />
      </div>
    );
  }
  if (filter.kind === "dateRange") {
    return (
      <div className="dv2-filter-group">
        <input
          className="dv2-filter-input"
          type="date"
          aria-label={`${label} from`}
          value={filter.from ?? ""}
          onChange={(e) => onChange({ ...filter, from: stringOrNull(e.target.value) })}
        />
        <input
          className="dv2-filter-input"
          type="date"
          aria-label={`${label} to`}
          value={filter.to ?? ""}
          onChange={(e) => onChange({ ...filter, to: stringOrNull(e.target.value) })}
        />
      </div>
    );
  }
  if (filter.kind === "boolean") {
    const value = filter.value === null ? "" : filter.value ? "yes" : "no";
    return (
      <select
        className="dv2-filter-input"
        aria-label={`Filter ${label}`}
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange({ kind: "boolean", value: v === "" ? null : v === "yes" });
        }}
      >
        <option value="">any</option>
        <option value="yes">yes</option>
        <option value="no">no</option>
      </select>
    );
  }
  return <span aria-hidden="true">{kind}</span>;
}

export function DataTable<R extends TableRow>({
  rows,
  columns,
  rowKey,
  renderExpanded,
  initialSort,
  noun = "rows",
}: DataTableProps<R>) {
  const [sort, setSort] = useState<SortState | SortState[] | null>(initialSort ?? null);
  const [filters, setFilters] = useState<FilterState>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const view = useMemo(() => buildView(rows, columns, filters, sort, rowKey), [rows, columns, filters, sort, rowKey]);
  const optionsByKey = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const c of columns) {
      if (c.type === "enum") out[c.key] = c.options ?? distinctValues(rows, c.key);
    }
    return out;
  }, [rows, columns]);

  const activeFilters = countActiveFilters(filters);
  const canExpand = typeof renderExpanded === "function";
  const colCount = columns.length + (canExpand ? 1 : 0);

  const currentSort: SortState | null = Array.isArray(sort) ? (sort[0] ?? null) : sort;
  const toggleSort = (column: ColumnDef) => {
    if (!isSortable(column)) return;
    setSort((current) => {
      const single = Array.isArray(current) ? (current[0] ?? null) : current;
      const direction = nextSortDirection(single?.key === column.key ? single.direction : null);
      return direction === null ? null : { key: column.key, direction };
    });
  };

  const setFilter = (key: string, next: ColumnFilter) => {
    setFilters((current) => ({ ...current, [key]: next }));
  };

  const toggleExpanded = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sortLabel = (column: ColumnDef): string => {
    if (currentSort?.key !== column.key || !currentSort.direction) return `Sort by ${column.label}`;
    return currentSort.direction === "asc" ? `${column.label}, sorted ascending` : `${column.label}, sorted descending`;
  };

  return (
    <div className="dv2-table-wrap">
      <style>{scopedStyle}</style>
      <div className="dv2-table-actions">
        <span className="dv2-table-count" aria-live="polite" data-testid="table-count">
          {countLine(view.matched, view.total, noun)}
        </span>
        {activeFilters > 0 ? (
          <button type="button" className="segmented-btn" onClick={() => setFilters({})}>
            Clear filters
          </button>
        ) : null}
      </div>
      <div className="dv2-table-scroll">
      <table className="table-sm dv2-table">
        <thead>
          <tr>
            {canExpand ? <th aria-label="Details" /> : null}
            {columns.map((column) => {
              const dir = currentSort?.key === column.key ? currentSort.direction : null;
              return (
                <th key={column.key} aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}>
                  {isSortable(column) ? (
                    <button
                      type="button"
                      className="ifai-sort-btn"
                      data-sort-dir={dir ?? undefined}
                      aria-label={sortLabel(column)}
                      onClick={() => toggleSort(column)}
                    >
                      {column.label}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
          <tr>
            {canExpand ? <th className="dv2-filter-cell" /> : null}
            {columns.map((column) => (
              <th key={column.key} className="dv2-filter-cell">
                <FilterCell
                  column={column}
                  options={optionsByKey[column.key] ?? []}
                  filter={filters[column.key] ?? emptyFilterFor(column.type)}
                  onChange={(next) => setFilter(column.key, next)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.rows.map((row) => {
            const key = keyOf(row, rowKey);
            const isOpen = expanded.has(key);
            const status = row[STATUS_KEY];
            return [
              <tr key={key} className="dv2-row" data-row-status={status ?? undefined} data-row-key={key}>
                {canExpand ? (
                  <td>
                    <button
                      type="button"
                      className="dv2-expand-btn"
                      aria-expanded={isOpen}
                      aria-label={isOpen ? "Hide details" : "Show details"}
                      onClick={() => toggleExpanded(key)}
                    >
                      {isOpen ? "Hide" : "Open"}
                    </button>
                  </td>
                ) : null}
                {columns.map((column) => {
                  const value = row[column.key];
                  const text = cellText(value, column);
                  if (column.type === "status") {
                    return (
                      <td key={column.key} data-col={column.key}>
                        <span className={`tag-badge tag-${statusTone(String(value ?? ""))}`}>{text}</span>
                      </td>
                    );
                  }
                  return (
                    <td key={column.key} data-col={column.key} className={column.truncate ? "dv2-cell-truncate" : undefined}>
                      {text}
                    </td>
                  );
                })}
              </tr>,
              isOpen && canExpand ? (
                <tr key={`${key}-expanded`} className="dv2-expanded-row">
                  <td className="dv2-expanded-cell" colSpan={colCount}>
                    {renderExpanded(row)}
                  </td>
                </tr>
              ) : null,
            ];
          })}
        </tbody>
      </table>
      </div>
      {view.matched === 0 ? (
        <div className="ifai-filter-empty" role="status" data-testid="table-empty">
          <p>No rows match these filters.</p>
          <button type="button" className="segmented-btn" onClick={() => setFilters({})}>
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default DataTable;
