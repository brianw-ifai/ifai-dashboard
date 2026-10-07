import {
  marketingPageFromSlug,
  marketingStaticParams,
  type MarketingPageId,
} from "@/lib/marketing/routes";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

const PAGE_TITLES: Record<MarketingPageId, string> = {
  home: "IntoFocus AI",
  modules: "Modules · IntoFocus AI",
  "ai-search-product-sellers": "AI Search + Product Sellers · IntoFocus AI",
  "ai-project-desk": "AI Project Desk · IntoFocus AI",
  faq: "FAQs · IntoFocus AI",
  contact: "Contact · IntoFocus AI",
  privacy: "Privacy Policy · IntoFocus AI",
};

export async function generateStaticParams() {
  return marketingStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = marketingPageFromSlug(slug);
  if (!page) return { title: "Not found" };
  return { title: PAGE_TITLES[page] };
}

export default async function MarketingPage({ params }: Props) {
  const { slug } = await params;
  const page = marketingPageFromSlug(slug);
  if (!page) notFound();

  return null;
}
