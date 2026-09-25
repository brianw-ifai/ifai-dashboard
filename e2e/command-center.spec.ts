import { expect, test } from "./fixtures";

/* The "what do I need to worry about" queue: open on arrival, assignable,
   and every row a route into the detail behind it. */
test.describe("command center", () => {
  test("opens on arrival without clicking a bubble", async ({ canvas }) => {
    await expect(canvas.commandCenter).toBeVisible();
    await expect(canvas.priorities).toHaveCount(7);
    await expect(canvas.page.locator(".drilldown-title")).toContainText(
      "What do I need to worry about?",
    );
  });

  test("every priority explains why it is top of the list", async ({ canvas }) => {
    const whys = canvas.page.locator(".cc-why p");
    await expect(whys).toHaveCount(7);
    for (const text of await whys.allInnerTexts()) {
      expect(text.trim().length).toBeGreaterThan(40);
    }
  });

  test("counts reflect the queue", async ({ canvas, page }) => {
    const quadrants = page.locator(".cc-quadrant");
    await expect(quadrants.nth(1)).toContainText("7");
    await expect(quadrants.nth(0)).toContainText("3"); // critical

    await canvas.priority("Amazon is hiding your buy button").locator(".cc-done-btn").click();
    await expect(canvas.priorities).toHaveCount(6);
    await expect(quadrants.nth(1)).toContainText("6");
    await expect(page.locator(".cc-cleared summary")).toContainText("1 cleared");
  });

  test("a cleared item can be reopened", async ({ canvas, page }) => {
    await canvas.priorities.first().locator(".cc-done-btn").click();
    await expect(canvas.priorities).toHaveCount(6);

    await page.locator(".cc-cleared summary").click();
    await page.locator(".cc-undo-btn").first().click();
    await expect(canvas.priorities).toHaveCount(7);
  });

  test("work can be assigned and survives a reload", async ({ canvas }) => {
    const item = canvas.priority("Amazon is hiding your buy button");
    await expect(item.locator(".cc-owner-btn.active")).toHaveText("IntoFocus AI");

    await item.locator(".cc-owner-btn", { hasText: "Client team" }).click();
    await expect(item.locator(".cc-owner-btn.active")).toHaveText("Client team");

    await canvas.reload();
    await expect(
      canvas.priority("Amazon is hiding your buy button").locator(".cc-owner-btn.active"),
    ).toHaveText("Client team");
  });

  test("clicking the active owner clears the assignment", async ({ canvas }) => {
    const item = canvas.priorities.first();
    await item.locator(".cc-owner-btn", { hasText: "IntoFocus AI" }).click();
    await expect(item.locator(".cc-owner-btn.active")).toHaveCount(0);
  });

  /* Each priority must land on the tab that actually holds its evidence. */
  const routes = [
    ["Amazon is hiding your buy button", "Flagged ASINs"],
    ["customer reviews are stranded", "Catalog"],
    ["AI assistants are quoting specs", "Hallucination"],
    ["invisible to AI crawlers", "Schema"],
    ["Discounted bundles are dragging", "MAP"],
    ["head-to-head recommendations", "Battlecards"],
    ["no comparison table", "A+"],
  ] as const;

  for (const [title, tab] of routes) {
    test(`"${title}" opens the ${tab} tab`, async ({ canvas }) => {
      await canvas.openPriority(title);
      await expect(canvas.activeTab).toContainText(tab);
    });
  }

  test("the back control returns to the queue", async ({ canvas }) => {
    await canvas.openPriority("Amazon is hiding your buy button");
    await canvas.backToPriorities();
    await expect(canvas.priorities).toHaveCount(7);
  });

  test("the header Priorities button reopens the queue from a spoke", async ({
    canvas,
    page,
  }) => {
    await canvas.openPriority("AI assistants are quoting specs");
    await page.locator(".hdr-btn", { hasText: "Priorities" }).click();
    await expect(canvas.commandCenter).toBeVisible();
  });
});
