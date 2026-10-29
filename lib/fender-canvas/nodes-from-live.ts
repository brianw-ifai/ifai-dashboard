import type { CanvasNode, NodeStatus } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import type { AiSearchRead } from "@/lib/ai-search/types";
import type { FindabilityRead } from "@/lib/findability/copy";
import {
  EXACT_PAGE_SHARE_BANDS,
  outcomeShareFigure,
  outcomeSharePct,
} from "@/lib/findability/lead";
import { countFindability } from "@/lib/findability/outcomes";
import { pageFoundHero, pageFoundTone } from "@/lib/fender-canvas/ai-readiness-lead";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";
import {
  retailBubbleFaces,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import { primarySpoke, satelliteNode } from "@/lib/fender-canvas/primary-spoke-layout";

type MetricsMap = ReturnType<typeof buildLiveMetrics>;

const EMPTY_TOOLTIP = { title: "", desc: "" } as const;

/** Exact official product page share — same figure the Findability tab leads with. */
function findabilitySatellite(findability: FindabilityRead): Pick<
  CanvasNode,
  "status" | "title" | "stats" | "meta" | "heroValue" | "subTab" | "tooltip"
> {
  if (findability.phase === "loading") {
    return {
      status: "neutral",
      title: "Findability",
      stats: ["Loading"],
      heroValue: { value: "Loading", label: "exact official product page" },
      subTab: "Findability",
      tooltip: { ...EMPTY_TOOLTIP },
    };
  }
  if (findability.phase === "error") {
    return {
      status: "danger",
      title: "Findability",
      stats: ["Read failed"],
      heroValue: { value: "Read failed", label: "exact official product page" },
      subTab: "Findability",
      tooltip: { ...EMPTY_TOOLTIP },
    };
  }
  const counts = countFindability(findability.rows);
  if (counts.total <= 0) {
    return {
      status: "neutral",
      title: "Findability",
      stats: ["No listings"],
      heroValue: { value: "No listings", label: "exact official product page" },
      subTab: "Findability",
      tooltip: { ...EMPTY_TOOLTIP },
    };
  }
  const pct = outcomeSharePct(counts, "exact_official_product");
  const value = outcomeShareFigure(counts, "exact_official_product") ?? "Not available";
  const status: NodeStatus =
    pct == null
      ? "neutral"
      : pct < EXACT_PAGE_SHARE_BANDS.redBelow
        ? "danger"
        : pct > EXACT_PAGE_SHARE_BANDS.greenAbove
          ? "success"
          : "warning";
  return {
    status,
    title: "Findability",
    stats: [
      `${formatInt(counts.exact_official_product)} of ${formatInt(counts.total)} exact`,
    ],
    meta: "Official-page outcomes",
    heroValue: { value, label: "exact official product page" },
    subTab: "Findability",
    tooltip: { ...EMPTY_TOOLTIP },
  };
}

/**
 * Share of found fender.com pages missing additionalProperty — same rate the Machine
 * Readability list and the AI Readiness tab's fourth hero use (missing / found).
 * When every found page is on that list the share is 100%; that is accurate, not a placeholder.
 */
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
  // Main AI Readiness spoke opens the AI Readiness tab and leads with its page-found hero.
  const pageHero = pageFoundHero(m);
  const pageTone = pageFoundTone(m.spec_fender_found_pct);
  const readinessStatus: NodeStatus = pageTone ?? "neutral";
  const readinessHero =
    pageHero.ratio != null
      ? { value: pageHero.percent, label: "fender.com page found" }
      : { value: pageHero.percent === "Pending data" ? "Pending data" : "Not available", label: "fender.com page found" };

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
      ...satelliteNode("sat-findability"),
      spokeId: "specs",
      ...findabilitySatellite(findability),
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
      status: readinessStatus,
      title: "AI Readiness",
      stats: [],
      heroValue: readinessHero,
      spokeId: "specs",
      subTab: "AI Readiness",
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
      logoSrc: "/image.png",
      spokeId: "hub",
      tooltip: { title: "", desc: "" },
    },
  ];
}
