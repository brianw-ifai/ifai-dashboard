import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* The stacked logo has an opaque background, so drawing it on the stage shows a
   rectangle behind the hub bubble. */
test("the canvas stage does not draw the clipped logo watermark", () => {
  const graph = readFileSync(join(root, "lib/canvas-sdk/CanvasGraph.tsx"), "utf8");
  assert.doesNotMatch(graph, /iomWatermarkClip/);
  assert.doesNotMatch(graph, /clipPath/);
  assert.doesNotMatch(graph, /intofocus-ai-logo-stacked-full-color/);
});
