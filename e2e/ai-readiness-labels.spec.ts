import { expect, test, type Page } from "@playwright/test";
import { Canvas } from "./fixtures";
import { mockCanvasRead } from "./spec-read-mock";

/**
 * The AI Readiness bubble, its two satellites, and its three tabs share one set
 * of names, and a link copied from an earlier tab title still opens the same tab.
 */

const TAB_NAMES = ["AI Readiness", "Machine Readability", "Amazon A+ Matrix"];

/** Bubble titles are drawn as separate SVG lines, so the DOM text has no space. */
function mapNode(page: Page, title: string) {
  const escaped = title
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*");
  return page.locator(".graph-node").filter({ hasText: new RegExp(escaped, "i") });
}

test("the bubble, its satellites, and its tabs share one set of names", async ({ page }) => {
  await mockCanvasRead(page);
  const canvas = new Canvas(page);
  await canvas.open();

  await expect(mapNode(page, "AI Readiness")).toHaveCount(1);
  await expect(mapNode(page, "Machine Readability")).toHaveCount(1);
  await expect(mapNode(page, "Amazon A+ Matrix")).toHaveCount(1);
  await expect(mapNode(page, "Schema.org")).toHaveCount(0);
  await expect(mapNode(page, "A+ Tables")).toHaveCount(0);

  await canvas.openSpokeFromMap("AI Readiness");
  await expect(page.locator(".drilldown-tabs .drilldown-tab-btn")).toHaveText(TAB_NAMES);
});

test("each satellite opens the tab that carries its name", async ({ page }) => {
  await mockCanvasRead(page);
  const canvas = new Canvas(page);
  await canvas.open();

  /* Satellites only take clicks while their parent cluster is revealed, and the
     map collapses to a spoke column once a panel is open, so each satellite is
     reached from a fresh map by hovering AI Readiness first. */
  for (const satellite of ["Machine Readability", "Amazon A+ Matrix"]) {
    await page.goto("/dashboard");
    await expect(page.locator(".ifai-canvas.panel-hidden")).toHaveCount(1);
    await expect(async () => {
      await mapNode(page, "AI Readiness").hover({ force: true });
      await expect(page.locator(".satellite-group.visible")).toHaveCount(1, { timeout: 2000 });
      await mapNode(page, satellite).click({ force: true });
      await expect(page.locator(".ifai-canvas.column-layout")).toHaveCount(1, { timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await expect(canvas.activeTab).toHaveText(satellite);
  }
});

test("a link copied from an earlier tab title still opens the same tab", async ({ page }) => {
  await mockCanvasRead(page);
  const canvas = new Canvas(page);
  await canvas.open();

  const aliases: Array<[string, string]> = [
    ["catalog-readiness-executive-guide", "AI Readiness"],
    ["machine-readable-schema-org-json-ld-audit", "Machine Readability"],
    ["amazon-a-comparison-matrix-blueprint", "Amazon A+ Matrix"],
  ];

  for (const [slug, tab] of aliases) {
    await page.goto(`/dashboard?spoke=specs&tab=${slug}`);
    await expect(page.locator(".ifai-canvas.column-layout")).toHaveCount(1);
    await expect(canvas.activeTab).toHaveText(tab);
  }
});
