import { expect, test } from "@playwright/test";
import { openDashboard, openSpokeFromWidget, SHOTS, watchErrors } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });

test("at phone width the page loads, the hub is visible, a spoke opens, and the page does not scroll sideways", async ({ page }) => {
  const errors = watchErrors(page);
  await openDashboard(page);
  await expect(page.locator('.graph-node[data-graph-node-id="hub"]')).toBeVisible();

  await openSpokeFromWidget(page, "AI Search Visibility");
  await expect(page.locator('[data-chart="grouped-bars"], .dv2-headline').first()).toBeVisible({ timeout: 30_000 });

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyScroll: document.body.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  expect(overflow.bodyScroll).toBeLessThanOrEqual(overflow.innerWidth);
  await page.screenshot({ path: `${SHOTS}/08-narrow.png` });

  expect(errors, errors.join("\n")).toEqual([]);
});
