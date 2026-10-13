"use client";

import { useEffect, useState } from "react";
import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useClientTableSort } from "@/components/v3/live/useClientTableSort";
import {
  isFoundAdditionalPropertyGap,
  schemaGapRowsQuery,
  type SchemaGapRow,
} from "@/lib/canvasData";
import { AdditionalPropertyTerm } from "@/components/v3/live/FenderSpecNarratives";
import { specModelTitle } from "@/lib/fender-canvas/types";
import { formatInt } from "@/lib/fender-canvas/format";
import type { SortInput } from "@/lib/fender-canvas/table-sort";

const COLUMNS = [
  clientColumn("asin", "ASIN", "text", 130, 108, "asin-col"),
  clientColumn("model", "Model", "text", 200, 120),
  clientColumn("page", "fender.com page", "text", 160, 110),
  clientColumn("fields", "Stored missing fields", "text", 280, 140),
];

function gapSortValue(row: SchemaGapRow, columnId: string): SortInput {
  if (columnId === "asin") return row.asin;
  if (columnId === "model") return specModelTitle(row.title) || null;
  if (columnId === "page") return pageHref(row.fender_url) ? "fender.com page" : null;
  return row.fender_missing_fields?.trim() || null;
}

function pageHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function SchemaAdditionalPropertyList() {
  const [rows, setRows] = useState<SchemaGapRow[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [seenPage, setSeenPage] = useState(page);
  const pageSize = 50;

  if (seenPage !== page) {
    setSeenPage(page);
    setFailed(false);
    setLoading(true);
    setRows([]);
    setTotal(null);
  }

  useEffect(() => {
    let cancelled = false;
    void schemaGapRowsQuery(page, pageSize).then(
      ({ data, count, error }) => {
        if (cancelled) return;
        if (error) {
          setRows([]);
          setTotal(null);
          setFailed(true);
          setLoading(false);
          return;
        }
        setRows((data ?? []) as SchemaGapRow[]);
        setTotal(count ?? null);
        setFailed(false);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setRows([]);
        setTotal(null);
        setFailed(true);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [page]);

  const visible = rows.filter((row) => isFoundAdditionalPropertyGap(row));
  const pages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const sorted = useClientTableSort(visible, COLUMNS, gapSortValue);

  return (
    <div className="content-box" style={{ marginTop: 12 }} id="schema-additional-property">
      <div className="content-box-title">
        <span>
          Found pages missing <AdditionalPropertyTerm />
        </span>
        {total != null ? (
          <span className="tag-badge tag-neutral" data-schema-gap-count={total}>
            {formatInt(total)} rows
          </span>
        ) : null}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "8px 0" }}>
        Each row is a found fender.com page whose stored missing-field text includes{" "}
        <AdditionalPropertyTerm />. The row count is the number of those pages in this read.
      </p>
      <ResizableTable
        tableId="schema-additional-property"
        columns={COLUMNS}
        freezeHeader
        maxHeight={520}
        sort={sorted.sort}
        onSort={sorted.onSort}
      >
        <tbody>
            {loading && visible.length === 0 ? (
              <tr>
                <td colSpan={4}>Loading…</td>
              </tr>
            ) : null}
            {failed ? (
              <tr>
                <td colSpan={4}>This read could not be loaded.</td>
              </tr>
            ) : null}
            {!loading && !failed && visible.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  No found page in this read stores additionalProperty in its missing fields.
                </td>
              </tr>
            ) : null}
            {sorted.rows.map((row) => {
              const href = pageHref(row.fender_url);
              return (
                <tr key={row.asin} data-schema-gap="additionalProperty">
                  <td>
                    <span className="asin-chip">{row.asin}</span>
                  </td>
                  <td>{specModelTitle(row.title)}</td>
                  <td>
                    {href ? (
                      <a className="listing-link" href={href} target="_blank" rel="noopener noreferrer">
                        fender.com page
                      </a>
                    ) : (
                      "Not stored"
                    )}
                  </td>
                  <td>{row.fender_missing_fields}</td>
                </tr>
              );
            })}
          </tbody>
      </ResizableTable>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="segmented-btn"
          disabled={page <= 0}
          onClick={() => setPage((current) => current - 1)}
        >
          Previous
        </button>
        <span style={{ fontSize: 11 }}>
          {page + 1} / {pages}
        </span>
        <button
          type="button"
          className="segmented-btn"
          disabled={page + 1 >= pages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
