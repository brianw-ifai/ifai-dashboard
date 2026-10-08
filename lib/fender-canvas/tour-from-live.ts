import type { TourStep } from "@/lib/canvas-sdk/types";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";
import {
  headlineSentence,
  headlineSurface,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

export function buildLiveTourSteps(
  bundle: CanvasBundle,
  retail: RetailCanvasRead = { phase: "loading" },
): TourStep[] {
  const { m, cats } = bundle;
  const beginner = cats.find((c) => c.category === "beginner");
  const headline = headlineSentence(headlineSurface(retail));

  return [
    {
      nodeId: "hub",
      targetX: 800,
      targetY: 500,
      radius: 185,
      title: "Brand Overview",
      subtitle: "Fender's health across catalog divisions",
      category: "BRAND CORE",
      displays: [
        `${formatInt(m.catalog_skus)} monitored SKUs`,
        headline,
        `AI win rate ${formatPct(m.sim_win_pct)}; weakest is ${m.weakest_category ?? "n/a"} at ${formatPct(m.weakest_win_pct)}`,
      ],
      value: "One page tying Amazon listing problems and AI recommendations to revenue.",
    },
    {
      nodeId: "ecommerce",
      targetX: 1160,
      targetY: 320,
      radius: 125,
      title: "Portfolio Retail",
      subtitle: "Featured Offer, MAP, and catalog nesting",
      category: "RETAIL HEALTH",
      displays: [
        "Suppressed Featured Offers, MAP prices, and unnested bundles",
        "A partial reading keeps its count and says what is still missing",
      ],
      value: "These catalog and retail issues change what an assistant can recommend and what a shopper can buy.",
    },
    {
      nodeId: "aeo",
      targetX: 440,
      targetY: 320,
      radius: 125,
      title: "AI Search Visibility",
      subtitle: "What ChatGPT, Perplexity, and Gemini say about Fender",
      category: "AI SEARCH VISIBILITY",
      displays: [
        `${formatInt(m.sim_total)} simulations across ${formatInt(m.sim_runs)} engine runs`,
        `${formatPct(m.sim_win_pct)} Fender/Squier wins on ${formatInt(m.sim_resolved)} resolved calls`,
        `${formatInt(m.sim_hallucinations)} confirmed spec hallucinations flagged`,
      ],
      value: "See why AI assistants leave Fender out of recommendations and exactly what to change.",
    },
    {
      nodeId: "specs",
      targetX: 440,
      targetY: 680,
      radius: 120,
      title: "Product Readiness",
      subtitle: "Can AI and Amazon read your specs correctly?",
      category: "AI READINESS",
      displays: [
        `${formatInt(m.spec_missing_additional_property)} fender.com pages missing additionalProperty`,
        `Product page found on ${formatPct(m.spec_fender_found_pct)} of checked SKUs (${formatInt(m.spec_fender_found)} of ${formatInt(m.spec_checked)})`,
        `${formatInt(bundle.missing.length)} missing-field rows in the spec read`,
      ],
      value: "Make fender.com the source AI trusts for specs, with fewer wrong answers and fewer returns.",
    },
    {
      nodeId: "competitors",
      targetX: 1160,
      targetY: 680,
      radius: 120,
      title: "Competitors",
      subtitle: "Where rivals beat Fender, and why",
      category: "COMPETITORS",
      displays: [
        `${beginner?.top_competitor ?? "Rival"} ${formatPct(beginner?.top_competitor_pct ?? null)} in beginner`,
        `Strongest category: ${m.strongest_category ?? "n/a"} at ${formatPct(m.strongest_win_pct)}`,
        "SOV from the simulation battery",
      ],
      value: "Get ready-made playbooks for shoppers deciding between Fender and a rival.",
    },
    {
      nodeId: "suggestions",
      targetX: 800,
      targetY: 180,
      radius: 115,
      title: "Action Items & ROI",
      subtitle: "Action items, with revenue labeled as estimates",
      category: "OPPORTUNITY",
      displays: [
        "Revenue figures on this spoke are estimates",
        "Phase 1 estimate: +$680K",
        "Enterprise estimate: +$38M to $62M",
      ],
      value: "See what each Action Item is worth, so you know where to start.",
    },
    {
      nodeId: "roadmap",
      targetX: 800,
      targetY: 820,
      radius: 115,
      title: "90-Day Roadmap",
      subtitle: "What happens at 30, 60, and 90 days",
      category: "ROADMAP",
      displays: [
        headline,
        `AI win rate ${formatPct(m.sim_win_pct)}`,
      ],
      value: "Follow a 90-day plan from the current retail headline.",
    },
  ];
}
