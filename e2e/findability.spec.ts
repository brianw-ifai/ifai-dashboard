import { expect, test, type Page } from "@playwright/test";
import { Canvas } from "./fixtures";
import { mockCanvasRead, type Row } from "./spec-read-mock";

const EXACT = "https://brand.example/products/zebra";

const ROWS: Row[] = [
  {
    asin: "B00ZEBRA",
    title: "Zebra Exact",
    category: "Solid Body",
    product_kind: "instrument",
    latest_state: "exact_official_product",
    latest_canonical_url: EXACT,
    latest_variant_sku: "0140000001",
    confidence: "sku",
    explanation: "Official page has one variant.",
    source_method: "derived_handle",
    http_status: 200,
    latest_attempt_at: "2026-10-12T20:27:42.000Z",
    jsonld_status: "not_checked",
    counts_as_confirmed: true,
    counts_as_finished_search: true,
    counts_as_ambiguous: false,
    counts_as_unchecked: false,
    counts_as_completed_not_found: false,
  },
  {
    asin: "B00ALPHA",
    title: "Alpha Exact",
    category: "Solid Body",
    product_kind: "instrument",
    latest_state: "exact_official_product",
    latest_canonical_url: "https://brand.example/products/alpha",
    latest_variant_sku: "0140000002",
    confidence: "gtin",
    explanation: "Official page has one variant.",
    source_method: "model_number_search",
    http_status: 200,
    latest_attempt_at: "2026-10-12T20:27:43.000Z",
    jsonld_status: "not_checked",
    counts_as_confirmed: true,
    counts_as_finished_search: true,
    counts_as_ambiguous: false,
    counts_as_unchecked: false,
    counts_as_completed_not_found: false,
  },
  {
    asin: "B00FAMILY",
    title: "Family Page Guitar",
    category: "Solid Body",
    product_kind: "instrument",
    latest_state: "official_family_page",
    latest_canonical_url: "https://brand.example/products/family",
    latest_variant_sku: "0117602805",
    confidence: "sku",
    explanation: "Official family page with 4 variants.",
    source_method: "derived_handle",
    http_status: 200,
    latest_attempt_at: "2026-10-12T20:27:44.000Z",
    jsonld_status: "not_checked",
    counts_as_confirmed: true,
    counts_as_finished_search: true,
    counts_as_ambiguous: false,
    counts_as_unchecked: false,
    counts_as_completed_not_found: false,
  },
  {
    asin: "B00BUNDLE1",
    title: "Finished Without A Page",
    category: "Solid Body",
    product_kind: "instrument",
    latest_state: "completed_not_found",
    latest_canonical_url: null,
    latest_variant_sku: null,
    confidence: "none",
    explanation: "Search finished without a defensible official page.",
    source_method: null,
    http_status: 200,
    latest_attempt_at: "2026-10-12T20:27:45.000Z",
    jsonld_status: "not_checked",
    counts_as_confirmed: false,
    counts_as_finished_search: true,
    counts_as_ambiguous: false,
    counts_as_unchecked: false,
    counts_as_completed_not_found: true,
  },
  {
    asin: "B00AMBIG",
    title: "Ambiguous Finish",
    category: "Solid Body",
    product_kind: "instrument",
    latest_state: "ambiguous_candidate",
    latest_canonical_url: null,
    latest_variant_sku: null,
    confidence: "none",
    explanation: "More than one official page fits the listing.",
    source_method: null,
    http_status: 200,
    latest_attempt_at: "2026-10-12T20:27:46.000Z",
    jsonld_status: "not_checked",
    counts_as_confirmed: false,
    counts_as_finished_search: true,
    counts_as_ambiguous: true,
    counts_as_unchecked: false,
    counts_as_completed_not_found: false,
  },
  {
    asin: "B00UNCHECKED",
    title: "Unchecked Listing",
    category: "Solid Body",
    product_kind: null,
    latest_state: "not_checked",
    latest_canonical_url: null,
    latest_variant_sku: null,
    confidence: null,
    explanation: null,
    source_method: null,
    http_status: null,
    latest_attempt_at: null,
    jsonld_status: null,
    counts_as_confirmed: false,
    counts_as_finished_search: false,
    counts_as_ambiguous: false,
    counts_as_unchecked: true,
    counts_as_completed_not_found: false,
  },
];

async function openFindability(page: Page) {
  const canvas = new Canvas(page);
  await canvas.open();
  await canvas.openSpokeFromMap("AI Readiness");
  await canvas.openTab("Findability");
  await expect(page.locator("[data-findability-headline]")).toBeVisible();
  return canvas;
}

test("the five outcome counts stay distinct and open the listings behind them", async ({ page }) => {
  await mockCanvasRead(page, { findability: ROWS });
  await openFindability(page);

  const headline = page.locator("[data-findability-headline]");
  await expect(headline).toContainText("2 exact official product pages");
  await expect(headline).toContainText("1 official family page");
  await expect(headline).toContainText("1 finished search with no defensible page");
  await expect(headline).toContainText("1 ambiguous match");
  await expect(headline).toContainText("1 unchecked listing");
  await expect(headline).not.toContainText("13.3%");
  await expect(headline).not.toContainText("one third");
  await expect(page.locator(".drilldown-desc")).not.toContainText("13.3%");
  await expect(page.locator("[data-findability-total]")).toHaveAttribute("data-findability-total", "6");
  await expect(page.locator(".findability-note").filter({ hasText: "JSON-LD was not audited" })).toBeVisible();
  await expect(page.locator(".findability-note").filter({ hasText: "older spec read" })).toBeVisible();

  const exact = page.locator("[data-findability-outcome='exact_official_product']");
  await expect(exact.locator("[data-findability-count]")).toHaveAttribute("data-findability-count", "2");
  await exact.locator("[data-findability-count]").click();
  const table = page.locator("#findability-listings");
  await expect(table).toContainText("B00ZEBRA");
  await expect(table).toContainText("B00ALPHA");
  await expect(table).not.toContainText("B00FAMILY");
  await expect(table.locator("thead")).toContainText("Listing");
  await expect(table.locator("thead")).toContainText("Official page");

  const link = table.locator("[data-findability-official-url]").first();
  await expect(link).toHaveAttribute("href", /brand\.example/);
  await expect(link).toHaveAttribute("target", "_blank");

  await table.locator("thead").getByRole("button", { name: "Listing" }).click();
  await expect(table.locator("tbody tr").first()).toContainText("Alpha Exact");

  await page.locator("[data-findability-outcome='official_family_page'] [data-findability-count]").click();
  await expect(table).toContainText("B00FAMILY");
  await expect(table).toContainText("Not an exact product page");
  await expect(table).not.toContainText("B00ZEBRA");
  await expect(table.locator("[data-findability-official-url]")).toHaveAttribute(
    "href",
    "https://brand.example/products/family",
  );

  await page.locator("[data-findability-outcome='completed_not_found'] [data-findability-count]").click();
  await expect(table).toContainText("B00BUNDLE1");
  await expect(table).toContainText("no defensible page");
  await expect(table).toContainText("Yes");

  await page.locator("[data-findability-outcome='ambiguous_candidate'] [data-findability-count]").click();
  await expect(table).toContainText("B00AMBIG");
  await expect(table).toContainText("No official page was accepted");

  await page.locator("[data-findability-outcome='not_checked'] [data-findability-count]").click();
  await expect(table).toContainText("B00UNCHECKED");
  await expect(table.locator("[data-findability-address='unchecked']")).toContainText("Not checked yet");
  await expect(table.locator("[data-findability-address='unchecked']")).not.toContainText("no defensible page");
  await expect(table.locator("[data-findability-row='not_checked']")).not.toContainText("unsuccessful");
});

test("an empty official-page read does not describe unchecked as a finished search", async ({ page }) => {
  await mockCanvasRead(page, { findability: [] });
  await openFindability(page);

  await expect(page.locator("[data-findability-shape]")).toHaveAttribute("data-findability-shape", "empty");
  await expect(page.locator("[data-findability-headline]")).toContainText("no listings");
  await expect(page.locator("[data-findability-headline]")).not.toContainText("%");
  for (const outcome of [
    "exact_official_product",
    "official_family_page",
    "completed_not_found",
    "ambiguous_candidate",
    "not_checked",
  ]) {
    await expect(page.locator(`[data-findability-outcome='${outcome}'] [data-findability-count]`)).toHaveAttribute(
      "data-findability-count",
      "0",
    );
  }

  await page.locator("[data-findability-outcome='not_checked'] [data-findability-count]").click();
  const table = page.locator("#findability-listings");
  await expect(table).toContainText("No listings in this outcome.");
  await expect(table).not.toContainText("no defensible page");
  await expect(table).not.toContainText("unsuccessful");
});

test("a partial read keeps zero outcomes separate from the rows that were checked", async ({ page }) => {
  await mockCanvasRead(page, {
    findability: ROWS.filter((row) => row.latest_state === "exact_official_product" || row.latest_state === "not_checked"),
  });
  await openFindability(page);

  await expect(page.locator("[data-findability-shape]")).toHaveAttribute("data-findability-shape", "partial");
  await expect(page.locator("[data-findability-total]")).toHaveAttribute("data-findability-total", "3");
  await expect(page.locator("[data-findability-headline]")).toContainText("0 official family pages");
  await expect(page.locator("[data-findability-headline]")).toContainText("0 finished searches with no defensible page");
  await expect(page.getByText("A zero is a real count.")).toBeVisible();

  await page.locator("[data-findability-outcome='official_family_page'] [data-findability-count]").click();
  await expect(page.locator("#findability-listings")).toContainText("No listings in this outcome.");
  await expect(page.locator("#findability-listings")).not.toContainText("B00ZEBRA");
});
