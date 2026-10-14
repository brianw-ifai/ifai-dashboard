import { expect, test } from "./fixtures";

const PRIMARY_TITLES = [
  "Action Items",
  "Strategy Roadmap",
  "AI Search Visibility",
  "Portfolio Retail",
  "AI Readiness",
  "Competitive Radar",
];

type Circle = { id: string; cx: number; cy: number; r: number };

async function circles(page: import("@playwright/test").Page, selector: string): Promise<Circle[]> {
  return page.locator(selector).evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect();
      const owner = node.closest("[data-graph-node-id]");
      return {
        id: owner?.getAttribute("data-graph-node-id") ?? "",
        cx: box.x + box.width / 2,
        cy: box.y + box.height / 2,
        r: Math.min(box.width, box.height) / 2,
      };
    }),
  );
}

function overlap(a: Circle, b: Circle) {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.r + b.r - 1;
}

test.describe("primary spoke map", () => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ]) {
    test(`primary circles stay apart at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const spokes = await circles(page, ".spoke-primary .node-circle");
      const hub = (await circles(page, ".graph-hub .node-circle"))[0];
      expect(spokes).toHaveLength(6);
      expect(hub).toBeTruthy();

      for (const spoke of spokes) {
        expect(overlap(spoke, hub), `${spoke.id} overlaps the hub`).toBe(false);
      }
      for (let i = 0; i < spokes.length; i += 1) {
        for (let j = i + 1; j < spokes.length; j += 1) {
          expect(overlap(spokes[i], spokes[j]), `${spokes[i].id} overlaps ${spokes[j].id}`).toBe(false);
        }
      }

      const satellites = await circles(page, ".graph-node:not(.spoke-primary):not(.graph-hub) .node-circle");
      for (const spoke of spokes) {
        for (const satellite of satellites) {
          expect(overlap(spoke, satellite), `${spoke.id} overlaps ${satellite.id}`).toBe(false);
        }
      }

      const roadmap = page.locator('[data-graph-node-id="spoke-roadmap"]');
      await expect(roadmap.locator(".node-meta")).toHaveCount(0);
      await expect(roadmap).toContainText("90 Days");
      await expect(roadmap).toContainText("3 Phases");

      for (const title of PRIMARY_TITLES) {
        const pattern = new RegExp(title.trim().split(/\s+/).join("\\s*"), "i");
        const node = page.locator(".spoke-primary").filter({ hasText: pattern });
        await expect(node).toBeVisible();
        const fontSize = await node.locator(".node-title").first().evaluate((el) => {
          const size = Number.parseFloat(getComputedStyle(el).fontSize);
          return Number.isFinite(size) ? size : 0;
        });
        expect(fontSize, title).toBeGreaterThan(12);
      }
    });
  }

  test("the Portfolio Retail column rail stays readable", async ({ canvas, page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    await canvas.openSpokeFromMap("Portfolio Retail");
    const retail = page.locator(".column-bubble-list .spoke-primary").filter({ hasText: /Portfolio\s*Retail/i });
    await expect(retail).toBeVisible();
    const fontSize = await retail.locator(".node-title").first().evaluate((el) => {
      return Number.parseFloat(getComputedStyle(el).fontSize);
    });
    expect(fontSize).toBeGreaterThan(11);
    const pill = retail.locator(".node-stat-text");
    await expect(pill).toHaveCount(1);
    const text = (await pill.textContent()) ?? "";
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/out of stock/i);
  });
});
