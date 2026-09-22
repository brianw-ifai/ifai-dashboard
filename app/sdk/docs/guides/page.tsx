import { GuidesContent } from "@/components/sdk/docs/GuidesContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guides · Canvas SDK",
  description: "Apply the IntoFocus Canvas SDK to a brand or a custom viewport",
};

export default function SdkDocsGuidesPage() {
  return <GuidesContent />;
}
