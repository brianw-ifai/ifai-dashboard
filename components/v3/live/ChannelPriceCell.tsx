"use client";

import { formatUsd } from "@/lib/fender-canvas/format";
import {
  MISSING_CHECKED_PAGE_DESC,
  MISSING_CHECKED_PAGE_LABEL,
  missingCheckedPageLabel,
  type ChannelFact,
} from "@/lib/fender-canvas/map-channels";

/**
 * Price and signed gap on one line. A missing price stays blank.
 * `note` marks a stored price that is not a current observation.
 * When `requireCheckedPage` is set and no stored URL exists, the cell keeps
 * the price and shows Not available* instead of inventing a retailer link.
 */
export function ChannelPriceCell({
  fact,
  href,
  note = null,
  requireCheckedPage = false,
}: {
  fact: ChannelFact | undefined;
  href?: string | null;
  note?: string | null;
  requireCheckedPage?: boolean;
}) {
  if (!fact || (fact.price == null && fact.gap == null)) return <td className="money channel-fact" />;
  const below = fact.gap != null && fact.gap < 0;
  const price = fact.price != null ? formatUsd(fact.price) : null;
  const missingSource = missingCheckedPageLabel(requireCheckedPage, href, fact.price);
  return (
    <td className="money channel-fact">
      {price != null && href ? (
        <a
          className="listing-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${fact.name} price ${price}`}
        >
          {price}
        </a>
      ) : null}
      {price != null && !href ? <span>{price}</span> : null}
      {fact.gap != null ? (
        <span className="channel-gap" style={below ? { color: "var(--danger-red)" } : undefined}>
          {formatUsd(fact.gap, { signed: true })}
        </span>
      ) : null}
      {missingSource ? (
        <span
          className="ifai-term channel-note"
          data-ifai-tooltip-title={MISSING_CHECKED_PAGE_LABEL}
          data-ifai-tooltip-desc={MISSING_CHECKED_PAGE_DESC}
          tabIndex={0}
          aria-label={`${MISSING_CHECKED_PAGE_LABEL}: ${MISSING_CHECKED_PAGE_DESC}`}
        >
          {MISSING_CHECKED_PAGE_LABEL}
        </span>
      ) : null}
      {note ? <span className="channel-note">{note}</span> : null}
    </td>
  );
}
