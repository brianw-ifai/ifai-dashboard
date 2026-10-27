// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/findability-lead.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  EXACT_PAGE_SHARE_BANDS,
  exactPageFigure,
  exactPageLeadPie,
  exactPageLeadTip,
  exactPageShareColor,
} from "../lib/findability/lead.ts";
import { countFindability, type FindabilityRow } from "../lib/findability/outcomes.ts";

const root = new URL("..", import.meta.url).pathname;
const read = (path: string) => readFileSync(join(root, path), "utf8");

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

test("hero figure is exact official product pages out of this read", () => {
  const counts = countFindability([
    row({ asin: "E1", latest_state: "exact_official_product", counts_as_confirmed: true }),
    row({ asin: "E2", latest_state: "exact_official_product", counts_as_confirmed: true }),
    row({ asin: "F1", latest_state: "official_family_page", counts_as_confirmed: true }),
    row({ asin: "N1", latest_state: "completed_not_found", counts_as_completed_not_found: true }),
    row({ asin: "A1", latest_state: "ambiguous_candidate", counts_as_ambiguous: true }),
    row({ asin: "U1", latest_state: "not_checked", counts_as_unchecked: true }),
  ]);
  assert.equal(counts.exact_official_product, 2);
  assert.equal(counts.total, 6);
  assert.equal(exactPageFigure(counts), "2 of 6");
  assert.equal(exactPageLeadTip(counts), "2 of 6");
});

test("disc is exact pages versus the rest; family pages stay in the rest", () => {
  const counts = countFindability([
    row({ asin: "E1", latest_state: "exact_official_product", counts_as_confirmed: true }),
    row({ asin: "F1", latest_state: "official_family_page", counts_as_confirmed: true }),
    row({ asin: "F2", latest_state: "official_family_page", counts_as_confirmed: true }),
    row({ asin: "U1", latest_state: "not_checked", counts_as_unchecked: true }),
  ]);
  const pie = exactPageLeadPie(counts);
  assert.ok(pie);
  assert.equal(pie.total, 4);
  assert.equal(pie.title, "Exact official product page");
  assert.deepEqual(
    pie.slices.map((s) => [s.key, s.count, s.label]),
    [
      ["matched", 1, "Exact official product page"],
      ["none", 3, "Rest of this read"],
    ],
  );
  assert.equal(counts.official_family_page, 2);
  assert.notEqual(counts.exact_official_product, counts.official_family_page + counts.exact_official_product);
});

test("empty and zero-total reads invent no figure and no disc", () => {
  const empty = countFindability([]);
  assert.equal(exactPageFigure(empty), null);
  assert.equal(exactPageLeadPie(empty), null);
  assert.equal(exactPageShareColor(empty), null);
});

test("low exact-page share uses the gap color", () => {
  const low = countFindability([
    row({ asin: "E1", latest_state: "exact_official_product", counts_as_confirmed: true }),
    ...Array.from({ length: 9 }, (_, i) =>
      row({ asin: `U${i}`, latest_state: "not_checked", counts_as_unchecked: true }),
    ),
  ]);
  assert.ok((100 * low.exact_official_product) / low.total < EXACT_PAGE_SHARE_BANDS.redBelow);
  assert.equal(exactPageShareColor(low), "var(--danger-red)");

  const high = countFindability([
    ...Array.from({ length: 7 }, (_, i) =>
      row({ asin: `E${i}`, latest_state: "exact_official_product", counts_as_confirmed: true }),
    ),
    row({ asin: "U1", latest_state: "not_checked", counts_as_unchecked: true }),
  ]);
  assert.ok((100 * high.exact_official_product) / high.total > EXACT_PAGE_SHARE_BANDS.greenAbove);
  assert.equal(exactPageShareColor(high), "var(--success-green)");
});

test("Findability panel leads with the exact-page hero before the outcome sentence", () => {
  const panel = read("components/v3/live/findability/FindabilityPanel.tsx");
  const hero = read("components/v3/live/findability/FindabilityLead.tsx");
  const lead = read("lib/findability/lead.ts");
  assert.match(panel, /FindabilityLead/);
  assert.match(hero, /ai-lead-figure/);
  assert.match(hero, /CitationPieDisc/);
  assert.match(hero, /OUTCOME_LABEL\.exact_official_product/);
  assert.match(lead, /exactPageLeadPie/);
  assert.match(lead, /Exact official product page/);
  assert.match(lead, /exact_official_product/);
  const leadAt = panel.indexOf("<FindabilityLead");
  const headlineAt = panel.indexOf('data-findability-headline=""');
  assert.ok(leadAt >= 0 && headlineAt > leadAt, "outcome sentence stays under the hero");
  assert.doesNotMatch(panel, /FenderSpecSummary|spec_fender_found_pct/);
  assert.doesNotMatch(hero, /\u2014/);
  assert.doesNotMatch(hero, /\stitle=/);
  assert.doesNotMatch(lead, /\u2014/);
});
