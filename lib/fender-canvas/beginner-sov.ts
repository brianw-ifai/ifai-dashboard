import type { CanvasCompetitorSovRow } from "@/lib/fender-canvas/types";
import { formatInt, formatPct } from "@/lib/fender-canvas/format";

const FENDER = "Fender/Squier";
const YAMAHA = "Yamaha";

export type BeginnerSovPair = {
  fender: CanvasCompetitorSovRow;
  yamaha: CanvasCompetitorSovRow;
};

/** Beginner rows from canvas_competitor_sov. Names are the stored competitor labels. */
export function beginnerSovPair(sov: CanvasCompetitorSovRow[]): BeginnerSovPair | null {
  const rows = sov.filter((row) => row.category === "beginner");
  const fender = rows.find((row) => row.competitor === FENDER);
  const yamaha = rows.find((row) => row.competitor === YAMAHA);
  if (!fender || !yamaha) return null;
  if (fender.sov_pct == null || yamaha.sov_pct == null) return null;
  return { fender, yamaha };
}

/** "Yamaha 66.7% vs Fender/Squier 33.3%" using whatever percents the table stored. */
export function beginnerSovLine(sov: CanvasCompetitorSovRow[]): string | null {
  const pair = beginnerSovPair(sov);
  if (!pair) return null;
  return `${pair.yamaha.competitor} ${formatPct(pair.yamaha.sov_pct)} vs ${pair.fender.competitor} ${formatPct(pair.fender.sov_pct)}`;
}

export function beginnerSovWhy(sov: CanvasCompetitorSovRow[]): string | null {
  const pair = beginnerSovPair(sov);
  if (!pair) return null;
  const line = beginnerSovLine(sov);
  const yamahaResolved = pair.yamaha.category_resolved;
  const fenderResolved = pair.fender.category_resolved;
  return `${line}. ${pair.yamaha.competitor} has ${formatInt(pair.yamaha.wins)} wins out of ${formatInt(yamahaResolved)} resolved beginner answers. ${pair.fender.competitor} has ${formatInt(pair.fender.wins)} wins out of ${formatInt(fenderResolved)}.`;
}
