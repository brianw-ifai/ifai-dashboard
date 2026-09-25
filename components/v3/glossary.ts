/** Plain-language definitions for the jargon in the panel copy. The SDK marks
    the first mention of each term per panel and shows the definition on hover.
    Keep these in the register an e-commerce operator would use — short enough
    to read without leaving the page. */
export const fenderGlossary: Record<string, string> = {
  "Buy Box":
    "The one-click 'Add to Cart' button on an Amazon listing. Only one seller wins it at a time; when nobody wins it, shoppers see 'Available from these sellers' instead and far fewer of them buy.",
  MAP: "Minimum Advertised Price — the lowest price a retail partner has agreed to display publicly. Partners get around it by bundling a cheap accessory and discounting the pair.",
  "Brand Registry":
    "Amazon's brand-owner programme. It lets Fender control its own listings and fold partner bundles in as variations of the official product.",
  "Schema.org":
    "A shared vocabulary for publishing facts about a product in a form machines can read, rather than leaving them to guess from marketing copy.",
  "JSON-LD":
    "The block of machine-readable product facts embedded in a web page. It is what an AI engine reads when it needs a hard number like a fingerboard radius.",
  AEO: "Answer Engine Optimisation — being the product an AI assistant names when someone asks it what to buy, rather than ranking in a list of blue links.",
  ASIN: "Amazon's product ID. Every listing has one, and a product split across several of them has its reviews split too.",
  "A+ Content":
    "Amazon's enhanced product modules, including comparison tables. Amazon's own shopping AI and the frontier models read those tables directly.",
  "Share of Voice":
    "How often a brand is the one an AI engine actually names, out of all the answers it gives in that category.",
  SOV: "Share of Voice — how often a brand is the one an AI engine actually names in a category.",
  DTC: "Direct-to-consumer — Fender's own storefront at fender.com, as opposed to selling through Amazon or a dealer.",
  Hallucination:
    "An AI engine stating something confidently that is not true — here, quoting specs scraped off a third-party bundle page rather than from Fender.",
  "AI Scan Index":
    "Out of 100, how often AI assistants like ChatGPT and Perplexity name Fender when shoppers ask what to buy. It moves day to day as the models update, so read it as a trend rather than something you steer directly.",
  "Controllable Readiness Score":
    "How much of what AI engines and Amazon read about Fender (specs, listings, reviews) is in good shape. Unlike the scan, every fix you ship moves this number.",
  "1P": "First-party: Fender selling directly, including through Amazon Retail.",
  "3P": "Third-party: an authorised partner or reseller selling Fender products under its own account.",
};
