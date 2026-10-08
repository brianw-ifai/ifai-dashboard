import { expect, test } from "./fixtures";

test.describe("configurable metric widgets", () => {
  test("starts with three decision signals and spoke-derived categories", async ({ page }) => {
    const widgets = page.locator(".canvas-metric-widget");
    await expect(widgets).toHaveCount(3);
    await expect(widgets.nth(0)).toContainText("Listings below MAP");
    await expect(widgets.nth(1)).toContainText("Confirmed Spec Hallucinations");
    await expect(widgets.nth(2)).toContainText("Recoverable Revenue");

    const firstBox = await widgets.first().boundingBox();
    expect(firstBox).not.toBeNull();
    expect(firstBox!.width / firstBox!.height).toBeGreaterThan(1.7);

    await widgets.nth(0).locator(".metric-widget-config").click();
    const picker = page.getByRole("dialog", { name: "Choose metric for widget 1" });
    await expect(picker).toBeVisible();
    await expect(picker.locator(".metric-widget-group h3")).toContainText([
      "Overview",
      "Portfolio Retail",
      "AI Search Visibility",
      "AI Readiness",
      "Competitive Radar",
      "Action Items",
      "90-Day Roadmap",
    ]);
  });

  test("allows duplicate selections", async ({ page }) => {
    const widgets = page.locator(".canvas-metric-widget");
    await widgets.nth(0).locator(".metric-widget-config").click();
    await page
      .getByRole("dialog", { name: "Choose metric for widget 1" })
      .locator(".metric-widget-option", { hasText: "Confirmed Spec Hallucinations" })
      .click();

    await expect(
      page.locator(".metric-widget-label", { hasText: "Confirmed Spec Hallucinations" }),
    ).toHaveCount(2);
  });

  test("supports an empty add bubble and persists it across reloads", async ({ canvas, page }) => {
    const firstWidget = page.locator(".canvas-metric-widget").first();
    await firstWidget.locator(".metric-widget-config").click();
    await page
      .getByRole("dialog", { name: "Choose metric for widget 1" })
      .locator(".metric-widget-clear")
      .click();

    await expect(firstWidget).toHaveClass(/is-empty/);
    await expect(page.getByRole("button", { name: "Add metric to widget 1" })).toBeVisible();

    await canvas.reload();
    await expect(page.locator(".canvas-metric-widget").first()).toHaveClass(/is-empty/);
    await expect(page.getByRole("button", { name: "Add metric to widget 1" })).toBeVisible();
  });
});
