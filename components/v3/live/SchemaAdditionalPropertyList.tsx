"use client";

import { useEffect, useMemo, useState } from "react";
import { clientColumn, ResizableTable } from "@/components/v3/live/ResizableTable";
import { useFullPopulationSort } from "@/components/v3/live/useFullPopulationSort";
import {
  isFoundAdditionalPropertyGap,
  schemaGapRowsQuery,
  type SchemaGapRow,
} from "@/lib/canvasData";
import { AdditionalPropertyTerm } from "@/components/v3/live/FenderSpecNarratives";
import { CLIENT_TABLE_PAGE_SIZE, loadFilteredPages } from "@/lib/fender-canvas/full-result-sort";
import { schemaGapSortValue, schemaPageHref } from "@/lib/fender-canvas/spec-table-sort";
import { specModelTitle } from "@/lib/fender-canvas/types";
import { formatInt } from "@/lib/fender-canvas/format";

const COLUMNS = [
  clientColumn("asin", "ASIN", "text", 130, 108, "asin-col"),
  clientColumn("model", "Model", "text", 200, 120),
  clientColumn("page", "fender.com page", "text", 160, 110),
  clientColumn("fields", "Stored missing fields", "text", 280, 140),
];

export function SchemaAdditionalPropertyList() {
  const [rows, setRows] = useState<SchemaGapRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const visible = useMemo(() => rows.filter((row) => isFoundAdditionalPropertyGap(row)), [rows]);
  const population = useFullPopulationSort(
    visible,
    COLUMNS,
    schemaGapSortValue,
    (row) => row.asin,
    CLIENT_TABLE_PAGE_SIZE,
  );

  useEffect(() => {
    let cancelled = false;
    void loadFilteredPages(async (page, size) => {
      const result = await schemaGapRowsQuery(page, size);
      return {
        data: (result.data ?? []) as SchemaGapRow[],
        error: result.error,
        count: result.count,
      };
    }).then(
      (result) => {
        if (cancelled) return;
        if (result.error) {
          setRows([]);
          setTotal(null);
          setFailed(true);
          setLoading(false);
          return;
        }
        setRows(result.rows);
        setTotal(result.total);
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
  }, []);

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
        sort={population.sort}
        onSort={population.onSort}
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
            {population.pageRows.map((row) => {
              const href = schemaPageHref(row.fender_url);
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
          disabled={population.page <= 0}
          onClick={() => population.setPage((current) => current - 1)}
        >
          Previous
        </button>
        <span style={{ fontSize: 11 }}>
          {population.page + 1} / {population.pages}
        </span>
        <button
          type="button"
          className="segmented-btn"
          disabled={population.page + 1 >= population.pages}
          onClick={() => population.setPage((current) => current + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
