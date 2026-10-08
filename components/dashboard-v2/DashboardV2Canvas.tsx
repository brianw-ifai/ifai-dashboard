"use client";

import { useCallback, useMemo } from "react";
import { IntelligenceCanvas } from "@/lib/canvas-sdk/IntelligenceCanvas";
import { buildDashboardV2Spec, type SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import { headerText, type SpokeId } from "@/lib/dashboard-v2/canvas/spec-model";
import type { SandboxBundle } from "@/lib/dashboard-v2/data/types";
import { selectAll } from "@/lib/dashboard-v2/selectors/index";
import { SpokePanel } from "./SpokePanel";

const scopedStyle = `
.ifai-canvas {
  --dv2-series-1: #3987e5; --dv2-series-2: #199e70; --dv2-series-3: #d95926;
  --dv2-neutral: var(--text-subtle); --dv2-track: var(--border-color);
  --dv2-status-danger: var(--danger-red); --dv2-status-warning: var(--warning-amber);
  --dv2-status-success: var(--success-green); --dv2-status-neutral: var(--text-subtle);
}
.ifai-canvas.light-theme { --dv2-series-1: #2a78d6; --dv2-series-2: #1baf7a; --dv2-series-3: #eb6834; }
.dv2-panel, .dv2-spoke { display: grid; gap: 14px; min-width: 0; }
.dv2-spoke-intro, .dv2-spoke-note, .dv2-explainer-note, .dv2-read-more-line { font-size: 12.5px; line-height: 1.5; color: var(--text-muted); margin: 0; }
.dv2-spoke-table { display: grid; gap: 10px; min-width: 0; }
.dv2-remote-status { font-size: 12.5px; color: var(--text-muted); margin: 0; }
.dv2-remote-error strong { color: var(--text-main); }
.dv2-remote-count { font-size: 12px; color: var(--text-muted); margin: 0 0 6px; }
.dv2-explainer { display: grid; gap: 10px; padding: 10px 12px; font-size: 12.5px; }
.dv2-explainer-title { margin: 0; font-size: 13px; }
.dv2-explainer-subtitle { font-weight: 400; color: var(--text-muted); }
.dv2-explainer-list { display: grid; gap: 4px; margin: 0; }
.dv2-explainer-row { display: grid; grid-template-columns: 130px 1fr; gap: 10px; }
.dv2-explainer-row dt { color: var(--text-muted); }
.dv2-explainer-row dd { margin: 0; overflow-wrap: anywhere; min-width: 0; }
.dv2-explainer a { color: var(--color-indigo); text-decoration: underline; }
.dv2-input-line { display: block; }
.dv2-input-lines { margin: 0; padding-left: 16px; }
.dv2-input-table { font-size: 11.5px; }
.dv2-header-asof { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.dv2-money { display: grid; gap: 14px; }
.dv2-drawer { gap: 8px; }
.dv2-drawer-head { display: flex; justify-content: space-between; align-items: center; }
.dv2-drawer-kicker { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); }
.dv2-card-grid { align-items: start; }
.dv2-card-drawer-slot { grid-column: 1 / -1; }
.dv2-reading-card { padding: 0; }
.dv2-card-btn { appearance: none; background: none; border: 0; color: inherit; font: inherit; text-align: left; width: 100%; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; border-radius: 16px; }
.dv2-card-btn:focus-visible, .dv2-headline:focus-visible, .dv2-formula-head:focus-visible { outline: 2px solid var(--color-indigo); outline-offset: 2px; }
.dv2-reading-card-open { border-color: var(--color-indigo); }
.dv2-card-btn .metric-card-val { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
.dv2-card-btn .metric-card-sub { font-size: 11px; color: var(--text-muted); }
.dv2-status-chip { padding: 3px 8px; font-size: 9.5px; margin-top: 2px; }
.dv2-headline { appearance: none; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; color: inherit; font: inherit; text-align: left; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; }
.dv2-headline-figure { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
.dv2-headline.tone-danger .dv2-headline-figure { color: var(--danger-text); }
.dv2-headline.tone-warning .dv2-headline-figure { color: var(--warning-text); }
.dv2-headline.tone-success .dv2-headline-figure { color: var(--success-text); }
.dv2-headline .metric-card-sub { font-size: 11px; color: var(--text-muted); }
.dv2-chart-block { gap: 10px; }
.dv2-chart { display: grid; gap: 8px; min-width: 0; }
.dv2-chart svg { display: block; max-width: 100%; overflow: visible; }
.dv2-chart-title { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--text-main); }
.dv2-chart-label { fill: var(--text-main); }
.dv2-chart-figure { fill: var(--text-main); font-variant-numeric: tabular-nums; }
.dv2-chart-muted { fill: var(--text-muted); color: var(--text-muted); font-size: 11px; }
.dv2-track { fill: var(--dv2-track); }
.dv2-grid { stroke: var(--border-color); stroke-width: 1; }
.dv2-dot { stroke: var(--bg-card); stroke-width: 2; }
.dv2-mark { cursor: pointer; outline: none; }
.dv2-mark-hit { fill: transparent; }
.dv2-mark:hover .dv2-mark-hit, .dv2-mark:focus-visible .dv2-mark-hit { fill: var(--bg-surface-hover); }
.dv2-mark-open .dv2-mark-hit { stroke: var(--color-indigo); stroke-width: 1.5; fill: var(--bg-surface-hover); }
.dv2-mark:focus-visible .dv2-mark-hit { stroke: var(--color-indigo); stroke-width: 2; }
.dv2-slice-label { pointer-events: none; }
.dv2-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 11px; color: var(--text-muted); }
.dv2-legend li { display: inline-flex; align-items: center; gap: 6px; }
.dv2-legend-swatch { width: 10px; height: 10px; border-radius: 3px; background: var(--dv2-track); display: inline-block; }
.dv2-legend-hatched { background: repeating-linear-gradient(45deg, var(--dv2-neutral) 0 1.5px, transparent 1.5px 5px); }
.dv2-mark-notes { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; font-size: 11px; color: var(--text-muted); }
.dv2-hover-note { color: var(--text-main); }
.dv2-asof-strip { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 12px; color: var(--text-muted); }
.dv2-asof-strip li { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dv2-asof-source { color: var(--text-main); font-weight: 600; }
.dv2-chart-pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.dv2-read-more { gap: 8px; }
.dv2-formula { gap: 8px; }
.dv2-formula-head { appearance: none; background: none; border: 0; color: inherit; font: inherit; text-align: left; padding: 0; display: flex; flex-direction: column; gap: 4px; cursor: pointer; border-radius: 8px; }
.dv2-formula-figure { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
.dv2-formula-lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 12.5px; }
.dv2-formula-line { display: grid; grid-template-columns: 16px 1fr auto; gap: 8px; align-items: baseline; padding: 4px 0; border-bottom: 1px solid var(--border-color); }
.dv2-formula-op { color: var(--text-muted); text-align: center; }
.dv2-formula-label { color: var(--text-main); min-width: 0; overflow-wrap: anywhere; }
.dv2-formula-value { font-variant-numeric: tabular-nums; color: var(--text-main); text-align: right; }
.dv2-formula-missing .dv2-formula-value { color: var(--text-muted); font-style: italic; }
.dv2-formula-total { border-bottom: 0; font-weight: 700; }
@media (max-width: 640px) {
  .dv2-header-asof { white-space: normal; font-size: 10.5px; max-width: 150px; line-height: 1.2; }
}
@media (max-width: 520px) {
  .dv2-explainer-row { grid-template-columns: 1fr; gap: 2px; }
  .metric-grid-2.dv2-card-grid { grid-template-columns: 1fr; }
}
`;

function HeaderAsOf({ text }: { text: string }) {
  return (
    <span className="dv2-header-asof" data-testid="header-asof">
      {text}
    </span>
  );
}

/** Builds the canvas spec from the server-loaded bundle and renders the SDK canvas. */
export function DashboardV2Canvas({ bundle, userEmail }: { bundle: SandboxBundle; userEmail?: string }) {
  const renderSpoke = useCallback(
    (spokeId: SpokeId, tabIdx: number, ctx: SpokeRenderContext) => <SpokePanel spokeId={spokeId} tabIdx={tabIdx} ctx={ctx} />,
    [],
  );
  const header = useMemo(() => headerText(selectAll(bundle)), [bundle]);
  const built = useMemo(
    () => buildDashboardV2Spec(bundle, { headerSlot: <HeaderAsOf text={header} />, renderSpoke, userEmail }),
    [bundle, header, renderSpoke, userEmail],
  );

  return (
    <>
      <style>{scopedStyle}</style>
      <IntelligenceCanvas spec={built.spec} />
    </>
  );
}

export default DashboardV2Canvas;
