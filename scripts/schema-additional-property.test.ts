// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/schema-additional-property.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  FENDER_MISSING_FIELDS_COLUMN,
  isFoundAdditionalPropertyGap,
  schemaGapRowsQuery,
  type SchemaGapRow,
} from "../lib/canvasData.ts";

function memoryClient(rows: SchemaGapRow[]) {
  const calls: string[] = [];

  function ordered(filters: Array<(row: SchemaGapRow) => boolean>) {
    let from = 0;
    let to = Math.max(rows.length - 1, 0);
    const builder = {
      eq(column: "fender_found", value: true) {
        assert.equal(column, "fender_found");
        assert.equal(value, true);
        calls.push(`${column}=${String(value)}`);
        return ordered([...filters, (row) => row.fender_found === value]);
      },
      like(column: typeof FENDER_MISSING_FIELDS_COLUMN, pattern: string) {
        assert.equal(column, "fender_missing_fields");
        assert.equal(pattern, "%additionalProperty%");
        calls.push(`${column} like ${pattern}`);
        const token = pattern.replaceAll("%", "");
        return ordered([
          ...filters,
          (row) => (row.fender_missing_fields ?? "").includes(token),
        ]);
      },
      range(nextFrom: number, nextTo: number) {
        from = nextFrom;
        to = nextTo;
        return builder;
      },
      then(
        onFulfilled: (value: { data: SchemaGapRow[]; count: number; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        const matched = rows
          .filter((row) => filters.every((keep) => keep(row)))
          .sort((a, b) => a.asin.localeCompare(b.asin));
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
    calls,
    client: {
      from(table: string) {
        assert.equal(table, "canvas_spec_readiness");
        return {
          select(columns: string, options: { count: "exact" }) {
            assert.equal(columns, "asin,title,fender_url,fender_found,fender_missing_fields");
            assert.equal(options.count, "exact");
            return {
              order(column: string, options: { ascending: boolean }) {
                assert.equal(column, "asin");
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

const foundGap: SchemaGapRow = {
  asin: "B00GAP",
  title: "Player Stratocaster",
  fender_url: "https://www.fender.com/en-US/player",
  fender_found: true,
  fender_missing_fields: "neck; additionalProperty; pickup",
};

const foundClear: SchemaGapRow = {
  asin: "B00CLEAR",
  title: "Complete Page",
  fender_url: "https://www.fender.com/en-US/complete",
  fender_found: true,
  fender_missing_fields: "scale_length",
};

const missingPage: SchemaGapRow = {
  asin: "B00MISSING",
  title: "No Page",
  fender_url: null,
  fender_found: false,
  fender_missing_fields: "additionalProperty",
};

const unchecked: SchemaGapRow = {
  asin: "B00NULL",
  title: "Unchecked",
  fender_url: null,
  fender_found: null,
  fender_missing_fields: "additionalProperty",
};

test("a found page with additionalProperty stays, and a page without that gap stays out", async () => {
  const { client, calls } = memoryClient([foundClear, missingPage, unchecked, foundGap]);
  const result = await schemaGapRowsQuery(0, 50, client);
  assert.deepEqual(calls, ["fender_found=true", "fender_missing_fields like %additionalProperty%"]);
  assert.equal(result.count, 1);
  assert.equal(result.data?.length, 1);
  const row = result.data?.[0] as SchemaGapRow;
  assert.equal(row.asin, "B00GAP");
  assert.equal(row.fender_found, true);
  assert.equal(isFoundAdditionalPropertyGap(row), true);
  assert.equal(isFoundAdditionalPropertyGap(foundClear), false);
  assert.equal(isFoundAdditionalPropertyGap(missingPage), false);
  assert.equal(isFoundAdditionalPropertyGap(unchecked), false);
  assert.equal(isFoundAdditionalPropertyGap({ fender_found: true, fender_missing_fields: null }), false);
});

test("the schema count is every matching page, not the current page of 50", async () => {
  const rows = Array.from({ length: 51 }, (_, index): SchemaGapRow => ({
    asin: `B00G${String(index).padStart(3, "0")}`,
    title: "Gap",
    fender_url: "https://www.fender.com/en-US/gap",
    fender_found: true,
    fender_missing_fields: "additionalProperty",
  }));
  rows.push(foundClear);
  const { client } = memoryClient(rows);
  const page = await schemaGapRowsQuery(0, 50, client);
  assert.equal(page.count, 51);
  assert.equal(page.data?.length, 50);
  assert.equal(
    (page.data as SchemaGapRow[]).every((row) => isFoundAdditionalPropertyGap(row)),
    true,
  );
  assert.equal(
    (page.data as SchemaGapRow[]).some((row) => row.asin === "B00CLEAR"),
    false,
  );
});

test("the schema list does not hard-code a row count or the catalog table", () => {
  const root = new URL("..", import.meta.url);
  const read = (path: string) => readFileSync(new URL(path, root), "utf8");
  const query = read("lib/canvasData.ts");
  const list = read("components/v3/live/SchemaAdditionalPropertyList.tsx");
  assert.match(query, /fender_missing_fields/);
  assert.match(query, /\.like\(FENDER_MISSING_FIELDS_COLUMN, `%\$\{ADDITIONAL_PROPERTY_GAP\}%`\)/);
  assert.doesNotMatch(query, /fender_missing_field[^s]/);
  assert.doesNotMatch(list, /\b(123|925|435)\b/);
  assert.doesNotMatch(list, /Spec readiness by ASIN/);
  assert.doesNotMatch(list, /Top missing schema fields/);
  assert.match(list, /data-schema-gap-count=\{total\}/);
});
