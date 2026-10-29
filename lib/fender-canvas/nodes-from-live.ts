import type { CanvasNode } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import { readinessFindabilityFace, type FindabilityRead } from "@/lib/findability/copy";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";
import {
  retailBubbleFaces,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import { primarySpoke, satelliteNode } from "@/lib/fender-canvas/primary-spoke-layout";
import type { NodeStatus } from "@/lib/canvas-sdk/types";

type MetricsMap = ReturnType<typeof buildLiveMetrics>;

const EMPTY_TOOLTIP = { title: "", desc: "" } as const;

/** Share of found fender.com pages missing additionalProperty — same figure the tab leads with. */
function machineReadabilitySatellite(m: CanvasBundle["m"]): Pick<
  CanvasNode,
  "status" | "title" | "stats" | "meta" | "heroValue" | "subTab" | "tooltip"
> {
  const found = m.spec_fender_found;
  const missing = m.spec_missing_additional_property;
  const ready = found != null && found > 0 && missing != null && missing >= 0 && missing <= found;
  const rate = ready ? (100 * missing!) / found! : null;
  const status: NodeStatus =
    rate == null ? "neutral" : rate > 0 ? "danger" : "success";
  const value = ready ? formatPct(rate) : "Not available";
  return {
    status,
    title: "Machine Readability",
    stats: [
      `${formatInt(m.spec_missing_additional_property)} missing additionalProperty`,
      `${formatInt(m.spec_checked)} checked`,
    ],
    meta: "fender.com JSON-LD gap",
    heroValue: { value, label: "missing additionalProperty" },
    subTab: "Machine Readability",
    tooltip: { ...EMPTY_TOOLTIP },
  };
}

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
      spokeId: "specs",
      ...machineReadabilitySatellite(m),
    },
    {
      ...satelliteNode("sat-tables"),
      status: "neutral",
      title: "Amazon A+ Matrix",
      stats: ["Not measured"],
      heroValue: { value: "Not measured", label: "Comparison tables" },
      spokeId: "specs",
      subTab: "Amazon A+ Matrix",
      tooltip: { ...EMPTY_TOOLTIP },
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
