import { basePath } from "@/lib/dashboard-v2/data/client-paths";
import type { ReactNode } from "react";
import { defineCanvas, type CanvasSpec, type CanvasTicker, type SpokeContent } from "@/lib/canvas-sdk/types";
import type { SandboxBundle } from "../data/types";
import { selectAll, type AllSelections } from "../selectors/index";
import { dashboardV2Glossary } from "./glossary";
import { buildSpecModel, METRIC_STORAGE_KEY, type SpecModel, type SpokeId } from "./spec-model";

export type SpokeRenderContext = {
  all: AllSelections;
  model: SpecModel;
  bundle: SandboxBundle;
};

export type BuildDashboardV2Options = {
  /** Header control; the page passes the oldest-source as-of line. */
  headerSlot?: ReactNode;
  /** Renders one spoke tab. Supplied by the client component so this module stays free of component imports. */
  renderSpoke: (spokeId: SpokeId, tabIdx: number, ctx: SpokeRenderContext) => ReactNode;
  userEmail?: string;
};

export type DashboardV2Spec = { spec: CanvasSpec; model: SpecModel; all: AllSelections };

/**
 * Builds the IntelligenceCanvas spec for dashboard v2 from a sandbox bundle. Every string on a
 * surface comes from the selectors through the spec model; this file only attaches React.
 */
export function buildDashboardV2Spec(bundle: SandboxBundle, options: BuildDashboardV2Options): DashboardV2Spec {
  const all = selectAll(bundle);
  const model = buildSpecModel(all);
  const ctx: SpokeRenderContext = { all, model, bundle };

  const spokes: Record<string, SpokeContent> = {};
  for (const def of model.spokes) {
    spokes[def.id] = {
      badge: def.badge,
      title: def.title,
      desc: def.desc,
      tabs: def.tabs,
      navLabel: def.navLabel,
      next: def.next,
      render: (tabIdx) => options.renderSpoke(def.id, tabIdx, ctx),
    };
  }

  const tickers: CanvasTicker[] = model.tickers.map((t) => ({
    id: t.id,
    label: t.label,
    tone: t.tone,
    spokeId: t.spokeId,
    subTab: t.subTab,
    icon: "pulse",
  }));

  const spec = defineCanvas({
    appearance: "iom",
    brand: { name: model.brand.name, subtitle: model.brand.subtitle, logoSrc: `${basePath()}/icon.png` },
    glossary: dashboardV2Glossary,
    commandCenter: model.commandCenter,
    metricWidgets: { metrics: model.metrics, defaults: model.metricDefaults, storageKey: METRIC_STORAGE_KEY },
    tickers,
    legend: model.legend,
    showLegend: true,
    nodes: model.nodes,
    edges: model.edges,
    badges: [],
    spokes,
    focusTargets: model.focusTargets,
    tour: model.tour,
    headerSlot: options.headerSlot,
    ...(options.userEmail ? { userEmail: options.userEmail } : {}),
  });

  return { spec, model, all };
}
