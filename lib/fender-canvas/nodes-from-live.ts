import type { CanvasNode, NodeStatus } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import type { FindabilityRead } from "@/lib/findability/copy";
import { pageFoundHero, pageFoundTone } from "@/lib/fender-canvas/ai-readiness-lead";
import { formatInt } from "@/lib/fender-canvas/format";
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
  // Official-page outcomes feed the Findability tab; the main spoke uses page-found metrics.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained for buildLiveNodes callers
  findability: FindabilityRead = { phase: "loading" },
): CanvasNode[] {
  const { m } = bundle;
  const retailFaces = retailBubbleFaces(retail);
  const aiFaces = aiNodeFaces(ai);
  // Main AI Readiness spoke leads with the same fender.com page-found share as the tab hero.
  const pageHero = pageFoundHero(m);
  const pageTone = pageFoundTone(m.spec_fender_found_pct);
  const readinessStatus: NodeStatus = pageTone ?? "neutral";
  const readinessHero =
    pageHero.ratio != null
      ? { value: pageHero.percent, label: "fender.com page found" }
      : { value: pageHero.percent === "Pending data" ? "Pending data" : "Not available", label: "fender.com page found" };
  const divisionCount = formatInt(bundle.divisions.length || m.division_count);
  const skuCount = formatInt(m.catalog_skus);

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
      status: readinessStatus,
      title: "AI Readiness",
      stats: [],
      heroValue: readinessHero,
      spokeId: "specs",
      tooltip: { title: "", desc: "" },
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
      stats: [],
      // Phase 1 dollar figure stays an analyst estimate — never a fee or ROI multiple.
      heroValue: { value: metrics.phaseOneLift.value, label: "est. Phase 1 lift" },
      spokeId: "suggestions",
      tooltip: { title: "", desc: "" },
    },
    {
      ...primarySpoke("spoke-roadmap"),
      status: "success",
      title: "Strategy Roadmap",
      stats: [],
      heroValue: { value: "90 Days", label: "3 phases" },
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
      stats: [],
      heroValue: {
        value: skuCount === "Pending data" ? "Pending data" : skuCount,
        label: `SKUs · ${divisionCount} divisions`,
      },
      logoSrc: "/image.png",
      spokeId: "hub",
      tooltip: {
        title: "Summary",
        desc: `${skuCount} monitored SKUs across ${divisionCount} divisions. Open for Briefing and Performance.`,
      },
    },
  ];
}
