import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IntoFocus v3",
  description: "Fender brand intelligence canvas",
};

export default function CanvasLayout({ children }: LayoutProps<"/">) {
  return <div className={`h-dvh ${playfair.variable}`}>{children}</div>;
}
