// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/consensus-scores.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUTHORIZED_BUY_BOX_PARTNERS,
  controlledBuyBoxFinding,
  consensusScore,
  hasKnownBuyBoxSeller,
  isAmazonRetailSeller,
  isAuthorizedBuyBoxPartner,
  isControlledBuyBoxSeller,
  REQUIRED_MARKETPLACE_SPEC_FIELDS,
  REQUIRED_MARKETPLACE_SPEC_LABELS,
  requiredMarketplaceSpecShare,
  rescaleComponents,
  shareScore,
  type ScoreComponentInput,
} from "../lib/fender-canvas/consensus-scores.ts";

test("rescale: a dropped component does not become zero, and remaining weights sum to 100", () => {
  const components: ScoreComponentInput[] = [
    {
      id: "controlled_buy_box",
      name: "Controlled Buy Box",
      weight: 35,
      score: 80,
      coverage: { numerator: 8, denominator: 10 },
    },
    {
      id: "not_suppressed",
      name: "Not suppressed",
      weight: 25,
      score: 90,
      coverage: { numerator: 9, denominator: 10 },
    },
    {
      id: "active_products_available",
      name: "Active products available",
      weight: 15,
      score: null,
      coverage: null,
    },
    {
      id: "not_splintered",
      name: "Not splintered",
      weight: 15,
      score: 70,
      coverage: { numerator: 7, denominator: 10 },
    },
    {
      id: "no_map_violation",
      name: "No current MAP violation",
      weight: 10,
      score: 100,
      coverage: { numerator: 5, denominator: 5 },
    },
  ];

  const result = rescaleComponents(components);
  assert.equal(result.dropped.length, 1);
  assert.equal(result.dropped[0]!.id, "active_products_available");
  assert.equal(result.included.length, 4);

  const weightSum = result.included.reduce((sum, row) => sum + row.weight, 0);
  assert.ok(Math.abs(weightSum - 100) < 1e-9);

  // Nominal remaining: 35+25+15+10 = 85. Controlled should be 35/85 * 100.
  assert.ok(Math.abs(result.included.find((r) => r.id === "controlled_buy_box")!.weight - (3500 / 85)) < 1e-9);

  // Score is weighted average of included shares only. Missing never scored as 0.
  const expected =
    (80 * 35) / 85 + (90 * 25) / 85 + (70 * 15) / 85 + (100 * 10) / 85;
  assert.ok(Math.abs((result.score as number) - expected) < 1e-9);
  assert.ok((result.score as number) > 0);
});

test("partner matching: Amazon 1P, Austin Bazaar, and GearTree count; unknown drops out; other 3P is not controlled", () => {
  assert.equal(isAmazonRetailSeller({ buybox_status: "Amazon 1P", buybox_seller_name: null }), true);
  assert.equal(isControlledBuyBoxSeller({ buybox_status: "Amazon 1P", buybox_seller_name: null }), true);
  assert.equal(hasKnownBuyBoxSeller({ buybox_status: "Amazon 1P", buybox_seller_name: null }), true);

  assert.equal(isAmazonRetailSeller({ buybox_status: "3P Confirmed", buybox_seller_name: "Amazon" }), true);
  assert.equal(isAmazonRetailSeller({ buybox_status: "3P Confirmed", buybox_seller_name: "Amazon.com" }), true);

  assert.equal(isAuthorizedBuyBoxPartner({ buybox_seller_name: "Austin Bazaar" }), true);
  assert.equal(isAuthorizedBuyBoxPartner({ buybox_seller_name: "austin bazaar" }), true);
  assert.equal(isControlledBuyBoxSeller({ buybox_status: "3P Confirmed", buybox_seller_name: "Austin Bazaar" }), true);

  assert.equal(isAuthorizedBuyBoxPartner({ buybox_seller_name: "GearTree" }), true);
  assert.equal(isAuthorizedBuyBoxPartner({ buybox_seller_name: "geartree" }), true);
  assert.equal(isControlledBuyBoxSeller({ buybox_status: "3P Confirmed", buybox_seller_name: "GearTree" }), true);

  assert.equal(hasKnownBuyBoxSeller({ buybox_status: "Unknown/Not Harvested", buybox_seller_name: null }), false);
  assert.equal(hasKnownBuyBoxSeller({ buybox_status: "3P Confirmed", buybox_seller_name: null }), false);
  assert.equal(isControlledBuyBoxSeller({ buybox_status: "Unknown/Not Harvested", buybox_seller_name: null }), false);

  assert.equal(isAuthorizedBuyBoxPartner({ buybox_seller_name: "Crazy Dave's Music" }), false);
  assert.equal(
    isControlledBuyBoxSeller({ buybox_status: "3P Confirmed", buybox_seller_name: "Crazy Dave's Music" }),
    false,
  );
  assert.equal(hasKnownBuyBoxSeller({ buybox_status: "3P Confirmed", buybox_seller_name: "Crazy Dave's Music" }), true);

  const detail = controlledBuyBoxFinding([
    { buybox_status: "Amazon 1P", buybox_seller_name: null },
    { buybox_status: "3P Confirmed", buybox_seller_name: "Austin Bazaar" },
    { buybox_status: "3P Confirmed", buybox_seller_name: "GearTree" },
    { buybox_status: "3P Confirmed", buybox_seller_name: "Crazy Dave's Music" },
    { buybox_status: "Unknown/Not Harvested", buybox_seller_name: null },
  ]);
  assert.deepEqual(detail, { controlled: 3, known: 4, population: 5 });
  assert.equal(shareScore({ numerator: detail!.controlled, denominator: detail!.known }), 75);
  assert.deepEqual([...AUTHORIZED_BUY_BOX_PARTNERS], ["Austin Bazaar", "GearTree"]);
});

test("required-spec placeholder list is the guitar and instrument fields", () => {
  assert.deepEqual([...REQUIRED_MARKETPLACE_SPEC_FIELDS], [
    "scale_length",
    "hand_orientation",
    "item_weight",
    "item_dimensions",
    "number_of_strings",
    "fretboard_material_type",
    "guitar_bridge_system",
    "guitar_pickup_configuration",
    "neck_material_type",
    "manufacturer_part_number",
    "body_material_type",
    "color",
    "upc",
  ]);
  assert.deepEqual([...REQUIRED_MARKETPLACE_SPEC_LABELS], [
    "scale length",
    "handedness",
    "weight",
    "dimensions",
    "strings",
    "fretboard",
    "bridge",
    "pickups",
    "neck",
    "part number",
    "body",
    "color",
    "UPC",
  ]);

  const share = requiredMarketplaceSpecShare(
    [
      { asin: "B1", modelOrTitle: null, missingFields: ["scale_length", "color"] },
      { asin: "B2", modelOrTitle: null, missingFields: ["some_other_field"] },
    ],
    4,
  );
  // B1 missing required → not filled. B2 only other field → filled. Two checked with no gaps → filled.
  assert.deepEqual(share, { numerator: 3, denominator: 4 });
  assert.equal(shareScore(share), 75);
});

test("consensus drops Actuation and splits Foundation and Commerce in half", () => {
  const result = consensusScore(
    {
      exactOfficialPages: { numerator: 50, denominator: 100 },
      machineReadableSpecs: { numerator: 50, denominator: 100 },
      requiredMarketplaceSpecs: { numerator: 50, denominator: 100 },
      unbrandedNamedMost: { numerator: 50, denominator: 100 },
      factCheckMatch: { numerator: 50, denominator: 100 },
    },
    {
      controlledBuyBox: { numerator: 100, denominator: 100 },
      notSuppressed: { numerator: 100, denominator: 100 },
      activeProductsAvailable: null,
      notSplintered: { numerator: 100, denominator: 100 },
      noMapViolation: { numerator: 100, denominator: 100 },
    },
  );

  assert.equal(result.actuation.included, false);
  assert.equal(result.actuation.omittedLabel, "Not included");
  assert.equal(result.foundation.weight, 50);
  assert.equal(result.commerce.weight, 50);
  assert.deepEqual(result.coverage, { numerator: 2, denominator: 3 });
  assert.ok(result.score != null);
  // Foundation all 50, Commerce all 100 (active omitted and rescaled) → 75.
  assert.ok(Math.abs((result.score as number) - 75) < 1e-9);

  const active = result.commerce.components.find((c) => c.id === "active_products_available");
  assert.equal(active?.included, false);
});
