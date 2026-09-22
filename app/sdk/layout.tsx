import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IntoFocus Canvas SDK",
  description: "Reusable intelligence canvas kernel extracted from /v3",
};

export default function SdkLayout({ children }: LayoutProps<"/sdk">) {
  return <div className="h-dvh">{children}</div>;
}
