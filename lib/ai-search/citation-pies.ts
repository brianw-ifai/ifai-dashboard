import { ownedPie, sourceMix } from "@/lib/ai-search/citation-insights";
import type { CitationRead } from "@/lib/ai-search/citations";

export type CitationPieSlice = {
  key: string;
  label: string;
  count: number;
};

export type CitationPie = {
  id: "classes" | "owned";
  title: string;
  total: number;
  totalLabel: string;
  slices: CitationPieSlice[];
};

/**
 * Pies for one citation view. Returns null when a slice set does not add up to
 * the same total the table uses. The former "answers that cited a source" pie
 * is no longer shown; that figure lives in the run-context strip.
 */
export function citationPies(read: CitationRead): CitationPie[] | null {
  const mix = sourceMix(read);
  const owned = ownedPie(read);
  if (read.rows.length === 0) return [];
  if (!mix || !owned) return null;

  return [
    {
      id: "classes",
      title: "Cited links by source",
      total: mix.total,
      totalLabel: "cited links",
      slices: mix.slices.map((slice) => ({
        key: slice.key,
        label: slice.label,
        count: slice.count,
      })),
    },
    {
      id: "owned",
      title: "Fender-owned and other links",
      total: owned.total,
      totalLabel: "cited links",
      slices: [
        { key: "owned", label: "Fender-owned", count: owned.owned },
        { key: "other", label: "Other cited links", count: owned.other },
      ].filter((slice) => slice.count > 0),
    },
  ];
}
