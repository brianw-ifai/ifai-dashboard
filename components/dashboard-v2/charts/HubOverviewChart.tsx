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
const FIGURE_FONT = 16;
const FIGURE_X = 18;

/**
 * Splits a label into at most two lines that fit the pixel budget at the chart font, breaking on
 * spaces. A line that still does not fit is truncated by fitLabel, so a long label wraps before it
 * is cut. The label text itself is never changed.
 */
function wrapLabel(text: string, maxPx: number): string[] {
  const perChar = CHART_FONT * 0.56;
  const max = Math.max(3, Math.floor(maxPx / perChar));
  if (text.length <= max) return [text];
  const words = text.split(" ");
  let first = "";
  for (const word of words) {
    const next = first ? `${first} ${word}` : word;
    if (next.length > max && first) break;
    first = next;
  }
  const rest = text.slice(first.length).trim();
  if (!rest) return [fitLabel(first, maxPx)];
  return [fitLabel(first, maxPx), fitLabel(rest, maxPx)];
}

/** The figure column is as wide as the longest figure, so the coverage bar never starts under one. */
function figureColumnWidth(figures: string[], minimum: number): number {
  const longest = figures.reduce((n, f) => Math.max(n, f.length), 0);
  return Math.max(minimum, Math.ceil(FIGURE_X + longest * FIGURE_FONT * 0.62 + 10));
}

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
  const figureW = figureColumnWidth(
    view.marks.filter((m) => !m.unavailable).map((m) => m.figure),
    narrow ? 90 : FIGURE_W,
  );
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
          const labelLines = wrapLabel(mark.label, labelW - 16);
          const twoLines = labelLines.length > 1;
          return (
            <g key={mark.id} transform={`translate(0 ${y})`} {...markProps({ id: mark.id, registryId: mark.registryId, label: mark.label, open, controls, onActivate: () => onSelect(mark) })}>
              <rect x="0" y="0" width={width} height={ROW - 4} rx="10" className="dv2-mark-hit" />
              <text x="8" y={twoLines ? 16 : ROW / 2 - 6} fontSize={CHART_FONT} className="dv2-chart-label">
                {labelLines.map((line, n) => (
                  <tspan key={n} x="8" dy={n === 0 ? 0 : 13}>
                    {n < labelLines.length - 1 ? `${line} ` : line}
                  </tspan>
                ))}
              </text>
              <text x="8" y={twoLines ? 42 : ROW / 2 + 12} fontSize={10} className="dv2-chart-muted">
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
                  <text x={labelW + FIGURE_X} y={ROW / 2} fontSize={FIGURE_FONT} fontWeight={700} className="dv2-chart-figure">
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
