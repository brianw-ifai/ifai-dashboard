"use client";

import { CommerceScoreBlock } from "@/components/v3/live/ConsensusScoreView";
import { commerceInputsFromLive } from "@/lib/fender-canvas/consensus-scores-from-live";
import { commerceScore } from "@/lib/fender-canvas/consensus-scores";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";

/**
 * Catalog Health → Retail Overview: AI Commerce score and component rows above the pies.
 */
export function CommerceConsensusPanel({ read }: { read: RetailCanvasRead }) {
  if (read.phase === "loading") {
    return <p className="retail-missing">Loading AI Commerce score…</p>;
  }
  if (read.phase === "error") {
    return <p className="retail-missing">The AI Commerce score could not be loaded.</p>;
  }

  const inputs = commerceInputsFromLive(read);
  if (!inputs) {
    return (
      <p className="retail-missing" data-consensus-commerce-unavailable="">
        AI Commerce is not available until the retail reading loads.
      </p>
    );
  }

  const commerce = commerceScore(inputs);

  return <CommerceScoreBlock commerce={commerce} />;
}
