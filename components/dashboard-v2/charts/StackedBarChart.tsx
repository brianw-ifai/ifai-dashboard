"use client";

import type { Slice, StackedBar } from "@/lib/dashboard-v2/canvas/first-views";
import { GAP, hoverNoteProps, Legend, markProps, seriesColor, useHatch, useMeasuredWidth } from "./chart-primitives";

/**
 * One horizontal stacked bar. Slices are separated by a 2px surface gap and each carries its
 * count in the legend; a label sits inside a slice only when it fits. Neutral slices (not read)
 * are hatched. When the slices do not sum to the total, the remainder is drawn hatched too.
 */

const H = 22;

export function StackedBarChart({
  view,
  openId,
  controls,
  onSelect,
}: {
  view: StackedBar;
  openId: string | null;
  controls: string;
  onSelect: (slice: Slice) => void;
}) {
  const [ref, width] = useMeasuredWidth();
  const hatch = useHatch();
  const total = view.total.status === "unavailable" ? null : view.total.value;
  const sum = view.slices.reduce((acc, s) => acc + (s.count ?? 0), 0);
  const denominator = total !== null && total > 0 ? Math.max(total, sum) : sum > 0 ? sum : 1;
  const barW = Math.max(40, width - 8);
  const remainder = total !== null ? Math.max(0, total - sum) : 0;
  // Slice positions, computed once per render: each starts where the previous one ended plus the gap.
  const placed = view.slices.reduce<Array<{ slice: Slice; x: number; w: number }>>((acc, s) => {
    const prev = acc[acc.length - 1];
    const start = prev ? prev.x + prev.w + GAP : 4;
    const w = Math.max(0, ((s.count ?? 0) / denominator) * barW - GAP);
    acc.push({ slice: s, x: start, w });
    return acc;
  }, []);
  const endX = placed.length ? placed[placed.length - 1].x + placed[placed.length - 1].w + GAP : 4;
  return (
    <div ref={ref} className="dv2-chart" data-chart={view.id}>
      <p className="dv2-chart-title">
        {view.title}: {view.totalFigure} {view.totalLabel}
        <span className="dv2-chart-muted"> ({view.coverageLine})</span>
      </p>
      <svg width={width} height={H + 8} role="img" aria-label={`${view.title} over ${view.totalLabel}`}>
        {hatch.defs}
        <rect x="4" y="4" width={barW} height={H} rx="4" className="dv2-track" />
        {placed.map(({ slice: s, x: sx, w }) => {
          const id = `${view.id}-${s.key}`;
          const open = openId === id;
          const fits = w > s.label.length * 6.5 + 12;
          return (
            <g key={s.key} {...markProps({ id, registryId: s.registryId, label: `${s.label} ${s.figure}`, open, controls, onActivate: () => onSelect(s) })}>
              <rect x={sx} y="4" width={Math.max(w, s.unavailable ? 18 : 0)} height={H} rx="3" fill={s.tone === "neutral" || s.unavailable ? hatch.fill : seriesColor(s.seriesIndex)} />
              {fits ? (
                <text x={sx + 6} y={4 + H / 2 + 4} fontSize={11} fontWeight={700} fill="#fff" className="dv2-slice-label">
                  {s.label} {s.figure}
                </text>
              ) : null}
            </g>
          );
        })}
        {remainder > 0 ? <rect x={endX} y="4" width={Math.max(0, (remainder / denominator) * barW - GAP)} height={H} rx="3" fill={hatch.fill} /> : null}
      </svg>
      <Legend
        items={[
          ...view.slices.map((s) => ({ label: `${s.label}: ${s.figure}`, color: s.tone === "neutral" || s.unavailable ? undefined : seriesColor(s.seriesIndex), hatched: s.tone === "neutral" || s.unavailable })),
          ...(remainder > 0 ? [{ label: "not in these states", hatched: true }] : []),
        ]}
      />
      {view.slices.some((s) => s.unavailable) ? (
        <ul className="dv2-mark-notes">
          {view.slices
            .filter((s) => s.unavailable)
            .map((s) => (
              <li key={s.key} className="dv2-mark-note">
                {s.label}: <span {...hoverNoteProps("unavailable", s.reason ?? "no reading")}>unavailable</span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
