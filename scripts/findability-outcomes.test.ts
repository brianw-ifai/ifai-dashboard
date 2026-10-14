// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/findability-outcomes.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  findabilityHeadline,
  findabilitySortValue,
  findabilitySpokeDescription,
  readinessFindabilityFace,
} from "../lib/findability/copy.ts";
import { orderFullResult } from "../lib/fender-canvas/full-result-sort.ts";
import {
  countFindability,
  findabilityOutcome,
  findabilityShape,
  isFinishedWithoutPage,
  outcomesSumToRows,
  presentOfficialAddress,
  rowsForOutcome,
  type FindabilityOutcome,
  type FindabilityRow,
} from "../lib/findability/outcomes.ts";
import { FINDABILITY_COLUMNS, loadFindabilityRead } from "../lib/findability/queries.ts";

function row(partial: Partial<FindabilityRow> & Pick<FindabilityRow, "asin" | "latest_state">): FindabilityRow {
  return {
    title: partial.title ?? "Listing",
    category: partial.category ?? "Solid Body",
    product_kind: partial.product_kind ?? "instrument",
    latest_canonical_url: partial.latest_canonical_url ?? null,
    latest_variant_sku: partial.latest_variant_sku ?? null,
    confidence: partial.confidence ?? null,
    explanation: partial.explanation ?? null,
    source_method: partial.source_method ?? null,
    http_status: partial.http_status ?? null,
    latest_attempt_at: partial.latest_attempt_at ?? null,
    jsonld_status: partial.jsonld_status ?? "not_checked",
    counts_as_confirmed: partial.counts_as_confirmed ?? false,
    counts_as_finished_search: partial.counts_as_finished_search ?? false,
    counts_as_ambiguous: partial.counts_as_ambiguous ?? false,
    counts_as_unchecked: partial.counts_as_unchecked ?? false,
    counts_as_completed_not_found: partial.counts_as_completed_not_found ?? false,
    counts_as_blocked: partial.counts_as_blocked ?? false,
    counts_as_timeout: partial.counts_as_timeout ?? false,
    counts_as_parse_failure: partial.counts_as_parse_failure ?? false,
    counts_as_unsupported: partial.counts_as_unsupported ?? false,
    ...partial,
  };
}

function flagged(state: FindabilityOutcome, index: number): FindabilityRow {
  const confirmed = state === "exact_official_product" || state === "official_family_page";
  return row({
    asin: `${state}-${index}`,
    latest_state: state,
    latest_canonical_url: confirmed ? `https://brand.example/products/${state}-${index}` : null,
    counts_as_confirmed: confirmed,
    counts_as_finished_search: state !== "not_checked",
    counts_as_ambiguous: state === "ambiguous_candidate",
    counts_as_unchecked: state === "not_checked",
    counts_as_completed_not_found: state === "completed_not_found",
    jsonld_status: state === "not_checked" ? null : "not_checked",
  });
}

function repeat(state: FindabilityOutcome, count: number): FindabilityRow[] {
  return Array.from({ length: count }, (_, index) => flagged(state, index));
}

test("the five outcomes stay distinct and sum to the stored row count", () => {
  const rows = [
    ...repeat("exact_official_product", 89),
    ...repeat("official_family_page", 548),
    ...repeat("completed_not_found", 342),
    ...repeat("ambiguous_candidate", 8),
    ...repeat("not_checked", 5),
  ];
  const counts = countFindability(rows);
  assert.equal(rows.length, 992);
  assert.equal(counts.total, 992);
  assert.equal(counts.exact_official_product, 89);
  assert.equal(counts.official_family_page, 548);
  assert.equal(counts.completed_not_found, 342);
  assert.equal(counts.ambiguous_candidate, 8);
  assert.equal(counts.not_checked, 5);
  assert.equal(counts.other, 0);
  assert.equal(outcomesSumToRows(counts), true);
  assert.equal(findabilityShape(counts), "complete");
  assert.equal(
    counts.exact_official_product +
      counts.official_family_page +
      counts.completed_not_found +
      counts.ambiguous_candidate +
      counts.not_checked,
    counts.total,
  );

  const headline = findabilityHeadline(counts);
  assert.match(headline, /89 exact official product pages/);
  assert.match(headline, /548 official family pages/);
  assert.match(headline, /342 finished searches with no defensible page/);
  assert.match(headline, /8 ambiguous matches/);
  assert.match(headline, /5 unchecked listings/);
  assert.doesNotMatch(headline, /%|one third|13\.3|about one third/i);

  for (const outcome of ["exact_official_product", "official_family_page", "completed_not_found", "ambiguous_candidate", "not_checked"] as const) {
    assert.equal(rowsForOutcome(rows, outcome).length, counts[outcome]);
    assert.equal(rowsForOutcome(rows, outcome).every((item) => findabilityOutcome(item) === outcome), true);
  }
});

test("a confirmed family page is not counted as an exact page", () => {
  const family = row({
    asin: "B00FAMILY",
    latest_state: "official_family_page",
    counts_as_confirmed: true,
    counts_as_finished_search: true,
    latest_canonical_url: "https://brand.example/products/family",
    confidence: "sku",
  });
  const exact = row({
    asin: "B00EXACT",
    latest_state: "exact_official_product",
    counts_as_confirmed: true,
    counts_as_finished_search: true,
    latest_canonical_url: "https://brand.example/products/exact",
  });
  const counts = countFindability([family, exact]);
  assert.equal(findabilityOutcome(family), "official_family_page");
  assert.equal(counts.official_family_page, 1);
  assert.equal(counts.exact_official_product, 1);
  assert.equal([family, exact].filter((item) => item.counts_as_confirmed).length, 2);
  assert.notEqual(counts.exact_official_product, 2);
  assert.equal(rowsForOutcome([family, exact], "exact_official_product").map((item) => item.asin).join(), "B00EXACT");
});

test("empty and partial reads keep every outcome, including the zeros", () => {
  const empty = countFindability([]);
  assert.equal(findabilityShape(empty), "empty");
  assert.equal(empty.total, 0);
  assert.equal(outcomesSumToRows(empty), true);
  assert.equal(empty.exact_official_product, 0);
  assert.equal(empty.official_family_page, 0);
  assert.equal(empty.completed_not_found, 0);
  assert.equal(empty.ambiguous_candidate, 0);
  assert.equal(empty.not_checked, 0);
  const emptyDesc = findabilitySpokeDescription({ phase: "ready", rows: [], dealerBundleLoaded: true });
  assert.match(emptyDesc, /no listings/);
  assert.doesNotMatch(emptyDesc, /%|13\.3|one third/i);

  const partialRows = [
    flagged("exact_official_product", 0),
    flagged("not_checked", 0),
  ];
  const partial = countFindability(partialRows);
  assert.equal(findabilityShape(partial), "partial");
  assert.equal(partial.total, 2);
  assert.equal(partial.exact_official_product, 1);
  assert.equal(partial.not_checked, 1);
  assert.equal(partial.official_family_page, 0);
  assert.equal(partial.completed_not_found, 0);
  assert.equal(partial.ambiguous_candidate, 0);
  assert.equal(outcomesSumToRows(partial), true);
  const partialHeadline = findabilityHeadline(partial);
  assert.match(partialHeadline, /0 official family pages/);
  assert.match(partialHeadline, /0 finished searches with no defensible page/);
  assert.match(partialHeadline, /1 unchecked listing/);
});

test("a null URL on an unchecked row is not a finished unsuccessful search", () => {
  const unchecked = row({
    asin: "B00UNCHECKED",
    latest_state: "not_checked",
    latest_canonical_url: null,
    counts_as_unchecked: true,
    counts_as_finished_search: false,
    counts_as_completed_not_found: false,
    explanation: null,
    http_status: null,
    latest_attempt_at: null,
    jsonld_status: null,
    product_kind: null,
    confidence: null,
  });
  const address = presentOfficialAddress(unchecked);
  assert.equal(address.kind, "unchecked");
  assert.equal(isFinishedWithoutPage(address), false);
  assert.match(address.kind === "unchecked" ? address.text : "", /Not checked yet/);
  assert.doesNotMatch(address.kind === "unchecked" ? address.text : "", /no defensible page|unsuccessful/i);

  const blankState = row({
    asin: "B00BLANK",
    latest_state: null,
    latest_canonical_url: null,
    counts_as_unchecked: true,
  });
  assert.equal(findabilityOutcome(blankState), "not_checked");
  assert.equal(isFinishedWithoutPage(presentOfficialAddress(blankState)), false);

  const finished = row({
    asin: "B00NONE",
    latest_state: "completed_not_found",
    latest_canonical_url: null,
    counts_as_completed_not_found: true,
    counts_as_finished_search: true,
    counts_as_unchecked: false,
    explanation: "Search finished without a defensible official page.",
  });
  const finishedAddress = presentOfficialAddress(finished);
  assert.equal(finishedAddress.kind, "finished-without-page");
  assert.equal(isFinishedWithoutPage(finishedAddress), true);
  assert.notEqual(findabilityOutcome(finished), findabilityOutcome(unchecked));
});

test("a blocked result stays outside the five outcomes", () => {
  const blocked = row({
    asin: "B00BLOCK",
    latest_state: "blocked",
    latest_canonical_url: null,
    counts_as_blocked: true,
    counts_as_unchecked: false,
    counts_as_completed_not_found: false,
    counts_as_finished_search: false,
  });
  assert.equal(findabilityOutcome(blocked), "other");
  assert.equal(isFinishedWithoutPage(presentOfficialAddress(blocked)), false);
  assert.notEqual(presentOfficialAddress(blocked).kind, "unchecked");
  const counts = countFindability([blocked, flagged("exact_official_product", 0)]);
  assert.equal(counts.other, 1);
  assert.equal(counts.exact_official_product, 1);
  assert.equal(outcomesSumToRows(counts), true);
  assert.equal(
    counts.exact_official_product +
      counts.official_family_page +
      counts.completed_not_found +
      counts.ambiguous_candidate +
      counts.not_checked,
    1,
  );
});

test("the readiness face uses outcome counts instead of the older found percentage", () => {
  const rows = [
    ...repeat("exact_official_product", 89),
    ...repeat("official_family_page", 548),
    ...repeat("completed_not_found", 342),
    ...repeat("ambiguous_candidate", 8),
    ...repeat("not_checked", 5),
  ];
  const face = readinessFindabilityFace(
    { phase: "ready", rows, dealerBundleLoaded: true },
    "91.8%",
  );
  const visible = [face.meta, face.tooltipDesc, ...face.stats].join(" ");
  assert.match(face.stats[0] ?? "", /89 exact/);
  assert.match(face.stats[1] ?? "", /548 family/);
  assert.match(face.meta, /342 no page/);
  assert.match(face.meta, /8 ambiguous/);
  assert.match(face.meta, /5 unchecked/);
  assert.match(visible, /not an exact product page/);
  assert.match(visible, /older spec read/);
  assert.doesNotMatch(visible, /13\.3|10\.8|one third|Found/);
  assert.doesNotMatch(face.stats.join(" "), /%/);

  const loading = readinessFindabilityFace({ phase: "loading" }, "91.8%");
  assert.doesNotMatch(loading.stats.join(" "), /13\.3|10\.8/);
  assert.match(loading.tooltipDesc, /counted separately/);

  const root = new URL("..", import.meta.url);
  const nodes = readFileSync(new URL("lib/fender-canvas/nodes-from-live.ts", root), "utf8");
  const tour = readFileSync(new URL("lib/fender-canvas/tour-from-live.ts", root), "utf8");
  assert.doesNotMatch(nodes, /spec_fender_found/);
  assert.doesNotMatch(tour, /spec_fender_found/);
});

test("filtered official-page rows sort across the whole outcome, not one page", () => {
  const rows = [
    row({ asin: "B00ZEBRA", latest_state: "exact_official_product", title: "Zebra", counts_as_confirmed: true, latest_canonical_url: "https://brand.example/z" }),
    row({ asin: "B00ALPHA", latest_state: "exact_official_product", title: "Alpha", counts_as_confirmed: true, latest_canonical_url: "https://brand.example/a" }),
    row({ asin: "B00FAMILY", latest_state: "official_family_page", title: "Alpha Family", counts_as_confirmed: true, latest_canonical_url: "https://brand.example/f" }),
  ];
  const exact = rowsForOutcome(rows, "exact_official_product");
  const ordered = orderFullResult(exact, "text", "asc", (item) => findabilitySortValue(item, "title"), (item) => item.asin);
  assert.deepEqual(ordered.map((item) => item.asin), ["B00ALPHA", "B00ZEBRA"]);
});

test("the findability query reads the stored view and keeps an unchecked blank address", async () => {
  const pages: Record<string, unknown[][]> = {
    canvas_spec_findability: [[
      row({
        asin: "B00UNCHECKED",
        latest_state: "not_checked",
        latest_canonical_url: null,
        counts_as_unchecked: true,
        jsonld_status: null,
      }),
      row({
        asin: "B00EXACT",
        latest_state: "exact_official_product",
        latest_canonical_url: "https://brand.example/products/exact",
        counts_as_confirmed: true,
        counts_as_finished_search: true,
      }),
    ]],
    canvas_retail_listings: [[{ asin: "B00EXACT", is_bundle: true }]],
  };
  const seen: string[] = [];
  const client = {
    from(view: string) {
      return {
        select(columns: string) {
          seen.push(`${view}:${columns}`);
          return {
            order() {
              let page = 0;
              const builder = {
                range() {
                  const batch = pages[view]?.[page] ?? [];
                  page += 1;
                  return Promise.resolve({ data: batch, error: null });
                },
              };
              return builder;
            },
          };
        },
      };
    },
  };

  const read = await loadFindabilityRead(client);
  assert.equal(read.phase, "ready");
  if (read.phase !== "ready") return;
  assert.equal(read.dealerBundleLoaded, true);
  assert.deepEqual(read.rows.map((item) => item.asin), ["B00UNCHECKED", "B00EXACT"]);
  assert.equal(read.rows[0]?.dealer_bundle, null);
  assert.equal(read.rows[1]?.dealer_bundle, true);
  assert.equal(isFinishedWithoutPage(presentOfficialAddress(read.rows[0]!)), false);
  assert.equal(findabilityOutcome(read.rows[0]!), "not_checked");
  assert.match(seen[0] ?? "", /canvas_spec_findability/);
  assert.match(FINDABILITY_COLUMNS, /latest_canonical_url/);
  assert.match(FINDABILITY_COLUMNS, /counts_as_confirmed/);
  assert.match(FINDABILITY_COLUMNS, /counts_as_unchecked/);
  assert.doesNotMatch(seen.join(" "), /canvas_spec_readiness/);
});
