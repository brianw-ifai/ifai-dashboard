import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IntoFocus v3",
  description: "Fender brand intelligence canvas",
};

export default function CanvasLayout({ children }: LayoutProps<"/">) {
  return <div className="h-dvh">{children}</div>;
}
