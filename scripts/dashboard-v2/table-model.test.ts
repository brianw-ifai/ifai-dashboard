import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCell } from "@/lib/dashboard-v2/table/format-cell";
import {
  applyFilters,
  buildView,
  compareValues,
  countActiveFilters,
  distinctValues,
  emptyFilterFor,
  filterKindFor,
  inferType,
  isFilterEmpty,
  isSortable,
  nextSortDirection,
  sortRows,
  type ColumnDef,
  type TableRow,
} from "@/lib/dashboard-v2/table/table-model";

type Listing = TableRow & {
  asin: string;
  title: string;
  channel: "amazon" | "walmart";
  price: number | null;
  gapPct: number | null;
  suppressed: boolean | null;
  readAt: string | null;
};

const columns: ColumnDef[] = [
  { key: "asin", label: "ASIN", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "channel", label: "Channel", type: "enum" },
  { key: "price", label: "Price", type: "usd" },
  { key: "gapPct", label: "Price gap", type: "percent" },
  { key: "suppressed", label: "Suppressed", type: "boolean" },
  { key: "readAt", label: "Read at", type: "date" },
  { key: "_status", label: "Reading", type: "status", sortable: false },
];

const rows: Listing[] = [
  { asin: "B001", title: "Player Stratocaster", channel: "amazon", price: 849.99, gapPct: 12.5, suppressed: true, readAt: "2026-10-01T10:00:00Z", _status: "complete" },
  { asin: "B002", title: "Squier Affinity Tele", channel: "walmart", price: 229, gapPct: null, suppressed: false, readAt: "2026-10-03T10:00:00Z", _status: "partial" },
  { asin: "B003", title: "American Pro II Jazzmaster", channel: "amazon", price: null, gapPct: null, suppressed: null, readAt: null, _status: "unavailable" },
  { asin: "B004", title: "Player Precision Bass", channel: "amazon", price: 849.99, gapPct: 4, suppressed: false, readAt: "2026-09-28T10:00:00Z", _status: "complete" },
  { asin: "B005", title: "Acoustasonic Player", channel: "walmart", price: 1199, gapPct: -2, suppressed: true, readAt: "2026-10-05T10:00:00Z", _status: "complete" },
];

const asins = (list: Listing[]) => list.map((r) => r.asin);

test("filter kinds follow column type and sortable defaults to true", () => {
  assert.equal(filterKindFor("text"), "text");
  assert.equal(filterKindFor("number"), "range");
  assert.equal(filterKindFor("usd"), "range");
  assert.equal(filterKindFor("percent"), "range");
  assert.equal(filterKindFor("date"), "dateRange");
  assert.equal(filterKindFor("enum"), "select");
  assert.equal(filterKindFor("boolean"), "boolean");
  assert.equal(filterKindFor("status"), "status");
  assert.equal(isSortable({ key: "a", label: "A", type: "text" }), true);
  assert.equal(isSortable({ key: "a", label: "A", type: "text", sortable: false }), false);
  for (const c of columns) assert.ok(isFilterEmpty(emptyFilterFor(c.type)), c.type);
  assert.equal(nextSortDirection(null), "asc");
  assert.equal(nextSortDirection("asc"), "desc");
  assert.equal(nextSortDirection("desc"), null);
});

test("sort by number puts nulls last in both directions and breaks ties on the row key", () => {
  const asc = sortRows(rows, "price", "asc", { type: "usd", rowKey: "asin" });
  assert.deepEqual(asins(asc), ["B002", "B001", "B004", "B005", "B003"]);
  const desc = sortRows(rows, "price", "desc", { type: "usd", rowKey: "asin" });
  assert.deepEqual(asins(desc), ["B005", "B001", "B004", "B002", "B003"]);
  const none = sortRows(rows, "price", null, { type: "usd", rowKey: "asin" });
  assert.deepEqual(asins(none), asins(rows));
  assert.notEqual(none, rows, "returns a copy");

  const gapAsc = sortRows(rows, "gapPct", "asc", { type: "percent", rowKey: "asin" });
  assert.deepEqual(asins(gapAsc), ["B005", "B004", "B001", "B002", "B003"]);
  const gapDesc = sortRows(rows, "gapPct", "desc", { type: "percent", rowKey: "asin" });
  assert.deepEqual(asins(gapDesc), ["B001", "B004", "B005", "B002", "B003"]);
});

test("sort by date orders by time, nulls last", () => {
  const asc = sortRows(rows, "readAt", "asc", { type: "date", rowKey: "asin" });
  assert.deepEqual(asins(asc), ["B004", "B001", "B002", "B005", "B003"]);
  const desc = sortRows(rows, "readAt", "desc", { type: "date", rowKey: "asin" });
  assert.deepEqual(asins(desc), ["B005", "B002", "B001", "B004", "B003"]);
});

test("sort by text, enum, boolean, and status is type aware", () => {
  const text = sortRows(rows, "title", "asc", { type: "text", rowKey: "asin" });
  assert.deepEqual(asins(text), ["B005", "B003", "B004", "B001", "B002"]);
  const bools = sortRows(rows, "suppressed", "asc", { type: "boolean", rowKey: "asin" });
  assert.deepEqual(asins(bools), ["B002", "B004", "B001", "B005", "B003"]);
  const status = sortRows(rows, "_status", "asc", { type: "status", rowKey: "asin" });
  assert.deepEqual(asins(status), ["B001", "B004", "B005", "B002", "B003"]);
  assert.ok(compareValues("a10", "a9", "text")! > 0, "numeric-aware text compare");
  assert.equal(compareValues(null, 1, "number"), null);
  assert.equal(inferType(rows, "price"), "number");
  assert.equal(inferType(rows, "_status"), "status");
});

test("text filter is case-insensitive contains; enum filter is multi-select", () => {
  const text = applyFilters(rows, { title: { kind: "text", text: "player" } });
  assert.deepEqual(asins(text), ["B001", "B004", "B005"]);
  const channel = applyFilters(rows, { channel: { kind: "select", values: ["walmart"] } });
  assert.deepEqual(asins(channel), ["B002", "B005"]);
  const both = applyFilters(rows, { channel: { kind: "select", values: ["walmart", "amazon"] } });
  assert.equal(both.length, 5);
  assert.deepEqual(distinctValues(rows, "channel"), ["amazon", "walmart"]);
});

test("range, date range, and boolean filters accept open ends", () => {
  assert.deepEqual(asins(applyFilters(rows, { price: { kind: "range", min: 500, max: null } })), ["B001", "B004", "B005"]);
  assert.deepEqual(asins(applyFilters(rows, { price: { kind: "range", min: null, max: 300 } })), ["B002"]);
  assert.deepEqual(asins(applyFilters(rows, { gapPct: { kind: "range", min: 0, max: 10 } })), ["B004"]);
  assert.deepEqual(
    asins(applyFilters(rows, { readAt: { kind: "dateRange", from: "2026-10-01", to: null } })),
    ["B001", "B002", "B005"],
  );
  assert.deepEqual(
    asins(applyFilters(rows, { readAt: { kind: "dateRange", from: null, to: "2026-10-01" } })),
    ["B001", "B004"],
    "a date-only upper bound includes that whole day",
  );
  assert.deepEqual(asins(applyFilters(rows, { suppressed: { kind: "boolean", value: true } })), ["B001", "B005"]);
  assert.deepEqual(asins(applyFilters(rows, { suppressed: { kind: "boolean", value: false } })), ["B002", "B004"]);
});

test("combined filters narrow with AND", () => {
  const one = applyFilters(rows, { title: { kind: "text", text: "player" } });
  assert.equal(one.length, 3);
  const two = applyFilters(rows, {
    title: { kind: "text", text: "player" },
    channel: { kind: "select", values: ["amazon"] },
  });
  assert.deepEqual(asins(two), ["B001", "B004"]);
  const three = applyFilters(rows, {
    title: { kind: "text", text: "player" },
    channel: { kind: "select", values: ["amazon"] },
    gapPct: { kind: "range", min: 10, max: null },
  });
  assert.deepEqual(asins(three), ["B001"]);
  assert.equal(countActiveFilters({ title: { kind: "text", text: "  " }, channel: { kind: "select", values: ["amazon"] } }), 1);
});

test("empty filters return every row; no match returns [] and never throws", () => {
  assert.equal(applyFilters(rows, {}).length, 5);
  assert.equal(applyFilters(rows, { title: { kind: "text", text: "" } }).length, 5);
  const none = applyFilters(rows, { title: { kind: "text", text: "banjo" } });
  assert.deepEqual(none, []);
  const impossible = applyFilters(rows, { price: { kind: "range", min: 5000, max: 1 } });
  assert.deepEqual(impossible, []);
  assert.deepEqual(applyFilters([], { title: { kind: "text", text: "x" } }), []);
  assert.doesNotThrow(() => applyFilters(rows, { missingKey: { kind: "range", min: 0, max: 1 } }));
  assert.deepEqual(applyFilters(rows, { missingKey: { kind: "range", min: 0, max: 1 } }), []);
});

test("incomplete rows stay in the set and can be filtered by status", () => {
  const all = applyFilters(rows, { title: { kind: "text", text: "a" } });
  assert.ok(asins(all).includes("B003"), "an unavailable row with a title still matches a title filter");
  const unavailableOnly = applyFilters(rows, { _status: { kind: "status", values: ["unavailable"] } });
  assert.deepEqual(asins(unavailableOnly), ["B003"]);
  const notFinal = applyFilters(rows, { _status: { kind: "status", values: ["partial", "unavailable"] } });
  assert.deepEqual(asins(notFinal), ["B002", "B003"]);
  const withPrice = applyFilters(rows, { price: { kind: "range", min: 0, max: null } });
  assert.ok(!asins(withPrice).includes("B003"), "a null in a filtered column drops the row");
});

test("buildView filters then sorts and reports matched of total", () => {
  const view = buildView(
    rows,
    columns,
    { channel: { kind: "select", values: ["amazon"] } },
    { key: "price", direction: "desc" },
    "asin",
  );
  assert.deepEqual(asins(view.rows as Listing[]), ["B001", "B004", "B003"]);
  assert.equal(view.matched, 3);
  assert.equal(view.total, 5);
  const empty = buildView(rows, columns, { title: { kind: "text", text: "zzz" } }, null, "asin");
  assert.deepEqual(empty.rows, []);
  assert.equal(empty.matched, 0);
});

test("formatCell renders by type and never shows a digit for a missing value", () => {
  assert.equal(formatCell(849.99, "usd"), "$849.99");
  assert.equal(formatCell(12.5, "percent"), "12.5%");
  assert.equal(formatCell(1200, "number"), "1,200");
  assert.equal(formatCell(true, "boolean"), "yes");
  assert.equal(formatCell("2026-10-01T10:00:00Z", "date"), "Oct 1, 2026, 10:00 UTC");
  assert.equal(formatCell("partial", "status"), "not final");
  assert.equal(formatCell({ numerator: 1, denominator: 4, pct: 25 }, "percent"), "25.0% (1 of 4)");
  for (const type of ["text", "number", "usd", "percent", "date", "enum", "boolean", "status"] as const) {
    const text = formatCell(null, type);
    assert.equal(text, "unavailable", type);
    assert.ok(!/\d/.test(text));
  }
});
