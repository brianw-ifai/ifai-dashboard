import {
  groupCitations,
  SOURCE_CLASS_LABELS,
  SOURCE_CLASS_ORDER,
  type CitationRead,
  type SourceClass,
} from "@/lib/ai-search/citations";

export type CitationPieSlice = {
  key: string;
  label: string;
  count: number;
};

export type CitationPie = {
  id: "answers" | "classes" | "owned";
  title: string;
  total: number;
  totalLabel: string;
  slices: CitationPieSlice[];
};

function sumsTo(slices: CitationPieSlice[], total: number): boolean {
  return slices.reduce((sum, slice) => sum + slice.count, 0) === total;
}

/**
 * Pies for one citation view. Returns null when a slice set does not add up to
 * the same total the table uses.
 */
export function citationPies(read: CitationRead): CitationPie[] | null {
  const withoutCitation = read.answered - read.answersWithCitation;
  if (withoutCitation < 0 || read.answered < 0 || read.rows.length < 0) return null;

  const answerSlices = [
    { key: "cited", label: "Cited a source", count: read.answersWithCitation },
    { key: "none", label: "No cited link", count: withoutCitation },
  ].filter((slice) => slice.count > 0);
  if (read.answered > 0 && !sumsTo(answerSlices, read.answered)) return null;

  const grouped = groupCitations(read.rows, (row) => row.sourceClass);
  const classSlices = SOURCE_CLASS_ORDER.map((key) => ({
    key,
    label: SOURCE_CLASS_LABELS[key as SourceClass],
    count: grouped.find((group) => group.key === key)?.rows ?? 0,
  })).filter((slice) => slice.count > 0);
  if (!sumsTo(classSlices, read.rows.length)) return null;

  const owned = read.rows.filter((row) => row.sourceClass === "fender_owned").length;
  const ownedSlices = [
    { key: "owned", label: "Fender-owned", count: owned },
    { key: "other", label: "Other cited links", count: read.rows.length - owned },
  ].filter((slice) => slice.count > 0);
  if (!sumsTo(ownedSlices, read.rows.length)) return null;

  const pies: CitationPie[] = [];
  if (read.answered > 0) {
    pies.push({
      id: "answers",
      title: "Answers that cited a source",
      total: read.answered,
      totalLabel: "answered calls in this view",
      slices: answerSlices,
    });
  }
  if (read.rows.length > 0) {
    pies.push({
      id: "classes",
      title: "Cited links by source",
      total: read.rows.length,
      totalLabel: "cited links",
      slices: classSlices,
    });
    pies.push({
      id: "owned",
      title: "Fender-owned and other links",
      total: read.rows.length,
      totalLabel: "cited links",
      slices: ownedSlices,
    });
  }
  return pies;
}
