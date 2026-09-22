import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IntoFocus v3",
  description: "IntoFocus AI v3",
};

export default function V3Layout({ children }: LayoutProps<"/v3">) {
  return <div className="h-dvh">{children}</div>;
}
