import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildSpecModel, surfaceStrings } from "@/lib/dashboard-v2/canvas/spec-model";
import { ENUM_LABELS, hasLabel, humanizeCode, labelFor, labelForAnyKind, SCHEMA_ENUM_KINDS, underscoredCodes, type LabelKind } from "@/lib/dashboard-v2/reading/labels";
import { selectAll } from "@/lib/dashboard-v2/selectors/index";
import { fixtureBundle, LISTINGS } from "./fixtures/bundle";

type SchemaColumn = { name: string; enum?: string[] };
type SchemaTable = { name: string; columns: SchemaColumn[] };

function schemaEnums(): Array<{ table: string; column: string; values: string[] }> {
  const schema = JSON.parse(readFileSync(new URL("../../docs/v2/schema/ifai-dashboard-v2.schema.json", import.meta.url), "utf8")) as { tables: SchemaTable[] };
  const out: Array<{ table: string; column: string; values: string[] }> = [];
  for (const table of schema.tables) {
    for (const column of table.columns ?? []) {
      if (Array.isArray(column.enum)) out.push({ table: table.name, column: column.name, values: column.enum });
    }
  }
  return out;
}

test("every enum value in the schema's CHECK lists has a label, and no label is the raw code with an underscore", () => {
  const enums = schemaEnums();
  assert.ok(enums.length >= 20, `expected the schema to list its enums, found ${enums.length}`);
  for (const e of enums) {
    const kind = SCHEMA_ENUM_KINDS[`${e.table}.${e.column}`];
    assert.ok(kind, `no label kind for ${e.table}.${e.column}`);
    for (const code of e.values) {
      assert.ok(hasLabel(kind, code), `no label for ${e.table}.${e.column} = ${code}`);
      const label = labelFor(kind, code);
      assert.ok(label.length > 0);
      assert.ok(!label.includes("_"), `label for ${code} still carries an underscore: ${label}`);
    }
  }
  // Every kind in the map is reachable from the schema or is the reading model's own status.
  const kinds = new Set<LabelKind>(Object.values(SCHEMA_ENUM_KINDS));
  kinds.add("reading_status");
  kinds.add("registry_owner");
  for (const kind of Object.keys(ENUM_LABELS) as LabelKind[]) assert.ok(kinds.has(kind), `label kind ${kind} is not tied to a schema column`);
});

test("the labels the brief names are exact, and unknown codes are humanized rather than shown raw", () => {
  assert.equal(labelFor("seller_class", "not_read"), "not read yet");
  assert.equal(labelFor("seller_class", "amazon_retail"), "Amazon Retail");
  assert.equal(labelFor("seller_class", "third_party"), "third-party seller");
  assert.equal(labelFor("seller_class", "no_offer"), "no offer");
  assert.equal(labelFor("action_status", "in_progress"), "in progress");
  assert.equal(labelFor("match_status", "no_match"), "no match");
  assert.equal(labelFor("run_status", "partial"), "not final");
  assert.equal(labelFor("seller_class", null), "not stored");
  assert.equal(labelFor("channel", "some_new_store"), "some new store");
  assert.equal(humanizeCode("a_b_c"), "a b c");
  assert.equal(labelForAnyKind("musiciansfriend"), "Musician's Friend");
  assert.equal(labelForAnyKind("chatgpt"), "ChatGPT");
});

test("no raw enum code reaches a surface string or a first view", () => {
  const all = selectAll(fixtureBundle(), LISTINGS);
  const model = buildSpecModel(all);
  const codes = underscoredCodes();
  assert.ok(codes.includes("amazon_retail") && codes.includes("not_read") && codes.includes("in_progress"));
  const leaks: string[] = [];
  for (const [surface, strings] of Object.entries(surfaceStrings(model))) {
    for (const s of strings) {
      for (const code of codes) {
        // A code is a leak when it appears as a standalone token (not inside a formula or an id).
        if (new RegExp(`(^|[^a-z0-9_])${code}(?![a-z0-9_])`).test(s) && !/[a-z]+_[a-z_]+ [/+=]/.test(s) && !s.includes(": ") === false) {
          if (surface === "cards" || surface === "firstViews" || surface === "nodes" || surface === "metrics" || surface === "tickers") leaks.push(`${surface}: "${code}" in "${s}"`);
        }
      }
    }
  }
  assert.deepEqual(leaks, []);
  // The seller mix labels and the stacked slices use the label map.
  for (const c of all.sellerMix.classes) assert.ok(!c.label.includes("_"), c.label);
  for (const s of model.firstViews.ecommerce.sellerMix.slices) assert.ok(!s.label.includes("_"), s.label);
  for (const b of [...model.firstViews.suggestions.byOwner.bars, ...model.firstViews.suggestions.bySeverity.bars]) assert.ok(!b.label.includes("_"), b.label);
});
