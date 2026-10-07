import type { CanvasNode } from "@/lib/canvas-sdk/types";
import type { CanvasBundle } from "@/lib/fender-canvas/types";
import type { buildLiveMetrics } from "@/lib/fender-canvas/metrics-from-live";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";
import {
  retailBubbleFaces,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";

type MetricsMap = ReturnType<typeof buildLiveMetrics>;

export function buildLiveNodes(
  bundle: CanvasBundle,
  metrics: MetricsMap,
  retail: RetailCanvasRead = { phase: "loading" },
): CanvasNode[] {
  const { m, cats } = bundle;
  const retailFaces = retailBubbleFaces(retail);
  const beginner = cats.find((c) => c.category === "beginner");
  const acoustics = cats.find((c) => c.category === "acoustics");
  const amps = cats.find((c) => c.category === "amps");

  const bb1p = metrics.buyBoxRetention.value;
  const simWin = metrics.overallAiWinRate.value;
  const beginnerWin = metrics.beginnerAiWinRate.value;

  return [
    {
      id: "sat-prompts",
      x: 240,
      y: 200,
      r: 52,
      status: "danger",
      title: `${formatInt(m.sim_total)} Sims`,
      stats: [
        `${formatInt(m.sim_runs)} engine runs`,
        `${simWin} win (resolved)`,
      ],
      meta: "ChatGPT · Perplexity · Gemini",
      spokeId: "aeo",
      subTab: "simulations",
      tooltip: {
        title: "AI Simulation Battery",
        desc: `${formatInt(m.sim_total)} prompt-engine calls in the latest battery. ${formatInt(m.sim_wins)} Fender/Squier wins of ${formatInt(m.sim_resolved)} resolved (${formatInt(m.sim_unclear)} unclear, ${formatInt(m.sim_errors)} errors).`,
      },
    },
    {
      id: "sat-citations",
      x: 180,
      y: 360,
      r: 52,
      status: "warning",
      title: "Citations",
      stats: ["SOV mix", "See drill-down"],
      meta: "Category breakdown in panel",
      spokeId: "aeo",
      subTab: "citation",
      tooltip: {
        title: "AI Citation Ecosystem",
        desc: "Citation share is derived from the latest simulation battery. Open the AI Search Visibility spoke for category-level win rates and competitor SOV.",
      },
    },
    {
      id: "sat-drift",
      x: 260,
      y: 480,
      r: 52,
      status: "warning",
      title: "AI Drift",
      stats: [
        `${metrics.confirmedHallucinations.value} Confirmed Hallucinations`,
        "See drill-down",
      ],
      meta: `Of ${formatInt(m.sim_hallucination_risk)} risk answers`,
      spokeId: "aeo",
      subTab: "hallucination",
      tooltip: {
        title: "Detected Spec Hallucinations",
        desc: `${formatInt(m.sim_hallucinations)} confirmed hallucinations in the latest run. Inspect root causes and remediation patches in the simulations table.`,
      },
    },
    {
      id: "sat-buybox",
      x: 1360,
      y: 200,
      r: 54,
      spokeId: "ecommerce",
      ...retailFaces.suppressed,
    },
    {
      id: "sat-asin",
      x: 1420,
      y: 360,
      r: 54,
      spokeId: "ecommerce",
      ...retailFaces.catalog,
    },
    {
      id: "sat-map",
      x: 1340,
      y: 480,
      r: 60,
      spokeId: "ecommerce",
      ...retailFaces.map,
    },
    {
      id: "sat-schema",
      x: 230,
      y: 720,
      r: 50,
      status: "danger",
      title: "Schema.org",
      stats: [
        `${formatInt(m.spec_missing_additional_property)} missing additionalProperty`,
        `${formatInt(m.spec_checked)} checked`,
      ],
      meta: "fender.com JSON-LD gap",
      spokeId: "specs",
      subTab: "schema",
      tooltip: {
        title: "Schema.org Structured Data",
        desc: `${formatPct(m.spec_fender_found_pct)} of audited SKUs have a fender.com page (${formatInt(m.spec_fender_found)} of ${formatInt(m.spec_checked)}). ${formatInt(m.spec_missing_additional_property)} pages lack additionalProperty specs.`,
      },
    },
    {
      id: "sat-tables",
      x: 320,
      y: 870,
      r: 48,
      status: "warning",
      title: "A+ Tables",
      stats: [
        `${formatPct(m.spec_avg_amazon_pct)} Amazon`,
        `${formatInt(m.spec_checked)} checked`,
      ],
      meta: "Amazon field completeness",
      spokeId: "specs",
      subTab: "a+",
      tooltip: {
        title: "Amazon Structured Field Completeness",
        desc: `Amazon product attribute completeness averages ${formatPct(m.spec_avg_amazon_pct)} across ${formatInt(m.spec_checked)} SKUs in the spec audit.`,
      },
    },
    {
      id: "sat-taylor",
      x: 1370,
      y: 720,
      r: 51,
      status: "warning",
      title: "Taylor / PRS",
      stats: [
        acoustics?.top_competitor
          ? `${formatPct(acoustics.top_competitor_pct)} ${acoustics.top_competitor}`
          : "Acoustics SOV",
        `${formatPct(acoustics?.fender_win_pct ?? null)} Fender`,
      ],
      meta: "Acoustics category",
      spokeId: "competitors",
      subTab: "battlecards",
      tooltip: {
        title: "Taylor and PRS Category Battles",
        desc: `Acoustics win rate: Fender/Squier ${formatPct(acoustics?.fender_win_pct ?? null)} vs top rival ${acoustics?.top_competitor ?? "n/a"} ${formatPct(acoustics?.top_competitor_pct ?? null)}.`,
      },
    },
    {
      id: "sat-amps",
      x: 1280,
      y: 870,
      r: 48,
      status: "success",
      title: "Amps Category",
      stats: [
        `${formatPct(amps?.fender_win_pct ?? null)} Fender`,
        `${formatInt(amps?.resolved ?? null)} resolved sims`,
      ],
      meta: "AI simulations",
      spokeId: "competitors",
      subTab: "head-to-head",
      tooltip: {
        title: "Digital Amp Ecosystem",
        desc: `Fender/Squier win ${formatPct(amps?.fender_win_pct ?? null)} of resolved amps-category prompts in the latest battery.`,
      },
    },
    {
      id: "spoke-aeo",
      x: 440,
      y: 320,
      r: 86,
      status: "danger",
      title: "AI Search Visibility",
      titleSize: 14.5,
      stats: [`${simWin} Win`, `${formatInt(m.sim_total)} Sims`],
      meta: `Weakest: ${m.weakest_category ?? "n/a"} ${beginnerWin}`,
      spokeId: "aeo",
      tooltip: {
        title: "AI Search Visibility & Simulations",
        desc: `Overall win rate ${simWin} across ${formatInt(m.sim_resolved)} resolved simulations. Weakest category: ${m.weakest_category ?? "n/a"} at ${formatPct(m.weakest_win_pct)}.`,
      },
    },
    {
      id: "spoke-retail",
      x: 1160,
      y: 320,
      r: 96,
      titleSize: 13.5,
      spokeId: "ecommerce",
      ...retailFaces.main,
    },
    {
      id: "spoke-specs",
      x: 440,
      y: 680,
      r: 78,
      status: "warning",
      title: "AI Readiness",
      titleSize: 13.5,
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
      id: "spoke-competitors",
      x: 1160,
      y: 680,
      r: 78,
      status: "danger",
      title: "Competitive Radar",
      titleSize: 13,
      stats: [
        `${beginner?.top_competitor ?? "Rival"} ${formatPct(beginner?.top_competitor_pct ?? null)}`,
        `${formatInt(m.weakest_sov_gap_pts)} pt gap`,
      ],
      meta: `${m.weakest_category ?? "Category"} gap`,
      spokeId: "competitors",
      tooltip: {
        title: "Competitive Radar",
        desc: `Largest SOV gap: ${m.weakest_top_competitor ?? "n/a"} in ${m.weakest_category ?? "n/a"} (${formatInt(m.weakest_sov_gap_pts)} pts). Strongest: ${m.strongest_category ?? "n/a"} at ${formatPct(m.strongest_win_pct)}.`,
      },
    },
    {
      id: "spoke-fixes",
      x: 800,
      y: 180,
      r: 74,
      status: "success",
      title: "Action Items",
      titleSize: 14,
      stats: [`${metrics.phaseOneLift.value} est.`, metrics.enterprisePotential.value],
      meta: metrics.enterprisePotential.value + " Enterprise",
      spokeId: "suggestions",
      tooltip: {
        title: "Action Items",
        desc: `Phase 1 estimate ${metrics.phaseOneLift.value}. Enterprise estimate ${metrics.enterprisePotential.value}.`,
      },
    },
    {
      id: "spoke-roadmap",
      x: 800,
      y: 820,
      r: 74,
      status: "success",
      title: "Strategy Roadmap",
      titleSize: 14,
      stats: ["90 Days", "3 Phases"],
      meta: "Buy Box & AI Search Visibility",
      spokeId: "roadmap",
      tooltip: {
        title: "90-Day Portfolio Roadmap",
        desc: `Baselines: Buy Box ${bb1p}, AI win ${simWin}. Day 90 Buy Box target ${metrics.dayNinetyBuyBoxTarget.value}.`,
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
