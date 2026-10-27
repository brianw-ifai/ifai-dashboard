import type { PieDiscData } from "@/lib/ai-search/citation-pies";

/** Same words as the Competitive Radar spoke sentence for this snapshot. */
export function competitorWinsFigure(competitorWins: number, resolved: number): string {
  return `Competitors led ${competitorWins} of ${resolved} resolved unbranded discovery answers.`;
}

/** Disc of competitor-led versus Fender/Squier-led among resolved unbranded discovery. */
export function competitorLeadPie(competitorWins: number, resolved: number): PieDiscData | null {
  if (resolved <= 0) return null;
  const fenderLed = resolved - competitorWins;
  if (competitorWins < 0 || fenderLed < 0) return null;
  return {
    id: "competitor-wins-lead",
    title: "Unbranded discovery leads",
    total: resolved,
    totalLabel: "resolved unbranded discovery answers",
    slices: [
      { key: "competitor_brand", label: "Competitor led", count: competitorWins },
      { key: "fender", label: "Fender/Squier led", count: fenderLed },
    ].filter((slice) => slice.count > 0),
  };
}
