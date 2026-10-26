/**
 * Browser check for Worker 11.4 column fit defaults.
 * Run: node scripts/verify-resizable-fit.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3118";
const OUT = process.env.VERIFY_OUT ?? "/tmp/cursor/resizable-fit-verify";
mkdirSync(OUT, { recursive: true });

async function clearColumnStorage(page) {
  await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("ifai.retail.columns.")) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  });
}

async function openDashboard(page, { spoke = "aeo", tab }) {
  await page.goto(`${BASE}/dashboard?spoke=${spoke}&tab=${encodeURIComponent(tab)}`, {
    waitUntil: "networkidle",
  });
  const skip = page.getByRole("button", { name: "Skip Login" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await page.waitForTimeout(500);
  }
  await clearColumnStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
}

async function measureTable(page, tableId, rowFinder) {
  return page.evaluate(
    ({ tableId, rowFinder }) => {
      const scroll = document.querySelector(`[data-table-id="${tableId}"]`);
      if (!scroll) return { error: `missing table ${tableId}` };
      const table = scroll.querySelector("table.resizable-table");
      if (!table) return { error: "missing table element" };
      const rows = [...scroll.querySelectorAll("tbody tr")].filter((tr) =>
        [...tr.children].some((td) => td.tagName === "TD" && td.colSpan === 1),
      );
      let row = rows[0];
      if (rowFinder?.includesText) {
        const needle = rowFinder.includesText.toLowerCase();
        row = rows.find((tr) => (tr.innerText || "").toLowerCase().includes(needle)) ?? row;
      }
      if (rowFinder?.selector) {
        row = scroll.querySelector(rowFinder.selector) ?? row;
      }
      if (!row) return { error: "no body row", panel: scroll.clientWidth };

      const cols = [...table.querySelectorAll("col")].map((col) => ({
        id: col.getAttribute("data-col-id"),
        width: Math.round(parseFloat(getComputedStyle(col).width) || col.getBoundingClientRect().width),
      }));

      const root = table.closest(".ifai-canvas") || document.body;
      const cells = [...row.children].filter((el) => el.tagName === "TD" && el.colSpan === 1).map((td, index) => {
        const host = document.createElement("div");
        host.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;";
        root.appendChild(host);
        const probe = document.createElement("table");
        probe.className = table.className;
        probe.style.cssText = "table-layout:auto;width:max-content;";
        const tr = document.createElement("tr");
        const clone = td.cloneNode(true);
        clone.style.cssText = "white-space:nowrap;width:auto;max-width:none;word-break:normal;";
        clone.querySelectorAll(".tag-badge").forEach((node) => {
          node.style.whiteSpace = "nowrap";
          node.style.maxWidth = "none";
        });
        tr.appendChild(clone);
        const body = document.createElement("tbody");
        body.appendChild(tr);
        probe.appendChild(body);
        host.appendChild(probe);
        const contentWidth = Math.ceil(clone.getBoundingClientRect().width);
        host.remove();
        const badge = td.querySelector(".tag-badge");
        const colWidth = cols[index]?.width ?? Math.round(td.getBoundingClientRect().width);
        return {
          colId: cols[index]?.id ?? null,
          text: (td.innerText || "").replace(/\s+/g, " ").trim().slice(0, 140),
          colWidth,
          contentWidth,
          wraps: contentWidth > colWidth + 2,
          badgeHeight: badge ? Math.round(badge.getBoundingClientRect().height) : null,
          badgeWraps: badge ? badge.getBoundingClientRect().height > 36 : false,
        };
      });

      const panel = Math.round(scroll.clientWidth);
      const tableWidth = Math.round(table.getBoundingClientRect().width);
      return {
        panel,
        tableWidth,
        fill: scroll.getAttribute("data-fill-column"),
        gap: panel - tableWidth,
        cols,
        cells,
      };
    },
    { tableId, rowFinder },
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = {};

  await openDashboard(page, { tab: "Run Details" });
  await page.waitForSelector('[data-table-id="ai-simulations"]', { timeout: 60000 });
  await page.waitForTimeout(1000);
  report.runDetails = await measureTable(page, "ai-simulations", { selector: "tbody tr.ai-sim-row" });
  await page.locator('[data-table-id="ai-simulations"]').screenshot({
    path: join(OUT, "run-details-calls.png"),
  });

  await openDashboard(page, { tab: "Product Fact Checks" });
  await page.waitForSelector('[data-table-id="product-fact-checks"]', { timeout: 60000 });
  await page.waitForTimeout(1000);
  report.productFactChecks = await measureTable(page, "product-fact-checks", {
    includesText: "neck radius",
  });
  await page.locator('[data-table-id="product-fact-checks"]').screenshot({
    path: join(OUT, "product-fact-checks.png"),
  });

  // Wider viewport: fact text one-line needs more than the 1440 content well.
  await page.setViewportSize({ width: 1920, height: 1000 });
  await clearColumnStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  report.productFactChecksWide = await measureTable(page, "product-fact-checks", {
    includesText: "neck radius",
  });
  await page.locator('[data-table-id="product-fact-checks"]').screenshot({
    path: join(OUT, "product-fact-checks-wide.png"),
  });

  await openDashboard(page, { spoke: "competitors", tab: "Category Battlecards" });
  await page.setViewportSize({ width: 1440, height: 900 });
  if (await page.locator('[data-table-id="category-battlecards"]').count()) {
    await page.waitForTimeout(1000);
    report.battlecards = await measureTable(page, "category-battlecards");
    await page.locator('[data-table-id="category-battlecards"]').screenshot({
      path: join(OUT, "category-battlecards.png"),
    });
  } else {
    report.battlecards = { error: "battlecards table not found" };
  }

  console.log(JSON.stringify(report, null, 2));
  await browser.close();

  const checks = [];
  const rd = report.runDetails;
  if (rd?.error) checks.push(`run-details: ${rd.error}`);
  else {
    if (rd.fill !== "prompt") checks.push(`run-details fill=${rd.fill}`);
    if (Math.abs(rd.gap) > 8) checks.push(`run-details gap ${rd.gap}px (table should match panel)`);
    for (const cell of rd.cells || []) {
      if (cell.colId === "prompt") continue;
      if (cell.badgeWraps) checks.push(`run-details ${cell.colId} badge wraps: ${cell.text}`);
      else if (cell.wraps) checks.push(`run-details ${cell.colId} wraps (${cell.contentWidth}>${cell.colWidth}): ${cell.text}`);
    }
  }

  const pf = report.productFactChecksWide;
  if (pf?.error) checks.push(`product-fact-checks: ${pf.error}`);
  else if (pf) {
    if (pf.fill !== "question") checks.push(`fact-checks fill=${pf.fill}, expected question`);
    if (Math.abs(pf.gap) > 8) checks.push(`fact-checks gap ${pf.gap}px`);
    for (const cell of pf.cells || []) {
      if (cell.colId === "engine") continue;
      if (cell.colId === "result" && cell.badgeWraps) {
        checks.push(`fact-checks result badge wraps: ${cell.text}`);
      } else if (cell.colId !== "result" && cell.wraps) {
        checks.push(`fact-checks ${cell.colId} wraps (${cell.contentWidth}>${cell.colWidth}): ${cell.text}`);
      }
    }
  } else {
    checks.push("product-fact-checks: missing wide viewport measurement");
  }

  const bc = report.battlecards;
  if (bc?.error) checks.push(`battlecards: ${bc.error}`);
  else if (bc) {
    if (Math.abs(bc.gap) > 8) checks.push(`battlecards gap ${bc.gap}px`);
    for (const cell of bc.cells || []) {
      if (cell.wraps && (cell.text || "").length < 28) {
        checks.push(`battlecards short cell wraps: ${cell.colId} ${cell.text}`);
      }
    }
  }

  if (checks.length) {
    console.error("ACCEPTANCE_FAILURES:\n" + checks.join("\n"));
    process.exitCode = 2;
  } else {
    console.error("ACCEPTANCE_OK");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
