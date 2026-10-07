import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { publicAssetPath } from "../lib/public-asset.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pagesBasePath = "/ifai-dashboard";

test("local dev and Netlify keep root-relative public paths", () => {
  assert.equal(publicAssetPath("/image.png"), "/image.png");
  assert.equal(publicAssetPath("/icon.png", ""), "/icon.png");
  assert.equal(publicAssetPath("/favicon.ico", ""), "/favicon.ico");
});

test("the GitHub Pages export prefixes public paths with the base path", () => {
  assert.equal(publicAssetPath("/image.png", pagesBasePath), "/ifai-dashboard/image.png");
  assert.equal(publicAssetPath("/icon.png", `${pagesBasePath}/`), "/ifai-dashboard/icon.png");
  assert.equal(publicAssetPath("/favicon.ico", pagesBasePath), "/ifai-dashboard/favicon.ico");
});

test("prefixed, external, and inlined URLs are left alone", () => {
  assert.equal(publicAssetPath("/ifai-dashboard/icon.png", pagesBasePath), "/ifai-dashboard/icon.png");
  assert.equal(publicAssetPath("https://cdn.example.com/a.png", pagesBasePath), "https://cdn.example.com/a.png");
  assert.equal(publicAssetPath("//cdn.example.com/a.png", pagesBasePath), "//cdn.example.com/a.png");
  assert.equal(publicAssetPath("data:image/png;base64,AAAA", pagesBasePath), "data:image/png;base64,AAAA");
});

test("the canvas stage no longer draws the clipped logo watermark", () => {
  const graph = readFileSync(join(root, "lib/canvas-sdk/CanvasGraph.tsx"), "utf8");
  assert.doesNotMatch(graph, /iomWatermarkClip/);
  assert.doesNotMatch(graph, /clipPath/);
  assert.doesNotMatch(graph, /intofocus-ai-logo-stacked-full-color/);
});

/* Runs after `npm run build:pages`; skipped when no export is on disk. */
const exportedDashboard = join(root, "out/dashboard/index.html");
test(
  "the GitHub Pages export requests logos and favicon under /ifai-dashboard",
  { skip: !existsSync(exportedDashboard) && "no out/ export; run npm run build:pages" },
  () => {
    const html = readFileSync(exportedDashboard, "utf8");
    assert.match(html, /rel="icon" href="\/ifai-dashboard\/favicon\.ico"/);
    assert.match(html, /rel="icon" href="\/ifai-dashboard\/icon\.png"/);
    assert.match(html, /rel="apple-touch-icon" href="\/ifai-dashboard\/icon\.png"/);
    assert.doesNotMatch(html, /href="\/(icon\.png|favicon\.ico)"/);

    const chunkDir = join(root, "out/_next/static/chunks");
    const chunks = readdirSync(chunkDir, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".js"))
      .map((file) => readFileSync(join(chunkDir, file), "utf8"))
      .join("\n");
    assert.match(chunks, /\/ifai-dashboard/);
    assert.doesNotMatch(chunks, /iomWatermarkClip/);
    assert.doesNotMatch(chunks, /intofocus-ai-logo-stacked-full-color/);
  },
);
