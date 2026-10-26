// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/review-table-presentation.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { coverageExceptionLabel, coverageExceptionsHealthy } from "../lib/fender-canvas/coverage-exceptions.ts";
import { filledColumnWidths } from "../lib/fender-canvas/retail-column-layout.ts";
import {
  MISSING_AMAZON_FIELDS_DETAIL_UNAVAILABLE,
  NO_MISSING_AMAZON_FIELDS,
  presentMissingAmazonFields,
} from "../lib/fender-canvas/spec-missing-fields.ts";
import { pendingLabel } from "../lib/fender-canvas/format.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), "utf8");

const SPEC_COLUMNS = [
  { id: "asin", width: 130, minWidth: 108 },
  { id: "model", width: 220, minWidth: 140 },
  { id: "amazon", width: 170, minWidth: 130 },
  { id: "found", width: 150, minWidth: 120 },
  { id: "missing", width: 280, minWidth: 180 },
];

const SCHEMA_COLUMNS = [
  { id: "asin", width: 120, minWidth: 108 },
  { id: "model", width: 420, minWidth: 220 },
  { id: "page", width: 150, minWidth: 128 },
  { id: "fields", width: 180, minWidth: 150 },
];

const REPRESENTATIVE_MODEL = "Fender American Professional Classic Telecaster Electric Guitar - 3-color Sunburst";

test("empty missing fields at 100% completeness mean no missing fields", () => {
  for (const missing of ["", "   ", null, undefined, " ; ; "]) {
    const presentation = presentMissingAmazonFields(missing, 100);
    assert.equal(presentation.kind, "none");
    assert.equal(presentation.kind === "none" ? presentation.label : "", NO_MISSING_AMAZON_FIELDS);
  }
  const listed = presentMissingAmazonFields("color; neck_material_type", 100);
  assert.equal(listed.kind, "fields");
  assert.deepEqual(listed.kind === "fields" ? listed.fields : [], ["color", "neck_material_type"]);
});

test("pending data stays only when completeness or the field list is unavailable", () => {
  for (const completeness of [null, undefined, Number.NaN]) {
    const presentation = presentMissingAmazonFields("", completeness);
    assert.equal(presentation.kind, "pending");
    assert.equal(presentation.kind === "pending" ? presentation.label : "", pendingLabel());
    assert.notEqual(presentation.kind === "pending" ? presentation.label : "", NO_MISSING_AMAZON_FIELDS);
  }
  const named = presentMissingAmazonFields("color", null);
  assert.equal(named.kind, "fields");
  assert.deepEqual(named.kind === "fields" ? named.fields : [], ["color"]);
});

test("completeness below 100 without field names says the detail is unavailable", () => {
  for (const completeness of [0, 53.8, 99.9]) {
    for (const missing of ["", null, "  ; "]) {
      const presentation = presentMissingAmazonFields(missing, completeness);
      assert.equal(presentation.kind, "detail-unavailable");
      assert.equal(
        presentation.kind === "detail-unavailable" ? presentation.label : "",
        MISSING_AMAZON_FIELDS_DETAIL_UNAVAILABLE,
      );
      assert.notEqual(presentation.kind === "detail-unavailable" ? presentation.label : "", NO_MISSING_AMAZON_FIELDS);
      assert.notEqual(presentation.kind === "detail-unavailable" ? presentation.label : "", pendingLabel());
    }
  }
});

test("coverage exceptions keep unchecked and failed as separate counts", () => {
  assert.equal(coverageExceptionLabel(0, 0), "0 unchecked · 0 failed");
  assert.equal(coverageExceptionLabel(2, 3), "2 unchecked · 3 failed");
  assert.equal(coverageExceptionLabel(2, 3).includes("5"), false);
  assert.equal(coverageExceptionsHealthy(0, 0), true);
  assert.equal(coverageExceptionsHealthy(1, 0), false);
  assert.equal(coverageExceptionsHealthy(0, 4), false);

  const readings = read("components/v3/live/FeaturedOfferReadings.tsx");
  assert.match(readings, /Coverage exceptions/);
  assert.match(readings, /data-coverage-unchecked=\{counts\.notChecked\}/);
  assert.match(readings, /data-coverage-failed=\{counts\.checkFailed\}/);
  assert.match(readings, /healthy \? " ok"/);
  assert.match(readings, /fo-coverage-value/);
  assert.match(read("lib/canvas-sdk/canvas-sdk.css"), /\.fo-reading \.fo-coverage-value \{[^}]*white-space:\s*nowrap/s);
  assert.doesNotMatch(readings, /notChecked \+ counts\.checkFailed|checkFailed \+ counts\.notChecked/);
  const counter = read("lib/fender-canvas/featured-offer.ts");
  assert.match(counter, /counts\.checkFailed \+= 1/);
  assert.match(counter, /counts\.notChecked \+= 1/);
  assert.match(read("lib/fender-canvas/featured-offer-copy.ts"), /26 hours/);
  assert.match(read("lib/fender-canvas/map-reading-status.ts"), /26 hours/);
});

test("the explore disclosure chevron stays on the keyboard control", () => {
  const explore = read("components/v3/live/ExploreListings.tsx");
  assert.match(explore, /aria-expanded=\{open\}/);
  assert.match(explore, /retail-explore-chevron/);
  assert.match(explore, /aria-hidden="true"/);
  assert.doesNotMatch(explore, /\btitle=/);
  const css = read("lib/canvas-sdk/canvas-sdk.css");
  assert.match(css, /\.retail-explore\[aria-expanded="true"\] \.retail-explore-chevron \{[^}]*rotate\(180deg\)/s);
});

test("AI Readiness gives leftover width to Missing Amazon fields", () => {
  const widths = filledColumnWidths(SPEC_COLUMNS, "missing", 1112);
  assert.equal(widths.asin, 130);
  assert.equal(widths.model, 220);
  assert.equal(widths.amazon, 170);
  assert.equal(widths.found, 150);
  assert.ok(widths.missing > widths.model);
  assert.ok(widths.missing > widths.amazon);
  assert.equal(Object.values(widths).reduce((sum, width) => sum + width, 0), 1112);
  const stored = filledColumnWidths(SPEC_COLUMNS, "missing", 1112, { missing: 200, asin: 160 });
  assert.equal(stored.missing, 200);
  assert.equal(stored.asin, 160);
  assert.equal(stored.model, 220);

  const panel = read("components/v3/live/FenderSpecPanel.tsx");
  assert.match(panel, /fillColumnId="missing"/);
  assert.match(panel, /spec-field-pill/);
  assert.match(panel, /presentMissingAmazonFields/);
  const css = read("lib/canvas-sdk/canvas-sdk.css");
  assert.match(css, /\.table-sm \{[^}]*font-size:\s*12px/s);
  assert.match(css, /\.resizable-table \.spec-field-pill \{[^}]*font-size:\s*12px/s);
});

const FACT_CHECK_COLUMNS = [
  { id: "question", width: 390, minWidth: 240 },
  { id: "engine", width: 130, minWidth: 100 },
  { id: "result", width: 340, minWidth: 240 },
  { id: "fact", width: 700, minWidth: 280 },
  { id: "checked", width: 200, minWidth: 160 },
];

const FACT_QUESTION = "Fender Player II Stratocaster neck radius and fret size";
const FACT_BADGE = "NO CONTRADICTION FOUND FOR THIS FACT";
const FACT_CLAIM =
  "Player II Stratocaster fingerboard radius is 9.5 inches (241 mm) with 22 medium jumbo frets.";
const FACT_CHECKED = "Oct 11, 2026, 6:11 AM UTC";

test("Product Fact Checks defaults fill the panel and leave room for one-line cells", () => {
  const widths = filledColumnWidths(FACT_CHECK_COLUMNS, "fact", 1112);
  assert.equal(widths.question, 390);
  assert.equal(widths.engine, 130);
  assert.equal(widths.result, 340);
  assert.equal(widths.checked, 200);
  assert.ok(widths.fact >= 700, `fact width ${widths.fact} should keep its one-line default`);
  assert.ok(widths.question >= FACT_QUESTION.length * 6);
  assert.ok(widths.result >= FACT_BADGE.length * 7);
  assert.ok(widths.checked >= FACT_CHECKED.length * 6);
  assert.ok(widths.fact >= FACT_CLAIM.length * 6.5);
  // On a wider panel the fact column grows so the table fills the width.
  const wide = filledColumnWidths(FACT_CHECK_COLUMNS, "fact", 2000);
  assert.equal(Object.values(wide).reduce((sum, width) => sum + width, 0), 2000);
  assert.ok(wide.fact > 700);

  const stored = filledColumnWidths(FACT_CHECK_COLUMNS, "fact", 1112, { fact: 200, question: 240 });
  assert.equal(stored.fact, 280); // minWidth floor
  assert.equal(stored.question, 240);

  const table = read("components/v3/live/ai-search/FactCheckTable.tsx");
  assert.match(table, /fillColumnId="fact"/);
  assert.match(table, /tableId="product-fact-checks"/);
  assert.doesNotMatch(table, /wordBreak:\s*"break-word"/);
  assert.match(table, /whiteSpace:\s*"nowrap"/);
});

test("Machine Readability gives leftover width to Model without shrinking the others", () => {
  const widths = filledColumnWidths(SCHEMA_COLUMNS, "model", 1112);
  assert.equal(widths.asin, 120);
  assert.equal(widths.page, 150);
  assert.equal(widths.fields, 180);
  assert.ok(widths.model >= 560, `model width ${widths.model} is below a one-line title`);
  assert.ok(widths.model >= REPRESENTATIVE_MODEL.length * 6);
  assert.equal(Object.values(widths).reduce((sum, width) => sum + width, 0), 1112);
  const narrow = filledColumnWidths(SCHEMA_COLUMNS, "model", 700);
  assert.equal(narrow.asin, 120);
  assert.equal(narrow.page, 150);
  assert.equal(narrow.fields, 180);
  assert.ok(narrow.model >= 420);
  const panel = read("components/v3/live/SchemaAdditionalPropertyList.tsx");
  assert.match(panel, /fillColumnId="model"/);
  const table = read("components/v3/live/ResizableTable.tsx");
  assert.match(table, /ResizeObserver/);
  assert.match(table, /columnWidthStorageKey/);
  assert.match(table, /aria-sort=/);
});
