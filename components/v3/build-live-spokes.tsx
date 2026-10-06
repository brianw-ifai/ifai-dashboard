import type { ReactNode } from "react";
import { FenderCategorySovPanel } from "@/components/v3/live/FenderCategorySovPanel";
import { FenderDivisionsTable } from "@/components/v3/live/FenderDivisionsTable";
import { FenderListingsTable } from "@/components/v3/live/FenderListingsTable";
import { MapChannelPanel } from "@/components/v3/live/MapChannelPanel";
import { recordedKeepaSuppressionHtml } from "@/components/v3/retail-partner-led";
import { FenderSimulationsPanel } from "@/components/v3/live/FenderSimulationsPanel";
import { FenderSpecPanel } from "@/components/v3/live/FenderSpecPanel";
import type { SpokeDefinition, SpokeId } from "@/components/v3/spoke-data-types";
import { spokeData } from "@/components/v3/spoke-data";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import { bindNarrativeSpoke } from "@/lib/fender-canvas/spoke-narrative";
import { bindCopy, buildTemplateVars } from "@/lib/fender-canvas/template-vars";

function htmlBlock(html: string) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

type TabOverride = (bundle: CanvasBundle, vars: Record<string, string>) => ReactNode | null;

const TAB_OVERRIDES: Partial<
  Record<SpokeId, Partial<Record<number, TabOverride>>>
> = {
  hub: {
    1: (bundle) => <FenderDivisionsTable divisions={bundle.divisions} />,
  },
  ecommerce: {
    0: (_bundle, vars) => (
      <>
        {htmlBlock(
          bindCopy(
            `<div class="ceo-callout"><div class="ceo-callout-header"><span>What does Buy Box coverage mean?</span></div><div class="ceo-callout-body">{catalog_skus} SKUs, {bb_total} active offers ({active_offer_coverage_pct}). {bb_1p_pct} ({bb_1p} of {bb_total}) Amazon 1P; {bb_3p} confirmed 3P; {bb_unharvested} seller unknown.</div></div>`,
            vars,
          ),
        )}
        <FenderListingsTable />
        {htmlBlock(recordedKeepaSuppressionHtml)}
      </>
    ),
    2: () => <MapChannelPanel />,
  },
  aeo: {
    1: () => <FenderSimulationsPanel />,
  },
  specs: {
    0: (bundle, vars) => {
      const tpl = spokeData.specs.render(0);
      return (
        <>
          {typeof tpl === "string" ? htmlBlock(bindCopy(tpl, vars)) : tpl}
          <FenderSpecPanel missing={bundle.missing} />
        </>
      );
    },
    1: (bundle, vars) => {
      const tpl = spokeData.specs.render(1);
      return (
        <>
          {typeof tpl === "string" ? htmlBlock(bindCopy(tpl, vars)) : tpl}
          <FenderSpecPanel missing={bundle.missing} />
        </>
      );
    },
  },
  competitors: {
    0: (bundle, vars) => {
      const tpl = spokeData.competitors.render(0);
      return (
        <>
          {typeof tpl === "string" ? htmlBlock(bindCopy(tpl, vars)) : tpl}
          <FenderCategorySovPanel categories={bundle.cats} sov={bundle.sov} />
        </>
      );
    },
  },
};

function wrapSpoke(id: SpokeId, bundle: CanvasBundle, vars: Record<string, string>): SpokeDefinition {
  const bound = bindNarrativeSpoke(spokeData[id], vars);
  const overrides = TAB_OVERRIDES[id] ?? {};

  return {
    ...bound,
    render: (tabIdx) => {
      const custom = overrides[tabIdx]?.(bundle, vars);
      if (custom) return custom;
      const content = bound.render(tabIdx);
      if (typeof content === "string") return htmlBlock(content);
      return content;
    },
  };
}

export function buildLiveSpokes(bundle: CanvasBundle): Record<SpokeId, SpokeDefinition> {
  const vars = buildTemplateVars(bundle);
  const ids = Object.keys(spokeData) as SpokeId[];
  const out = {} as Record<SpokeId, SpokeDefinition>;
  for (const id of ids) out[id] = wrapSpoke(id, bundle, vars);
  return out;
}
