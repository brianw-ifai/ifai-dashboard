"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  columnWidthStorageKey,
  mergeColumnWidths,
  type ColumnWidthSpec,
} from "@/lib/fender-canvas/retail-column-layout";

export type RetailColumn = ColumnWidthSpec & {
  label: ReactNode;
  /** Spoken name for the resize control. */
  name: string;
  className?: string;
};

const KEY_STEP = 16;

function readStored(tableId: string, columns: readonly RetailColumn[]): Record<string, number> {
  if (typeof window === "undefined") return mergeColumnWidths(columns, null);
  try {
    const raw = window.localStorage.getItem(columnWidthStorageKey(tableId));
    return mergeColumnWidths(columns, raw ? JSON.parse(raw) : null);
  } catch {
    return mergeColumnWidths(columns, null);
  }
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

  const setWidth = useCallback((id: string, width: number) => {
    setWidths((current) => {
      const next = mergeColumnWidths(columnsRef.current, { ...current, [id]: width });
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
  freezeHeader = false,
  maxHeight,
  children,
}: {
  tableId: string;
  columns: readonly RetailColumn[];
  freezeHeader?: boolean;
  maxHeight?: number;
  children: ReactNode;
}) {
  const { widths, setWidth } = useColumnWidths(tableId, columns);
  const tableRef = useRef<HTMLTableElement>(null);
  const widthsRef = useRef(widths);
  widthsRef.current = widths;
  const total = columns.reduce((sum, column) => sum + (widths[column.id] ?? column.width), 0);

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
      return sum + (widthsRef.current[column.id] ?? column.width);
    }, 0);
    table.style.width = `${nextTotal}px`;
  };

  const setDragging = (active: boolean) => {
    tableRef.current?.closest(".ifai-canvas")?.classList.toggle("col-resize-active", active);
  };

  return (
    <div
      className={`table-scroll${freezeHeader ? " table-freeze-head" : ""}`}
      style={maxHeight != null ? { maxHeight } : undefined}
      data-table-id={tableId}
    >
      <table ref={tableRef} className="table-sm resizable-table" style={{ width: total }}>
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.id}
              data-col-id={column.id}
              style={{ width: widths[column.id] ?? column.width }}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => {
              const width = widths[column.id] ?? column.width;
              return (
                <th
                  key={column.id}
                  data-col-id={column.id}
                  className={`resizable-th${column.className ? ` ${column.className}` : ""}`}
                  style={{ width }}
                >
                  <span className="resizable-th-label">{column.label}</span>
                  <ColumnResizeHandle
                    name={column.name}
                    width={width}
                    minWidth={column.minWidth ?? 72}
                    onPreview={(next) => preview(column.id, next)}
                    onCommit={(next) => setWidth(column.id, next)}
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
