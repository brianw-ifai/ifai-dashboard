"use client";

import { useCallback, useEffect, useState } from "react";
import { listingsQuery } from "@/lib/canvasData";
import type { CanvasRetailListingRow } from "@/lib/fender-canvas/types";
import { formatInt, formatUsd, pendingLabel } from "@/lib/fender-canvas/format";

type Filter = {
  status?: string;
  violationsOnly?: boolean;
  bundlesOnly?: boolean;
};

function leakageStyle(value: number | null) {
  if (value == null) return {};
  if (value < 0) return { color: "var(--danger-red)" };
  return {};
}

export function FenderListingsTable() {
  const [rows, setRows] = useState<CanvasRetailListingRow[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({});

  const pageSize = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err, count } = await listingsQuery(page, pageSize, filter);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setRows((data ?? []) as CanvasRetailListingRow[]);
    setTotal(count ?? null);
    setLoading(false);
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return (
    <div className="content-box" style={{ marginTop: 12 }}>
      <div className="content-box-title">
        <span>Retail Listings Drill-Down</span>
        {total != null ? (
          <span className="tag-badge tag-neutral">{formatInt(total)} rows</span>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
        <button
          type="button"
          className={`segmented-btn${!filter.violationsOnly && !filter.bundlesOnly ? " active" : ""}`}
          onClick={() => {
            setPage(0);
            setFilter({});
          }}
        >
          All
        </button>
        <button
          type="button"
          className={`segmented-btn${filter.violationsOnly ? " active" : ""}`}
          onClick={() => {
            setPage(0);
            setFilter({ violationsOnly: true });
          }}
        >
          MAP violations only
        </button>
        <button
          type="button"
          className={`segmented-btn${filter.bundlesOnly ? " active" : ""}`}
          onClick={() => {
            setPage(0);
            setFilter({ bundlesOnly: true });
          }}
        >
          Bundles only
        </button>
      </div>

      {error ? (
        <p style={{ color: "var(--danger-red)", fontSize: 12 }}>{error}</p>
      ) : null}

      <div style={{ overflowX: "auto" }}>
        <table className="table-sm">
          <thead>
            <tr>
              <th>Model / SKU</th>
              <th>Child ASIN</th>
              <th>Partner / Bundle</th>
              <th>MAP</th>
              <th>Offer</th>
              <th>Leakage</th>
              <th>Walmart</th>
              <th>MF</th>
              <th>Reviews</th>
              <th>Channels</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={10}>Loading listings…</td>
              </tr>
            ) : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={10}>n/a</td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const label = row.model_name?.trim() || row.title?.trim() || "n/a";
              const partner = row.bundle_name ?? row.buybox_seller_name ?? "n/a";
              return (
                <tr key={row.asin}>
                  <td>
                    <strong>{label}</strong>
                  </td>
                  <td>
                    <span className="asin-chip">{row.asin}</span>
                  </td>
                  <td>{partner}</td>
                  <td>{row.map_price != null ? formatUsd(row.map_price) : pendingLabel()}</td>
                  <td style={leakageStyle(row.worst_leakage)}>
                    {row.offer_price != null ? formatUsd(row.offer_price) : pendingLabel()}
                  </td>
                  <td style={leakageStyle(row.worst_leakage)}>
                    {row.worst_leakage != null
                      ? formatUsd(row.worst_leakage, { signed: true })
                      : pendingLabel()}
                  </td>
                  <td>
                    {row.wmt_price != null ? (
                      <>
                        {formatUsd(row.wmt_price)}
                        {row.wmt_leakage != null ? (
                          <span style={leakageStyle(row.wmt_leakage)}>
                            {" "}
                            ({formatUsd(row.wmt_leakage, { signed: true })})
                          </span>
                        ) : null}
                        {row.wmt_url ? (
                          <>
                            {" "}
                            <a href={row.wmt_url} target="_blank" rel="noreferrer">
                              link
                            </a>
                          </>
                        ) : null}
                      </>
                    ) : (
                      "n/a"
                    )}
                  </td>
                  <td>
                    {row.mf_price != null ? (
                      <>
                        {formatUsd(row.mf_price)}
                        {row.mf_leakage != null ? (
                          <span style={leakageStyle(row.mf_leakage)}>
                            {" "}
                            ({formatUsd(row.mf_leakage, { signed: true })})
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "n/a"
                    )}
                  </td>
                  <td>{row.reviews_count != null ? formatInt(row.reviews_count) : pendingLabel()}</td>
                  <td>{row.channels?.trim() || "n/a"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
        <button
          type="button"
          className="segmented-btn"
          disabled={page <= 0 || loading}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Page {page + 1} of {pages}
        </span>
        <button
          type="button"
          className="segmented-btn"
          disabled={page + 1 >= pages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
