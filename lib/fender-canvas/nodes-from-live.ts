import type { CanvasNode } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";
import {
  headlineSentence,
  headlineSurface,
  retailBubbleFaces,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import { primarySpoke, satelliteNode } from "@/lib/fender-canvas/primary-spoke-layout";

type MetricsMap = ReturnType<typeof buildLiveMetrics>;

export function buildLiveNodes(
  bundle: CanvasBundle,
  metrics: MetricsMap,
  retail: RetailCanvasRead = { phase: "loading" },
  ai: AiSearchRead = { phase: "loading" },
): CanvasNode[] {
  const { m } = bundle;
  const retailFaces = retailBubbleFaces(retail);
  const aiFaces = aiNodeFaces(ai);
  const headline = headlineSurface(retail);

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
        desc: `${formatPct(m.spec_fender_found_pct)} of audited SKUs have a fender.com page (${formatInt(m.spec_fender_found)} of ${formatInt(m.spec_checked)}). ${formatInt(m.spec_missing_additional_property)} pages lack additionalProperty specs.`,
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
      stats: [
        `${metrics.fenderFindability.value} Found`,
        `${metrics.machineReadableSpecs.value} Amazon specs`,
      ],
      meta: `${formatInt(m.spec_checked)} SKUs checked`,
      spokeId: "specs",
      tooltip: {
        title: "AI Readiness: Product Specs",
        desc: `fender.com findability ${metrics.fenderFindability.value}. Amazon structured completeness ${metrics.machineReadableSpecs.value} on average.`,
      },
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
        title: "Action Items",
        desc: `Phase 1 estimate ${metrics.phaseOneLift.value}. Enterprise estimate ${metrics.enterprisePotential.value}.`,
      },
    },
    {
      ...primarySpoke("spoke-roadmap"),
      status: "success",
      title: "Strategy Roadmap",
      stats: ["90 Days", "3 Phases"],
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
