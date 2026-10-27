import { pct } from "@/lib/ai-search/summary";

/**
 * Link-share lead for Citation Ecosystem: share of cited links that are Fender-owned.
 * Same definition as the Citations satellite (`pct(fenderOwnedRows, rows)`).
 */
export function citationOwnedLinksLead(
  owned: number,
  total: number,
): { figure: string; population: string | null } {
  if (total <= 0) return { figure: "No cited links", population: null };
  return {
    figure: pct(owned, total),
    population: `${owned} of ${total} cited links lead to Fender-owned sites`,
  };
}
