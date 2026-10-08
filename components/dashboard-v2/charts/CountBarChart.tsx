"use client";

import type { CountBar, CountBars } from "@/lib/dashboard-v2/canvas/first-views";
import { BAR_THICKNESS, CHART_FONT, fitLabel, markProps, seriesColor, useMeasuredWidth } from "./chart-primitives";

/** Horizontal count bars, one hue, the count at each bar end. */

const ROW = 30;

export function CountBarChart({
  view,
  openId,
  controls,
  onSelect,
}: {
  view: CountBars;
  openId: string | null;
  controls: string;
  onSelect: (bar: CountBar, view: CountBars) => void;
}) {
  const [ref, width] = useMeasuredWidth();
  const labelW = width < 480 ? 110 : 150;
  const valueW = 56;
  const barW = Math.max(40, width - labelW - valueW - 8);
  const height = Math.max(ROW, view.bars.length * ROW) + 4;
  return (
    <div ref={ref} className="dv2-chart" data-chart={view.id}>
      <p className="dv2-chart-title">{view.title}</p>
      {view.bars.length === 0 ? <p className="dv2-spoke-note">No open Action Items.</p> : null}
      <svg width={width} height={height} role="img" aria-label={view.title}>
        {view.bars.map((bar, i) => {
          const y = i * ROW + 2;
          const id = `${view.id}-${bar.key}`;
          const open = openId === id;
          const w = view.max > 0 ? (bar.count / view.max) * barW : 0;
          return (
            <g key={bar.key} transform={`translate(0 ${y})`} {...markProps({ id, registryId: view.registryId, label: `${bar.label} ${bar.figure}`, open, controls, onActivate: () => onSelect(bar, view) })}>
              <rect x="0" y="0" width={width} height={ROW - 2} rx="8" className="dv2-mark-hit" />
              <text x="8" y={ROW / 2 + 3} fontSize={CHART_FONT} className="dv2-chart-label">
                {fitLabel(bar.label, labelW - 16)}
              </text>
              <rect x={labelW} y={ROW / 2 - BAR_THICKNESS / 2 - 1} width={barW} height={BAR_THICKNESS} rx="4" className="dv2-track" />
              <rect x={labelW} y={ROW / 2 - BAR_THICKNESS / 2 - 1} width={w} height={BAR_THICKNESS} rx="4" fill={seriesColor(0)} />
              <text x={labelW + barW + 8} y={ROW / 2 + 3} fontSize={12} fontWeight={700} className="dv2-chart-figure">
                {bar.figure}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
