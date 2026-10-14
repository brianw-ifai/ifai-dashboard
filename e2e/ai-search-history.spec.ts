import { expect, test } from "./fixtures";

test.describe("AI Search history on the live run", () => {
  test("the current run is unchanged and the calendar closes from the keyboard", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
    const trigger = page.locator("[data-ai-history-trigger]");
    await expect(trigger).toContainText(/Current run/);
    await trigger.click();
    const dialog = page.locator("[data-ai-history-dialog]");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Previous run" })).toBeDisabled();
    await expect(page.locator("[data-ai-history-day='2026-10-12']")).toBeEnabled();
    await expect(page.locator("[data-ai-history-day='2026-10-11']")).toBeDisabled();
    await expect(page.locator("[data-ai-history-enabled='true']")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".drilldown-panel")).toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
  });

  test("all time does not invent a line from one published run", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "All time" }).click();
    await expect(page.locator("[data-ai-history-state='one-run']")).toContainText(
      "Trend begins after the next comparable published run",
    );
    await expect(page.locator("[data-ai-history-chart]")).toHaveCount(0);
    await page.locator("[data-ai-history-return]").click();
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator(".drilldown-tab-btn")).toHaveText([
      "Run Summary",
      "Simulations",
      "Product Fact Checks",
      "Citation Ecosystem",
    ]);
  });

  test("legacy runs stay out until the inspection control is on", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ai-history-trigger]").click();
    await page.locator("[data-ai-history-day='2026-10-12']").click();
    await expect(page.locator("[data-ai-history-run]")).toHaveCount(1);
    await page.getByRole("checkbox", { name: "Include legacy test runs" }).check();
    await expect(page.locator("[data-ai-history-run]")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
  });
});

test.describe("AI Search history fixtures", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard?ai-history=fixture");
    await expect(page.locator(".graph-node").first()).toBeVisible();
  });

  test("a historical run opens and return restores the live run", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(page.locator("[data-ai-history-day='2026-09-14']")).toBeEnabled();
    await expect(page.locator("[data-ai-history-day='2026-09-01']")).toBeDisabled();
    await page.locator("[data-ai-history-day='2026-09-14']").click();
    await page.locator("[data-ai-history-view-run]").click();
    await expect(page.locator("[data-ai-history-banner]")).toContainText("Historical run");
    await expect(page.locator("[data-ai-history-fixture]")).toBeVisible();
    await expect(page.locator(".drilldown-desc")).toContainText("Historical run");
    await expect(page.locator(".drilldown-desc")).toContainText("25.0%");
    await expect(page.locator(".drilldown-desc")).not.toContainText("56.5%");
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("25.0%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("66.7%");
    await page.locator("[data-ai-history-return]").click();
    await expect(page.locator("[data-ai-history-banner]")).toHaveCount(0);
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
  });

  test("range, all time, engines, exact questions, and the version boundary", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "Date range" }).click();
    await page.getByRole("button", { name: "Previous month" }).click();
    await page.locator("[data-ai-history-day='2026-09-07']").click();
    await page.locator("[data-ai-history-day='2026-09-28']").click();
    await page.getByRole("button", { name: "View trends" }).click();
    await expect(page.locator("[data-ai-history-trends]")).toBeVisible();
    await expect(page.locator(".drilldown-desc")).toContainText("fixture runs");
    await expect(page.locator(".drilldown-desc")).not.toContainText("56.5%");
    await expect(page.locator("[data-ai-history-boundary]")).toContainText("Question set changed");
    await expect(page.locator(".drilldown-tab-btn", { hasText: "Run Summary" })).toBeVisible();
    const small = page.locator("[data-ai-trend-row='fx-2026-09-14:overall']");
    await expect(small).toContainText("25.0% (1 of 4 resolved)");
    await expect(small).toContainText("Small sample");
    await expect(small).toContainText("1 unresolved");
    await expect(small).toContainText("1 provider error");
    await page.locator("[data-ai-trend-point='fx-2026-09-14:overall']").click();
    await expect(page.locator("[data-ai-trend-detail='fx-2026-09-14'] [data-ai-trend-bucket='rate']")).not.toHaveCount(0);
    await expect(page.locator("[data-ai-trend-detail='fx-2026-09-14'] [data-ai-trend-bucket='outside']")).not.toHaveCount(0);

    await page.getByRole("button", { name: "By engine" }).click();
    await expect(page.locator("[data-ai-trend-row='fx-2026-09-14:chatgpt']")).toBeVisible();
    await page.getByRole("button", { name: "Overall" }).click();

    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "All time" }).click();
    await expect(page.locator("[data-ai-trend-row='fx-2026-10-05:overall']")).toBeVisible();
    await expect(page.locator("[data-ai-trend-row*='fx-legacy']")).toHaveCount(0);
    await page.getByLabel("Question version").selectOption({ label: "What is the best beginner electric guitar?" });
    await expect(page.locator("[data-ai-trend-row='fx-2026-09-14:overall']")).toBeVisible();
    await expect(page.locator("[data-ai-trend-row='fx-2026-10-05:overall']")).toHaveCount(0);
    await page.getByLabel("Question version").selectOption({ label: "All wordings of p-beginner" });
    await expect(page.locator("[data-ai-history-boundary]")).toContainText("Question wording changed");
  });

  test("legacy fixture runs do not enter the trend", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "All time" }).click();
    await expect(page.locator("[data-ai-trend-row*='fx-legacy']")).toHaveCount(0);
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("checkbox", { name: "Include legacy test runs" }).check();
    await page.getByRole("button", { name: "Previous month" }).click();
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(page.locator("[data-ai-history-day='2026-08-01']")).toBeEnabled();
    await page.locator("[data-ai-history-day='2026-08-01']").click();
    await page.locator("[data-ai-history-view-run]").click();
    await expect(page.locator("[data-ai-history-legacy]")).toContainText("excluded from headline rates");
    await page.locator("[data-ai-history-return]").click();
    await page.locator("[data-ai-history-trigger]").click();
    await page.getByRole("button", { name: "All time" }).click();
    await expect(page.locator("[data-ai-trend-row*='fx-legacy']")).toHaveCount(0);
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
        await page.getByRole("button", { name: "All time" }).click();
        await expect(page.locator("[data-ai-history-trends]")).toBeVisible();
        await expect(page.locator("[data-ai-trend-row='fx-2026-09-14:overall']")).toContainText("25.0%");
        await page.locator("[data-ai-history-return]").click();
      }
    });
  });
}
