"use client";

import type { FormulaTree, PriceGapView } from "@/lib/dashboard-v2/canvas/first-views";
import type { PriceGapLine } from "@/lib/dashboard-v2/selectors/price-gap";
import { formatInt, formatUsd } from "@/lib/dashboard-v2/reading/format";
import { activateOnKey } from "../ExplainerDrawer";

/**
 * An estimate as a formula tree: one line per input with its value or "unavailable: not stored",
 * then the sum, shown only when every input exists. The price gap tree lists its lines
 * (listing, offer, benchmark, gap) and their sum, labeled "price gap", never revenue.
 */

export function FormulaTreeView({ tree, open, controls, onToggle }: { tree: FormulaTree; open: boolean; controls: string; onToggle: () => void }) {
  return (
    <div className="content-box dv2-formula" data-estimate={tree.registryId}>
      <button type="button" className="dv2-formula-head" aria-expanded={open} aria-controls={controls} onClick={onToggle} onKeyDown={activateOnKey(onToggle)}>
        <span className="content-box-title">{tree.name}</span>
        <span className="dv2-chart-muted">{tree.formula}</span>
      </button>
      <ul className="dv2-formula-lines">
        {tree.lines.map((line, i) => (
          <li key={line.key} className={`dv2-formula-line${line.value === null ? " dv2-formula-missing" : ""}`} data-input-key={line.key}>
            <span className="dv2-formula-op">{i === 0 ? "" : "+"}</span>
            <span className="dv2-formula-label">{line.label}</span>
            <span className="dv2-formula-value">{line.text}</span>
          </li>
        ))}
        <li className="dv2-formula-line dv2-formula-total">
          <span className="dv2-formula-op">=</span>
          <span className="dv2-formula-label">{tree.name}</span>
          <span className="dv2-formula-value">{tree.totalText ?? "unavailable until every input is stored"}</span>
        </li>
      </ul>
      {tree.reason ? <p className="dv2-spoke-note">{tree.reason}</p> : null}
    </div>
  );
}

export function PriceGapTreeView({
  view,
  lines,
  linesStatus,
  open,
  controls,
  onToggle,
}: {
  view: PriceGapView;
  lines: PriceGapLine[];
  /** Loading, ready, or the error text for the listing rows the lines come from. */
  linesStatus: string | null;
  open: boolean;
  controls: string;
  onToggle: () => void;
}) {
  const sum = lines.reduce((acc, l) => acc + Math.round(l.gap * 100), 0) / 100;
  const shown = lines.slice(0, 5);
  return (
    <div className="content-box dv2-formula" data-estimate={view.registryId}>
      <button type="button" className="dv2-formula-head" aria-expanded={open} aria-controls={controls} onClick={onToggle} onKeyDown={activateOnKey(onToggle)}>
        <span className="content-box-title">Price gap on suppressed listings</span>
        <span className="dv2-formula-figure" data-testid="price-gap-figure">
          {view.figure}
        </span>
        <span className="dv2-chart-muted">
          {view.lineCountText}, {view.coverageLine}
        </span>
      </button>
      <ul className="dv2-formula-lines">
        {shown.map((l, i) => (
          <li key={l.listingId} className="dv2-formula-line">
            <span className="dv2-formula-op">{i === 0 ? "" : "+"}</span>
            <span className="dv2-formula-label">
              {l.asin}: offer {formatUsd(l.offerPrice)} minus benchmark {formatUsd(l.benchmark)}
            </span>
            <span className="dv2-formula-value">{formatUsd(l.gap)}</span>
          </li>
        ))}
        {lines.length > shown.length ? (
          <li className="dv2-formula-line">
            <span className="dv2-formula-op">+</span>
            <span className="dv2-formula-label">{formatInt(lines.length - shown.length)} more lines in the Price gap lines tab</span>
            <span className="dv2-formula-value" />
          </li>
        ) : null}
        <li className="dv2-formula-line dv2-formula-total">
          <span className="dv2-formula-op">=</span>
          <span className="dv2-formula-label">price gap, sum of the lines</span>
          <span className="dv2-formula-value">{lines.length ? formatUsd(sum) : (linesStatus ?? "lines not loaded")}</span>
        </li>
      </ul>
      <p className="dv2-spoke-note">A price gap, not revenue. The stored sum above comes from the benchmark run; the lines come from the suppressed listings.</p>
    </div>
  );
}
