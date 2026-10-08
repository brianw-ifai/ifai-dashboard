import { expect, test } from "@playwright/test";
import { Canvas } from "./fixtures";

/**
 * Proves the three spec surfaces with a mocked canvas API.
 * Catalog Readiness filters fender_found false and hides a true row.
 * Schema.org shows an additionalProperty row and not the full ASIN table.
 * Catalog Governance shows the unnested-bundle table, hides the spec-field table,
 * and its count opens Catalog Readiness.
 */

type Row = Record<string, unknown>;

const METRICS = {
  catalog_skus: 4,
  catalog_bundles: 1,
  spec_checked: 4,
  spec_fender_found: 2,
  spec_fender_found_pct: 50,
  spec_avg_amazon_pct: 48.8,
  spec_avg_fender_pct: 40,
  spec_missing_additional_property: 1,
  division_count: 1,
};

const SPEC_ROWS: Row[] = [
  {
    asin: "B00NULLFLG",
    title: "Unchecked flag",
    amazon_completeness_pct: 5,
    amazon_checked: true,
    amazon_missing_fields: "",
    fender_found: null,
    fender_missing_fields: "additionalProperty",
    fender_url: null,
  },
  {
    asin: "B00MISSING",
    title: "Missing Page Guitar",
    amazon_completeness_pct: 20,
    amazon_checked: true,
    amazon_missing_fields: "color",
    fender_found: false,
    fender_missing_fields: null,
    fender_url: null,
  },
  {
    asin: "B00CLEAR01",
    title: "Clear Page",
    amazon_completeness_pct: 80,
    amazon_checked: true,
    amazon_missing_fields: "",
    fender_found: true,
    fender_missing_fields: "scale_length",
    fender_url: "https://www.fender.com/en-US/clear",
  },
  {
    asin: "B00FOUND01",
    title: "Found Strat",
    amazon_completeness_pct: 90,
    amazon_checked: true,
    amazon_missing_fields: "",
    fender_found: true,
    fender_missing_fields: "neck; additionalProperty",
    fender_url: "https://www.fender.com/en-US/found",
  },
];

const BUNDLE: Row = {
  asin: "B00BUNDLE1",
  model_name: "Twin Amp Bundle",
  title: "Twin Amp Bundle",
  bundle_name: "Amp plus cable",
  parent_asin: null,
  product_url: "https://www.amazon.com/dp/B00BUNDLE1",
  is_bundle: true,
};

function specRowsFor(url: URL): Row[] {
  const found = url.searchParams.get("fender_found");
  const missing = url.searchParams.get("fender_missing_fields") ?? "";
  let rows = SPEC_ROWS;
  if (found === "eq.false") rows = rows.filter((row) => row.fender_found === false);
  if (found === "eq.true") rows = rows.filter((row) => row.fender_found === true);
  if (missing.startsWith("like.")) {
    const token = missing.slice("like.".length).replaceAll("%", "").replaceAll("*", "");
    rows = rows.filter((row) => String(row.fender_missing_fields ?? "").includes(token));
  }
  return rows;
}

function bodyFor(url: URL, accept: string): { body: unknown; count: number } {
  const table = url.pathname.split("/").pop() ?? "";
  if (table === "canvas_metrics") {
    if (accept.includes("vnd.pgrst.object")) return { body: METRICS, count: 1 };
    return { body: [{ catalog_bundles: METRICS.catalog_bundles }], count: 1 };
  }
  if (table === "canvas_spec_missing_fields") {
    return { body: [{ field: "scale_length", sku_count: 3, source: "amazon" }], count: 1 };
  }
  if (table === "canvas_freshness") {
    return {
      body: [{ job_key: "spec_readiness", last_run_at: "2026-10-08T00:00:00.000Z" }],
      count: 1,
    };
  }
  if (table === "canvas_retail_listings") {
    const select = url.searchParams.get("select") ?? "";
    if (select.includes("is_bundle")) return { body: [BUNDLE], count: 1 };
    return { body: [], count: 0 };
  }
  if (table === "canvas_spec_readiness") {
    const rows = specRowsFor(url);
    return { body: rows, count: rows.length };
  }
  return { body: [], count: 0 };
}

test("spec tables live on one surface each", async ({ page }) => {
  const seen: string[] = [];
  await page.route("**/*supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    seen.push(`${url.pathname}?${url.searchParams.toString()}`);
    if (!url.pathname.includes("/rest/v1/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }
    const { body, count } = bodyFor(url, request.headers().accept ?? "");
    const rows = Array.isArray(body) ? body : [body];
    const range = rows.length === 0 ? `*/${count}` : `0-${rows.length - 1}/${count}`;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "content-range": range,
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "content-range",
      },
      body: JSON.stringify(body),
    });
  });

  const canvas = new Canvas(page);
  await canvas.open();
  await canvas.openSpokeFromMap("AI Readiness");
  await canvas.openTab("Catalog Readiness");

  const catalog = page.locator("#spec-readiness-by-asin");
  await expect(catalog).toBeVisible();
  await expect(catalog).toContainText("B00MISSING");
  await expect(catalog).toContainText("B00FOUND01");
  await expect(catalog).toContainText("B00NULLFLG");
  await expect(page.getByText("Top missing schema fields")).toBeVisible();

  await page.locator("[data-spec-filter='missing-fender-page']").click();
  await expect(catalog).toContainText("B00MISSING");
  await expect(catalog).not.toContainText("B00FOUND01");
  await expect(catalog).not.toContainText("B00NULLFLG");
  await expect(catalog).toContainText("missing page");

  await page.locator("[data-spec-filter='clear']").click();
  await expect(catalog).toContainText("B00FOUND01");
  await expect(catalog).toContainText("B00NULLFLG");

  await canvas.openTab("Schema.org");
  const schema = page.locator("#schema-additional-property");
  await expect(schema).toBeVisible();
  await expect(schema).toContainText("B00FOUND01");
  await expect(schema).toContainText("additionalProperty");
  await expect(schema.locator("[data-schema-gap-count]")).toHaveAttribute("data-schema-gap-count", "1");
  await expect(schema).not.toContainText("B00CLEAR01");
  await expect(schema).not.toContainText("B00MISSING");
  await expect(page.locator("#spec-readiness-by-asin")).toHaveCount(0);
  await expect(page.getByText("Top missing schema fields")).toHaveCount(0);
  await expect(page.getByText("Spec readiness by ASIN")).toHaveCount(0);

  await canvas.openSpokeFromMap("Portfolio Retail");
  await canvas.openTab("Catalog Governance");
  await expect(page.getByText("Unnested bundles", { exact: true })).toBeVisible();
  await expect(page.getByText("Twin Amp Bundle")).toBeVisible();
  await expect(page.getByText("Missing Amazon spec fields")).toHaveCount(0);
  await expect(page.locator("#catalog-specs")).toHaveCount(0);

  const gapCount = page.locator("[data-spec-open='catalog-readiness']");
  await expect(gapCount.locator("[data-amazon-spec-gap-count]")).toHaveAttribute(
    "data-amazon-spec-gap-count",
    "1",
  );
  await gapCount.click();
  await expect(canvas.activeTab).toContainText("Catalog Readiness");
  await expect(page.locator("#spec-readiness-by-asin")).toBeVisible();
  await expect(page.locator("#spec-readiness-by-asin")).toContainText("B00MISSING");

  expect(seen.some((entry) => entry.includes("fender_missing_fields=like."))).toBe(true);
});
