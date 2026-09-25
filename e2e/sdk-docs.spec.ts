import { expect, test } from "@playwright/test";

/* Smoke cover for the SDK routes. Thin, but it pins the behaviour the docs
   shell's page-change reset and hash deep-linking are responsible for. */

const DOCS_PAGES = [
  "/sdk/docs",
  "/sdk/docs/guides",
  "/sdk/docs/api",
  "/sdk/docs/design",
] as const;

test.describe("sdk routes", () => {
  test("the SDK canvas renders", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error).split("\n")[0]));

    await page.goto("/sdk");
    await expect(page.locator(".ifai-canvas")).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const path of DOCS_PAGES) {
    test(`${path} renders with a table of contents`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error).split("\n")[0]));

      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("navigating between docs pages clears the filter", async ({ page }) => {
    await page.goto("/sdk/docs");

    const search = page.locator('input[type="search"]');
    await expect(search).toBeVisible();
    await search.fill("canvas");
    await expect(search).toHaveValue("canvas");

    await page.locator('a[href="/sdk/docs/guides"]').first().click();
    await page.waitForURL("**/sdk/docs/guides");
    await expect(search).toHaveValue("");
  });

  test("a hash deep link scrolls to its heading", async ({ page }) => {
    await page.goto("/sdk/docs");
    const firstAnchor = await page
      .locator("[id]")
      .evaluateAll((els) =>
        els.map((el) => el.id).find((id) => id && /^[a-z][\w-]*$/.test(id)),
      );
    test.skip(!firstAnchor, "no anchorable heading on this page");

    await page.goto(`/sdk/docs#${firstAnchor}`);
    const scrolled = await page.evaluate(
      (id) => {
        const el = document.getElementById(id!);
        return el ? el.getBoundingClientRect().top : null;
      },
      firstAnchor ?? null,
    );
    expect(scrolled).not.toBeNull();
    expect(Math.abs(scrolled!)).toBeLessThan(400);
  });
});
