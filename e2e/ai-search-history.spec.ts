import { expect, test } from "./fixtures";

const OCTOBER_11 = "7c3e9f52-4b1a-4d8e-9a6f-2e5d81b0c4a7";
const EARLIER = "e775ee16-ec5b-45b0-8918-579181b44aff";
const PUBLISHED = "b28d6086-65f3-4d12-a775-ea724ea58f22";

test.describe("AI Search history on the live run", () => {
  test("the current run stays current and only the three review days are offered", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
    const trigger = page.locator("[data-ai-history-trigger]");
    await expect(trigger).toContainText(/Current run/);
    await trigger.click();
    const dialog = page.locator("[data-ai-history-dialog]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("checkbox", { name: "Include legacy test runs" })).toHaveCount(0);
    await expect(page.locator("[data-ai-history-day='2026-10-11']")).toBeEnabled();
    await expect(page.locator("[data-ai-history-day='2026-10-12']")).toBeEnabled();
    await expect(page.locator("[data-ai-history-day='2026-10-03']")).toBeDisabled();
    await expect(page.locator("[data-ai-history-day='2026-10-11']")).toHaveAttribute("data-ai-history-coverage", "partial");
    await expect(page.locator("[data-ai-history-day='2026-10-12']")).toHaveAttribute("data-ai-history-coverage", "partial");
    await expect(page.locator("[data-ai-history-enabled='true']")).toHaveCount(2);
    await expect(dialog.getByRole("button", { name: "Previous run" })).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".drilldown-panel")).toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
  });

  test("selecting October 11 loads that stored run from the database", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ai-history-trigger]").click();
    await page.locator("[data-ai-history-day='2026-10-11']").click();
    await expect(page.locator(`[data-ai-history-scoring='${OCTOBER_11}']`)).toHaveText("Original winner labels");
    await expect(page.locator("[data-ai-history-gap='p15:perplexity']")).toContainText(
      "What is the best first electric guitar for a total beginner?",
    );
    await expect(page.locator("[data-ai-history-gap='p24:chatgpt']")).toContainText(
      "Best 5-string bass guitar for gigging musicians",
    );
    await page.locator("[data-ai-history-view-run]").click();
    await expect(page.locator("[data-ai-history-banner]")).toContainText("Historical run");
    await expect(page.locator("[data-ai-state='unavailable']")).toHaveCount(0);
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.7%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("100.0%");
    await expect(page.locator(".ai-run-freshness")).toContainText("Historical run");
    await expect(page.locator(".ai-run-freshness")).not.toContainText("Historical published run");
    await page.locator("[data-ai-history-return]").click();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
  });

  test("all time draws the three stored runs from the database", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "All time" }).click();
    await expect(page.locator(".drilldown-desc")).toContainText("Trends use the stored review runs");
    await expect(page.locator(".drilldown-desc")).not.toContainText("Copy of the stored runs");
    await expect(page.locator("[data-ai-history-chart]")).toBeVisible();
    await expect(page.locator("[data-ai-history-boundary='scoring']")).toContainText("Scoring method changed");
    const rows = page.locator("[data-ai-trend-row$=':overall']");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("Oct 11, 2026");
    await expect(rows.nth(0)).toContainText("56.7% (17 of 30 resolved)");
    await expect(rows.nth(1)).toContainText("65.0% (13 of 20 resolved)");
    await expect(rows.nth(2)).toContainText("56.5% (13 of 23 resolved)");
    await page.locator(".drilldown-tab-btn", { hasText: "Run Details" }).click();
    await expect(page.locator("[data-ai-history-trends]")).toHaveCount(0);
    await expect(page.locator("#ai-simulation-list")).toBeVisible();
    await expect(page.locator("[data-ai-history-banner]")).toContainText("current published run");
    await page.locator(".drilldown-tab-btn", { hasText: "Product Fact Checks" }).click();
    await expect(page.locator("[data-ai-history-trends]")).toHaveCount(0);
    await page.locator(".drilldown-tab-btn", { hasText: "Citation Ecosystem" }).click();
    await expect(page.locator("[data-ai-history-trends]")).toHaveCount(0);
    await expect(page.locator("[data-ai-citation-count], [data-ai-cited-links]").first()).toBeVisible();
    await page.locator(".drilldown-tab-btn", { hasText: "Run Summary" }).click();
    await expect(page.locator("[data-ai-history-trends]")).toBeVisible();
    await page.locator("[data-ai-history-return]").click();
    await expect(page.locator("[data-ai-history-trigger]")).toContainText("Current run");
    await page.locator(".drilldown-tab-btn", { hasText: "Run Summary" }).click();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
    await expect(page.locator(".drilldown-tab-btn")).toHaveText([
      "Run Summary",
      "Run Details",
      "Product Fact Checks",
      "Citation Ecosystem",
    ]);
  });
});

test.describe("AI Search stored-run copy", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard?ai-history=fixture");
    await expect(page.locator(".graph-node").first()).toBeVisible();
  });

  test("the copy labels the three runs and return restores the live rates", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await page.locator("[data-ai-history-trigger]").click();
    await expect(page.locator("[data-ai-history-fixture]")).toContainText("Copy of the stored runs");
    await expect(page.locator("[data-ai-history-day='2026-10-03']")).toBeDisabled();
    await page.locator("[data-ai-history-day='2026-10-12']").click();
    await expect(page.locator("[data-ai-history-run]")).toHaveCount(2);
    await expect(page.locator(`[data-ai-history-run='${EARLIER}']`)).toContainText("Mention-based scoring");
    await expect(page.locator(`[data-ai-history-run='${EARLIER}']`)).toContainText("Not published");
    await expect(page.locator(`[data-ai-citation-caution='${EARLIER}']`)).toContainText("mostly not stored");
    await expect(page.locator(`[data-ai-history-run='${PUBLISHED}']`)).toContainText("Mention-based scoring");
    await page.locator("[data-ai-history-day='2026-10-11']").click();
    await expect(page.locator(`[data-ai-history-scoring='${OCTOBER_11}']`)).toHaveText("Original winner labels");
    await page.locator("[data-ai-history-view-run]").click();
    await expect(page.locator("[data-ai-history-banner]")).toContainText("Historical run");
    await expect(page.locator("[data-ai-history-fixture]")).toContainText("Copy of the stored runs");
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.7%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("100.0%");
    await expect(page.locator(".ai-run-freshness")).toContainText("Historical run");
    await expect(page.locator(".ai-run-freshness")).not.toContainText("Historical published run");
    await page.locator(".drilldown-tab-btn", { hasText: "Citation Ecosystem" }).click();
    await expect(page.locator("[data-ai-citation-count]")).toContainText("468 citation rows");
    await expect(page.locator("[data-ai-citation-count]")).toContainText("not read as a change in the citation ecosystem");
    await expect(page.getByText("No answer in this view returned a cited link.")).toHaveCount(0);
    await page.locator("[data-ai-history-return]").click();
    await expect(page.locator("[data-ai-history-banner]")).toHaveCount(0);
    await page.locator(".drilldown-tab-btn", { hasText: "Run Summary" }).click();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
  });

  test("the trend connects the three runs and marks the scoring boundary", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "All time" }).click();
    await expect(page.locator("[data-ai-history-trends]")).toBeVisible();
    await expect(page.locator(".drilldown-desc")).toContainText("Copy of the stored runs");
    await expect(page.locator(".drilldown-desc")).not.toContainText("56.5%");
    await expect(page.locator("[data-ai-history-boundary='scoring']")).toContainText("Scoring method changed");
    await expect(page.locator("[data-ai-history-boundary='scoring']")).toContainText("Original winner labels");
    await expect(page.locator("[data-ai-history-boundary='scoring']")).toContainText("Mention-based scoring");
    await expect(page.locator("[data-ai-history-boundary='question']")).toHaveCount(0);
    await expect(page.locator("[data-ai-history-chart]")).toBeVisible();
    const rows = page.locator("[data-ai-trend-row$=':overall']");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("Oct 11, 2026");
    await expect(rows.nth(0)).toContainText("Original winner labels");
    await expect(rows.nth(0)).toContainText("56.7% (17 of 30 resolved)");
    await expect(rows.nth(0)).toContainText("2 not stored");
    await expect(rows.nth(1)).toContainText("Mention-based scoring");
    await expect(rows.nth(1)).toContainText("65.0% (13 of 20 resolved)");
    await expect(rows.nth(2)).toContainText("56.5% (13 of 23 resolved)");
    await expect(page.locator("[data-ai-history-gap='p15:perplexity']")).toContainText("total beginner");
    await expect(page.locator("[data-ai-history-gap='p24:chatgpt']")).toContainText("5-string bass");
    await page.getByRole("button", { name: "Branded consideration" }).click();
    await expect(page.locator(`[data-ai-trend-row='${EARLIER}:overall']`)).toContainText("100.0% (18 of 18 resolved)");
    await expect(page.locator(`[data-ai-trend-row='${PUBLISHED}:overall']`)).toContainText("95.7% (22 of 23 resolved)");
    await page.getByRole("button", { name: "By engine" }).click();
    await expect(page.locator(`[data-ai-trend-row='${EARLIER}:chatgpt']`)).toContainText("Small sample");
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "Previous run" }).click();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("65.0%");
    await page.locator(".drilldown-tab-btn", { hasText: "Citation Ecosystem" }).click();
    await expect(page.locator("[data-ai-citation-caution]")).toContainText(
      "These 2 stored citations are not evidence that the citation ecosystem changed.",
    );
    await page.locator("[data-ai-history-return]").click();
    await page.locator(".drilldown-tab-btn", { hasText: "Run Summary" }).click();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
  });
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
] as const) {
  test.describe(`history themes at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("the calendar and trends stay usable in dark and light", async ({ canvas, page }) => {
      await page.goto("/dashboard?ai-history=fixture");
      await expect(page.locator(".graph-node").first()).toBeVisible();
      await canvas.openSpokeFromMap("AI Search Visibility");
      const theme = page.locator("button[title='Toggle Light / Dark']");
      for (const mode of ["dark", "light"] as const) {
        if (mode === "light") await theme.click();
        await expect(page.locator(".ifai-canvas")).toHaveClass(mode === "light" ? /light-theme/ : /^((?!light-theme).)*$/);
        await page.locator("[data-ai-history-trigger]").click();
        await expect(page.locator("[data-ai-history-dialog]")).toBeVisible();
        await expect(page.locator("[data-ai-history-day='2026-10-11']")).toBeEnabled();
        await page.getByRole("button", { name: "All time" }).click();
        await expect(page.locator("[data-ai-history-trends]")).toBeVisible();
        await expect(page.locator(`[data-ai-trend-row='${OCTOBER_11}:overall']`)).toContainText("56.7%");
        await expect(page.locator("[data-ai-history-boundary='scoring']")).toBeVisible();
        await page.locator("[data-ai-history-return]").click();
      }
    });
  });
}
