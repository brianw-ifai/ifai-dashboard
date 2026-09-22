import { ApiReferenceContent } from "@/components/sdk/docs/ApiReferenceContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API reference · Canvas SDK",
  description: "CanvasSpec, CanvasShell, graph primitives, and panel helpers",
};

export default function SdkDocsApiPage() {
  return <ApiReferenceContent />;
}
