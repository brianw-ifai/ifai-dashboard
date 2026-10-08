"use client";

import type { RateBar } from "@/lib/dashboard-v2/canvas/first-views";
import { BAR_THICKNESS, CHART_FONT, fitLabel, hoverNoteProps, markProps, statusColor, useHatch, useMeasuredWidth } from "./chart-primitives";

/** Horizontal rate bars (0 to 100) with the numerator and denominator beside each one. */

const ROW = 44;

export function RateBars({
  bars,
  openId,
  controls,
  onSelect,
  ariaLabel,
}: {
  bars: RateBar[];
  openId: string | null;
  controls: string;
  onSelect: (bar: RateBar) => void;
  ariaLabel: string;
}) {
  const [ref, width] = useMeasuredWidth();
  const hatch = useHatch();
  const labelW = width < 480 ? 130 : 190;
  const valueW = 150;
  const barX = labelW;
  const barW = Math.max(60, width - barX - valueW - 8);
  const height = bars.length * ROW + 6;
  return (
    <div ref={ref} className="dv2-chart" data-chart="rate-bars">
      <svg width={width} height={height} role="img" aria-label={ariaLabel}>
        {hatch.defs}
        {bars.map((bar, i) => {
          const y = i * ROW + 3;
          const open = openId === bar.id;
          const w = bar.pct === null ? 0 : (Math.min(100, Math.max(0, bar.pct)) / 100) * barW;
          return (
            <g key={bar.id} transform={`translate(0 ${y})`} {...markProps({ id: bar.id, registryId: bar.registryId, label: bar.label, open, controls, onActivate: () => onSelect(bar) })}>
              <rect x="0" y="0" width={width} height={ROW - 3} rx="10" className="dv2-mark-hit" />
              <text x="8" y={ROW / 2 - 4} fontSize={CHART_FONT} className="dv2-chart-label">
                {fitLabel(bar.label, labelW - 16)}
              </text>
              <text x="8" y={ROW / 2 + 11} fontSize={10} className="dv2-chart-muted">
                {bar.unavailable ? "unavailable" : bar.countText}
              </text>
              <rect x={barX} y={ROW / 2 - BAR_THICKNESS / 2 - 2} width={barW} height={BAR_THICKNESS} rx="4" className="dv2-track" />
              {bar.unavailable ? (
                <rect x={barX} y={ROW / 2 - BAR_THICKNESS / 2 - 2} width={barW} height={BAR_THICKNESS} rx="4" fill={hatch.fill} />
              ) : (
                <rect x={barX} y={ROW / 2 - BAR_THICKNESS / 2 - 2} width={w} height={BAR_THICKNESS} rx="4" fill="var(--dv2-series-1)" />
              )}
              {!bar.unavailable ? <circle cx={barX + barW + 12} cy={ROW / 2 - 2} r="5" fill={statusColor(bar.status)} /> : null}
              <text x={barX + barW + 22} y={ROW / 2 + 2} fontSize={14} fontWeight={700} className="dv2-chart-figure">
                {bar.figure}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="dv2-mark-notes">
        {bars.map((bar) => (
          <li key={bar.id} className="dv2-mark-note">
            {bar.label}:{" "}
            {bar.unavailable ? <span {...hoverNoteProps("unavailable", bar.reason ?? "no reading")}>unavailable</span> : `${bar.figure} (${bar.countText}), ${bar.coverageLine}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
