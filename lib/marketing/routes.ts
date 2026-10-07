export const MARKETING_PAGES = [
  "home",
  "modules",
  "ai-search-product-sellers",
  "ai-project-desk",
  "faq",
  "contact",
  "privacy",
] as const;

export type MarketingPageId = (typeof MARKETING_PAGES)[number];

const SLUG_TO_PAGE: Record<string, MarketingPageId> = {
  modules: "modules",
  "ai-search-product-sellers": "ai-search-product-sellers",
  "ai-project-desk": "ai-project-desk",
  faq: "faq",
  contact: "contact",
  privacy: "privacy",
};

export function marketingPageFromSlug(
  slug: string[] | undefined,
): MarketingPageId | null {
  if (!slug?.length) return "home";
  if (slug.length > 1) return null;
  return SLUG_TO_PAGE[slug[0]!] ?? null;
}

export function marketingPathForPage(page: MarketingPageId): string {
  return page === "home" ? "/" : `/${page}`;
}

export function marketingPageFromPathname(pathname: string): MarketingPageId | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/") return "home";
  const slug = normalized.slice(1);
  return SLUG_TO_PAGE[slug] ?? null;
}

export function marketingStaticParams(): { slug: string[] }[] {
  // Optional catch-all must include `slug` on every params object.
  // An empty array is the static-export path for `/`.
  return MARKETING_PAGES.map((page) => ({
    slug: page === "home" ? [] : [page],
  }));
}
