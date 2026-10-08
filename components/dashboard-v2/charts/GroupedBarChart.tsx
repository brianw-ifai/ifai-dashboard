"use client";

import type { GroupedBars, PairBar } from "@/lib/dashboard-v2/canvas/first-views";
import { CHART_FONT, fitLabel, Legend, markProps, seriesColor, useHatch, useMeasuredWidth } from "./chart-primitives";

/**
 * Grouped horizontal bars by category: the brand's share against the top rival's share, with
 * the resolved count as the row label. Rows arrive sorted by brand share ascending.
 */

const ROW = 52;
const BAR = 12;

export function GroupedBarChart({
  view,
  openId,
  controls,
  onSelect,
}: {
  view: GroupedBars;
  openId: string | null;
  controls: string;
  onSelect: (row: PairBar) => void;
}) {
  const [ref, width] = useMeasuredWidth();
  const hatch = useHatch();
  const labelW = width < 480 ? 110 : 150;
  const valueW = 64;
  const barX = labelW;
  const barW = Math.max(60, width - barX - valueW - 8);
  const height = view.rows.length * ROW + 6;
  if (view.rows.length === 0) {
    return <p className="dv2-spoke-note">unavailable: {view.reason ?? "no category can be ranked"}</p>;
  }
  return (
    <div ref={ref} className="dv2-chart" data-chart="grouped-bars">
      <Legend items={[{ label: view.clientLabel, color: seriesColor(0) }, { label: "top rival", color: seriesColor(2) }]} />
      <svg width={width} height={height} role="img" aria-label="Answer share by category, brand against the top rival">
        {hatch.defs}
        {view.rows.map((row, i) => {
          const y = i * ROW + 3;
          const id = `category-${row.category}`;
          const open = openId === id;
          const cw = row.clientPct === null ? 0 : (row.clientPct / 100) * barW;
          const rw = row.rivalPct === null ? 0 : (row.rivalPct / 100) * barW;
          return (
            <g key={row.category} transform={`translate(0 ${y})`} {...markProps({ id, registryId: row.registryId, label: row.label, open, controls, onActivate: () => onSelect(row) })}>
              <rect x="0" y="0" width={width} height={ROW - 3} rx="10" className="dv2-mark-hit" />
              <text x="8" y={ROW / 2 - 6} fontSize={CHART_FONT} className="dv2-chart-label">
                {fitLabel(row.label, labelW - 16)}
              </text>
              <text x="8" y={ROW / 2 + 10} fontSize={10} className="dv2-chart-muted">
                {row.resolvedText}
              </text>
              <rect x={barX} y={ROW / 2 - BAR - 3} width={barW} height={BAR} rx="4" className="dv2-track" />
              {row.clientPct === null ? (
                <rect x={barX} y={ROW / 2 - BAR - 3} width={barW} height={BAR} rx="4" fill={hatch.fill} />
              ) : (
                <rect x={barX} y={ROW / 2 - BAR - 3} width={cw} height={BAR} rx="4" fill={seriesColor(0)} />
              )}
              <text x={barX + barW + 8} y={ROW / 2 - 3} fontSize={11} fontWeight={700} className="dv2-chart-figure">
                {row.clientFigure}
              </text>
              <rect x={barX} y={ROW / 2 + 1} width={barW} height={BAR} rx="4" className="dv2-track" />
              {row.rivalPct === null ? (
                <rect x={barX} y={ROW / 2 + 1} width={barW} height={BAR} rx="4" fill={hatch.fill} />
              ) : (
                <rect x={barX} y={ROW / 2 + 1} width={rw} height={BAR} rx="4" fill={seriesColor(2)} />
              )}
              <text x={barX + barW + 8} y={ROW / 2 + 11} fontSize={11} className="dv2-chart-muted">
                {row.rivalFigure}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="dv2-mark-notes">
        {view.rows.map((row) => (
          <li key={row.category} className="dv2-mark-note">
            {row.label}: {view.clientLabel} {row.clientFigure}; top rival {row.rivalName ?? "not stored"} {row.rivalFigure}; {row.resolvedText}
          </li>
        ))}
      </ul>
    </div>
  );
}
