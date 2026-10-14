import type { ReactNode } from "react";
import { buildLiveSpokes } from "@/components/v3/build-live-spokes";
import { fenderCommandCenter } from "@/components/v3/command-center-data";
import { fenderGlossary } from "@/components/v3/glossary";
import { FENDER_METRICS, fenderWidgetMetrics } from "@/components/v3/fender-metrics";
import { fenderStaticNodes } from "@/components/v3/fender-static-nodes";
import { spokeData } from "@/components/v3/spoke-data";
import staticTourSteps from "@/data/fender-v3-tour.json";
import graphLayout from "@/data/fender-v3-spokes.json";
import type { TourStep } from "@/lib/canvas-sdk/types";
import type { CanvasUserMenu } from "@/lib/canvas-sdk/types";
import { defineCanvas } from "@/lib/canvas-sdk/types";
import { aiMetrics } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import { buildLiveCommandCenter } from "@/lib/fender-canvas/command-center-from-live";
import { headlineSentence, headlineSurface } from "@/lib/fender-canvas/portfolio-retail-display";
import { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { buildLiveNodes } from "@/lib/fender-canvas/nodes-from-live";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import { fenderCanvasEdges, frameTourStep, withPrimaryFocusTargets } from "@/lib/fender-canvas/primary-spoke-layout";
import { buildLiveTourSteps } from "@/lib/fender-canvas/tour-from-live";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

const FOCUS_TARGETS = withPrimaryFocusTargets(
  graphLayout.focusTargets as Record<string, { x: number; y: number }>,
);
const tourSteps = (staticTourSteps as TourStep[]).map(frameTourStep);

export type BuildCanvasSpecOptions = {
  userMenu?: CanvasUserMenu;
  viewerId?: string;
  headerSlot?: ReactNode;
  metricStorageSuffix?: string;
  retail?: RetailCanvasRead;
  aiSearch?: AiSearchRead;
};

function viewerStorageScope(viewerId?: string) {
  if (!viewerId) return "anonymous";
  let hash = 2166136261;
  for (const character of viewerId.trim().toLowerCase()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/** Static fallback when Supabase is unavailable on first paint. */
export function buildStaticFenderCanvasSpec(options: BuildCanvasSpecOptions = {}) {
  return buildFenderCanvasSpec(null, options);
}

export function buildFenderCanvasSpec(
  bundle: CanvasBundle | null,
  options: BuildCanvasSpecOptions = {},
) {
  const retail = options.retail ?? { phase: "loading" as const };
  const aiSearch = options.aiSearch ?? { phase: "loading" as const };
  const live = bundle ? buildLiveMetrics(bundle, retail) : null;
  const metrics = live ? (Object.assign({}, live, aiMetrics(aiSearch)) as typeof live) : FENDER_METRICS;
  const widgetList = bundle
    ? Object.values(metrics)
    : fenderWidgetMetrics;

  const ai = metrics.overallAiWinRate;
  const headline = headlineSurface(retail);

  return defineCanvas({
    appearance: "iom",
    commandCenter: bundle ? buildLiveCommandCenter(bundle, retail, aiSearch) : fenderCommandCenter,
    glossary: fenderGlossary,
    metricWidgets: {
      metrics: widgetList,
      defaults: [
        metrics.flaggedAsins.id,
        metrics.confirmedHallucinations.id,
        metrics.phaseOneLift.id,
      ],
      storageKey: `ifai:fender:metric-widgets:v2:${options.metricStorageSuffix ?? viewerStorageScope(options.viewerId)}`,
    },
    brand: {
      name: "IntoFocus AEO Consensus Control",
      subtitle: "",
      logoSrc: "/icon.png",
    },
    headerSlot: options.headerSlot,
    tickers: [
      {
        id: "buybox",
        tone: "danger",
        icon: "pulse",
        spokeId: "ecommerce",
        subTab: headline.tab,
        label: headlineSentence(headline),
      },
      {
        id: "aeo",
        tone: "warning",
        icon: "sparkles",
        spokeId: "aeo",
        subTab: "run summary",
        label: (
          <>
            AI Win Rate: <strong>{ai.value}</strong> · {ai.detail}
          </>
        ),
      },
      {
        id: "opportunity",
        tone: "success",
        icon: "trending",
        spokeId: "suggestions",
        subTab: "roi",
        label: (
          <>
            Lift: <strong>{metrics.phaseOneLift.value} Phase 1</strong> (
            {metrics.enterprisePotential.value} Enterprise)
          </>
        ),
      },
    ],
    showLegend: false,
    legend: [
      { status: "danger", label: "Critical / Buy Box Suppression" },
      { status: "warning", label: "At Risk / Review Splintering" },
      { status: "success", label: "On Track / Lift Target" },
    ],
    badges: [],
    edges: fenderCanvasEdges(),
    nodes: bundle ? buildLiveNodes(bundle, metrics, retail, aiSearch) : fenderStaticNodes,
    spokes: bundle ? buildLiveSpokes(bundle, retail, aiSearch) : spokeData,
    focusTargets: FOCUS_TARGETS,
    tour: bundle ? buildLiveTourSteps(bundle, retail, aiSearch) : tourSteps,
    ...(options.userMenu
      ? { userMenu: options.userMenu, userEmail: options.userMenu.email }
      : {}),
  });
}
