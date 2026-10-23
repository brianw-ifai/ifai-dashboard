import { isValidCitationUrl } from "@/lib/ai-search/citations";

export const WHY_NOT_NOTE =
  "Each cited page is an association with the stored answer. It does not show that the page caused the engine to name another brand.";

export type WhyNotPage = { href: string; label: string };

export type WhyNotFenderView = {
  label: "Association";
  note: string;
  answer: string | null;
  pages: WhyNotPage[];
};

/**
 * Pooled evidence ids are `${audit_run_id}:${call.id}`.
 * Those ids are not rows in the current-run answer view, so they are not queried.
 */
export function answerLookupId(id: string): string | null {
  if (id.includes(":")) return null;
  return id;
}

/** Stored answer text and stored http(s) pages only. No cause is added. */
export function whyNotFender(input: {
  answerText: string | null | undefined;
  pages: ReadonlyArray<{ href: string | null | undefined; label: string | null | undefined }>;
}): WhyNotFenderView {
  const answer = input.answerText?.trim() || null;
  const pages: WhyNotPage[] = [];
  const seen = new Set<string>();
  for (const page of input.pages) {
    const href = page.href?.trim() ?? "";
    if (!isValidCitationUrl(href) || seen.has(href)) continue;
    seen.add(href);
    pages.push({ href, label: page.label?.trim() || href });
  }
  return { label: "Association", note: WHY_NOT_NOTE, answer, pages };
}
