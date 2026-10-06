import { expect, test } from "./fixtures";

/* The authored panel HTML is injected as a string and wired by delegation.
   These cover the contract in lib/canvas-sdk/panel-interactions.ts. */

test.describe("simulation filters", () => {
  test("filters narrow the list", async ({ canvas }) => {
    await canvas.openSimulations();
    await expect(canvas.simulations).toHaveCount(7);

    await canvas.filterChip("Hallucination Flags").click();
    await expect(canvas.simulations.filter({ visible: true })).toHaveCount(1);

    await canvas.filterChip("Electrics").click();
    await expect(canvas.simulations.filter({ visible: true })).toHaveCount(1);

    await canvas.filterChip("All (102)").click();
    await expect(canvas.simulations.filter({ visible: true })).toHaveCount(7);
  });

  /* Guards the regression these buttons shipped with: they called
     window.filterSimulations, which was never defined, and threw on click. */
  test("no filter relies on an undefined global", async ({ canvas, page }) => {
    await canvas.openSimulations();
    const inlineHandlers = await page
      .locator(".segmented-btn")
      .evaluateAll((els) => els.filter((el) => el.hasAttribute("onclick")).length);
    expect(inlineHandlers).toBe(0);
  });

  test("the active chip tracks the selection", async ({ canvas }) => {
    await canvas.openSimulations();
    await canvas.filterChip("Amps (12)").click();
    await expect(canvas.page.locator(".segmented-btn.active")).toHaveText(/Amps \(12\)/);
  });
});

test.describe("prompt watchlist", () => {
  test("starring builds a per-viewer watchlist that survives a reload", async ({ canvas }) => {
    await canvas.openSimulations();
    await expect(canvas.page.locator(".ifai-star-btn")).toHaveCount(7);

    await canvas.simulations.nth(1).locator(".ifai-star-btn").click();
    await canvas.simulations.nth(4).locator(".ifai-star-btn").click();
    await expect(canvas.page.locator(".ifai-star-chip")).toContainText("2");

    await canvas.filterChip("Starred").click();
    await expect(canvas.simulations.filter({ visible: true })).toHaveCount(2);

    await canvas.reload();
    await canvas.openSimulations();
    await expect(canvas.page.locator("#simulation-list .action-card.starred")).toHaveCount(2);
  });

  test("an empty watchlist says how to fill it", async ({ canvas, page }) => {
    await canvas.openSimulations();
    await canvas.filterChip("Starred").click();
    await expect(page.locator(".ifai-filter-empty")).toContainText("Nothing starred yet");
  });

  test("unstarring removes the row from the watchlist", async ({ canvas }) => {
    await canvas.openSimulations();
    const row = canvas.simulations.first();
    await row.locator(".ifai-star-btn").click();
    await expect(row).toHaveClass(/starred/);

    await row.locator(".ifai-star-btn").click();
    await expect(row).not.toHaveClass(/starred/);
    await expect(canvas.page.locator(".ifai-star-chip")).toContainText("0");
  });
});

test.describe("collapsible explanations", () => {
  test("an explanation can be hidden and stays hidden", async ({ canvas, page }) => {
    await canvas.openPriority("39 active offers have no Featured Offer");

    const toggle = page.locator(".ceo-callout-toggle").first();
    const body = page.locator(".ceo-callout-body").first();
    await expect(body).toBeVisible();

    await toggle.click();
    await expect(body).toBeHidden();
    // The header survives as a one-line reminder of what was hidden.
    await expect(page.locator(".ceo-callout-header").first()).toBeVisible();

    await canvas.reload();
    await canvas.openPriority("39 active offers have no Featured Offer");
    await expect(page.locator(".ceo-callout-body").first()).toBeHidden();

    await page.locator(".ceo-callout-toggle").first().click();
    await expect(page.locator(".ceo-callout-body").first()).toBeVisible();
  });
});

test.describe("drill-downs", () => {
  test("opening a spoke dismisses the node tooltip", async ({ canvas, page }) => {
    const retailNode = page.locator('[data-graph-node-id="spoke-retail"]');
    await retailNode.hover({ force: true });
    const tooltip = page.locator(".node-tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Highlights marketplace listings");
    await expect(tooltip).not.toContainText("Portfolio Retail highlights");
    await expect(retailNode).toContainText("457 below MAP");
    await expect(retailNode).toContainText("46% of 993");

    await retailNode.click({ force: true });
    await expect(canvas.panel).toBeVisible();
    await expect(tooltip).toBeHidden();
  });

  test("catalog governance connects listings to AI search and sorts the queue", async ({
    canvas,
    page,
  }) => {
    await canvas.openPriority("partner bundle listings need catalog governance");

    await expect(canvas.activeTab).toContainText("Catalog Consolidation");
    await expect(page.locator(".drilldown-body")).toContainText(
      "Why these listings matter to AI search",
    );
    await expect(page.locator(".drilldown-body")).not.toContainText(
      "Consolidation Opportunity by Partner",
    );
    const rows = page.locator(".drilldown-body tbody tr");
    await expect(rows).toHaveCount(14);

    const listing = rows.first().locator("a.listing-link").first();
    await expect(listing).toHaveAttribute("href", /amazon\.com\/dp\//);
    const popupPromise = page.waitForEvent("popup");
    await listing.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/amazon\.com\/dp\//);
    await popup.close();

    const partnerSort = page.locator(".ifai-sort-btn", { hasText: "Partner" });
    await partnerSort.click();
    await expect(rows.first()).toContainText("Mustang Micro");
    await partnerSort.click();
    await expect(rows.first()).toContainText("Player II Telecaster");
  });

  test("MAP channels open listing rows and explain consequences", async ({ canvas, page }) => {
    await canvas.openPriority("Discounted bundles are dragging");
    await expect(canvas.activeTab).toContainText("MAP");

    const amazon = page.locator(".map-channel-row", { hasText: "Amazon.com" });
    await amazon.click();
    const detail = page.locator('[data-ifai-detail="amazon"]');
    await expect(detail).toBeVisible();
    await expect(detail.locator("tbody tr")).toHaveCount(14);
    await expect(detail.locator("a.listing-link").first()).toHaveAttribute(
      "href",
      /amazon\.com\/dp\//,
    );

    const consequence = amazon.locator(".ifai-term");
    await expect(consequence).toHaveAttribute("data-ifai-tooltip-desc", /.+/);
    await consequence.hover();
    await expect(page.locator(".node-tooltip")).toContainText("Competitive External Price");
  });

  test("roadmap phases open the work behind them", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("Strategy Roadmap");
    await expect(page.locator(".ifai-open-hint")).toHaveCount(3);

    await page.locator(".ifai-open-hint").first().click();
    await expect(canvas.activeTab).toContainText("Catalog");
  });

  test("the spec sample states the live schema result", async ({ canvas, page }) => {
    await canvas.openPriority("machine-readable specs");
    await canvas.openTab("Readiness");
    await expect(page.locator(".drilldown-desc")).toContainText("29.2%");
    await expect(page.locator(".drilldown-body")).toContainText("additionalProperty");
  });

  test("competitive rows name the live leader and link to the evidence", async ({
    canvas,
    page,
  }) => {
    await canvas.openPriority("head-to-head recommendations");

    const headers = await page.locator(".table-sm th").allInnerTexts();
    expect(headers.some((h) => /leader brand/i.test(h))).toBe(true);
    expect(headers.some((h) => /fender sov/i.test(h))).toBe(true);

    const leaders = await page.locator("tr.ifai-row-link td:nth-child(2)").allInnerTexts();
    expect(leaders.map((name) => name.trim())).toEqual([
      "PRS",
      "Yamaha",
      "Fender/Squier",
      "Yamaha",
      "Fender/Squier",
    ]);

    await page.locator("tr.ifai-row-link").first().click();
    await expect(canvas.activeTab).toContainText("Simulations");
  });
});

test.describe("glossary", () => {
  test("jargon is marked with a plain-language definition", async ({ canvas, page }) => {
    await canvas.openPriority("39 active offers have no Featured Offer");

    const terms = page.locator(".ifai-term");
    expect(await terms.count()).toBeGreaterThan(0);

    for (const term of await terms.all()) {
      const definition = await term.getAttribute("data-ifai-tooltip-desc");
      expect(definition?.length ?? 0).toBeGreaterThan(20);
      await expect(term).not.toHaveAttribute("title");
    }
    await expect(terms.filter({ hasText: "Buy Box" }).first()).toBeVisible();
  });

  /* The command center is React-rendered; mutating it would fight reconciliation. */
  test("the walker leaves React-rendered content alone", async ({ canvas, page }) => {
    await expect(page.locator(".command-center .ifai-term")).toHaveCount(0);

    const item = canvas.priorities.first();
    await item.locator(".cc-owner-btn", { hasText: "Client team" }).click();
    await expect(item.locator(".cc-owner-btn.active")).toHaveText("Client team");
  });

  test("marking does not corrupt the surrounding copy", async ({ canvas, page }) => {
    await canvas.openPriority("39 active offers have no Featured Offer");
    const html = await page.locator(".drilldown-body").innerHTML();
    expect(html).toContain('<span class="ifai-term"');
    expect(html).not.toContain("&lt;span");
    await expect(page.locator(".drilldown-body")).toContainText("Buy Box");
  });

  test("terms are re-marked after switching tabs", async ({ canvas, page }) => {
    await canvas.openPriority("39 active offers have no Featured Offer");
    const before = await page.locator(".ifai-term").count();

    await canvas.openTab("MAP");
    await canvas.openTab("Suppressed");
    await expect(page.locator(".ifai-term")).toHaveCount(before);
  });
});
