"use client";

import { useCallback, useEffect, useState } from "react";
import { specRowsQuery } from "@/lib/canvasData";
import type { CanvasSpecMissingRow, CanvasSpecReadinessRow } from "@/lib/fender-canvas/types";
import { formatInt, formatPct, pendingLabel } from "@/lib/fender-canvas/format";

export function FenderSpecPanel({ missing }: { missing: CanvasSpecMissingRow[] }) {
  const [rows, setRows] = useState<CanvasSpecReadinessRow[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await specRowsQuery(page, pageSize);
    setRows((data ?? []) as CanvasSpecReadinessRow[]);
    setTotal(count ?? null);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

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

      <div className="content-box" style={{ marginTop: 12 }}>
        <div className="content-box-title">
          <span>Spec readiness by ASIN</span>
          {total != null ? (
            <span className="tag-badge tag-neutral">{formatInt(total)} rows</span>
          ) : null}
        </div>
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
                    <td>{row.model_name?.trim() || "n/a"}</td>
                    <td>{formatPct(row.amazon_completeness_pct)}</td>
                    <td>{row.fender_page_found ? "Yes" : "No"}</td>
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
