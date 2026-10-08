// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/spec-missing-page-filter.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { specRowsFilter, specRowsQuery } from "../lib/canvasData.ts";

type SpecRow = {
  asin: string;
  fender_found: boolean | null;
  amazon_completeness_pct: number;
};

function memoryClient(rows: SpecRow[]) {
  const eqs: Array<[string, unknown]> = [];

  function ordered(eqFilters: Array<[string, false]>) {
    let from = 0;
    let to = Math.max(rows.length - 1, 0);
    const builder = {
      eq(column: "fender_found", value: false) {
        assert.equal(column, "fender_found");
        assert.equal(value, false);
        eqs.push([column, value]);
        return ordered([...eqFilters, [column, value]]);
      },
      range(nextFrom: number, nextTo: number) {
        from = nextFrom;
        to = nextTo;
        return builder;
      },
      then(
        onFulfilled: (value: { data: SpecRow[]; count: number; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        const matched = rows
          .filter((row) => eqFilters.every(([column, value]) => row[column] === value))
          .sort((a, b) => a.amazon_completeness_pct - b.amazon_completeness_pct);
        return Promise.resolve({
          data: matched.slice(from, to + 1),
          count: matched.length,
          error: null,
        }).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  return {
    eqs,
    client: {
      from(table: string) {
        assert.equal(table, "canvas_spec_readiness");
        return {
          select(_columns: string, options: { count: "exact" }) {
            assert.equal(options.count, "exact");
            return {
              order(column: string, options: { ascending: boolean }) {
                assert.equal(column, "amazon_completeness_pct");
                assert.equal(options.ascending, true);
                return ordered([]);
              },
            };
          },
        };
      },
    },
  };
}

test("the missing-page filter keeps the false row, and clearing brings both back", async () => {
  const rows: SpecRow[] = [
    { asin: "B00FOUND", fender_found: true, amazon_completeness_pct: 30 },
    { asin: "B00MISSING", fender_found: false, amazon_completeness_pct: 20 },
  ];
  const { client, eqs } = memoryClient(rows);

  const filtered = await specRowsQuery(0, 50, specRowsFilter(true, true), client);
  assert.deepEqual(eqs, [["fender_found", false]]);
  assert.equal(filtered.count, 1);
  assert.equal(filtered.data?.length, 1);
  assert.equal(filtered.data?.[0]?.asin, "B00MISSING");
  assert.equal(filtered.data?.[0]?.fender_found, false);

  eqs.length = 0;
  const cleared = await specRowsQuery(0, 50, specRowsFilter(true, false), client);
  assert.deepEqual(eqs, []);
  assert.deepEqual(
    cleared.data?.map((row) => (row as SpecRow).asin),
    ["B00MISSING", "B00FOUND"],
  );

  const schema = await specRowsQuery(0, 50, specRowsFilter(false, true), client);
  assert.equal(specRowsFilter(false, true), undefined);
  assert.deepEqual(eqs, []);
  assert.deepEqual(
    schema.data?.map((row) => (row as SpecRow).fender_found),
    [false, true],
  );
});

test("a null flag is not in the missing-page list", async () => {
  const { client } = memoryClient([
    { asin: "B00FOUND", fender_found: true, amazon_completeness_pct: 30 },
    { asin: "B00MISSING", fender_found: false, amazon_completeness_pct: 20 },
    { asin: "B00UNCHECKED", fender_found: null, amazon_completeness_pct: 10 },
  ]);
  const filtered = await specRowsQuery(0, 50, { missingFenderPage: true }, client);
  assert.deepEqual(
    filtered.data?.map((row) => (row as SpecRow).asin),
    ["B00MISSING"],
  );
});

test("the filter counts every missing page, not the current page of 50", async () => {
  const found: SpecRow = { asin: "B00FOUND", fender_found: true, amazon_completeness_pct: 1 };
  const missing = Array.from({ length: 51 }, (_, index): SpecRow => ({
    asin: `B00M${index}`,
    fender_found: false,
    amazon_completeness_pct: index + 2,
  }));
  const { client } = memoryClient([found, ...missing]);

  const firstPage = await specRowsQuery(0, 50, undefined, client);
  const firstPageRows = (firstPage.data ?? []) as SpecRow[];
  assert.equal(firstPageRows[0]?.asin, "B00FOUND");
  assert.equal(firstPageRows.filter((row) => row.fender_found === false).length, 49);

  const filtered = await specRowsQuery(0, 50, { missingFenderPage: true }, client);
  const filteredRows = (filtered.data ?? []) as SpecRow[];
  assert.equal(filtered.count, 51);
  assert.equal(filteredRows.length, 50);
  assert.equal(filteredRows.every((row) => row.fender_found === false), true);
  assert.equal(filteredRows.some((row) => row.asin === "B00FOUND"), false);
});

test("the catalog control copy stays on the live rollup and the custom tooltip", () => {
  const root = new URL("..", import.meta.url);
  const read = (path: string) => readFileSync(new URL(path, root), "utf8");
  const narrative = read("components/v3/live/FenderSpecNarratives.tsx");
  const panel = read("components/v3/live/FenderSpecPanel.tsx");
  const catalog = read("components/v3/live/CatalogReadinessSpec.tsx");
  const spokes = read("components/v3/build-live-spokes.tsx");
  const forbidden = /\b(123|802|925)\b/;

  assert.match(narrative, /spec_fender_found_pct/);
  assert.match(narrative, /data-spec-filter="missing-fender-page"/);
  assert.match(narrative, /data-spec-filter="clear"/);
  assert.doesNotMatch(narrative, /\stitle=/);
  assert.doesNotMatch(narrative, forbidden);

  assert.match(panel, /means this check did not resolve a fender.com address/);
  assert.match(panel, /It is not proof the product is\s+absent from fender.com/);
  assert.match(panel, />\s*missing page\s*</);
  assert.match(panel, /data-ifai-tooltip-title="missing page"/);
  assert.match(panel, /data-ifai-tooltip-desc=\{MISSING_PAGE_DESC\}/);
  assert.match(panel, /className="ifai-term"/);
  // The missing-field list opens on two rows and keeps the full list behind a control.
  assert.match(panel, /MISSING_FIELD_PREVIEW = 2/);
  assert.match(panel, /missing\.slice\(0, MISSING_FIELD_PREVIEW\)/);
  assert.match(panel, /Show all \$\{formatInt\(missing\.length\)\} fields/);
  assert.doesNotMatch(panel, /slice\(0, 8\)/);
  assert.doesNotMatch(panel, /\stitle=/);
  assert.doesNotMatch(panel, forbidden);

  assert.match(catalog, /catalogReadiness/);
  assert.match(catalog, /missingPagesOnly=\{missingPagesOnly\}/);
  assert.doesNotMatch(catalog, forbidden);

  assert.match(spokes, /<CatalogReadinessSpec bundle=\{bundle\} \/>/);
  assert.match(spokes, /<SchemaExplanation \/>/);
  assert.match(spokes, /<SchemaAdditionalPropertyList \/>/);
  assert.doesNotMatch(spokes, /<FenderSpecPanel/);
  assert.doesNotMatch(spokes, forbidden);

  const schemaList = read("components/v3/live/SchemaAdditionalPropertyList.tsx");
  const governance = read("components/v3/live/CatalogGovernancePanel.tsx");
  assert.doesNotMatch(schemaList, /Spec readiness by ASIN/);
  assert.doesNotMatch(schemaList, /Top missing schema fields/);
  assert.doesNotMatch(schemaList, /\stitle=/);
  assert.doesNotMatch(schemaList, forbidden);
  assert.match(schemaList, /data-schema-gap-count=\{total\}/);
  assert.match(governance, /data-ifai-open="specs"/);
  assert.match(governance, /data-ifai-tab="AI Readiness"/);
  assert.match(governance, /Unnested bundles/);
  assert.doesNotMatch(governance, /catalog-specs/);
  assert.doesNotMatch(governance, /Missing Amazon spec fields/);
  assert.doesNotMatch(governance, /\b435\b/);
  assert.doesNotMatch(governance, /\stitle=/);
});
