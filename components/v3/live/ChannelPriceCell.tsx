"use client";

import { formatUsd } from "@/lib/fender-canvas/format";
import type { ChannelFact } from "@/lib/fender-canvas/map-channels";

/** Price and signed gap on one line. A missing price stays blank. */
export function ChannelPriceCell({
  fact,
  href,
}: {
  fact: ChannelFact | undefined;
  href?: string | null;
}) {
  if (!fact || (fact.price == null && fact.gap == null)) return <td className="money channel-fact" />;
  const below = fact.gap != null && fact.gap < 0;
  const price = fact.price != null ? formatUsd(fact.price) : null;
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
    </td>
  );
}
