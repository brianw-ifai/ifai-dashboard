"use client";

import { useCallback, useMemo, useState } from "react";
import {
  nextTableSort,
  sortRowsByColumn,
  type SortInput,
  type SortKind,
  type TableSort,
} from "@/lib/fender-canvas/table-sort";

type SortableColumn = {
  id: string;
  sort?: SortKind;
};

/** Column sort for one ResizableTable. Width memory stays in that table. */
export function useClientTableSort<T>(
  rows: readonly T[],
  columns: readonly SortableColumn[],
  value: (row: T, columnId: string) => SortInput,
) {
  const [sort, setSort] = useState<TableSort | null>(null);
  const onSort = useCallback((columnId: string) => {
    setSort((current) => nextTableSort(current, columnId));
  }, []);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const kind = columns.find((column) => column.id === sort.columnId)?.sort;
    if (!kind) return rows;
    return sortRowsByColumn(rows, kind, sort.direction, (row) => value(row, sort.columnId));
  }, [columns, rows, sort, value]);
  return { rows: sorted, sort, onSort };
}
