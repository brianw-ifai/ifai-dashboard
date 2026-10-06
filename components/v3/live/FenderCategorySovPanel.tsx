"use client";

import type { CanvasAiCategoryRow, CanvasCompetitorSovRow } from "@/lib/fender-canvas/types";
import { formatPct } from "@/lib/fender-canvas/format";

export function FenderCategorySovPanel({
  categories,
  sov,
}: {
  categories: CanvasAiCategoryRow[];
  sov: CanvasCompetitorSovRow[];
}) {
  const filtered = categories.filter((c) => c.category !== "hallucinations");

  return (
    <div className="content-box" style={{ marginTop: 12 }}>
      <div className="content-box-title">Share of Voice by category</div>
      <table className="table-sm">
        <thead>
          <tr>
            <th>Category</th>
            <th>Fender win %</th>
            <th>Top competitor</th>
            <th>Top competitor %</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.category}>
              <td>
                <strong>{row.category}</strong>
              </td>
              <td>{formatPct(row.fender_win_pct)}</td>
              <td>{row.top_competitor ?? "n/a"}</td>
              <td>{formatPct(row.top_competitor_pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
        Competitor breakdown (top wins by category):
      </p>
      <table className="table-sm">
        <thead>
          <tr>
            <th>Category</th>
            <th>Competitor</th>
            <th>Wins</th>
            <th>SOV %</th>
          </tr>
        </thead>
        <tbody>
          {sov
            .filter((r) => r.category !== "all")
            .slice(0, 24)
            .map((row) => (
              <tr key={`${row.category}-${row.competitor}`}>
                <td>{row.category}</td>
                <td>{row.competitor}</td>
                <td>{row.wins ?? "n/a"}</td>
                <td>{formatPct(row.sov_pct)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
