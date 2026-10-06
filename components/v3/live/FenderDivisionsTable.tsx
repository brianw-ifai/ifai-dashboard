"use client";

import type { CanvasDivisionRow } from "@/lib/fender-canvas/types";
import { formatInt, formatPct, pendingLabel } from "@/lib/fender-canvas/format";

export function FenderDivisionsTable({ divisions }: { divisions: CanvasDivisionRow[] }) {
  return (
    <div className="content-box">
      <div className="content-box-title">
        <span>FMIC Catalog Division Performance Matrix (Live)</span>
        <span className="tag-badge tag-neutral">{formatInt(divisions.length)} divisions</span>
      </div>
      <table className="table-sm">
        <thead>
          <tr>
            <th>Catalog Division</th>
            <th>Monitored SKUs</th>
            <th>Buy Box (Active Offers)</th>
            <th>Splinter Bundles</th>
            <th>Schema Sync</th>
            <th>Primary Threat</th>
          </tr>
        </thead>
        <tbody>
          {divisions.map((row) => (
            <tr key={row.division}>
              <td>
                <strong>{row.division}</strong>
              </td>
              <td>{formatInt(row.monitored_skus)}</td>
              <td>{formatPct(row.buybox_pct)}</td>
              <td>{formatInt(row.splinter_bundles)}</td>
              <td>
                {row.schema_sync_pct != null ? formatPct(row.schema_sync_pct) : pendingLabel()}
              </td>
              <td>{row.primary_threat?.trim() || "n/a"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
