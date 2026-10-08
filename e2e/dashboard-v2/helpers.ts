import { expect, type Locator, type Page } from "@playwright/test";

/* Shared steps for the dashboard-v2 specs. Plain Playwright: these specs do not use
   e2e/fixtures.ts, which auto-opens the current dashboard at /dashboard. */

export const SHOTS = "/private/tmp/claude-501/-Users-watsonbriant-Downloads---IntoFocusAI-ifai-dashboard/1cd84f82-4c09-46eb-99cb-08335edb9214/scratchpad/chunk567";

/** Collects console errors and page errors from the first navigation on. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error).split("\n")[0]));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

export async function openDashboard(page: Page) {
  await page.goto("/dashboard-v2", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".graph-node").first()).toBeVisible({ timeout: 90_000 });
  // The map plays an entry animation during which clicks do not land; wait for it to settle.
  await expect(page.locator(".ifai-canvas")).not.toHaveClass(/iom-map-entering|iom-map-exiting/, { timeout: 30_000 });
}

/** Clicks a target until the panel shows the expected title; the first click can land during a camera move. */
async function clickUntilOpen(page: Page, target: Locator, title: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await target.click({ force: true });
    try {
      await expect(page.locator(".drilldown-title")).toContainText(title, { timeout: 4_000 });
      return;
    } catch {
      // try again
    }
  }
  throw new Error(`The ${title} panel did not open after six clicks.`);
}

/** Opens a spoke by its node id (spoke-retail, spoke-aeo, hub, ...) and waits for its title. */
export async function openSpoke(page: Page, nodeId: string, title: string) {
  await clickUntilOpen(page, page.locator(`.graph-node[data-graph-node-id="${nodeId}"]`), title);
  await expect(page.locator(".drilldown-panel")).toBeVisible({ timeout: 30_000 });
}

/**
 * Opens a spoke from its metric widget in the left rail, which sits in the same place at every
 * width (the map nodes overlap at phone width). The category is the spoke's nav label.
 */
export async function openSpokeFromWidget(page: Page, category: string) {
  const widget = page.locator(".metric-widget-body").filter({ has: page.locator(".metric-widget-category", { hasText: category }) }).first();
  await expect(widget).toBeVisible({ timeout: 60_000 });
  await clickUntilOpen(page, widget, category);
  await expect(page.locator(".drilldown-panel")).toBeVisible({ timeout: 30_000 });
}

export async function openTab(page: Page, name: string) {
  await page.locator(".drilldown-tab-btn", { hasText: name }).click();
  await expect(page.locator(".drilldown-tab-btn.active")).toContainText(name);
}

/** The visible rows of the first data table in the panel. */
export function tableRows(page: Page) {
  return page.locator(".dv2-table tbody tr.dv2-row");
}

export async function waitForRows(page: Page) {
  await expect(tableRows(page).first()).toBeVisible({ timeout: 120_000 });
}
