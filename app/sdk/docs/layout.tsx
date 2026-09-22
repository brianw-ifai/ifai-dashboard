import { SdkDocsShell } from "@/components/sdk/docs/SdkDocsShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canvas SDK Docs",
  description: "IntoFocus Canvas SDK documentation",
};

export default function SdkDocsLayout({ children }: LayoutProps<"/sdk/docs">) {
  return <SdkDocsShell>{children}</SdkDocsShell>;
}
