"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  applyColumnSort,
  pageSlice,
  orderFullResult,
} from "@/lib/fender-canvas/full-result-sort";
import type { SortInput, SortKind, TableSort } from "@/lib/fender-canvas/table-sort";

type SortableColumn = {
  id: string;
  sort?: SortKind;
};

/**
 * Sort the filtered population, then show one page.
 * Width memory stays on ResizableTable. This hook does not touch column widths.
 */
export function useFullPopulationSort<T>(
  rows: readonly T[],
  columns: readonly SortableColumn[],
  value: (row: T, columnId: string) => SortInput,
  tieBreak: (row: T) => string,
  pageSize: number,
) {
  const [sort, setSort] = useState<TableSort | null>(null);
  const [page, setPage] = useState(0);
  const tieBreakRef = useRef(tieBreak);
  tieBreakRef.current = tieBreak;
  const onSort = useCallback((columnId: string) => {
    setSort((current) => applyColumnSort(current, columnId).sort);
    setPage(0);
  }, []);
  const resetPage = useCallback(() => setPage(0), []);
  const ordered = useMemo(() => {
    if (!sort) return rows;
    const kind = columns.find((column) => column.id === sort.columnId)?.sort;
    if (!kind) return rows;
    return orderFullResult(
      rows,
      kind,
      sort.direction,
      (row) => value(row, sort.columnId),
      (row) => tieBreakRef.current(row),
    );
  }, [columns, rows, sort, value]);
  const pages = Math.max(1, Math.ceil(ordered.length / pageSize) || 1);
  const safePage = Math.min(page, pages - 1);
  return {
    pageRows: pageSlice(ordered, safePage, pageSize),
    sort,
    onSort,
    page: safePage,
    setPage,
    resetPage,
    pages,
  };
}
