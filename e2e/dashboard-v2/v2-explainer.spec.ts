import { expect, test } from "@playwright/test";
import { openDashboard, openSpoke, openTab, SHOTS, tableRows, waitForRows, watchErrors } from "./helpers";

/* The listings tables hold every row of the catalog (thousands), fetched in pages and rendered in full, so these specs get more time than the config default. */
test.setTimeout(180_000);

test("a suppressed listing's explainer shows benchmark, offer, gap, the Amazon link, and channel rows", async ({ page }) => {
  const errors = watchErrors(page);
  await openDashboard(page);
  await openSpoke(page, "spoke-retail", "Portfolio Retail");
  await expect(page.getByTestId("headline-figure")).toBeVisible();
  await expect(page.locator('[data-chart="offer-states"] .dv2-mark').first()).toBeVisible();
  await page.waitForTimeout(900); // let the panel finish sliding in before the screenshot
  await page.screenshot({ path: `${SHOTS}/02-retail-first-view.png` });

  await openTab(page, "Suppressed");
  await waitForRows(page);
  const row = tableRows(page).first();
  await expect(row.locator('td[data-col="suppressed"]')).toHaveText("yes");
  await row.locator(".dv2-expand-btn").click();

  const explainer = page.locator(".dv2-explainer").first();
  await expect(explainer).toBeVisible();
  await expect(explainer.locator(".dv2-explainer-name")).toContainText("Featured Offer withheld");
  await expect(explainer).toContainText("Benchmark");
  await expect(explainer).toContainText("Offer price");
  await expect(explainer).toContainText("Price gap");
  await expect(explainer).toContainText("Formula");
  const amazon = explainer.locator(".dv2-amazon-link");
  await expect(amazon).toHaveAttribute("href", /https:\/\/www\.amazon\.com\/dp\//);
  await expect(explainer.locator(".dv2-channel-table tbody tr").first()).toBeVisible({ timeout: 60_000 });
  const channelText = await explainer.locator(".dv2-channel-table").innerText();
  expect(channelText).toMatch(/Open the .* listing|no link stored/);
  await explainer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/03-explainer-row.png` });

  expect(errors, errors.join("\n")).toEqual([]);
});

test("a metric card opens a drawer with the registry name and the formula", async ({ page }) => {
  const errors = watchErrors(page);
  await openDashboard(page);
  await openSpoke(page, "spoke-retail", "Portfolio Retail");
  await openTab(page, "Read more");

  const card = page.locator(".dv2-card-btn").first();
  await expect(card).toHaveAttribute("aria-expanded", "false");
  await card.click();
  await expect(card).toHaveAttribute("aria-expanded", "true");
  const drawer = page.getByTestId("explainer-drawer");
  await expect(drawer).toBeVisible();
  const name = await drawer.locator(".dv2-explainer-name").innerText();
  expect(name.trim().length).toBeGreaterThan(3);
  await expect(drawer).toContainText("Formula");
  await expect(drawer).toContainText("Meaning");
  await expect(drawer).toContainText("Source tables");
  await expect(drawer).toContainText("Reading run");

  expect(errors, errors.join("\n")).toEqual([]);
});
