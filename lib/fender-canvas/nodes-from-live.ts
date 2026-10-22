import type { CanvasNode } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import { readinessFindabilityFace, type FindabilityRead } from "@/lib/findability/copy";
import { formatInt } from "@/lib/fender-canvas/format";
import {
  retailBubbleFaces,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import { primarySpoke, satelliteNode } from "@/lib/fender-canvas/primary-spoke-layout";

/** Shown until Action Items and Strategy Roadmap are wired to live data. */
export const EXAMPLE_BUBBLE_NOTE =
  "The information in this bubble is not optimized to live data, and is simply a visual example of what will eventually be displayed.";

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
  const readinessFace = readinessFindabilityFace(findability, metrics.machineReadableSpecs.value);

  return [
    {
      ...satelliteNode("sat-prompts"),
      spokeId: "aeo",
      ...aiFaces.satPrompts,
    },
    {
      ...satelliteNode("sat-citations"),
      spokeId: "aeo",
      ...aiFaces.satCitations,
    },
    {
      ...satelliteNode("sat-drift"),
      spokeId: "aeo",
      ...aiFaces.satDrift,
    },
    {
      ...satelliteNode("sat-buybox"),
      spokeId: "ecommerce",
      ...retailFaces.suppressed,
    },
    {
      ...satelliteNode("sat-asin"),
      spokeId: "ecommerce",
      ...retailFaces.catalog,
    },
    {
      ...satelliteNode("sat-map"),
      spokeId: "ecommerce",
      ...retailFaces.map,
    },
    {
      ...satelliteNode("sat-schema"),
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
      ...satelliteNode("sat-tables"),
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
      ...satelliteNode("sat-taylor"),
      spokeId: "competitors",
      ...aiFaces.satGap,
    },
    {
      ...satelliteNode("sat-amps"),
      spokeId: "competitors",
      ...aiFaces.satLead,
    },
    {
      ...aiFaces.spokeAeo,
      spokeId: "aeo",
      ...primarySpoke("spoke-aeo"),
    },
    {
      ...retailFaces.main,
      spokeId: "ecommerce",
      ...primarySpoke("spoke-retail"),
    },
    {
      ...primarySpoke("spoke-specs"),
      status: "warning",
      title: "AI Readiness",
      stats: readinessFace.stats,
      meta: readinessFace.meta,
      spokeId: "specs",
      tooltip: { title: readinessFace.tooltipTitle, desc: readinessFace.tooltipDesc },
    },
    {
      ...aiFaces.spokeCompetitors,
      spokeId: "competitors",
      ...primarySpoke("spoke-competitors"),
    },
    {
      ...primarySpoke("spoke-fixes"),
      status: "success",
      title: "Action Items",
      stats: [`${metrics.phaseOneLift.value} est.`, metrics.enterprisePotential.value],
      meta: metrics.enterprisePotential.value + " Enterprise",
      spokeId: "suggestions",
      tooltip: {
        // title: "Action Items",
        // desc: `Phase 1 estimate ${metrics.phaseOneLift.value}. Enterprise estimate ${metrics.enterprisePotential.value}.`,
        title: "",
        desc: EXAMPLE_BUBBLE_NOTE,
        hasMoreInfo: false,
      },
    },
    {
      ...primarySpoke("spoke-roadmap"),
      status: "success",
      title: "Strategy Roadmap",
      stats: ["90 Days", "3 Phases"],
      spokeId: "roadmap",
      tooltip: {
        // title: "90-Day Portfolio Roadmap",
        // desc: headlineSentence(headline),
        title: "",
        desc: EXAMPLE_BUBBLE_NOTE,
        hasMoreInfo: false,
      },
    },
    {
      id: "hub",
      x: 800,
      y: 500,
      r: 98,
      status: "danger",
      variant: "hub",
      title: "Summary",
      stats: [
        `${formatInt(m.catalog_skus)} SKUs`,
        `${formatInt(bundle.divisions.length || m.division_count)} Divisions`,
      ],
      logoSrc: "/image.png",
      meta: "Click for Master View",
      spokeId: "hub",
      tooltip: {
        title: "Summary",
        desc: `${formatInt(m.catalog_skus)} monitored SKUs across ${formatInt(bundle.divisions.length || m.division_count)} divisions. Open for Briefing and Performance.`,
      },
    },
  ];
}
