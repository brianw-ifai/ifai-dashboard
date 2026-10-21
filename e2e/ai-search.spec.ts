import { expect, test } from "./fixtures";

/* AI Search Visibility and Competitive Radar read one published run.
   These cover the run summary, evidence drill-downs, citations, and old links. */

test.describe("AI Search Visibility", () => {
  test("the bubble states the published run with numerator and denominator", async ({ page }) => {
    const bubble = page.locator(".graph-node").filter({ hasText: /AI\s*Search\s*Visibility/i });
    await expect(bubble).toContainText(/Unbranded\s*13 of 23/);
    await expect(bubble).toContainText(/Branded\s*22 of 23/);
    await expect(bubble).not.toContainText(/51 of 63/);
    await expect(bubble).not.toContainText(/Sims/);
  });

  test("the run summary shows completeness, engines, and the win share", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await expect(canvas.activeTab).toHaveText("Run Summary");
    const body = page.locator(".drilldown-body");
    await expect(page.locator(".ai-run-freshness")).toContainText("Published run");
    await expect(page.locator(".ai-run-freshness")).toContainText(/completed .* UTC/);
    await expect(page.locator("[data-ai-win-rate='unbranded_discovery']")).toHaveText("56.5%");
    await expect(page.locator("[data-ai-win-rate='branded_consideration']")).toHaveText("95.7%");
    await expect(page.locator("[data-ai-role='unbranded_discovery']")).toContainText("13 Fender/Squier leads");
    await expect(page.locator("[data-ai-role='unbranded_discovery']")).toContainText("of 23");
    await expect(page.locator("[data-ai-role='branded_consideration']")).toContainText("22 Fender/Squier leads");
    await expect(page.locator("[data-ai-role='branded_consideration']")).toContainText("of 23");
    await expect(body).toContainText("not inside unbranded discovery");
    await expect(body).toContainText("Not in either rate above");
    await expect(body).not.toContainText("51 of 63");
    await expect(page.locator(".ai-engine-table tbody tr")).not.toHaveCount(0);
    await expect(page.locator(".ai-category-table [data-category='hallucinations']")).toHaveCount(0);
    await expect(page.locator(".ai-run-card")).toContainText("Expected calls");
  });

  test("the command center and metric repeat the two rates", async ({ canvas, page }) => {
    await canvas.openCommandCenter();
    await expect(canvas.commandCenter).toContainText("13 of 23 resolved answers (56.5%)");
    await expect(canvas.commandCenter).toContainText("22 of 23 resolved answers (95.7%)");
    await expect(canvas.commandCenter).not.toContainText("51 of 63");
    await page.locator(".drilldown-hide-btn").click();

    await page.locator(".metric-widget-config").first().click();
    const picker = page.getByRole("dialog");
    await expect(picker.locator(".metric-widget-option", { hasText: "Unbranded discovery" })).toContainText("56.5%");
    await expect(picker).not.toContainText("Overall AI Win Rate");
  });

  test("a headline count opens the rows behind it", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await page.locator("[data-ifai-evidence='outcome:error']").first().click();
    await expect(canvas.activeTab).toHaveText("Run Details");
    await expect(page).toHaveURL(/evidence=outcome(%3A|:)error/);
    const outcomes = await canvas.simulations.evaluateAll((els) => els.map((el) => el.getAttribute("data-outcome")));
    expect(outcomes.length).toBeGreaterThan(0);
    for (const outcome of outcomes) expect(outcome).toBe("error");
  });

  test("prompts carry no engine tag and the drawer hides absent remediation", async ({ canvas, page }) => {
    await canvas.openSimulations();
    for (const prompt of await page.locator("[data-ai-prompt]").allInnerTexts()) {
      expect(prompt).not.toMatch(/[[(]\s*(chatgpt|gemini|perplexity)/i);
    }
    await canvas.simulations.first().click();
    const drawer = page.locator(".ai-evidence-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Model");
    await expect(drawer).toContainText("Answer ID");
    await expect(drawer.locator("[data-ai-remediation]")).toHaveCount(0);
    await expect(drawer.locator("[data-ai-root-cause]")).toHaveCount(0);
  });

  test("a copied evidence link reopens the same call", async ({ canvas, page }) => {
    await canvas.openSimulations();
    const simId = await canvas.simulations.first().getAttribute("data-sim-id");
    await page.goto(`/dashboard?spoke=aeo&tab=simulations&evidence=sim:${simId}`);
    await expect(page.locator(`.ai-evidence-drawer[data-sim-id='${simId}']`)).toBeVisible();
  });

  test("citations drill from a domain to its cited pages", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await canvas.openTab("Citation Ecosystem");
    await expect(page.locator("[data-ai-cited-answers]")).toContainText(
      /\d+ of \d+ shopping answers cited web sources/,
    );
    await expect(page.locator("[data-ai-cited-links]")).toContainText(/Those answers contained \d+ cited links across \d+ domains/);
    await expect(page.locator("[data-ai-fender-owned]")).toContainText(/\d+ links, or \d+\.\d%, led to Fender-owned sites/);
    const body = page.locator(".drilldown-body");
    await expect(body).toContainText("Answers and links are separate counts");
    await expect(body).toContainText("Why this matters");
    await expect(body).toContainText("canonical product facts");
    await expect(page.locator("[data-ai-citation-interpretation]")).toContainText(
      "A low count does not prove a source had no influence",
    );
    await expect(body).not.toContainText("valid link");
    const domain = page.locator(".ai-top-domains [data-ai-pick^='domain:']").first();
    const picked = (await domain.getAttribute("data-ai-pick"))!.slice("domain:".length);
    await domain.click();
    const rows = page.locator(".ai-citation-evidence tbody tr");
    await expect(rows.first()).toBeVisible();
    for (const d of await rows.evaluateAll((els) => els.map((el) => el.getAttribute("data-domain")))) {
      expect(d).toBe(picked);
    }
    const link = page.locator(".ai-citation-evidence a[href]").first();
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(page.locator(".drilldown-body")).not.toContainText(/\bnull\b/);
  });

  test("AI definitions use the custom tooltip", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    const terms = page.locator(".ai-search-panel .ifai-term");
    await expect(terms.first()).toBeVisible();
    for (const term of await terms.all()) {
      expect((await term.getAttribute("data-ifai-tooltip-desc"))?.length ?? 0).toBeGreaterThan(20);
      await expect(term).not.toHaveAttribute("title");
    }
  });

  test("the citation definitions are reachable by keyboard", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await canvas.openTab("Citation Ecosystem");
    for (const [label, fragment] of [
      ["Cited link", "explicitly returned with its answer"],
      ["Fender-owned", "controlled by Fender or another FMIC brand"],
      ["Source class", "brand-owned, retailer, editorial, community, video, or other"],
    ]) {
      const term = page.locator(`.ifai-term[data-ifai-tooltip-title="${label}"]`).first();
      await expect(term).toHaveAttribute("data-ifai-tooltip-desc", new RegExp(fragment));
      await expect(term).toHaveAttribute("tabindex", "0");
      await expect(term).toHaveAttribute("aria-label", new RegExp(label));
      await expect(term).not.toHaveAttribute("title");
      await term.focus();
      await expect(page.locator(".node-tooltip-definition, .node-tooltip")).toBeVisible();
    }
  });

  test("the fact-check drawer reads question, fact, source, answer, result", async ({ canvas, page }) => {
    await canvas.openSimulations();
    await canvas.filterChip("Product fact checks").click();
    const checked = canvas.simulations.filter({ hasText: "No contradiction found for this fact" }).first();
    await checked.click();
    const drawer = page.locator("[data-ai-fact-check-evidence]");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("product questions IntoFocus sends to every engine on purpose");
    // The step labels are uppercased in CSS, so compare case-insensitively.
    const order = (await drawer.innerText()).toLowerCase();
    const steps = ["question checked", "verified fender fact", "official fender source", "ai answer", "result"];
    let cursor = -1;
    for (const step of steps) {
      const at = order.indexOf(step);
      expect(at, step).toBeGreaterThan(cursor);
      cursor = at;
    }
    await expect(drawer.locator("[data-ai-fact-result-row]")).toHaveText("No contradiction found for this fact");
    await expect(drawer.locator("[data-ai-remediation]")).toHaveCount(0);
    await expect(drawer.locator("[data-ai-root-cause]")).toHaveCount(0);
  });

  test("a question with no verified fact says so", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("AI Search Visibility");
    await canvas.openTab("Product Fact Checks");
    const pending = page.locator(".ai-probe-table tr[data-probe-state='no_fact']").first();
    await expect(pending).toContainText("No verified fact available");
    await expect(page.locator("[data-ai-pending-fact]")).toContainText(/no verified Fender fact yet/);
    await expect(page.locator("[data-ai-coverage-note]")).toContainText(/did not return answers for \d+ fact-check calls/);
    const body = page.locator(".drilldown-body");
    await expect(body).not.toContainText("0 of 65");
    await expect(body).not.toContainText("0 confirmed");
    await expect(body).not.toContainText("Not evaluated");
  });
});

test.describe("Competitive Radar", () => {
  test("only commercial AI-search outcomes, no retail channels", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("Competitive Radar");
    await expect(page.locator(".drilldown-tab-btn")).toHaveText([
      "Category Battlecards",
      "Competitor Wins",
      "Engine Comparison",
    ]);
    const body = page.locator(".drilldown-body");
    for (const tab of ["Category Battlecards", "Competitor Wins", "Engine Comparison"]) {
      await canvas.openTab(tab);
      await expect(page.locator(".ai-search-panel")).toBeVisible();
      await expect(body).not.toContainText(/Sweetwater|Reverb|Walmart|shelf price/i);
      await expect(body).not.toContainText(/hallucinations/i);
    }
    await expect(page.locator(".ai-engine-comparison tbody tr")).not.toHaveCount(0);
  });

  test("engine comparison shows the two rates, not one pooled commercial win rate", async ({ canvas, page }) => {
    await canvas.openSpokeFromMap("Competitive Radar");
    await canvas.openTab("Engine Comparison");
    const comparison = page.locator(".ai-engine-comparison");
    await expect(comparison).toContainText("Unbranded discovery");
    await expect(comparison).toContainText("Branded consideration");
    await expect(comparison.locator("[data-ai-role-total='unbranded_discovery']")).toContainText("13 of 23");
    await expect(comparison.locator("[data-ai-role-total='unbranded_discovery']")).toContainText("56.5%");
    await expect(comparison.locator("[data-ai-role-total='branded_consideration']")).toContainText("22 of 23");
    await expect(comparison.locator("[data-ai-role-total='branded_consideration']")).toContainText("95.7%");
    const body = page.locator(".drilldown-body");
    await expect(body).not.toContainText("51 of 63");
    await expect(body).not.toContainText("All commercial prompts");
    await expect(body).not.toContainText("Fender win share");
    await expect(body).not.toContainText("Too few to compare");
    const small = comparison.locator("[data-small-sample='true']").first();
    await expect(small).toContainText(/%/);
    await expect(small).toContainText("Small sample");
    await expect(small).toContainText(/of \d+/);

    const cell = await comparison.locator("td").first().evaluate((el) => getComputedStyle(el).fontSize);
    const header = await comparison.locator(".ifai-sort-btn").first().evaluate((el) => getComputedStyle(el).fontSize);
    const note = await comparison.locator(".ai-role-footnote").last().evaluate((el) => getComputedStyle(el).fontSize);
    expect(parseFloat(cell)).toBeGreaterThanOrEqual(15);
    expect(parseFloat(header)).toBeGreaterThanOrEqual(13);
    expect(parseFloat(note)).toBeGreaterThanOrEqual(14);

    await comparison.locator("[data-ai-role-total='unbranded_discovery'] .ifai-evidence-link").first().click();
    await expect(canvas.activeTab).toHaveText("Run Details");
    await expect(page.locator("[data-ai-role-filter='unbranded_discovery']")).toBeVisible();
    const roles = await canvas.simulations.evaluateAll((els) => els.map((el) => el.getAttribute("data-role")));
    expect(roles.length).toBeGreaterThan(0);
    for (const role of roles) expect(role).toBe("unbranded_discovery");
  });

  test("old tab slugs still open the renamed tabs", async ({ page }) => {
    for (const [spoke, slug, tab] of [
      ["competitors", "multi-marketplace-channel-scope-sweetwater-reverb-walmart", "Engine Comparison"],
      ["competitors", "head-to-head-category-battlecards", "Category Battlecards"],
      ["aeo", "dual-index-scoring-executive-callout", "Run Summary"],
      ["aeo", "simulations", "Run Details"],
      ["aeo", "100-ai-simulations-interactive-explorer", "Run Details"],
      ["aeo", "ai-spec-hallucination-engine-root-causes", "Product Fact Checks"],
      ["aeo", "ai-drift", "Product Fact Checks"],
      ["aeo", "hallucination", "Product Fact Checks"],
      ["aeo", "citation-ecosystem-fender-dtc-opportunity", "Citation Ecosystem"],
      ["hub", "executive-briefing-buy-box-coverage", "Briefing"],
      ["hub", "executive-briefing", "Briefing"],
      ["hub", "division-performance-3-598-skus", "Performance"],
      ["hub", "commercial-sizing-680k-pilot-vs-38m-to-62m-enterprise", "Opportunity"],
    ]) {
      await page.goto(`/dashboard?spoke=${spoke}&tab=${slug}`);
      await expect(page.locator(".drilldown-tab-btn.active")).toHaveText(tab);
    }
  });
});
