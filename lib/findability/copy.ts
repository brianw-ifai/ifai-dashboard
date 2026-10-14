import { formatInt } from "@/lib/fender-canvas/format";
import type { SortInput } from "@/lib/fender-canvas/table-sort";
import {
  countFindability,
  findabilityOutcome,
  presentOfficialAddress,
  type FindabilityBucket,
  type FindabilityOutcome,
  type FindabilityRow,
  type OutcomeCounts,
} from "@/lib/findability/outcomes";

export const OUTCOME_LABEL: Record<FindabilityOutcome, string> = {
  exact_official_product: "Exact official product page",
  official_family_page: "Official family page",
  completed_not_found: "Finished search, no defensible page",
  ambiguous_candidate: "Ambiguous match",
  not_checked: "Unchecked",
};

export const OUTCOME_DEFINITION: Record<FindabilityOutcome, string> = {
  exact_official_product:
    "This listing resolves to one official product page for this variant. A family page is not counted here.",
  official_family_page:
    "This listing resolves to an official page for the product line. That page covers more than one variant, so it is not an exact product page.",
  completed_not_found:
    "The search finished and did not accept an official page. That does not prove the product is absent from the brand site.",
  ambiguous_candidate:
    "More than one page could fit, or the stored identifiers disagree, so no official page was accepted.",
  not_checked:
    "This listing has not been checked. A missing address is not a finished search.",
};

const HEADLINE_NOUN: Record<FindabilityOutcome, [string, string]> = {
  exact_official_product: ["exact official product page", "exact official product pages"],
  official_family_page: ["official family page", "official family pages"],
  completed_not_found: [
    "finished search with no defensible page",
    "finished searches with no defensible page",
  ],
  ambiguous_candidate: ["ambiguous match", "ambiguous matches"],
  not_checked: ["unchecked listing", "unchecked listings"],
};

export const JSONLD_NOT_AUDITED =
  "JSON-LD was not audited on this official-page read. This screen is not a schema-completeness or A+ result.";

export const MACHINE_READABILITY_DISTINCTION =
  "Machine Readability is a separate, older spec read. It lists pages whose stored missing fields include additionalProperty. It is not this official-page result.";

export const DEALER_BUNDLE_NOTE =
  "Dealer bundle status comes from the retail read. It can line up with an official-page outcome. That is a correlation, not a proven cause.";

export const FAMILY_IS_NOT_EXACT = "A family page is not an exact product page.";

const OUTCOME_ORDER: FindabilityOutcome[] = [
  "exact_official_product",
  "official_family_page",
  "completed_not_found",
  "ambiguous_candidate",
  "not_checked",
];

function phrase(count: number, singular: string, plural: string): string {
  return `${formatInt(count)} ${count === 1 ? singular : plural}`;
}

/** The headline is each outcome count. It is not a single found percentage. */
export function findabilityHeadline(counts: OutcomeCounts): string {
  const parts = OUTCOME_ORDER.map((key) => {
    const [singular, plural] = HEADLINE_NOUN[key];
    return phrase(counts[key], singular, plural);
  });
  if (counts.other > 0) {
    parts.push(phrase(counts.other, "other result", "other results"));
  }
  if (parts.length === 1) return `${parts[0]}.`;
  const last = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(", ")}, and ${last}.`;
}

export type FindabilityRead =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; rows: FindabilityRow[]; dealerBundleLoaded: boolean };

export function findabilitySpokeDescription(read: FindabilityRead): string {
  const tail = `${FAMILY_IS_NOT_EXACT} ${MACHINE_READABILITY_DISTINCTION}`;
  if (read.phase === "loading") {
    return `Official-page outcomes are loading. Exact product pages, family pages, finished searches with no defensible page, ambiguous matches, and unchecked listings stay separate. ${tail}`;
  }
  if (read.phase === "error") {
    return `The official-page read did not load. Exact product pages, family pages, finished searches with no defensible page, ambiguous matches, and unchecked listings stay separate. ${tail}`;
  }
  const counts = countFindability(read.rows);
  if (counts.total === 0) {
    return `This official-page read has no listings. ${tail}`;
  }
  return `${findabilityHeadline(counts)} ${tail}`;
}

export function findabilityTourLine(read: FindabilityRead): string {
  if (read.phase !== "ready") {
    return "Official-page outcomes stay separate and load with the findability read";
  }
  const counts = countFindability(read.rows);
  if (counts.total === 0) return "This official-page read has no listings";
  return findabilityHeadline(counts);
}

export type ReadinessFace = {
  stats: string[];
  meta: string;
  tooltipTitle: string;
  tooltipDesc: string;
};

const SEPARATE_OUTCOMES =
  "Exact official product pages, official family pages, finished searches with no defensible page, ambiguous matches, and unchecked listings are counted separately.";

/** Map bubble face. The findability lines are counts, not the older found percentage. */
export function readinessFindabilityFace(
  read: FindabilityRead,
  amazonSpecsLabel: string,
): ReadinessFace {
  const amazonStat = `${amazonSpecsLabel} Amazon specs`;
  const amazonSentence = `Amazon structured completeness averages ${amazonSpecsLabel} on the older spec read.`;
  if (read.phase !== "ready") {
    return {
      stats: ["Official pages", amazonStat],
      meta: read.phase === "error" ? "Official-page read unavailable" : "Five outcomes loading",
      tooltipTitle: "Official product pages",
      tooltipDesc: `${SEPARATE_OUTCOMES} ${FAMILY_IS_NOT_EXACT} ${amazonSentence}`,
    };
  }
  const counts = countFindability(read.rows);
  if (counts.total === 0) {
    return {
      stats: ["0 listings", amazonStat],
      meta: "No rows in this read",
      tooltipTitle: "Official product pages",
      tooltipDesc: `This official-page read has no listings. ${SEPARATE_OUTCOMES} ${FAMILY_IS_NOT_EXACT} ${amazonSentence}`,
    };
  }
  const other = counts.other > 0 ? ` · ${formatInt(counts.other)} other` : "";
  return {
    stats: [
      `${formatInt(counts.exact_official_product)} exact`,
      `${formatInt(counts.official_family_page)} family`,
    ],
    meta: `${formatInt(counts.completed_not_found)} no page · ${formatInt(counts.ambiguous_candidate)} ambiguous · ${formatInt(counts.not_checked)} unchecked${other}`,
    tooltipTitle: "Official product pages",
    tooltipDesc: `${findabilityHeadline(counts)} ${FAMILY_IS_NOT_EXACT} ${amazonSentence}`,
  };
}

export function jsonLdNote(rows: readonly FindabilityRow[]): string {
  const audited = rows.filter((row) => {
    const status = row.jsonld_status?.trim();
    return Boolean(status) && status !== "not_checked";
  }).length;
  if (audited === 0) return JSONLD_NOT_AUDITED;
  return `${formatInt(audited)} listings have a stored JSON-LD note. This screen still does not score schema completeness.`;
}

export function bucketLabel(bucket: FindabilityBucket): string {
  return bucket === "other" ? "Other result" : OUTCOME_LABEL[bucket];
}

const PRODUCT_KIND: Record<string, string> = {
  instrument: "Instrument",
  part: "Part",
  pack: "Pack",
  case: "Case",
  strings: "Strings",
};

const CONFIDENCE: Record<string, string> = {
  sku: "SKU match",
  gtin: "GTIN match",
  variant_options: "Variant options",
  none: "No identifier match",
};

const SOURCE_METHOD: Record<string, string> = {
  derived_handle: "Derived handle",
  model_number_search: "Model number search",
  search_meta: "Search metadata",
};

export function productKindLabel(value: string | null): string {
  if (!value?.trim()) return "Not recorded";
  return PRODUCT_KIND[value] ?? value.replaceAll("_", " ");
}

export function confidenceLabel(value: string | null): string {
  if (!value?.trim()) return "Not recorded";
  return CONFIDENCE[value] ?? value.replaceAll("_", " ");
}

export function sourceMethodLabel(value: string | null): string {
  if (!value?.trim()) return "Not recorded";
  return SOURCE_METHOD[value] ?? value.replaceAll("_", " ");
}

export function httpStatusLabel(status: number | null, bucket: FindabilityBucket): string {
  if (bucket === "not_checked") return "Not checked";
  if (status == null) return "Not recorded";
  return String(status);
}

export function attemptLabel(iso: string | null, bucket: FindabilityBucket): string {
  if (bucket === "not_checked") return "Not checked yet";
  if (!iso?.trim()) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function dealerBundleLabel(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null) return "Not in the retail read";
  return "Not loaded";
}

export function countFlagLine(row: FindabilityRow): string {
  const outcome = findabilityOutcome(row);
  if (outcome === "exact_official_product") {
    return row.counts_as_confirmed === true
      ? "Counted as a confirmed exact official product page."
      : "Stored as an exact official product page.";
  }
  if (outcome === "official_family_page") {
    return row.counts_as_confirmed === true
      ? "Counted as a confirmed official page, and as a family page. Not an exact product page."
      : "Stored as an official family page, not an exact product page.";
  }
  if (outcome === "completed_not_found") return "The search finished with no defensible page.";
  if (outcome === "ambiguous_candidate") {
    return "The search finished with an ambiguous match. No official page was accepted.";
  }
  if (outcome === "not_checked") return "Not checked. A missing address is not a finished search.";
  return "This stored result sits outside the five official-page outcomes.";
}

export function presentExplanation(row: FindabilityRow): string {
  const stored = row.explanation?.trim();
  if (stored) return stored;
  if (findabilityOutcome(row) === "not_checked") return "Not checked yet.";
  return "No explanation was stored.";
}

export function listingTitle(row: FindabilityRow): string {
  return row.title?.trim() || "No title stored";
}

export function findabilitySortValue(row: FindabilityRow, columnId: string): SortInput {
  const bucket = findabilityOutcome(row);
  const address = presentOfficialAddress(row);
  switch (columnId) {
    case "asin":
      return row.asin;
    case "title":
      return listingTitle(row);
    case "outcome":
      return bucketLabel(bucket);
    case "category":
      return row.category?.trim() || null;
    case "kind":
      return productKindLabel(row.product_kind);
    case "page":
      return address.kind === "link" ? address.href : address.text;
    case "sku":
      return row.latest_variant_sku?.trim() || null;
    case "confidence":
      return confidenceLabel(row.confidence);
    case "source":
      return sourceMethodLabel(row.source_method);
    case "http":
      return bucket === "not_checked" ? null : row.http_status;
    case "checked":
      return bucket === "not_checked" ? null : row.latest_attempt_at;
    case "explanation":
      return presentExplanation(row);
    case "flags":
      return countFlagLine(row);
    case "bundle":
      return dealerBundleLabel(row.dealer_bundle);
    default:
      return null;
  }
}
