import type { CanvasNode } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import { readinessFindabilityFace, type FindabilityRead } from "@/lib/findability/copy";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  headlineSentence,
  headlineSurface,
  retailBubbleFaces,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";

type MetricsMap = ReturnType<typeof buildLiveMetrics>;

export function buildLiveNodes(
  bundle: CanvasBundle,
  metrics: MetricsMap,
  retail: RetailCanvasRead = { phase: "loading" },
  ai: AiSearchRead = { phase: "loading" },
  findability: FindabilityRead = { phase: "loading" },
): CanvasNode[] {
  const { m } = bundle;
  const retailFaces = retailBubbleFaces(retail);
  const aiFaces = aiNodeFaces(ai);
  const headline = headlineSurface(retail);
  const readinessFace = readinessFindabilityFace(findability, metrics.machineReadableSpecs.value);

  return [
    {
      id: "sat-prompts",
      x: 240,
      y: 200,
      r: 52,
      spokeId: "aeo",
      ...aiFaces.satPrompts,
    },
    {
      id: "sat-citations",
      x: 180,
      y: 360,
      r: 52,
      spokeId: "aeo",
      ...aiFaces.satCitations,
    },
    {
      id: "sat-drift",
      x: 260,
      y: 480,
      r: 52,
      spokeId: "aeo",
      ...aiFaces.satDrift,
    },
    {
      id: "sat-buybox",
      x: 1360,
      y: 200,
      r: 54,
      spokeId: "ecommerce",
      ...retailFaces.suppressed,
    },
    {
      id: "sat-asin",
      x: 1420,
      y: 360,
      r: 54,
      spokeId: "ecommerce",
      ...retailFaces.catalog,
    },
    {
      id: "sat-map",
      x: 1340,
      y: 480,
      r: 60,
      spokeId: "ecommerce",
      ...retailFaces.map,
    },
    {
      id: "sat-schema",
      x: 230,
      y: 720,
      r: 50,
      status: "danger",
      title: "Machine Readability",
      stats: [
        `${formatInt(m.spec_missing_additional_property)} missing additionalProperty`,
        `${formatInt(m.spec_checked)} checked`,
      ],
      meta: "fender.com JSON-LD gap",
      spokeId: "specs",
      subTab: "Machine Readability",
      tooltip: {
        title: "Schema.org Structured Data",
        desc: `${formatInt(m.spec_missing_additional_property)} pages in the older spec read lack additionalProperty. That list is on this tab. It is not the Findability count of official pages.`,
      },
    },
    {
      id: "sat-tables",
      x: 320,
      y: 870,
      r: 48,
      status: "neutral",
      title: "Amazon A+ Matrix",
      stats: ["Not measured yet"],
      spokeId: "specs",
      subTab: "Amazon A+ Matrix",
      tooltip: {
        title: "A+ comparison tables",
        desc: "Comparison tables have not been measured. When a comparison table is on the page, a shopping assistant can read the columns and repeat how the lineup steps up.",
      },
    },
    {
      id: "sat-taylor",
      x: 1370,
      y: 720,
      r: 51,
      spokeId: "competitors",
      ...aiFaces.satGap,
    },
    {
      id: "sat-amps",
      x: 1280,
      y: 870,
      r: 48,
      spokeId: "competitors",
      ...aiFaces.satLead,
    },
    {
      id: "spoke-aeo",
      x: 440,
      y: 320,
      r: 86,
      titleSize: 14.5,
      spokeId: "aeo",
      ...aiFaces.spokeAeo,
    },
    {
      id: "spoke-retail",
      x: 1160,
      y: 320,
      r: 96,
      titleSize: 13.5,
      spokeId: "ecommerce",
      ...retailFaces.main,
    },
    {
      id: "spoke-specs",
      x: 440,
      y: 680,
      r: 78,
      status: "warning",
      title: "AI Readiness",
      titleSize: 13.5,
      stats: readinessFace.stats,
      meta: readinessFace.meta,
      spokeId: "specs",
      tooltip: { title: readinessFace.tooltipTitle, desc: readinessFace.tooltipDesc },
    },
    {
      id: "spoke-competitors",
      x: 1160,
      y: 680,
      r: 78,
      titleSize: 13,
      spokeId: "competitors",
      ...aiFaces.spokeCompetitors,
    },
    {
      id: "spoke-fixes",
      x: 800,
      y: 180,
      r: 74,
      status: "success",
      title: "Action Items",
      titleSize: 14,
      stats: [`${metrics.phaseOneLift.value} est.`, metrics.enterprisePotential.value],
      meta: metrics.enterprisePotential.value + " Enterprise",
      spokeId: "suggestions",
      tooltip: {
        title: "Action Items",
        desc: `Phase 1 estimate ${metrics.phaseOneLift.value}. Enterprise estimate ${metrics.enterprisePotential.value}.`,
      },
    },
    {
      id: "spoke-roadmap",
      x: 800,
      y: 820,
      r: 74,
      status: "success",
      title: "Strategy Roadmap",
      titleSize: 14,
      stats: ["90 Days", "3 Phases"],
      meta: headline.countLabel ? `${headline.label}: ${headline.countLabel}` : headline.label,
      spokeId: "roadmap",
      tooltip: {
        title: "90-Day Portfolio Roadmap",
        desc: headlineSentence(headline),
      },
    },
    {
      id: "hub",
      x: 800,
      y: 500,
      r: 98,
      status: "danger",
      variant: "hub",
      title: "Brand Portfolio",
      stats: [
        `${formatInt(m.catalog_skus)} SKUs`,
        `${formatInt(bundle.divisions.length || m.division_count)} Divisions`,
      ],
      logoSrc: "/image.png",
      meta: "Click for Master View",
      spokeId: "hub",
      tooltip: {
        title: "Brand Portfolio Overview",
        desc: `${formatInt(m.catalog_skus)} monitored SKUs across ${formatInt(bundle.divisions.length || m.division_count)} divisions. Open for executive briefing and division performance.`,
      },
    },
  ];
}
