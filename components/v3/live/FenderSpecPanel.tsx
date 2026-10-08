"use client";

import { useEffect, useState } from "react";
import { specRowsFilter, specRowsQuery } from "@/lib/canvasData";
import {
  specFenderFoundLabel,
  specModelTitle,
  type CanvasSpecMissingRow,
  type CanvasSpecReadinessRow,
} from "@/lib/fender-canvas/types";
import { formatInt, formatPct, pendingLabel } from "@/lib/fender-canvas/format";

const MISSING_PAGE_DESC =
  "This check did not resolve a fender.com address. It is not proof the product is absent from fender.com.";

export function FenderSpecPanel({
  missing,
  catalogReadiness = false,
  missingPagesOnly = false,
}: {
  missing: CanvasSpecMissingRow[];
  /** Catalog Readiness passes this. Schema.org leaves it off and stays unfiltered. */
  catalogReadiness?: boolean;
  missingPagesOnly?: boolean;
}) {
  const queryMissingPages =
    specRowsFilter(catalogReadiness, missingPagesOnly)?.missingFenderPage === true;
  const [rows, setRows] = useState<CanvasSpecReadinessRow[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [seenFilter, setSeenFilter] = useState(queryMissingPages);
  const pageSize = 50;

  if (seenFilter !== queryMissingPages) {
    setSeenFilter(queryMissingPages);
    setPage(0);
    setRows([]);
    setTotal(null);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    void specRowsQuery(
      page,
      pageSize,
      queryMissingPages ? { missingFenderPage: true } : undefined,
    ).then(
      ({ data, count }) => {
        if (cancelled) return;
        setRows((data ?? []) as CanvasSpecReadinessRow[]);
        setTotal(count ?? null);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [page, queryMissingPages]);

  const pages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const topMissing = missing.slice(0, 8);
  const maxCount = topMissing.reduce((m, r) => Math.max(m, r.sku_count ?? 0), 0) || 1;

  return (
    <>
      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">Top missing schema fields</div>
        {topMissing.map((row) => (
          <div key={`${row.source}-${row.field}`} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>
                {row.field} ({row.source ?? "n/a"})
              </span>
              <span>{formatInt(row.sku_count)} SKUs</span>
            </div>
            <div className="readiness-progress-bar">
              <div
                className="readiness-progress-fill"
                style={{ width: `${((row.sku_count ?? 0) / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="content-box" style={{ marginTop: 12 }} id="spec-readiness-by-asin">
        <div className="content-box-title">
          <span>Spec readiness by ASIN</span>
          {total != null ? (
            <span className="tag-badge tag-neutral">{formatInt(total)} rows</span>
          ) : null}
        </div>
        {queryMissingPages ? (
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "8px 0" }}>
            A{" "}
            <span
              className="ifai-term"
              data-ifai-tooltip-title="missing page"
              data-ifai-tooltip-desc={MISSING_PAGE_DESC}
              tabIndex={0}
              aria-label={`missing page: ${MISSING_PAGE_DESC}`}
            >
              missing page
            </span>{" "}
            means this check did not resolve a fender.com address. It is not proof the product is
            absent from fender.com.
          </p>
        ) : null}
        <div style={{ overflowX: "auto" }}>
          <table className="table-sm">
            <thead>
              <tr>
                <th>ASIN</th>
                <th>Model</th>
                <th>Amazon completeness</th>
                <th>fender.com found</th>
                <th>Missing Amazon fields</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>Loading…</td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    {queryMissingPages
                      ? "No checked SKUs in this read are missing a stored fender.com page."
                      : "No spec rows in this read."}
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => {
                const chips = (row.amazon_missing_fields ?? "")
                  .split(";")
                  .map((s) => s.trim())
                  .filter(Boolean);
                return (
                  <tr key={row.asin}>
                    <td>
                      <span className="asin-chip">{row.asin}</span>
                    </td>
                    <td>{specModelTitle(row.title)}</td>
                    <td>{formatPct(row.amazon_completeness_pct)}</td>
                    <td>{specFenderFoundLabel(row.fender_found)}</td>
                    <td>
                      {chips.length
                        ? chips.map((c) => (
                            <span key={c} className="tag-badge tag-neutral" style={{ marginRight: 4 }}>
                              {c}
                            </span>
                          ))
                        : pendingLabel()}
                    </td>
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
            onClick={() => setPage((p) => p - 1)}
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
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
