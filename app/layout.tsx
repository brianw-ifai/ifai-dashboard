import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { publicAssetPath } from "@/lib/public-asset";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IntoFocus Portal",
  description: "IntoFocus AI visibility dashboard",
  icons: {
    icon: [
      { url: publicAssetPath("/favicon.ico"), sizes: "any" },
      { url: publicAssetPath("/icon.png"), type: "image/png" },
    ],
    apple: [{ url: publicAssetPath("/icon.png"), type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${playfair.variable}`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
