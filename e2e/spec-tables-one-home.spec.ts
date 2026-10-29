import { expect, test } from "@playwright/test";
import { Canvas } from "./fixtures";
import { mockCanvasRead } from "./spec-read-mock";

/**
 * Proves the three spec surfaces with a mocked canvas API.
 * AI Readiness shows the ASIN table with Yes/No found values.
 * Machine Readability counts fender.com pages, lists the page with no spec block, and not the full ASIN table.
 * Catalog Governance shows the unnested-bundle table, hides the spec-field table,
 * and its count opens AI Readiness.
 */

test("spec tables live on one surface each", async ({ page }) => {
  const seen = await mockCanvasRead(page);

  const canvas = new Canvas(page);
  await canvas.open();
  await expect(async () => {
    await page.locator(".graph-node").filter({ hasText: /AI\s*Readiness/i }).click({ force: true });
    await expect(page.locator(".ifai-canvas.column-layout")).toHaveCount(1, { timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await canvas.openTab("AI Readiness");

  const catalog = page.locator("#spec-readiness-by-asin");
  await expect(catalog).toBeVisible();
  await expect(catalog).toContainText("B00MISSING");
  await expect(catalog).toContainText("B00FOUND01");
  await expect(catalog).toContainText("B00NULLFLG");
  await expect(catalog.getByText("No", { exact: true })).toHaveCount(1);
  await expect(catalog.getByText("Yes", { exact: true })).toHaveCount(2);
  await expect(page.getByText("Top missing schema fields")).toBeVisible();
  await expect(page.locator("[data-spec-filter]")).toHaveCount(0);

  await canvas.openTab("Machine Readability");
  const specHero = page.locator("[data-machine-hero='spec_block']");
  await expect(specHero.locator("[data-hero-percent]")).toHaveText("50.0%");
  await expect(specHero).toContainText("1 of 2");
  await expect(
    page.locator("[data-machine-hero='product_basics'] [data-hero-percent]"),
  ).toHaveText("100.0%");
  const pages = page.locator("#machine-readability-pages");
  await expect(pages).toBeVisible();
  await expect(pages.locator("[data-machine-page-count]")).toHaveAttribute("data-machine-page-count", "1");
  await expect(pages).toContainText("fender.com/en-US/found");
  await expect(pages).toContainText("B00FOUND01");
  await expect(pages).toContainText("Spec block");
  await expect(pages).not.toContainText("fender.com/en-US/clear");
  await expect(pages).not.toContainText("B00MISSING");
  await expect(page.locator("#spec-readiness-by-asin")).toHaveCount(0);
  await expect(page.getByText("Top missing schema fields")).toHaveCount(0);
  await expect(page.getByText("Spec readiness by ASIN")).toHaveCount(0);

  await canvas.openSpokeFromMap("Catalog Health");
  await canvas.openTab("Catalog Governance");
  await expect(page.locator("[data-catalog-governance-lead]")).toBeVisible();
  await expect(page.locator("[data-catalog-governance-notes]")).toBeVisible();
  await expect(page.getByText("Twin Amp Bundle")).toBeVisible();
  await expect(page.getByText("Missing Amazon spec fields")).toHaveCount(0);
  await expect(page.locator("#catalog-specs")).toHaveCount(0);

  const gapCount = page.locator("[data-spec-open='ai-readiness']");
  await expect(gapCount.locator("[data-amazon-spec-gap-count]")).toHaveAttribute(
    "data-amazon-spec-gap-count",
    "1",
  );
  await gapCount.click();
  await expect(canvas.activeTab).toContainText("AI Readiness");
  await expect(page.locator("#spec-readiness-by-asin")).toBeVisible();
  await expect(page.locator("#spec-readiness-by-asin")).toContainText("B00MISSING");

  expect(seen.some((entry) => entry.includes("fender_missing_fields=like."))).toBe(true);
});
