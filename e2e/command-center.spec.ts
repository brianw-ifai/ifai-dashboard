import { expect, test } from "./fixtures";

/* The "what do I need to worry about" queue: opens from Priorities, assignable,
   and every row a route into the detail behind it. */
test.describe("command center", () => {
  test("opens from the priorities control", async ({ canvas, page }) => {
    await canvas.openCommandCenter();
    await expect(canvas.commandCenter).toBeVisible();
    await expect(canvas.priorities).toHaveCount(6);
    await expect(canvas.commandCenter).not.toContainText("3,430");
    await expect(canvas.commandCenter).not.toContainText("993");
    await expect(canvas.commandCenter).not.toContainText("7.4%");
    await expect(canvas.commandCenter).not.toContainText("16.7%");
    await expect(canvas.commandCenter).not.toContainText("Fourteen");
    await expect(canvas.commandCenter).not.toContainText("14 catalog");
    await expect(canvas.commandCenter).not.toContainText("Discounted bundles");
    await expect(canvas.commandCenter).toContainText("below MAP");
    await expect(canvas.page.locator(".drilldown-title")).toContainText(
      "What do I need to worry about?",
    );
  });

  test("every priority explains why it is top of the list", async ({ canvas }) => {
    await canvas.openCommandCenter();
    const whys = canvas.page.locator(".cc-why p");
    await expect(whys).toHaveCount(6);
    for (const text of await whys.allInnerTexts()) {
      expect(text.trim().length).toBeGreaterThan(40);
    }
  });

  test("counts reflect the queue", async ({ canvas, page }) => {
    await canvas.openCommandCenter();
    const quadrants = page.locator(".cc-quadrant");
    await expect(quadrants.nth(1)).toContainText("6");
    await expect(quadrants.nth(0)).toContainText("2"); // critical

    await canvas.priority("Suppressed Listings").locator(".cc-done-btn").click();
    await expect(canvas.priorities).toHaveCount(5);
    await expect(quadrants.nth(1)).toContainText("5");
    await expect(page.locator(".cc-cleared summary")).toContainText("1 cleared");
  });

  test("a cleared item can be reopened", async ({ canvas, page }) => {
    await canvas.openCommandCenter();
    await canvas.priorities.first().locator(".cc-done-btn").click();
    await expect(canvas.priorities).toHaveCount(5);

    await page.locator(".cc-cleared summary").click();
    await page.locator(".cc-undo-btn").first().click();
    await expect(canvas.priorities).toHaveCount(6);
  });

  test("work can be assigned and survives a reload", async ({ canvas }) => {
    await canvas.openCommandCenter();
    const item = canvas.priority("Suppressed Listings");
    await expect(item.locator(".cc-owner-btn.active")).toHaveText("IntoFocus AI");

    await item.locator(".cc-owner-btn", { hasText: "Client team" }).click();
    await expect(item.locator(".cc-owner-btn.active")).toHaveText("Client team");

    await canvas.reload();
    await canvas.openCommandCenter();
    await expect(
      canvas.priority("Suppressed Listings").locator(".cc-owner-btn.active"),
    ).toHaveText("Client team");
  });

  test("clicking the active owner clears the assignment", async ({ canvas }) => {
    await canvas.openCommandCenter();
    const item = canvas.priorities.first();
    await item.locator(".cc-owner-btn", { hasText: "IntoFocus AI" }).click();
    await expect(item.locator(".cc-owner-btn.active")).toHaveCount(0);
  });

  /* Each priority must land on the tab that actually holds its evidence. */
  const routes = [
    ["Suppressed Listings", "Retail Overview"],
    ["AI assistants are quoting specs", "Hallucination"],
    ["machine-readable spec", "Schema"],
    ["below MAP", "MAP"],
    ["Beginner share of voice", "Battlecards"],
    ["A+ comparison tables", "A+"],
  ] as const;

  for (const [title, tab] of routes) {
    test(`"${title}" opens the ${tab} tab`, async ({ canvas }) => {
      await canvas.openPriority(title);
      await expect(canvas.activeTab).toContainText(tab);
    });
  }

  test("the back control returns to the queue", async ({ canvas }) => {
    await canvas.openPriority("Suppressed Listings");
    await canvas.backToPriorities();
    await expect(canvas.priorities).toHaveCount(6);
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
