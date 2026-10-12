import type { ReactNode } from "react";
import { CatalogGovernancePanel } from "@/components/v3/live/CatalogGovernancePanel";
import { AiDriftPanel } from "@/components/v3/live/ai-search/AiDriftPanel";
import { CategoryBattlecardsPanel } from "@/components/v3/live/ai-search/CategoryBattlecardsPanel";
import { CitationEcosystemPanel } from "@/components/v3/live/ai-search/CitationEcosystemPanel";
import { CompetitorWinsPanel } from "@/components/v3/live/ai-search/CompetitorWinsPanel";
import { EngineComparisonPanel } from "@/components/v3/live/ai-search/EngineComparisonPanel";
import { RunSummaryPanel } from "@/components/v3/live/ai-search/RunSummaryPanel";
import { SimulationsExplorer } from "@/components/v3/live/ai-search/SimulationsExplorer";
import { FenderDivisionsTable } from "@/components/v3/live/FenderDivisionsTable";
import { MapChannelPanel } from "@/components/v3/live/MapChannelPanel";
import { RetailOverview } from "@/components/v3/live/RetailOverview";
import { SuppressedListingsPanel } from "@/components/v3/live/SuppressedListingsPanel";
import { CatalogReadinessSpec } from "@/components/v3/live/CatalogReadinessSpec";
import { AplusExplanation, SchemaExplanation } from "@/components/v3/live/FenderSpecNarratives";
import { SchemaAdditionalPropertyList } from "@/components/v3/live/SchemaAdditionalPropertyList";
import type { SpokeDefinition, SpokeId } from "@/components/v3/spoke-data-types";
import { spokeData } from "@/components/v3/spoke-data";
import { aiActionCardHtml, aiSpokeDesc, competitorsSpokeDesc } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import { RETAIL_PANEL_TABS, type RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import { MUSICIANS_FRIEND_FRESHNESS_JOB } from "@/lib/fender-canvas/map-reading-status";
import { retailTemplateVars } from "@/lib/fender-canvas/retail-copy";
import { bindNarrativeSpoke } from "@/lib/fender-canvas/spoke-narrative";
import { buildTemplateVars } from "@/lib/fender-canvas/template-vars";

function htmlBlock(html: string) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

type TabOverride = (
  bundle: CanvasBundle,
  vars: Record<string, string>,
  retail: RetailCanvasRead,
) => ReactNode | null;

const TAB_OVERRIDES: Partial<
  Record<SpokeId, Partial<Record<number, TabOverride>>>
> = {
  hub: {
    1: (bundle) => <FenderDivisionsTable divisions={bundle.divisions} />,
  },
  ecommerce: {
    0: (_bundle, _vars, retail) => <RetailOverview read={retail} />,
    1: (_bundle, _vars, retail) => <SuppressedListingsPanel read={retail} />,
    2: (bundle, _vars, retail) => (
      <MapChannelPanel
        read={retail}
        musiciansFriendFreshness={
          bundle.fresh.find((row) => row.job_key === MUSICIANS_FRIEND_FRESHNESS_JOB) ?? null
        }
      />
    ),
    3: (_bundle, _vars, retail) => <CatalogGovernancePanel read={retail} />,
  },
  aeo: {
    0: () => <RunSummaryPanel />,
    1: () => <SimulationsExplorer />,
    2: () => <AiDriftPanel />,
    3: () => <CitationEcosystemPanel />,
  },
  specs: {
    0: (bundle) => <CatalogReadinessSpec bundle={bundle} />,
    1: () => (
      <>
        <SchemaExplanation />
        <SchemaAdditionalPropertyList />
      </>
    ),
    2: () => <AplusExplanation />,
  },
  competitors: {
    0: () => <CategoryBattlecardsPanel />,
    1: () => <CompetitorWinsPanel />,
    2: () => <EngineComparisonPanel />,
  },
};

function wrapSpoke(
  id: SpokeId,
  bundle: CanvasBundle,
  vars: Record<string, string>,
  retail: RetailCanvasRead,
  ai: AiSearchRead,
): SpokeDefinition {
  const bound = bindNarrativeSpoke(spokeData[id], vars);
  const overrides = TAB_OVERRIDES[id] ?? {};

  return {
    ...bound,
    ...(id === "ecommerce"
      ? {
          title: "Portfolio Retail",
          desc: "Suppressed Featured Offers, MAP leakage, and unnested bundles, and how those catalog and retail issues change what AI search can recommend.",
          tabs: [...RETAIL_PANEL_TABS],
        }
      : {}),
    ...(id === "aeo" ? { desc: aiSpokeDesc(ai) } : {}),
    ...(id === "competitors" ? { desc: competitorsSpokeDesc(ai) } : {}),
    render: (tabIdx) => {
      const custom = overrides[tabIdx]?.(bundle, vars, retail);
      if (custom) return custom;
      const content = bound.render(tabIdx);
      if (typeof content === "string") return htmlBlock(content);
      return content;
    },
  };
}

export function buildLiveSpokes(
  bundle: CanvasBundle,
  retail: RetailCanvasRead = { phase: "loading" },
  ai: AiSearchRead = { phase: "loading" },
): Record<SpokeId, SpokeDefinition> {
  const vars = {
    ...buildTemplateVars(bundle),
    ...retailTemplateVars(bundle, retail),
    ai_action_card: aiActionCardHtml(ai),
  };
  const ids = Object.keys(spokeData) as SpokeId[];
  const out = {} as Record<SpokeId, SpokeDefinition>;
  for (const id of ids) out[id] = wrapSpoke(id, bundle, vars, retail, ai);
  return out;
}
