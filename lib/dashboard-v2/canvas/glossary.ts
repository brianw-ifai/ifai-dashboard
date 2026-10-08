/**
 * Hover definitions for the terms the dashboard uses. Written for any brand: no brand names, no
 * figures. The canvas SDK marks each term in panel copy with a dotted underline and shows the
 * definition on hover or focus.
 */
export const dashboardV2Glossary: Record<string, string> = {
  "Featured Offer":
    "The offer Amazon shows first on a product page, with the Add to Cart button. Shoppers often call it the Buy Box. Amazon can withhold it when no offer meets its price checks.",
  "Competitive External Price":
    "Amazon's benchmark for a product: the price, including shipping, it finds at other large retailers. An offer above it can lose the Featured Offer.",
  MAP: "Minimum advertised price. The lowest price a brand lets its sellers advertise. A MAP sheet comes from the brand, not from a store.",
  "Brand Registry":
    "Amazon's program that lets a brand claim its product listings, control the content on them, and report sellers that break its rules.",
  "Schema.org":
    "A shared vocabulary for describing products, prices, and specs in a web page so software can read them without guessing.",
  "JSON-LD":
    "The common format for putting Schema.org data on a page: a small block of structured text that search and AI tools read directly.",
  AEO: "Answer Engine Optimization. The discipline of shaping product data and pages so AI assistants name the brand correctly when a shopper asks.",
  ASIN: "Amazon Standard Identification Number. Amazon's id for one listing. Each color or size variation has its own.",
  "A+ Content":
    "The richer product description area on an Amazon listing that a registered brand can fill with comparison tables, images, and spec blocks.",
  "Share of Voice":
    "Of the answers that named any brand, the share that named this brand. A rate, shown with how many answers were counted.",
  Reading:
    "One measured value with its date, its source run, and how much of the population the run covered. Every figure on this dashboard is a reading.",
  "Partial read":
    "A run that read fewer items than it should have. Its figure is shown with how many of how many were read, and marked not final.",
  Unavailable:
    "No stored value exists for this reading yet. The dashboard shows the word and the reason instead of a number, never a zero.",
};
