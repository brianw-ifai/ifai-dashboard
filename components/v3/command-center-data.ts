import type { CommandCenterSpec } from "@/lib/canvas-sdk/types";

/**
 * Offline fallback when the canvas read has not loaded.
 * Measured figures live in `buildLiveCommandCenter`. This copy does not state a count.
 */
export const fenderCommandCenter: CommandCenterSpec = {
  badge: "COMMAND CENTER · TODAY",
  title: "What do I need to worry about?",
  desc: "The highest-value moves across the monitored electric catalog, ranked by what they cost you while they sit open.",
  summary:
    "The retail headline, beginner share of voice, and spec hallucination flags load with the canvas read.",
  openByDefault: true,
  storageKey: "ifai:fender:command-center",
  items: [
    {
      id: "buybox-suppression",
      title: "The retail headline loads with the catalog read",
      why: "Suppressed Featured Offers, MAP leakage, and unnested bundles are ranked from the stored retail read. The count and any missing coverage appear when that read finishes.",
      severity: "critical",
      spokeId: "ecommerce",
      subTab: "Retail Overview",
      defaultOwner: "intofocus",
    },
    {
      id: "ai-spec-hallucination",
      title: "AI assistants are quoting specs you never published",
      why: "The hallucination tab lists each root cause stored on the flagged simulation rows.",
      severity: "critical",
      spokeId: "aeo",
      subTab: "Hallucination",
      defaultOwner: "intofocus",
    },
    {
      id: "schema-coverage",
      title: "fender.com pages are missing machine-readable spec fields",
      why: "The spec read shows how often a fender.com page was found and how many of those pages are missing additionalProperty. The Schema tab lists the missing-field rows.",
      severity: "high",
      spokeId: "specs",
      subTab: "Schema",
      defaultOwner: "intofocus",
    },
    {
      id: "map-leakage",
      title: "Below-MAP listings load with the retail read",
      why: "The MAP tab states how many stored prices are below MAP. When that reading is partial, it also states what is still missing. Amazon, Walmart, and Musician's Friend appear only when this read stored a price for that channel.",
      impact: "The summary and the listing rows are the rows returned by the latest retail listing read.",
      severity: "high",
      spokeId: "ecommerce",
      subTab: "MAP",
      defaultOwner: "client",
    },
    {
      id: "midrange-losses",
      title: "Beginner share of voice is in the competitor read",
      why: "Yamaha and Fender/Squier shares for the beginner category come from the competitor share-of-voice rows, not from a saved sentence.",
      severity: "high",
      spokeId: "competitors",
      subTab: "Battlecards",
      defaultOwner: "intofocus",
    },
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
