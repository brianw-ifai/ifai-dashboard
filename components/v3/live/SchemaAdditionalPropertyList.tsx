"use client";

import { useEffect, useState } from "react";
import {
  isFoundAdditionalPropertyGap,
  schemaGapRowsQuery,
  type SchemaGapRow,
} from "@/lib/canvasData";
import { AdditionalPropertyTerm } from "@/components/v3/live/FenderSpecNarratives";
import { specModelTitle } from "@/lib/fender-canvas/types";
import { formatInt } from "@/lib/fender-canvas/format";

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
      <div style={{ overflowX: "auto" }}>
        <table className="table-sm">
          <thead>
            <tr>
              <th>ASIN</th>
              <th>Model</th>
              <th>fender.com page</th>
              <th>Stored missing fields</th>
            </tr>
          </thead>
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
            {visible.map((row) => {
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
        </table>
      </div>
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
