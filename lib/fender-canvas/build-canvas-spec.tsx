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
import { buildLiveCommandCenter } from "@/lib/fender-canvas/command-center-from-live";
import { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { buildLiveNodes } from "@/lib/fender-canvas/nodes-from-live";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import { buildLiveTourSteps } from "@/lib/fender-canvas/tour-from-live";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import { formatInt } from "@/lib/fender-canvas/format";

const FOCUS_TARGETS = graphLayout.focusTargets as Record<string, { x: number; y: number }>;
const tourSteps = staticTourSteps as TourStep[];

const STATIC_EDGES = [
  { x1: 800, y1: 500, x2: 440, y2: 320 },
  { x1: 800, y1: 500, x2: 1160, y2: 320 },
  { x1: 800, y1: 500, x2: 440, y2: 680 },
  { x1: 800, y1: 500, x2: 1160, y2: 680 },
  { x1: 800, y1: 500, x2: 800, y2: 180 },
  { x1: 800, y1: 500, x2: 800, y2: 820, kind: "active" as const },
  { x1: 440, y1: 320, x2: 240, y2: 200 },
  { x1: 440, y1: 320, x2: 180, y2: 360 },
  { x1: 440, y1: 320, x2: 260, y2: 480 },
  { x1: 1160, y1: 320, x2: 1360, y2: 200, kind: "critical" as const },
  { x1: 1160, y1: 320, x2: 1420, y2: 360, kind: "critical" as const },
  { x1: 1160, y1: 320, x2: 1340, y2: 480 },
  { x1: 440, y1: 680, x2: 230, y2: 720 },
  { x1: 440, y1: 680, x2: 320, y2: 870 },
  { x1: 1160, y1: 680, x2: 1370, y2: 720 },
  { x1: 1160, y1: 680, x2: 1280, y2: 870 },
];

export type BuildCanvasSpecOptions = {
  userMenu?: CanvasUserMenu;
  viewerId?: string;
  headerSlot?: ReactNode;
  metricStorageSuffix?: string;
  retail?: RetailCanvasRead;
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
  const metrics = bundle ? buildLiveMetrics(bundle) : FENDER_METRICS;
  const widgetList = bundle
    ? Object.values(metrics)
    : fenderWidgetMetrics;

  const m = bundle?.m;
  const bb = metrics.buyBoxRetention.value;
  const ai = metrics.overallAiWinRate.value;
  const beginner = metrics.beginnerAiWinRate.value;

  return defineCanvas({
    appearance: "iom",
    commandCenter: bundle ? buildLiveCommandCenter(bundle) : fenderCommandCenter,
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
        subTab: "Retail Overview",
        label: (
          <>
            Buy Box (Active Offers): <strong>{bb} 1P</strong> ({m ? formatInt(m.bb_1p) : "n/a"} of{" "}
            {m ? formatInt(m.bb_total) : "n/a"} active)
          </>
        ),
      },
      {
        id: "aeo",
        tone: "warning",
        icon: "sparkles",
        spokeId: "aeo",
        subTab: "dual-index",
        label: (
          <>
            AI Win Rate: <strong>{ai}</strong> · Weakest:{" "}
            <strong>
              {m?.weakest_category ?? "Beginner"} {beginner}
            </strong>
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
    edges: STATIC_EDGES,
    nodes: bundle ? buildLiveNodes(bundle, metrics, options.retail) : fenderStaticNodes,
    spokes: bundle ? buildLiveSpokes(bundle, options.retail) : spokeData,
    focusTargets: FOCUS_TARGETS,
    tour: bundle ? buildLiveTourSteps(bundle) : tourSteps,
    ...(options.userMenu
      ? { userMenu: options.userMenu, userEmail: options.userMenu.email }
      : {}),
  });
}
