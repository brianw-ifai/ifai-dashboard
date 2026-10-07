import type { CommandCenterSpec } from "@/lib/canvas-sdk/types";
import { beginnerSovLine, beginnerSovWhy } from "@/lib/fender-canvas/beginner-sov";
import { formatInt, formatPct, formatRatio } from "@/lib/fender-canvas/format";
import {
  headlineSentence,
  headlineSurface,
  type RetailCanvasRead,
} from "@/lib/fender-canvas/portfolio-retail-display";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

/** Command center copy from the canvas reads. Unsourced counts are omitted. */
export function buildLiveCommandCenter(
  bundle: CanvasBundle,
  retail: RetailCanvasRead = { phase: "loading" },
): CommandCenterSpec {
  const { m, divisions } = bundle;
  const divisionCount = divisions.length > 0 ? divisions.length : m.division_count;
  const sovLine = beginnerSovLine(bundle.sov);
  const sovWhy = beginnerSovWhy(bundle.sov);
  const headline = headlineSurface(retail);

  const summaryParts = [
    headlineSentence(headline),
    `The catalog read has ${formatInt(m.catalog_skus)} electric SKUs across ${formatInt(divisionCount)} divisions.`,
  ];
  if (sovLine) summaryParts.push(`Beginner share of voice is ${sovLine}.`);
  if (m.sim_hallucinations != null) {
    summaryParts.push(
      `${formatInt(m.sim_hallucinations)} simulation answers are flagged for a spec hallucination.`,
    );
  }

  return {
    badge: "COMMAND CENTER · TODAY",
    title: "What do I need to worry about?",
    desc: `The highest-value moves across the ${formatInt(m.catalog_skus)} monitored electric SKUs, ranked by what they cost you while they sit open.`,
    summary: summaryParts.join(" "),
    openByDefault: true,
    storageKey: "ifai:fender:command-center",
    items: [
      {
        id: "buybox-suppression",
        title: headline.countLabel ? `${headline.label}: ${headline.countLabel}` : headline.label,
        why: headline.missingMessage
          ? headline.missingMessage
          : `${headline.label} is the current retail headline${headline.countLabel ? `, with ${headline.countLabel}` : ""}.`,
        severity: "critical",
        spokeId: "ecommerce",
        subTab: headline.commandTab,
        defaultOwner: "intofocus",
      },
      {
        id: "ai-spec-hallucination",
        title: "AI assistants are quoting specs you never published",
        why: `${formatInt(m.sim_hallucinations)} answers in the latest simulation read are flagged for a spec hallucination. The hallucination tab lists each root cause stored on those rows.`,
        severity: "critical",
        spokeId: "aeo",
        subTab: "Hallucination",
        defaultOwner: "intofocus",
      },
      {
        id: "schema-coverage",
        title: "fender.com pages are missing machine-readable spec fields",
        why: `Site search found a fender.com page for ${formatRatio(m.spec_fender_found, m.spec_checked)} checked SKUs (${formatPct(m.spec_fender_found_pct)}). additionalProperty is missing on ${formatInt(m.spec_missing_additional_property)} of the found pages, so an assistant still has no spec block to read there. The Schema tab lists the missing-field rows from this read.`,
        severity: "high",
        spokeId: "specs",
        subTab: "Schema",
        defaultOwner: "intofocus",
      },
      {
        id: "map-leakage",
        title: "Discounted bundles are dragging your prices down everywhere",
        why: "Open the MAP tab for the current below-MAP listings. Amazon, Walmart, and Musician's Friend appear only when this read stored a price for that channel. Any other retailer appears only when a stored price exists for that channel.",
        impact: "The summary and the listing rows are the rows returned by the latest retail listing read.",
        severity: "high",
        spokeId: "ecommerce",
        subTab: "MAP",
        defaultOwner: "client",
      },
      ...(sovWhy
        ? [
            {
              id: "midrange-losses",
              title: `Beginner share of voice is ${sovLine}`,
              why: sovWhy,
              severity: "high" as const,
              spokeId: "competitors",
              subTab: "Battlecards",
              defaultOwner: "intofocus" as const,
            },
          ]
        : []),
      {
        id: "aplus-tables",
        title: "A+ comparison tables are how assistants read your lineup",
        why: "Amazon A+ content is the enhanced modules on a product page, including comparison tables. When a comparison table is on the page, Amazon's shopping assistant and other AI models can read the columns and repeat how your lineup steps up.",
        severity: "moderate",
        spokeId: "specs",
        subTab: "A+",
        defaultOwner: "intofocus",
      },
    ],
  };
}
