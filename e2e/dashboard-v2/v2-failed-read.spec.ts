import { expect, test } from "@playwright/test";
import { openDashboard, openSpokeFromWidget, openTab, SHOTS, watchErrors } from "./helpers";

test("a failed listings read renders the unavailable state with no digits and no page errors", async ({ page }) => {
  const errors = watchErrors(page);
  await page.route("**/api/dashboard-v2/listings**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "forced failure for the failed-read test" }),
    }),
  );
  await openDashboard(page);
  await openSpokeFromWidget(page, "Portfolio Retail");
  await openTab(page, "Listings");

  const area = page.locator('.dv2-panel[data-tab-name="Listings"]');
  const status = area.locator(".dv2-remote-error");
  await expect(status).toBeVisible({ timeout: 30_000 });
  await expect(status).toContainText("unavailable");
  const text = (await area.innerText()).trim();
  expect(text).toContain("unavailable");
  expect(text).not.toMatch(/\d/);
  await expect(area.locator(".dv2-table")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/07-failed-read.png` });

  // The browser logs the forced 500 as a network notice; that is the test's own stub, not a page error.
  const unexpected = errors.filter((e) => !/Failed to load resource: the server responded with a status of 500/.test(e));
  expect(unexpected, unexpected.join("\n")).toEqual([]);
});
