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
      heroValue: { value: "100.0%", label: "missing additionalProperty" },
      spokeId: "specs",
      subTab: "Machine Readability",
      tooltip: { title: "", desc: "" },
    },
    {
      ...satelliteNode("sat-tables"),
      status: "neutral",
      title: "Amazon A+ Matrix",
      stats: ["Not measured"],
      heroValue: { value: "Not measured", label: "Comparison tables" },
      spokeId: "specs",
      subTab: "Amazon A+ Matrix",
      tooltip: { title: "", desc: "" },
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
      stats: [],
      logoSrc: "/image.png",
      meta: "Click for Master View",
      spokeId: "hub",
      tooltip: {"title": "Summary", "desc": "Click to open the Summary: 5 brand divisions, the Briefing, and Opportunity."},
    },
];
