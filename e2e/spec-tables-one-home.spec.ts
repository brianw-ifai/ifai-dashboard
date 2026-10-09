import { expect, test } from "@playwright/test";
import { Canvas } from "./fixtures";
import { mockCanvasRead } from "./spec-read-mock";

/**
 * Proves the three spec surfaces with a mocked canvas API.
 * AI Readiness filters fender_found false and hides a true row.
 * Machine Readability shows an additionalProperty row and not the full ASIN table.
 * Catalog Governance shows the unnested-bundle table, hides the spec-field table,
 * and its count opens AI Readiness.
 */

test("spec tables live on one surface each", async ({ page }) => {
  const seen = await mockCanvasRead(page);

  const canvas = new Canvas(page);
  await canvas.open();
  await canvas.openSpokeFromMap("AI Readiness");
  await canvas.openTab("AI Readiness");

  const catalog = page.locator("#spec-readiness-by-asin");
  await expect(catalog).toBeVisible();
  await expect(catalog).toContainText("B00MISSING");
  await expect(catalog).toContainText("B00FOUND01");
  await expect(catalog).toContainText("B00NULLFLG");
  await expect(page.getByText("Top missing schema fields")).toBeVisible();

  const pageFound = page.locator("[data-spec-filter='missing-fender-page']");
  await pageFound.click();
  await expect(catalog).toContainText("B00MISSING");
  await expect(catalog).not.toContainText("B00FOUND01");
  await expect(catalog).not.toContainText("B00NULLFLG");
  await expect(catalog).toContainText("missing page");

  await pageFound.click();
  await expect(catalog).toContainText("B00FOUND01");
  await expect(catalog).toContainText("B00NULLFLG");

  await canvas.openTab("Machine Readability");
  const schema = page.locator("#schema-additional-property");
  await expect(schema).toBeVisible();
  await expect(schema).toContainText("B00FOUND01");
  await expect(schema).toContainText("additionalProperty");
  await expect(schema.locator("[data-schema-gap-count]")).toHaveAttribute("data-schema-gap-count", "1");
  await expect(schema).not.toContainText("B00CLEAR01");
  await expect(schema).not.toContainText("B00MISSING");
  await expect(page.locator("#spec-readiness-by-asin")).toHaveCount(0);
  await expect(page.getByText("Top missing schema fields")).toHaveCount(0);
  await expect(page.getByText("Spec readiness by ASIN")).toHaveCount(0);

  await canvas.openSpokeFromMap("Portfolio Retail");
  await canvas.openTab("Catalog Governance");
  await expect(page.getByText("Unnested bundles", { exact: true })).toBeVisible();
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
