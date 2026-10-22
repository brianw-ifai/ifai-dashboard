import { expect, test } from "./fixtures";

test.describe("bubble signal slots", () => {
  test("replaces the metric picker with three slots from the focused bubble", async ({ canvas, page }) => {
    await expect(page.locator("[data-hub-slot]")).toHaveCount(3);
    await expect(page.locator("[data-hub-slot-source]")).toHaveText("Summary");
    await expect(page.locator(".metric-widget-config")).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: /Choose metric/ })).toHaveCount(0);

    for (const viewport of [
      { width: 1600, height: 950 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await page.locator("[data-graph-node-id='spoke-retail']").focus();
      await expect(page.locator("[data-hub-slot-source]")).toHaveText("Catalog Health");
      await expect(page.locator("[data-hub-slot='gap'] [data-hub-slot-status]")).not.toHaveText("");
      const figure = page.locator("[data-hub-slot='gap'] [data-hub-slot-figure]");
      const box = await figure.boundingBox();
      expect(box && box.height).toBeGreaterThan(20);
    }

    const tab = await page.locator("[data-hub-slot='gap']").getAttribute("data-hub-slot-tab");
    await page.locator("[data-hub-slot='gap']").click();
    await expect(canvas.activeTab).toContainText(tab ?? "Suppressed");
  });
});
