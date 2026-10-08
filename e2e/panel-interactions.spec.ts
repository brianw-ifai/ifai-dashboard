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
    await canvas.openPriority("Suppressed Listings");

    const toggle = page.locator(".ceo-callout-toggle").first();
    const body = page.locator(".ceo-callout-body").first();
    await expect(body).toBeVisible();

    await toggle.click();
    await expect(body).toBeHidden();
    // The header survives as a one-line reminder of what was hidden.
    await expect(page.locator(".ceo-callout-header").first()).toBeVisible();

    await canvas.reload();
    await canvas.openPriority("Suppressed Listings");
    await expect(page.locator(".ceo-callout-body").first()).toBeHidden();

    await page.locator(".ceo-callout-toggle").first().click();
    await expect(page.locator(".ceo-callout-body").first()).toBeVisible();
  });
});

test.describe("drill-downs", () => {
  test("MAP tab holds the summary and does not revive the old channel story", async ({ canvas, page }) => {
    await canvas.openPriority("Fender MAP prices have not been stored");
    await expect(canvas.activeTab).toContainText("MAP");

    const body = page.locator(".drilldown-body");
    await expect(body).toContainText("Minimum Advertised Price");
    await expect(body).toContainText("Summary");
    await expect(body).toContainText("Fender MAP prices have not been stored.");
    await expect(body).not.toContainText("listings below MAP");
    await expect(body).not.toContainText("Listings below MAP");
    await expect(body).not.toContainText("Average price gap");
    await expect(body).not.toContainText("Discounted bundles");
    await expect(body).not.toContainText("Amazon gap");
    const musiciansFriend = page.locator("tr", { hasText: "B0HJDFP2XS" });
    await expect(musiciansFriend).toBeVisible();
    await expect(musiciansFriend).toContainText("$599.99");
    await expect(musiciansFriend).not.toContainText("-$150");
    await expect(musiciansFriend.locator(".channel-gap")).toHaveCount(0);
    const walmart = page.locator("tr", { hasText: "B0DYKZ4MJG" });
    await expect(walmart).toBeVisible();
    await expect(walmart).toContainText("$220.14");
    await expect(walmart.locator(".channel-gap")).toHaveCount(0);
    await expect(body).not.toContainText("$808.00");
    await expect(body).not.toContainText("Reverb");
    await expect(body).not.toContainText("Sweetwater");
    await expect(body).not.toContainText("Featured Offer withheld");
    await expect(body).not.toContainText("Prices at MAP");
    await expect(page.locator(".map-channel-row")).toHaveCount(0);
  });

  test("portfolio retail keeps listings, MAP, suppressed rows, and catalog apart", async ({
    canvas,
    page,
  }) => {
    await canvas.openPriority("Suppressed Listings");
    await expect(page.locator(".drilldown-tab-btn")).toHaveText([
      "Retail Overview",
      "Suppressed Listings",
      "MAP",
      "Catalog Governance",
    ]);

    await expect(canvas.activeTab).toHaveText("Retail Overview");
    await expect(page.getByRole("button", { name: "Explore all listings" })).toBeVisible();
    await expect(page.locator(".retail-listings-table")).toHaveCount(0);
    await expect(page.locator(".suppressed-listings")).toHaveCount(0);

    await page.getByRole("button", { name: "Explore all listings" }).click();
    await expect(page.locator(".retail-listings-table")).toBeVisible();
    await expect(page.locator(".segmented-btn", { hasText: "All" })).toBeVisible();
    await expect(page.locator(".segmented-btn", { hasText: "MAP violations only" })).toBeVisible();
    await expect(page.locator(".segmented-btn", { hasText: "Bundles only" })).toBeVisible();

    await canvas.openTab("Catalog Governance");
    const catalog = page.locator(".catalog-governance");
    await expect(catalog).toContainText("not the full catalog");
    await expect(catalog).not.toContainText("listings below MAP");
    await expect(catalog).not.toContainText("Average price gap");
    await expect(catalog).not.toContainText("$808");
    await expect(catalog).not.toContainText("8 Listings");
    await expect(catalog).not.toContainText("11 Listings");
    await expect(catalog).not.toContainText("0 Violations");
    await expect(catalog).not.toContainText("Reverb");
    await expect(catalog).not.toContainText("Sweetwater");
    await expect(catalog).not.toContainText("Starter Kit");
  });

  test("suppressed listings follow the retail reading", async ({ canvas, page }) => {
    await canvas.openPriority("Suppressed Listings");
    await canvas.openTab("Suppressed Listings");
    const body = page.locator(".drilldown-body");
    const list = page.locator(".suppressed-listings");
    await expect(list).toBeVisible();
    await expect(list).toContainText("Competitive External Price");
    await expect(list).not.toContainText("Recorded Keepa reading");
    await expect(list).not.toContainText("39 of 993");
    await expect(list).not.toContainText("Reverb");
    await expect(list).not.toContainText("Sweetwater");
    await expect(body).not.toContainText("$808.00");

    const count = list.locator(".suppressed-count");
    await expect(count).toBeVisible();
    await expect(list.getByText("Loading qualifying listings…")).toHaveCount(0);
    await expect(list.getByText(/not a final count|not been stored|could not be loaded/)).toBeVisible();
    if (await count.isVisible()) {
      const badge = Number((await count.innerText()).replace(/,/g, ""));
      const empty = await list.getByText("No listing in this reading").count();
      const dataRows = empty ? 0 : await list.locator("tbody tr").count();
      expect(badge).toBe(dataRows);
    }
  });

  test("roadmap phases open the work behind them", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("Strategy Roadmap");
    const hints = page.locator(".ifai-open-hint");
    await expect(hints).toHaveCount(3);
    await expect(page.locator(".drilldown-desc")).not.toContainText("88%");
    await expect(page.locator(".drilldown-desc")).not.toContainText("95%");
    await expect(page.locator(".drilldown-body")).not.toContainText("Sweetwater");
    await expect(page.locator(".drilldown-body")).not.toContainText("Guitar Center");

    await hints.nth(0).click();
    await expect(canvas.activeTab).toHaveText("MAP");

    await canvas.openSpokeFromMap("Strategy Roadmap");
    await page.locator(".ifai-open-hint").nth(1).click();
    await expect(canvas.activeTab).toHaveText("Catalog Governance");
  });

  test("the spec sample states the live schema result", async ({ canvas, page }) => {
    await canvas.openPriority("machine-readable spec");
    await canvas.openTab("Readiness");
    await expect(page.locator(".drilldown-desc")).toContainText("additionalProperty");
    await expect(page.locator(".drilldown-desc")).not.toContainText("29.2%");
    await expect(page.locator(".drilldown-desc")).not.toContainText("7 of 22");
    await expect(page.locator(".drilldown-body")).toContainText("additionalProperty");
    await expect(page.locator(".drilldown-body")).not.toContainText("14 catalog");
  });

  test("the hallucination tab lists stored root causes", async ({ canvas, page }) => {
    await canvas.openPriority("AI assistants are quoting specs");
    await expect(canvas.activeTab).toContainText("Hallucination");
    await expect(page.locator(".drilldown-body")).toContainText("flagged answers");
    await expect(page.locator(".drilldown-body")).not.toContainText("Dual Humbucker");
    await expect(page.locator(".drilldown-body")).not.toContainText("12-Inch");
    await expect(page.locator(".drilldown-body")).not.toContainText("2 of 6");
  });

  test("competitive rows use the share-of-voice read", async ({ canvas, page }) => {
    await canvas.openPriority("Beginner share of voice");

    const headers = await page.locator(".table-sm th").allInnerTexts();
    expect(headers.some((h) => /fender win/i.test(h))).toBe(true);
    expect(headers.some((h) => /top competitor/i.test(h))).toBe(true);

    const body = page.locator(".drilldown-body");
    await expect(body).toContainText("Yamaha");
    await expect(body).toContainText("Fender/Squier");
    await expect(body).not.toContainText("16.7%");
    await expect(body).not.toContainText("15.4%");
    await expect(body).not.toContainText("50-point");
  });
});

test.describe("glossary", () => {
  test("jargon is marked with a plain-language definition", async ({ canvas, page }) => {
    await canvas.openPriority("Suppressed Listings");

    const terms = page.locator(".ifai-term");
    expect(await terms.count()).toBeGreaterThan(0);

    for (const term of await terms.all()) {
      const definition = await term.getAttribute("data-ifai-tooltip-desc");
      expect(definition?.length ?? 0).toBeGreaterThan(20);
      await expect(term).not.toHaveAttribute("title");
    }
    await expect(terms.filter({ hasText: "Featured Offer" }).first()).toBeVisible();
  });

  /* The command center is React-rendered; mutating it would fight reconciliation. */
  test("the walker leaves React-rendered content alone", async ({ canvas, page }) => {
    await canvas.openCommandCenter();
    await expect(page.locator(".command-center .ifai-term")).toHaveCount(0);

    const item = canvas.priorities.first();
    await item.locator(".cc-owner-btn", { hasText: "Client team" }).click();
    await expect(item.locator(".cc-owner-btn.active")).toHaveText("Client team");
  });

  test("marking does not corrupt the surrounding copy", async ({ canvas, page }) => {
    await canvas.openPriority("Suppressed Listings");
    const html = await page.locator(".drilldown-body").innerHTML();
    expect(html).toContain('<span class="ifai-term"');
    expect(html).not.toContain("&lt;span");
    await expect(page.locator(".drilldown-body")).toContainText("Featured Offer");
  });

  test("terms are re-marked after switching tabs", async ({ canvas, page }) => {
    await canvas.openPriority("Suppressed Listings");
    const before = await page.locator(".ifai-term").count();

    await canvas.openTab("MAP");
    await canvas.openTab("Retail Overview");
    await expect(page.locator(".ifai-term")).toHaveCount(before);
  });
});
