import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

export function loadMarketingDocumentHtml(): string {
  if (process.env.NODE_ENV === "production" && cached) return cached;
  const html = readFileSync(join(process.cwd(), "public/marketing/document.html"), "utf8");
  if (process.env.NODE_ENV === "production") cached = html;
  return html;
}
