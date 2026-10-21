import { expect, test } from "@playwright/test";
import { Canvas } from "./fixtures";
import { mockCanvasRead } from "./spec-read-mock";

/** Label in the picker, and the current tab that label must open. */
const DESTINATIONS: Array<[string, string]> = [
  ["Monitored Electric SKUs", "Performance"],
  ["Active Amazon Offer Coverage", "Briefing"],
  ["Confirmed Amazon 1P Buy Box", "Retail Overview"],
  ["Seller Data Harvested", "Retail Overview"],
  ["MAP violations", "MAP"],
  ["Suppressed Listings", "Suppressed Listings"],
  ["Stranded Customer Reviews", "Catalog Governance"],
  ["Average Amazon Price Drift", "MAP"],
  ["Unbranded discovery", "Run Summary"],
  ["Beginner AI Win Rate", "Run Details"],
  ["Answered AI Calls", "Run Summary"],
  ["Product Fact Checks", "Product Fact Checks"],
  ["Exact official product pages", "Findability"],
  ["Machine-Readable Spec Coverage", "Machine Readability"],
  ["Pages Missing additionalProperty", "Machine Readability"],
  ["Beginner Category SOV Gap", "Category Battlecards"],
  ["Strongest Category SOV", "Category Battlecards"],
  ["Prioritized Action Items", "Urgent Interventions"],
  ["Recoverable Revenue", "Interactive ROI Model"],
  ["Enterprise GMV Potential", "Interactive ROI Model"],
  ["90-day plan", "30-60-90 Day Milestones"],
];

test("every rendered widget opens its current tab", async ({ page }) => {
  test.setTimeout(120_000);
  await mockCanvasRead(page);
  const canvas = new Canvas(page);
  await canvas.open();

  const widget = page.locator(".canvas-metric-widget").first();
  await widget.locator(".metric-widget-config").click();
  const picker = page.getByRole("dialog", { name: "Choose metric for widget 1" });
  for (const [label] of DESTINATIONS) {
    await expect(picker.locator(".metric-widget-option", { hasText: label })).toHaveCount(1);
  }

  for (const [label, tab] of DESTINATIONS) {
    if (!(await picker.isVisible())) {
      await widget.locator(".metric-widget-config").click();
    }
    await picker.locator(".metric-widget-option", { hasText: label }).click();
    await widget.locator(".metric-widget-body").click();
    await expect(canvas.activeTab).toContainText(tab);
    await page.getByRole("button", { name: "Show full map" }).click();
    await expect(page.locator(".ifai-canvas.panel-hidden")).toHaveCount(1);
  }
});
