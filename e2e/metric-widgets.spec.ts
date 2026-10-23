import { expect, test } from "./fixtures";

test.describe("bubble signal slots", () => {
  test("shows three slots only while a bubble is hovered or focused", async ({ canvas, page }) => {
    await expect(page.locator("[data-hub-slot]")).toHaveCount(0);
    await expect(page.locator(".metric-widget-config")).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: /Choose metric/ })).toHaveCount(0);

    await page.locator("[data-graph-node-id='hub']").focus();
    await expect(page.locator("[data-hub-slot]")).toHaveCount(3);
    await expect(page.locator("[data-hub-slot-source]")).toHaveText("Summary");

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

  test("a click outside every bubble and the slots closes the slots", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 950 });
    await page.locator("[data-graph-node-id='spoke-retail']").focus();
    await expect(page.locator("[data-hub-slots]")).toHaveCount(1);

    // Just below the header, in the empty corner of the map, clear of every bubble.
    await page.mouse.click(10, 90);
    await expect(page.locator("[data-hub-slots]")).toHaveCount(0);
  });
});
