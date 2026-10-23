import type { CanvasNode } from "@/lib/canvas-sdk/types";
import { FENDER_METRICS } from "@/components/v3/fender-metrics";
import { aiNodeFaces } from "@/lib/ai-search/canvas-surfaces";
import { retailBubbleFaces } from "@/lib/fender-canvas/portfolio-retail-display";
import { primarySpoke, satelliteNode } from "@/lib/fender-canvas/primary-spoke-layout";

const retailFaces = retailBubbleFaces({ phase: "loading" });
const aiFaces = aiNodeFaces({ phase: "loading" });

export const fenderStaticNodes: CanvasNode[] = [
    {
      ...aiFaces.satPrompts,
      spokeId: "aeo",
      ...satelliteNode("sat-prompts"),
    },
    {
      ...aiFaces.satCitations,
      spokeId: "aeo",
      ...satelliteNode("sat-citations"),
    },
    {
      ...aiFaces.satDrift,
      spokeId: "aeo",
      ...satelliteNode("sat-drift"),
    },
    {
      ...retailFaces.suppressed,
      spokeId: "ecommerce",
      ...satelliteNode("sat-buybox"),
    },
    {
      ...retailFaces.catalog,
      spokeId: "ecommerce",
      ...satelliteNode("sat-asin"),
    },
    {
      ...retailFaces.map,
      spokeId: "ecommerce",
      ...satelliteNode("sat-map"),
    },
    {
      ...satelliteNode("sat-schema"),
      status: "danger",
      title: "Machine Readability",
      stats: ["0% Specs", "62 Checked"],
      meta: "additionalProperty Missing",
      spokeId: "specs",
      subTab: "Machine Readability",
      tooltip: {"title": "Schema.org Structured Data", "desc": "Across 19 SKUs, site search found a fender.com product page only 36.8% of the time (7/19). None of those 7 pages has an additionalProperty JSON-LD field, so AI engines have no machine-readable nut width, fingerboard radius, or pickup configuration to read. The specs exist only as human-readable HTML tables."},
    },
    {
      ...satelliteNode("sat-tables"),
      status: "neutral",
      title: "Amazon A+ Matrix",
      stats: ["Not measured yet"],
      spokeId: "specs",
      subTab: "Amazon A+ Matrix",
      tooltip: {"title": "A+ comparison tables", "desc": "Comparison tables have not been measured. When a comparison table is on the page, a shopping assistant can read the columns and repeat how the lineup steps up."},
    },
    {
      ...aiFaces.satGap,
      spokeId: "competitors",
      ...satelliteNode("sat-taylor"),
    },
    {
      ...aiFaces.satLead,
      spokeId: "competitors",
      ...satelliteNode("sat-amps"),
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
      stats: ["Official pages", "Five outcomes"],
      meta: "Exact, family, no page, ambiguous, unchecked",
      spokeId: "specs",
      // The stats and meta above carry the counts; no hover explainer needed.
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
      stats: [
        `${FENDER_METRICS.prioritizedFixes.value} Actions`,
        FENDER_METRICS.phaseOneLift.value,
      ],
      meta: "Pilot ➔ $38M to $62M Ent.",
      spokeId: "suggestions",
      tooltip: {
        // title: "Action Items",
        // desc: "18 high-impact brand interventions. Compare the Phase 1 Quick-Win ($680K) with the full enterprise portfolio potential ($38M to $62M GMV).",
        title: "",
        desc: "The information in this bubble is not optimized to live data, and is simply a visual example of what will eventually be displayed.",
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
        // desc: retailFaces.main.tooltip.desc,
        title: "",
        desc: "The information in this bubble is not optimized to live data, and is simply a visual example of what will eventually be displayed.",
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
      stats: [],
      logoSrc: "/image.png",
      meta: "Click for Master View",
      spokeId: "hub",
      tooltip: {"title": "Summary", "desc": "Click to open the Summary: 5 brand divisions, the Briefing, and Opportunity."},
    },
];
