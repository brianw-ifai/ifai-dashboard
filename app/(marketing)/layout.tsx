import { MarketingSite } from "@/components/marketing/MarketingSite";
import { loadMarketingDocumentHtml } from "@/lib/marketing/load-document";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "IntoFocus AI",
  description:
    "Org-ready agentic teams for one defined problem — implemented for your business and kept current.",
};

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  const documentHtml = loadMarketingDocumentHtml();

  return (
    <>
      <Suspense fallback={null}>
        <MarketingSite documentHtml={documentHtml} />
      </Suspense>
      {children}
    </>
  );
}
