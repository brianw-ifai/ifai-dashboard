import { unavailable } from "../reading/build";
import { pickHeadline, type HeadlinePick } from "../reading/headline";
import type { Finding } from "../reading/types";
import type { SandboxBundle } from "../data/types";
import { metricReading, type MetricReading } from "./common";
import { FEATURED_OFFER_PRESENT_ID, FEATURED_OFFER_SUPPRESSED_ID, selectFeaturedOfferPresent, selectFeaturedOfferSuppressed } from "./featured-offer";
import { MAP_BELOW_ID, selectMapBelow } from "./map-below";

export const RETAIL_CONTROL_PREFIX = "retail_control_";

/** The retail question needs the client's authorized-seller list; that table is its source. */
const AUTHORIZED_SELLER_TABLE = "seller_authorization";
const NO_AUTHORIZED_LIST_REASON = "No authorized-seller list is stored.";

export type RetailHeadline = HeadlinePick & {
  sellerType: string | null;
  sellerTypeLabel: string | null;
  /** The seller type's primary retail question, from seller_type.primary_retail_question. */
  primaryQuestion: string | null;
  primaryRegistryId: string;
  /** Every candidate, ranked, primary question first. */
  findings: Finding[];
  details: Record<string, MetricReading>;
};

/** The registry id of the seller type's primary question, for example retail_control_partner_led. */
export function primaryRegistryIdFor(bundle: SandboxBundle, sellerType: string | null): string {
  if (sellerType) return `${RETAIL_CONTROL_PREFIX}${sellerType}`;
  const fromRegistry = bundle.registry.error
    ? null
    : bundle.registry.rows.find((r) => r.registry_id.startsWith(RETAIL_CONTROL_PREFIX))?.registry_id;
  return fromRegistry ?? `${RETAIL_CONTROL_PREFIX}unknown`;
}

/**
 * Seller-type rule: the primary question ranks first, then the withheld-above-benchmark finding,
 * then Featured Offer present, then offers below MAP. pickHeadline keeps a confirmed finding ahead
 * of an unavailable higher rank, and the unavailable primary question returns as coverage.
 */
export function selectRetailHeadline(bundle: SandboxBundle): RetailHeadline {
  const client = bundle.client.error ? null : (bundle.client.rows[0] ?? null);
  const sellerType = client?.seller_type ?? null;
  const sellerTypeRow = client?.seller_type_row ?? null;
  const primaryRegistryId = primaryRegistryIdFor(bundle, sellerType);

  let primary = metricReading(bundle, primaryRegistryId);
  if (primary.reading.status === "unavailable" && primary.registry && !primary.row && !bundle.metricValues.error) {
    const needsAuthorizedList = primary.registry.source_tables.includes(AUTHORIZED_SELLER_TABLE);
    if (needsAuthorizedList) {
      primary = { ...primary, reading: unavailable(NO_AUTHORIZED_LIST_REASON, primaryRegistryId) };
    }
  }

  const suppressed = selectFeaturedOfferSuppressed(bundle);
  const present = selectFeaturedOfferPresent(bundle);
  const mapBelow = selectMapBelow(bundle);

  const details: Record<string, MetricReading> = {
    [primaryRegistryId]: primary,
    [FEATURED_OFFER_SUPPRESSED_ID]: suppressed,
    [FEATURED_OFFER_PRESENT_ID]: present,
    [MAP_BELOW_ID]: mapBelow,
  };
  const findings: Finding[] = [
    { registryId: primaryRegistryId, rank: 1, reading: primary.reading },
    { registryId: FEATURED_OFFER_SUPPRESSED_ID, rank: 2, reading: suppressed.reading },
    { registryId: FEATURED_OFFER_PRESENT_ID, rank: 3, reading: present.reading },
    { registryId: MAP_BELOW_ID, rank: 4, reading: mapBelow.reading },
  ];
  const pick = pickHeadline(findings);

  return {
    ...pick,
    sellerType,
    sellerTypeLabel: sellerTypeRow?.label ?? null,
    primaryQuestion: sellerTypeRow?.primary_retail_question ?? null,
    primaryRegistryId,
    findings,
    details,
  };
}
