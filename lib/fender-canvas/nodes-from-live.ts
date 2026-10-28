import type { CanvasNode } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import { readinessFindabilityFace, type FindabilityRead } from "@/lib/findability/copy";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";
import { specPageCounts } from "@/lib/fender-canvas/machine-readability";
import {
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
  findability: FindabilityRead = { phase: "loading" },
): CanvasNode[] {
  const { m } = bundle;
  const schemaPages = specPageCounts(bundle.specPages);
  const retailFaces = retailBubbleFaces(retail);
  const aiFaces = aiNodeFaces(ai);
  const readinessFace = readinessFindabilityFace(findability, formatPct(m.spec_avg_amazon_pct));

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
      status: !schemaPages ? "warning" : schemaPages.withSpecBlock === schemaPages.pages ? "success" : "danger",
      title: "Machine Readability",
      stats: schemaPages
        ? [`${formatPct(schemaPages.specBlockPct)} spec block`, `${formatInt(schemaPages.pages)} pages checked`]
        : ["Not available*"],
      meta: "fender.com product data",
      spokeId: "specs",
      subTab: "Machine Readability",
      tooltip: {
        title: "Machine-readable specs",
        desc: schemaPages
          ? `${formatInt(schemaPages.missingSpecBlock)} of ${formatInt(schemaPages.pages)} fender.com product pages have no spec block, so AI engines cannot read those specs as product data.`
          : "The fender.com page read could not be loaded.",
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
      tooltip: { title: "", desc: "" },
    },
    {
      ...primarySpoke("spoke-roadmap"),
      status: "success",
      title: "Strategy Roadmap",
      stats: ["90 Days", "3 Phases"],
      spokeId: "roadmap",
      tooltip: { title: "", desc: "" },
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
