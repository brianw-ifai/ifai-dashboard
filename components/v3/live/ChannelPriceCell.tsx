"use client";

import { formatUsd } from "@/lib/fender-canvas/format";
import type { ChannelFact } from "@/lib/fender-canvas/map-channels";

/**
 * One stored retailer price. A missing price stays blank.
 * No gap is drawn here: the stored list price is Amazon's, so a difference from it is not a MAP gap.
 */
export function ChannelPriceCell({
  fact,
  href,
}: {
  fact: ChannelFact | undefined;
  href?: string | null;
}) {
  if (!fact) return <td className="money channel-fact" />;
  const price = formatUsd(fact.price);
  return (
    <td className="money channel-fact">
      {href ? (
        <a
          className="listing-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${fact.name} price ${price}`}
        >
          {price}
        </a>
      ) : (
        <span>{price}</span>
      )}
    </td>
  );
}
