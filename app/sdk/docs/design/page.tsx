import { DesignSystemContent } from "@/components/sdk/docs/DesignSystemContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design system · Canvas SDK",
  description:
    "Fonts, colors, bubbles, pills, lines, graphs, and data-display chrome used by the IntoFocus Canvas SDK",
};

export default function SdkDocsDesignPage() {
  return <DesignSystemContent />;
}
