"use client";

import { useCallback, useMemo } from "react";
import { IntelligenceCanvas } from "@/lib/canvas-sdk/IntelligenceCanvas";
import { buildDashboardV2Spec, type SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import { headerText, type SpokeId } from "@/lib/dashboard-v2/canvas/spec-model";
import type { SandboxBundle } from "@/lib/dashboard-v2/data/types";
import { selectAll } from "@/lib/dashboard-v2/selectors/index";
import { SpokePanel } from "./SpokePanel";

const scopedStyle = `
.dv2-spoke { display: grid; gap: 14px; }
.dv2-spoke-intro, .dv2-spoke-note, .dv2-explainer-note { font-size: 12.5px; line-height: 1.5; color: var(--text-muted); margin: 0; }
.dv2-spoke-table { display: grid; gap: 10px; }
.dv2-remote-status { font-size: 12.5px; color: var(--text-muted); margin: 0; }
.dv2-remote-error strong { color: var(--text-main); }
.dv2-remote-count { font-size: 12px; color: var(--text-muted); margin: 0 0 6px; }
.dv2-explainer { display: grid; gap: 10px; padding: 10px 12px; font-size: 12.5px; }
.dv2-explainer-title { margin: 0; font-size: 13px; }
.dv2-explainer-list { display: grid; gap: 4px; margin: 0; }
.dv2-explainer-row { display: grid; grid-template-columns: 130px 1fr; gap: 10px; }
.dv2-explainer-row dt { color: var(--text-muted); }
.dv2-explainer-row dd { margin: 0; overflow-wrap: anywhere; }
.dv2-explainer a { color: var(--color-indigo); text-decoration: underline; }
.dv2-input-lines { margin: 0; padding-left: 16px; }
.dv2-header-asof { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.dv2-money { display: grid; gap: 14px; }
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
