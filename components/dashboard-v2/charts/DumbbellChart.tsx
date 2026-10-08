"use client";

import type { GroupedBars, PairBar } from "@/lib/dashboard-v2/canvas/first-views";
import { CHART_FONT, fitLabel, Legend, markProps, seriesColor, useMeasuredWidth } from "./chart-primitives";

/**
 * A dot pair per category: the brand's share and the top rival's share on one 0 to 100 line,
 * joined by a hairline. The gap between the dots is the competitive distance.
 */

const ROW = 40;

export function DumbbellChart({
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
  const labelW = width < 480 ? 100 : 140;
  const rightW = 110;
  const x0 = labelW;
  const span = Math.max(60, width - x0 - rightW - 8);
  const height = view.rows.length * ROW + 6;
  if (view.rows.length === 0) {
    return <p className="dv2-spoke-note">unavailable: {view.reason ?? "no category can be ranked"}</p>;
  }
  const px = (pct: number) => x0 + (Math.min(100, Math.max(0, pct)) / 100) * span;
  return (
    <div ref={ref} className="dv2-chart" data-chart="dumbbell">
      <Legend items={[{ label: view.clientLabel, color: seriesColor(0) }, { label: "top rival", color: seriesColor(2) }]} />
      <svg width={width} height={height} role="img" aria-label="Brand share against the top rival, per category">
        {view.rows.map((row, i) => {
          const y = i * ROW + 3;
          const id = `rival-${row.category}`;
          const open = openId === id;
          const cy = ROW / 2 - 2;
          return (
            <g key={row.category} transform={`translate(0 ${y})`} {...markProps({ id, registryId: row.registryId, label: row.label, open, controls, onActivate: () => onSelect(row) })}>
              <rect x="0" y="0" width={width} height={ROW - 3} rx="10" className="dv2-mark-hit" />
              <text x="8" y={cy + 4} fontSize={CHART_FONT} className="dv2-chart-label">
                {fitLabel(row.label, labelW - 16)}
              </text>
              <line x1={x0} x2={x0 + span} y1={cy} y2={cy} className="dv2-grid" />
              {row.clientPct !== null && row.rivalPct !== null ? (
                <line x1={px(row.rivalPct)} x2={px(row.clientPct)} y1={cy} y2={cy} stroke="var(--dv2-neutral)" strokeWidth="2" />
              ) : null}
              {row.rivalPct !== null ? <circle cx={px(row.rivalPct)} cy={cy} r="6" fill={seriesColor(2)} className="dv2-dot" /> : null}
              {row.clientPct !== null ? <circle cx={px(row.clientPct)} cy={cy} r="6" fill={seriesColor(0)} className="dv2-dot" /> : null}
              <text x={x0 + span + 10} y={cy + 4} fontSize={11} className="dv2-chart-figure" fontWeight={700}>
                {row.clientFigure}
              </text>
              <text x={x0 + span + 10} y={cy + 15} fontSize={9} className="dv2-chart-muted">
                {row.rivalName ? fitLabel(`${row.rivalName} ${row.rivalFigure}`, rightW - 12) : "rival not stored"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
