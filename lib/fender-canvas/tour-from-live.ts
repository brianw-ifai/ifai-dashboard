import type { TourStep } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import { formatInt, formatPct, formatUsd } from "@/lib/fender-canvas/format";

export function buildLiveTourSteps(bundle: CanvasBundle): TourStep[] {
  const { m, cats } = bundle;
  const beginner = cats.find((c) => c.category === "beginner");

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
        `Buy Box: ${formatPct(m.bb_1p_pct)} Amazon 1P on ${formatInt(m.bb_total)} active offers`,
        `AI win rate ${formatPct(m.sim_win_pct)}; weakest is ${m.weakest_category ?? "n/a"} at ${formatPct(m.weakest_win_pct)}`,
      ],
      value: "One page tying Amazon listing problems and AI recommendations to revenue.",
    },
    {
      nodeId: "ecommerce",
      targetX: 1160,
      targetY: 320,
      radius: 125,
      title: "Amazon & Retail Health",
      subtitle: "Buy Box, price leaks, and partner bundles",
      category: "RETAIL HEALTH",
      displays: [
        `${formatPct(m.bb_1p_pct)} of ${formatInt(m.bb_total)} active offers confirm Amazon 1P`,
        `${formatInt(m.map_violation_skus)} MAP violation SKUs across channels`,
        `MAP drift: Amazon ${formatUsd(m.amz_avg_drift, { signed: true })} average on ${formatInt(m.amz_below_map)} listings`,
      ],
      value: "Win back the Buy Box (target 95%) by working with partners, not sending legal threats.",
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
        `Baseline: Buy Box ${formatPct(m.bb_1p_pct)}, AI win ${formatPct(m.sim_win_pct)}`,
        "Targets toward 95% Buy Box",
        "Choose who does the work: IntoFocus or your team",
      ],
      value: "Follow a clear 90-day plan with targets, whichever team does the work.",
    },
  ];
}
