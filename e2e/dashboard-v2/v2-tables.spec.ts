import { expect, test } from "@playwright/test";
import { openDashboard, openSpoke, openTab, SHOTS, tableRows, waitForRows, watchErrors } from "./helpers";

/* The listings tables hold every row of the catalog (thousands), fetched in pages and rendered in full, so these specs get more time than the config default. */
test.setTimeout(180_000);

const money = (text: string) => Number(text.replace(/[^0-9.]/g, ""));

test("sorting listings by offer price changes the first row", async ({ page }) => {
  const errors = watchErrors(page);
  await openDashboard(page);
  await openSpoke(page, "spoke-retail", "Portfolio Retail");
  await openTab(page, "Listings");
  await waitForRows(page);

  const countLine = page.getByTestId("table-count");
  await expect(countLine).toContainText(/^\d{1,3}(,\d{3})* of \d{1,3}(,\d{3})* listings$/);
  const before = (await tableRows(page).first().locator('td[data-col="offer_price"]').innerText()).trim();
  const beforeAsin = (await tableRows(page).first().locator('td[data-col="asin"]').innerText()).trim();

  const sortButton = page.locator("th .ifai-sort-btn", { hasText: "Offer price" });
  await sortButton.click();
  await expect(sortButton).toHaveAttribute("data-sort-dir", "asc");
  const asc = (await tableRows(page).first().locator('td[data-col="offer_price"]').innerText()).trim();
  const ascAsin = (await tableRows(page).first().locator('td[data-col="asin"]').innerText()).trim();
  expect(`${ascAsin} ${asc}`).not.toEqual(`${beforeAsin} ${before}`);
  const second = (await tableRows(page).nth(1).locator('td[data-col="offer_price"]').innerText()).trim();
  expect(money(asc)).toBeLessThanOrEqual(money(second));

  await sortButton.click();
  await expect(sortButton).toHaveAttribute("data-sort-dir", "desc");
  const desc = (await tableRows(page).first().locator('td[data-col="offer_price"]').innerText()).trim();
  expect(desc).not.toEqual(asc);
  expect(money(desc)).toBeGreaterThan(money(asc));
  await page.screenshot({ path: `${SHOTS}/04-sorted-table.png` });

  const sortedNote = `sorted first cells: before: ${beforeAsin} ${before}; asc: ${ascAsin} ${asc}; desc: ${desc}; count line: ${(await countLine.innerText()).trim()}`;
  test.info().annotations.push({ type: "evidence", description: sortedNote });
  console.log(sortedNote);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("filtering outside prices to Walmart drops the count and keeps only Walmart rows; an empty filter shows the empty state; clearing restores", async ({ page }) => {
  const errors = watchErrors(page);
  await openDashboard(page);
  await openSpoke(page, "spoke-retail", "Portfolio Retail");
  await openTab(page, "Outside prices");
  await waitForRows(page);

  const countLine = page.getByTestId("table-count");
  const initial = (await countLine.innerText()).trim();
  const initialMatched = Number(initial.split(" of ")[0].replace(/,/g, ""));
  const initialTotal = Number(initial.split(" of ")[1].replace(/[^0-9]/g, ""));
  expect(initialMatched).toBe(initialTotal);

  await page.locator('select[aria-label="Filter Channel"]').selectOption({ label: "Walmart" });
  await expect(countLine).not.toHaveText(initial);
  const filtered = (await countLine.innerText()).trim();
  const filteredMatched = Number(filtered.split(" of ")[0].replace(/,/g, ""));
  expect(filteredMatched).toBeGreaterThan(0);
  expect(filteredMatched).toBeLessThan(initialMatched);
  const channels = await tableRows(page).locator('td[data-col="channel"]').allInnerTexts();
  expect(channels.length).toBe(filteredMatched);
  expect(channels.every((c) => c.trim() === "Walmart")).toBe(true);
  await page.screenshot({ path: `${SHOTS}/05-filtered-table.png` });

  await page.locator('input[aria-label="Filter ASIN"]').fill("ZZZZ-NO-SUCH-ASIN");
  await expect(page.getByTestId("table-empty")).toBeVisible();
  await expect(page.getByTestId("table-empty")).toContainText("No rows match these filters.");
  await expect(countLine).toContainText(/^0 of /);
  await page.screenshot({ path: `${SHOTS}/06-empty-state.png` });

  await page.getByTestId("table-empty").getByRole("button", { name: "Clear filters" }).click();
  await expect(countLine).toHaveText(initial);

  const filterNote = `filtered counts: initial: ${initial}; Walmart: ${filtered}; after clear: ${(await countLine.innerText()).trim()}`;
  test.info().annotations.push({ type: "evidence", description: filterNote });
  console.log(filterNote);
  expect(errors, errors.join("\n")).toEqual([]);
});
