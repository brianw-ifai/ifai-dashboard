"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  columnWidthStorageKey,
  filledColumnWidths,
  mergeColumnWidths,
  type ColumnWidthSpec,
} from "@/lib/fender-canvas/retail-column-layout";
import {
  ariaSortValue,
  tableScrollClass,
  type SortKind,
  type TableSort,
} from "@/lib/fender-canvas/table-sort";

export type RetailColumn = ColumnWidthSpec & {
  label: ReactNode;
  /** Spoken name for the resize control. */
  name: string;
  className?: string;
  /** When set, the header sorts this column. Currency and counts use "number". */
  sort?: SortKind;
};

export function clientColumn(
  id: string,
  name: string,
  sort: SortKind,
  width: number,
  minWidth = 72,
  className?: string,
): RetailColumn {
  return { id, name, label: name, sort, width, minWidth, className };
}

const KEY_STEP = 16;

function readStoredRaw(tableId: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(columnWidthStorageKey(tableId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readStored(tableId: string, columns: readonly RetailColumn[]): Record<string, number> {
  return mergeColumnWidths(columns, readStoredRaw(tableId));
}

function useColumnWidths(tableId: string, columns: readonly RetailColumn[]) {
  const signature = columns
    .map((column) => `${column.id}:${column.width}:${column.minWidth ?? ""}`)
    .join("|");
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const [widths, setWidths] = useState<Record<string, number>>(() => mergeColumnWidths(columns, null));

  useEffect(() => {
    setWidths(readStored(tableId, columnsRef.current));
  }, [tableId, signature]);

  const setWidth = useCallback((id: string, width: number, base?: Record<string, number>) => {
    setWidths((current) => {
      const next = mergeColumnWidths(columnsRef.current, { ...(base ?? current), [id]: width });
      try {
        window.localStorage.setItem(columnWidthStorageKey(tableId), JSON.stringify(next));
      } catch {
        /* keep the in-memory width when storage is blocked */
      }
      return next;
    });
  }, [tableId]);

  return { widths, setWidth };
}

function ColumnResizeHandle({
  name,
  width,
  minWidth,
  onPreview,
  onCommit,
  onDragChange,
}: {
  name: string;
  width: number;
  minWidth: number;
  onPreview: (width: number) => void;
  onCommit: (width: number) => void;
  onDragChange: (active: boolean) => void;
}) {
  const drag = useRef<{ x: number; width: number } | null>(null);

  const finish = (clientX: number, pointerId: number, handle: HTMLElement) => {
    if (!drag.current) return;
    const next = Math.max(minWidth, Math.round(drag.current.width + clientX - drag.current.x));
    drag.current = null;
    onDragChange(false);
    if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
    onCommit(next);
  };

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${name} column`}
      aria-valuemin={minWidth}
      aria-valuenow={Math.round(width)}
      aria-valuemax={960}
      tabIndex={0}
      className="col-resize-handle"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, width };
        onDragChange(true);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        const next = Math.max(minWidth, Math.round(drag.current.width + event.clientX - drag.current.x));
        onPreview(next);
      }}
      onPointerUp={(event) => finish(event.clientX, event.pointerId, event.currentTarget)}
      onPointerCancel={(event) => finish(event.clientX, event.pointerId, event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? KEY_STEP : -KEY_STEP;
        onCommit(Math.max(minWidth, width + delta));
      }}
    />
  );
}

export function ResizableTable({
  tableId,
  columns,
  fillColumnId,
  freezeHeader = true,
  maxHeight = 520,
  sort = null,
  onSort,
  children,
}: {
  tableId: string;
  columns: readonly RetailColumn[];
  /** Column that grows so the table fills the panel until someone resizes. */
  fillColumnId?: string;
  freezeHeader?: boolean;
  maxHeight?: number;
  sort?: TableSort | null;
  onSort?: (columnId: string) => void;
  children: ReactNode;
}) {
  const { widths, setWidth } = useColumnWidths(tableId, columns);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    setManual(readStoredRaw(tableId) != null);
  }, [tableId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !fillColumnId) return;
    const measure = () => setContainerWidth(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fillColumnId]);

  const displayWidths =
    fillColumnId && !manual ? filledColumnWidths(columns, fillColumnId, containerWidth) : widths;
  const displayRef = useRef(displayWidths);
  displayRef.current = displayWidths;
  const total = columns.reduce((sum, column) => sum + (displayWidths[column.id] ?? column.width), 0);

  useEffect(() => {
    const table = tableRef.current;
    return () => {
      table?.closest(".ifai-canvas")?.classList.remove("col-resize-active");
    };
  }, []);

  const preview = (id: string, width: number) => {
    const table = tableRef.current;
    if (!table) return;
    const col = table.querySelector(`col[data-col-id="${id}"]`);
    if (col instanceof HTMLElement) col.style.width = `${width}px`;
    const header = table.querySelector(`th[data-col-id="${id}"]`);
    if (header instanceof HTMLElement) header.style.width = `${width}px`;
    const nextTotal = columns.reduce((sum, column) => {
      if (column.id === id) return sum + width;
      return sum + (displayRef.current[column.id] ?? column.width);
    }, 0);
    table.style.width = `${nextTotal}px`;
  };

  const setDragging = (active: boolean) => {
    tableRef.current?.closest(".ifai-canvas")?.classList.toggle("col-resize-active", active);
  };

  return (
    <div
      ref={scrollRef}
      className={tableScrollClass(freezeHeader)}
      style={maxHeight != null ? { maxHeight } : undefined}
      data-table-id={tableId}
      data-freeze-header={freezeHeader ? "true" : "false"}
      data-fill-column={fillColumnId}
    >
      <table ref={tableRef} className="table-sm resizable-table" style={{ width: total }}>
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.id}
              data-col-id={column.id}
              style={{ width: displayWidths[column.id] ?? column.width }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => {
              const width = displayWidths[column.id] ?? column.width;
              return (
                <th
                  key={column.id}
                  scope="col"
                  data-col-id={column.id}
                  className={`resizable-th${column.className ? ` ${column.className}` : ""}`}
                  style={{ width }}
                  aria-sort={column.sort ? ariaSortValue(sort, column.id) : undefined}
                >
                  {column.sort ? (
                    <button
                      type="button"
                      className="ifai-sort-btn"
                      data-sort-dir={sort?.columnId === column.id ? sort.direction : undefined}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSort?.(column.id);
                      }}
                    >
                      {column.label}
                    </button>
                  ) : (
                    <span className="resizable-th-label">{column.label}</span>
                  )}
                  <ColumnResizeHandle
                    name={column.name}
                    width={width}
                    minWidth={column.minWidth ?? 72}
                    onPreview={(next) => preview(column.id, next)}
                    onCommit={(next) => {
                      setManual(true);
                      setWidth(column.id, next, displayRef.current);
                    }}
                    onDragChange={setDragging}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}
