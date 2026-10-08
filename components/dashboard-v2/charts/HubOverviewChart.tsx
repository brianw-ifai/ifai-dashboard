"use client";

import type { HubOverview, HubMark } from "@/lib/dashboard-v2/canvas/first-views";
import { BAR_THICKNESS, CHART_FONT, fitLabel, hoverNoteProps, markProps, statusColor, useHatch, useMeasuredWidth } from "./chart-primitives";

/**
 * The five executive outputs as coverage-aware marks: short label, figure in the status color,
 * a thin coverage bar (read over population) with "not final" when partial, and a hatched empty
 * mark with the word "unavailable" when there is no reading.
 */

const ROW = 56;
const LABEL_W = 200;
const FIGURE_W = 120;

export function HubOverviewChart({
  view,
  openId,
  controls,
  onSelect,
}: {
  view: HubOverview;
  openId: string | null;
  controls: string;
  onSelect: (mark: HubMark) => void;
}) {
  const [ref, width] = useMeasuredWidth();
  const hatch = useHatch();
  const narrow = width < 480;
  const labelW = narrow ? 140 : LABEL_W;
  const figureW = narrow ? 90 : FIGURE_W;
  const barX = labelW + figureW;
  const barW = Math.max(60, width - barX - 8);
  const height = view.marks.length * ROW + 8;

  return (
    <div ref={ref} className="dv2-chart" data-chart="hub-overview">
      <svg width={width} height={height} role="img" aria-label="The five executive outputs with their coverage">
        {hatch.defs}
        {view.marks.map((mark, i) => {
          const y = i * ROW + 4;
          const open = openId === mark.id;
          const fill = statusColor(mark.status);
          const fraction = mark.coverage?.fraction ?? (mark.unavailable ? 0 : 1);
          return (
            <g key={mark.id} transform={`translate(0 ${y})`} {...markProps({ id: mark.id, registryId: mark.registryId, label: mark.label, open, controls, onActivate: () => onSelect(mark) })}>
              <rect x="0" y="0" width={width} height={ROW - 4} rx="10" className="dv2-mark-hit" />
              <text x="8" y={ROW / 2 - 6} fontSize={CHART_FONT} className="dv2-chart-label">
                {fitLabel(mark.label, labelW - 16)}
              </text>
              <text x="8" y={ROW / 2 + 12} fontSize={10} className="dv2-chart-muted">
                {mark.coverage ? mark.coverage.line : mark.reason ? "no coverage stored" : ""}
              </text>
              {mark.unavailable ? (
                <>
                  <rect x={labelW} y={ROW / 2 - 14} width={figureW - 12} height={BAR_THICKNESS + 6} rx="4" fill={hatch.fill} stroke="var(--dv2-neutral)" strokeWidth="1" />
                  <text x={labelW + (figureW - 12) / 2} y={ROW / 2} fontSize={11} textAnchor="middle" className="dv2-chart-label">
                    unavailable
                  </text>
                </>
              ) : (
                <>
                  <circle cx={labelW + 6} cy={ROW / 2 - 4} r="5" fill={fill} />
                  <text x={labelW + 18} y={ROW / 2} fontSize={16} fontWeight={700} className="dv2-chart-figure">
                    {mark.figure}
                  </text>
                </>
              )}
              <rect x={barX} y={ROW / 2 - 7} width={barW} height={6} rx="3" className="dv2-track" />
              {mark.unavailable ? (
                <rect x={barX} y={ROW / 2 - 7} width={barW} height={6} rx="3" fill={hatch.fill} />
              ) : (
                <rect x={barX} y={ROW / 2 - 7} width={Math.max(0, barW * fraction)} height={6} rx="3" fill="var(--dv2-series-1)" />
              )}
              <text x={barX} y={ROW / 2 + 12} fontSize={10} className="dv2-chart-muted">
                {mark.unavailable ? "unavailable" : mark.coverage?.partial ? "not final" : "coverage complete"}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="dv2-mark-notes">
        {view.marks.map((mark) => (
          <li key={mark.id} className="dv2-mark-note">
            <span>{mark.label}: </span>
            {mark.unavailable ? (
              <span {...hoverNoteProps("unavailable", mark.reason ?? "no reading")}>unavailable</span>
            ) : (
              <span>
                {mark.figure}
                {mark.coverage?.partial ? `, ${mark.coverage.line}` : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
