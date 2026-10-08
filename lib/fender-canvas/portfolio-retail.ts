/**
 * Portfolio Retail readings from stored rows.
 * A missing read stays missing. A stored zero stays zero. An unfinished audit stays incomplete.
 * Fender's seller type is an internal rank only. It is not a client-facing label.
 */

import { tabSlug } from "../canvas-sdk/canvas-url-state";
import {
  qualifiesForSuppressionList,
  thresholdCents,
  type SuppressionReading,
} from "./suppressed-listings";

export type RetailReadingStatus =
  | "available_with_issues"
  | "available_with_zero"
  | "incomplete"
  | "unavailable";

export type RetailReading<T> = {
  status: RetailReadingStatus;
  /** Null when this reading was never stored. Zero is a stored result, or a partial count on an incomplete read. */
  issueCount: number | null;
  /** Plain language for an incomplete or absent reading. Null when the reading is complete. */
  missingMessage: string | null;
  detail: T;
};

export type RetailFindingId = "suppressed_listings" | "map_leakage" | "unnested_bundles";

export const RETAIL_FINDING_LABELS = {
  suppressed_listings: "Suppressed Listings",
  map_leakage: "MAP",
  unnested_bundles: "Catalog Governance",
} as const satisfies Record<RetailFindingId, string>;

/** Fender rank. A confirmed zero is skipped. A missing or unfinished higher finding is not replaced. */
export const FENDER_RETAIL_HEADLINE_RANK: readonly RetailFindingId[] = [
  "suppressed_listings",
  "map_leakage",
  "unnested_bundles",
];

export type RetailHeadline = {
  findingId: RetailFindingId;
  label: (typeof RETAIL_FINDING_LABELS)[RetailFindingId];
  tabSlug: string;
  reading: RetailReading<unknown>;
};

const SUPPRESSED_UNAVAILABLE =
  "Suppressed Featured Offer readings have not been stored.";

/** The only honest MAP sentence until Fender's own MAP file is stored. */
export const FENDER_MAP_NOT_STORED = "Fender MAP prices have not been stored.";

/** Why no stored column can stand in for that file. */
export const AMAZON_LIST_PRICE_IS_NOT_MAP =
  "The stored list price is Amazon's own, copied from Keepa, so a retailer price under it is not below MAP.";

const MAP_READ_FAILED = "The MAP listing read did not succeed.";
const BUNDLE_UNAVAILABLE = "Catalog bundle parent ASINs have not been stored.";
const SPEC_UNAVAILABLE = "Amazon spec-field readings have not been stored.";

export const RETAIL_SUPPRESSION_COLUMNS =
  "asin,offer_price,competitive_price_threshold_cents,featured_offer_withheld";

export const RETAIL_MAP_PRICE_COLUMNS = "asin,map_price";

export const RETAIL_CATALOG_GOVERNANCE_COLUMNS =
  "asin,model_name,title,bundle_name,parent_asin,product_url,is_bundle";

export const RETAIL_AMAZON_SPEC_COLUMNS =
  "asin,title,amazon_checked,amazon_missing_fields";

function finite(value: unknown): number | null {
  if (typeof value === "string" && value.trim() === "") return null;
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function countLabel(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function text(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function unavailable<T>(message: string): RetailReading<T | null> {
  return { status: "unavailable", issueCount: null, missingMessage: message, detail: null };
}

export type SuppressionSupportRow = {
  offer_price: number | string | null;
  competitive_price_threshold_cents: number | string | null;
  featured_offer_withheld: boolean | null;
};

export type SuppressionDetail = {
  suppressed: number;
  audited: number;
  population: number;
  withThreshold: number;
};

function withheldWasStored(value: boolean | null | undefined): boolean {
  return value === true || value === false;
}

function asSuppressionReading(row: SuppressionSupportRow): SuppressionReading {
  return {
    asin: "",
    model_name: null,
    title: null,
    offer_price: finite(row.offer_price),
    competitive_price_threshold_cents: finite(row.competitive_price_threshold_cents),
    featured_offer_withheld: row.featured_offer_withheld ?? null,
  };
}

/**
 * Count listings supported by a stored Competitive External Price and a stored
 * Featured Offer withheld flag. Coverage is the share of the population whose
 * withheld flag has been written.
 */
export function suppressedListingsFinding(
  rows: SuppressionSupportRow[] | null,
  options?: { truncated?: boolean },
): RetailReading<SuppressionDetail | null> {
  if (rows == null) return unavailable(SUPPRESSED_UNAVAILABLE);

  const population = rows.length;
  const audited = rows.filter((row) => withheldWasStored(row.featured_offer_withheld)).length;
  const withThreshold = rows.filter(
    (row) => thresholdCents(finite(row.competitive_price_threshold_cents)) != null,
  ).length;
  const suppressed = rows.filter((row) => qualifiesForSuppressionList(asSuppressionReading(row))).length;
  const detail: SuppressionDetail = { suppressed, audited, population, withThreshold };

  if (population === 0 && !options?.truncated) {
    return {
      status: "available_with_zero",
      issueCount: 0,
      missingMessage: null,
      detail,
    };
  }

  if (audited === 0 && !options?.truncated) return unavailable(SUPPRESSED_UNAVAILABLE);

  if (options?.truncated || audited < population) {
    const remaining = population - audited;
    const confirmed =
      suppressed === 0
        ? "No suppressed Featured Offer is confirmed in that partial read."
        : `${countLabel(suppressed)} ${suppressed === 1 ? "listing" : "listings"} in that partial read ${suppressed === 1 ? "is" : "are"} above the Competitive External Price with the Featured Offer withheld.`;
    const tail = options?.truncated
      ? "The read stopped before every listing was loaded, so this is not a final count."
      : `${countLabel(remaining)} ${remaining === 1 ? "listing is" : "listings are"} still missing, so this is not a final count.`;
    return {
      status: "incomplete",
      issueCount: suppressed,
      missingMessage: `The hourly audit has stored a Featured Offer reading for ${countLabel(audited)} of ${countLabel(population)} listings. ${confirmed} ${tail}`,
      detail,
    };
  }

  if (suppressed === 0) {
    return { status: "available_with_zero", issueCount: 0, missingMessage: null, detail };
  }

  return {
    status: "available_with_issues",
    issueCount: suppressed,
    missingMessage: null,
    detail,
  };
}

export type MapPriceRow = {
  asin: string | null;
  /** Amazon's list price, copied from Keepa. It is not Fender's minimum advertised price. */
  map_price: number | string | null;
};

export type MapPriceDetail = {
  /** Listings in this read. */
  population: number;
  /** Listings carrying a stored Amazon list price. A list price is not a MAP, so this is not a below-MAP count. */
  amazonListPrices: number;
};

function storedPrice(value: unknown): number | null {
  const price = finite(value);
  if (price == null || price <= 0) return null;
  return price;
}

/**
 * Fender's own MAP file decides which retailer prices are below MAP. No stored column carries
 * it: `map_price` is Amazon's list price from Keepa, and the stored leakage columns are gaps
 * against that list price. Neither can name a MAP violation, so this reading stays unavailable
 * and reports only what the listing read does hold.
 */
export function mapPriceFinding(rows: MapPriceRow[] | null): RetailReading<MapPriceDetail | null> {
  if (rows == null) return unavailable(MAP_READ_FAILED);

  return {
    status: "unavailable",
    issueCount: null,
    missingMessage: FENDER_MAP_NOT_STORED,
    detail: {
      population: rows.length,
      amazonListPrices: rows.filter((row) => storedPrice(row.map_price) != null).length,
    },
  };
}

export type CatalogBundleRow = {
  asin: string | null;
  model_name: string | null;
  title: string | null;
  bundle_name: string | null;
  parent_asin: string | null;
  product_url: string | null;
  is_bundle: boolean | null;
};

export type UnnestedBundleReason = "missing_parent_asin" | "unusable_parent_asin";

export type UnnestedBundleOpportunity = {
  asin: string;
  modelOrTitle: string | null;
  bundleName: string | null;
  parentAsin: string | null;
  productUrl: string | null;
  justification: {
    isBundle: true;
    parentAsin: string | null;
    reason: UnnestedBundleReason;
  };
};

export type UnnestedBundleDetail = {
  opportunities: UnnestedBundleOpportunity[];
  bundlesInRead: number;
  catalogBundles: number | null;
};

/** A parent ASIN can nest the bundle only when it is a different 10-character ASIN. */
export function usableParentAsin(parentAsin: string | null | undefined, asin: string): boolean {
  const parent = text(parentAsin)?.toUpperCase();
  const child = text(asin)?.toUpperCase();
  if (!parent || !child) return false;
  if (!/^[A-Z0-9]{10}$/.test(parent)) return false;
  return parent !== child;
}

function bundleReason(row: CatalogBundleRow): UnnestedBundleReason {
  return text(row.parent_asin) ? "unusable_parent_asin" : "missing_parent_asin";
}

export function unnestedBundleOpportunities(rows: CatalogBundleRow[]): UnnestedBundleOpportunity[] {
  const opportunities: UnnestedBundleOpportunity[] = [];
  for (const row of rows) {
    if (row.is_bundle !== true) continue;
    const asin = text(row.asin);
    if (!asin) continue;
    if (usableParentAsin(row.parent_asin, asin)) continue;
    const parentAsin = text(row.parent_asin);
    opportunities.push({
      asin,
      modelOrTitle: text(row.model_name) ?? text(row.title),
      bundleName: text(row.bundle_name),
      parentAsin,
      productUrl: text(row.product_url),
      justification: {
        isBundle: true,
        parentAsin,
        reason: bundleReason(row),
      },
    });
  }
  opportunities.sort((a, b) => a.asin.localeCompare(b.asin));
  return opportunities;
}

/**
 * A bundle with no usable parent ASIN is an unnested-bundle opportunity.
 * A bundle with a usable parent is not a defect. Seller authorization is not classified here.
 */
export function unnestedBundlesFinding(
  rows: CatalogBundleRow[] | null,
  options?: { truncated?: boolean; catalogBundleCount?: number | null },
): RetailReading<UnnestedBundleDetail | null> {
  if (rows == null) return unavailable(BUNDLE_UNAVAILABLE);

  const bundleFlagStored = rows.some((row) => row.is_bundle === true || row.is_bundle === false);
  if (rows.length > 0 && !bundleFlagStored) return unavailable(BUNDLE_UNAVAILABLE);

  const bundlesInRead = rows.filter((row) => row.is_bundle === true && text(row.asin)).length;
  const opportunities = unnestedBundleOpportunities(rows);
  const catalogBundles =
    options?.catalogBundleCount == null || !Number.isFinite(options.catalogBundleCount)
      ? null
      : options.catalogBundleCount;
  const detail: UnnestedBundleDetail = { opportunities, bundlesInRead, catalogBundles };
  const catalogShort =
    catalogBundles != null && catalogBundles > bundlesInRead && rows.length > 0;

  if (rows.length === 0 && !options?.truncated && catalogBundles == null) {
    return { status: "available_with_zero", issueCount: 0, missingMessage: null, detail };
  }

  if (rows.length === 0 && catalogBundles != null && catalogBundles > 0) {
    return {
      status: "incomplete",
      issueCount: 0,
      missingMessage: `The catalog read stores ${countLabel(catalogBundles)} bundle listings. This retail read did not include them, so zero unnested bundles is not a final result.`,
      detail,
    };
  }

  if (options?.truncated || catalogShort) {
    const coverage =
      catalogBundles != null
        ? `This read includes ${countLabel(bundlesInRead)} of ${countLabel(catalogBundles)} bundle listings.`
        : `This read did not include the full bundle population.`;
    const known =
      opportunities.length === 0
        ? "No unnested bundle is confirmed in the included listings."
        : `${countLabel(opportunities.length)} of the included listings ${opportunities.length === 1 ? "has" : "have"} no usable parent ASIN.`;
    return {
      status: "incomplete",
      issueCount: opportunities.length,
      missingMessage: `${coverage} ${known} This is not a final count.`,
      detail,
    };
  }

  if (opportunities.length === 0) {
    return { status: "available_with_zero", issueCount: 0, missingMessage: null, detail };
  }

  return {
    status: "available_with_issues",
    issueCount: opportunities.length,
    missingMessage: null,
    detail,
  };
}

export type AmazonSpecRow = {
  asin: string | null;
  title: string | null;
  amazon_checked: boolean | null;
  amazon_missing_fields: string | null;
};

export type AmazonSpecGap = {
  asin: string;
  modelOrTitle: string | null;
  missingFields: string[];
};

export type AmazonSpecGapDetail = {
  gaps: AmazonSpecGap[];
  checked: number;
  unchecked: number;
};

/** Stored Amazon spec gaps, split on the semicolon list in the spec-readiness source. */
export function amazonMissingFields(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((field) => field.trim())
    .filter((field) => field.length > 0);
}

export function amazonSpecGapsFinding(
  rows: AmazonSpecRow[] | null,
  options?: { truncated?: boolean },
): RetailReading<AmazonSpecGapDetail | null> {
  if (rows == null || rows.length === 0) return unavailable(SPEC_UNAVAILABLE);

  const gaps: AmazonSpecGap[] = [];
  let checked = 0;
  let unchecked = 0;
  for (const row of rows) {
    if (row.amazon_checked !== true) {
      unchecked += 1;
      continue;
    }
    checked += 1;
    const asin = text(row.asin);
    const missingFields = amazonMissingFields(row.amazon_missing_fields);
    if (!asin || missingFields.length === 0) continue;
    gaps.push({
      asin,
      modelOrTitle: text(row.title),
      missingFields,
    });
  }
  gaps.sort((a, b) => a.asin.localeCompare(b.asin));
  const detail: AmazonSpecGapDetail = { gaps, checked, unchecked };

  if (checked === 0) return unavailable(SPEC_UNAVAILABLE);

  if (options?.truncated || unchecked > 0) {
    return {
      status: "incomplete",
      issueCount: gaps.length,
      missingMessage: `Amazon spec fields are stored for ${countLabel(checked)} listings in this read. ${countLabel(unchecked)} ${unchecked === 1 ? "listing was" : "listings were"} not checked. Unchecked listings are missing from this count and are not counted as zero.`,
      detail,
    };
  }

  if (gaps.length === 0) {
    return { status: "available_with_zero", issueCount: 0, missingMessage: null, detail };
  }

  return {
    status: "available_with_issues",
    issueCount: gaps.length,
    missingMessage: null,
    detail,
  };
}

export type PortfolioRetailFindings = {
  suppressedListings: RetailReading<SuppressionDetail | null>;
  mapPrices: RetailReading<MapPriceDetail | null>;
  unnestedBundles: RetailReading<UnnestedBundleDetail | null>;
  amazonSpecGaps: RetailReading<AmazonSpecGapDetail | null>;
};

/**
 * The most important current retail finding for Fender.
 * Skip a confirmed zero. If a higher finding was never stored, or its audit is unfinished, return that reading.
 * Amazon 1P share, active-listing count, and unknown-seller percentage are not candidates.
 */
export function selectRetailHeadline(findings: PortfolioRetailFindings): RetailHeadline | null {
  const readings: Record<RetailFindingId, RetailReading<unknown>> = {
    suppressed_listings: findings.suppressedListings,
    map_leakage: findings.mapPrices,
    unnested_bundles: findings.unnestedBundles,
  };

  for (const findingId of FENDER_RETAIL_HEADLINE_RANK) {
    const reading = readings[findingId];
    if (reading.status === "available_with_zero" && reading.issueCount === 0) continue;
    const label = RETAIL_FINDING_LABELS[findingId];
    return {
      findingId,
      label,
      tabSlug: tabSlug(label),
      reading,
    };
  }

  return null;
}

export type PagedRows<T> =
  | {
      ok: true;
      rows: T[];
      truncated: boolean;
    }
  | {
      ok: false;
    };

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

/** Walk a listing read. A short page ends it. A full final page means the population was cut off. */
export async function readPages<T>(
  fetchPage: (page: number, size: number) => PromiseLike<PageResult<T>>,
  pageSize = PAGE_SIZE,
): Promise<PagedRows<T>> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await fetchPage(page, pageSize);
    if (error) return { ok: false };
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) return { ok: true, rows, truncated: false };
  }
  return { ok: true, rows, truncated: true };
}

export type RetailQuerySource = {
  suppressionRows: () => Promise<PagedRows<SuppressionSupportRow>>;
  mapRows: () => Promise<PagedRows<MapPriceRow>>;
  catalogRows: () => Promise<PagedRows<CatalogBundleRow>>;
  catalogBundleCount: () => Promise<number | null>;
  specRows: () => Promise<PagedRows<AmazonSpecRow>>;
};

export type PortfolioRetailSnapshot = PortfolioRetailFindings & {
  headline: RetailHeadline | null;
};

export async function loadPortfolioRetailSnapshot(
  source: RetailQuerySource,
): Promise<PortfolioRetailSnapshot> {
  const [suppression, mapRows, catalog, catalogBundleCount, spec] = await Promise.all([
    source.suppressionRows(),
    source.mapRows(),
    source.catalogRows(),
    source.catalogBundleCount(),
    source.specRows(),
  ]);

  const findings: PortfolioRetailFindings = {
    suppressedListings: suppressedListingsFinding(suppression.ok ? suppression.rows : null, {
      truncated: suppression.ok ? suppression.truncated : false,
    }),
    mapPrices: mapPriceFinding(mapRows.ok ? mapRows.rows : null),
    unnestedBundles: unnestedBundlesFinding(catalog.ok ? catalog.rows : null, {
      truncated: catalog.ok ? catalog.truncated : false,
      catalogBundleCount,
    }),
    amazonSpecGaps: amazonSpecGapsFinding(spec.ok ? spec.rows : null, {
      truncated: spec.ok ? spec.truncated : false,
    }),
  };

  return {
    ...findings,
    headline: selectRetailHeadline(findings),
  };
}
