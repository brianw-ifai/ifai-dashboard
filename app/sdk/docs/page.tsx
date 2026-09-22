import { GetStartedContent } from "@/components/sdk/docs/GetStartedContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get started · Canvas SDK",
  description: "Quickstart for the IntoFocus Canvas SDK",
};

export default function SdkDocsGetStartedPage() {
  return <GetStartedContent />;
}
