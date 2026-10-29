/**
 * Display helpers for AI Consensus heroes. Score math stays in consensus-scores.ts.
 * Higher scores are better. Bands use the same traffic-light tokens as other share leads.
 */

import type { PieDiscData } from "@/lib/ai-search/citation-pies";

/**
 * Score color bands (0-100, higher is better).
 * Below 40 is danger red. Above 70 is success green. The closed interval is warning amber.
 */
export const CONSENSUS_SCORE_BANDS = { redBelow: 40, greenAbove: 70 } as const;

export const ACTUATION_OMITTED_REASON =
  "No owner, evidence, or dated records yet.";

export const CONSENSUS_EXPLAINER_TITLE = "What is the AI Consensus score?";

export const CONSENSUS_EXPLAINER_BODY =
  "AI Consensus is IntoFocus's 0 to 100 read of how the brand is doing from AI search and ecommerce together. It combines AI Foundation and AI Commerce. AI Actuation is not included yet. Coverage shows how many of those three inputs are in the number.";

export type ScoreTone = "danger" | "warning" | "success";

export function scoreTone(score: number | null | undefined): ScoreTone | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score < CONSENSUS_SCORE_BANDS.redBelow) return "danger";
  if (score > CONSENSUS_SCORE_BANDS.greenAbove) return "success";
  return "warning";
}

export function scoreToneColor(score: number | null | undefined): string {
  const tone = scoreTone(score);
  if (tone === "danger") return "var(--danger-red)";
  if (tone === "success") return "var(--success-green)";
  if (tone === "warning") return "var(--warning-amber)";
  return "var(--text-muted)";
}

/**
 * Disc of the score versus the rest of 100. Same CitationPieDisc family as other tabs.
 * Empty when the score is missing.
 */
export function scoreAgainst100Pie(
  id: string,
  title: string,
  score: number | null | undefined,
): PieDiscData | null {
  if (score == null || !Number.isFinite(score)) return null;
  const filled = Math.max(0, Math.min(100, Math.round(score)));
  const rest = 100 - filled;
  const slices = [
    { key: "matched", label: "Score", count: filled },
    { key: "none", label: "Rest to 100", count: rest },
  ].filter((slice) => slice.count > 0);
  if (slices.length === 0) return null;
  return {
    id,
    title,
    total: 100,
    totalLabel: "points",
    slices,
  };
}
