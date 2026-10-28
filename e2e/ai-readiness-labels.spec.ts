import { expect, test, type Page } from "@playwright/test";
import { Canvas } from "./fixtures";
import { FOUND_RESULT, MISSING_FIELD_ROWS, mockCanvasRead } from "./spec-read-mock";

/**
 * The AI Readiness bubble, its two satellites, and its tabs share one set
 * of names. A link copied from an earlier tab title still opens the same tab,
 * and the two controls on the first tab read as controls before they are used.
 */

const TAB_NAMES = ["Findability", "AI Readiness", "Machine Readability", "Amazon A+ Matrix"];

/** Bubble titles are drawn as separate SVG lines, so the DOM text has no space. */
function mapNode(page: Page, title: string) {
  const escaped = title
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s*");
  return page.locator(".graph-node").filter({ hasText: new RegExp(escaped, "i") });
}

async function openFirstTab(page: Page) {
  const canvas = new Canvas(page);
  await canvas.open();
  await expect(async () => {
    await page.locator(".graph-node").filter({ hasText: /AI\s*Readiness/i }).click({ force: true });
    await expect(page.locator(".ifai-canvas.column-layout")).toHaveCount(1, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await expect(canvas.panel).toBeVisible();
  await canvas.openTab("AI Readiness");
  return canvas;
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

  await expect(async () => {
    await mapNode(page, "AI Readiness").click({ force: true });
    await expect(page.locator(".ifai-canvas.column-layout")).toHaveCount(1, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
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

test("the first tab opens on two missing fields and reveals the rest", async ({ page }) => {
  await mockCanvasRead(page);
  await openFirstTab(page);

  const fields = page.locator("#spec-missing-fields > div");
  await expect(fields).toHaveCount(2);
  await expect(fields.first()).toContainText("scale_length");

  const reveal = page.locator("[data-spec-missing-fields-toggle]");
  await expect(reveal).toHaveText(`Show all ${MISSING_FIELD_ROWS.length} fields`);
  await reveal.click();
  await expect(fields).toHaveCount(MISSING_FIELD_ROWS.length);
  await expect(fields.last()).toContainText("pickup_configuration");

  await expect(reveal).toHaveText("Show fewer fields");
  await reveal.click();
  await expect(fields).toHaveCount(2);
});

test("the page found hero shows percent, ratio, and pie, and its Show filter works", async ({ page }) => {
  await mockCanvasRead(page);
  await openFirstTab(page);

  const lead = page.locator("[data-ai-readiness-lead]");
  await expect(lead).toBeVisible();
  await expect(page.locator(".spec-summary")).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Metric" })).toHaveCount(0);

  const pageFound = page.locator("[data-ai-readiness-hero='page_found']");
  await expect(pageFound.locator("[data-ai-readiness-hero-percent]")).toHaveText("50.0%");
  await expect(pageFound.locator("[data-ai-readiness-hero-ratio]")).toHaveText("2 of 4");
  await expect(pageFound.locator("[data-citation-pie-disc]")).toHaveCount(1);
  await expect(page.locator("[data-ai-readiness-hero]")).toHaveCount(4);

  const amazon = page.locator("[data-ai-readiness-hero='amazon_completeness']");
  await expect(amazon.locator("[data-ai-readiness-hero-percent]")).toHaveText("48.8%");
  await expect(amazon.locator("[data-ai-readiness-hero-ratio]")).toHaveText("Across 4 checked SKUs");

  await expect(lead).toContainText("older spec read");
  await expect(lead).toContainText("Findability tab");
  await expect(lead).toContainText("family page");

  const pill = pageFound.locator(".spec-found-pill");
  await expect(pill).toHaveCount(1);
  await expect(pill).toContainText("Show");
  await expect(pill).toHaveAttribute("aria-label", new RegExp(FOUND_RESULT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await expect(page.getByRole("button", { name: "Clear", exact: true })).toHaveCount(0);

  const catalog = page.locator("#spec-readiness-by-asin");
  await pill.click();
  await expect(pill).toContainText("Hide");
  await expect(pill).toHaveAttribute("aria-pressed", "true");
  await expect(catalog).toContainText("B00MISSING");
  await expect(catalog).not.toContainText("B00FOUND01");
  await expect(catalog).not.toContainText("B00NULLFLG");
  await expect(catalog).toContainText("missing page");

  await pill.click();
  await expect(pill).toContainText("Show");
  await expect(pill).toHaveAttribute("aria-pressed", "false");
  await expect(catalog).toContainText("B00FOUND01");
  await expect(catalog).toContainText("B00NULLFLG");

  const yesLink = catalog.locator('a.listing-link[href="https://www.fender.com/en-US/found"]');
  await expect(yesLink).toHaveText("Yes");
  await expect(yesLink).toHaveAttribute("target", "_blank");
  await expect(catalog.getByText("No", { exact: true })).toHaveCount(1);
  await expect(catalog.locator("a.listing-link", { hasText: "No" })).toHaveCount(0);
});
