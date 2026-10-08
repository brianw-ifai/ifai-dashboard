import { expect, test } from "@playwright/test";
import { openDashboard, openSpoke, SHOTS, watchErrors } from "./helpers";

test("the hub first view loads with five chart marks and an as-of header, with no page errors", async ({ page }) => {
  const errors = watchErrors(page);
  await openDashboard(page);

  await expect(page.getByTestId("header-asof")).toContainText("Readings as of");

  await openSpoke(page, "hub", "Brand Portfolio");
  const marks = page.locator('[data-chart="hub-overview"] .dv2-mark');
  await expect(marks).toHaveCount(5);
  await expect(page.getByTestId("asof-strip").locator("li").first()).toBeVisible();

  // Every mark is a keyboard-reachable button that opens the evidence drawer.
  const first = marks.first();
  await expect(first).toHaveAttribute("role", "button");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("explainer-drawer")).toContainText("Formula");
  await page.screenshot({ path: `${SHOTS}/01-hub-first-view.png`, fullPage: false });

  expect(errors, errors.join("\n")).toEqual([]);
});
