// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/estimate-lines.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { bindCopy } from "../lib/fender-canvas/template-vars.ts";

const root = new URL("..", import.meta.url);
const spec = JSON.parse(readFileSync(new URL("data/fender-v3-spec.json", root), "utf8"));

/** A live retail headline the old analyst lines used to wear. */
const LIVE_HEADLINE = "Suppressed Listings: 47 listings.";

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function listItems(html: string): string[] {
  return [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => plain(match[1] ?? ""));
}

function bound(template: string): string {
  return bindCopy(template, {
    retail_headline: LIVE_HEADLINE,
    phase_one_lift: "+$680K",
    catalog_skus: "3,598",
    map_violation_skus: "555",
  });
}

test("the Phase 1 and enterprise ROI lines do not wear the live retail headline", () => {
  const roi = bound(spec.spokes.suggestions.tabTemplates[1] as string);
  const pilot = roi.split('id="roi-content-pilot"')[1]?.split('id="roi-content-enterprise"')[0] ?? "";
  const enterprise = roi.split('id="roi-content-enterprise"')[1] ?? "";
  const pilotLines = listItems(pilot);
  const enterpriseLines = listItems(enterprise);

  assert.equal(
    pilotLines[0],
    "Earlier analyst estimate, not calculated from the current listing count: +$380,000 / yr",
  );
  assert.equal(
    enterpriseLines[0],
    "Earlier analyst estimate, not calculated from the current listing count: +$25,000,000 / yr",
  );
  for (const line of [pilotLines[0], enterpriseLines[0]]) {
    assert.equal(line?.startsWith("Suppressed Listings"), false);
    assert.equal(line?.includes(LIVE_HEADLINE), false);
    assert.equal(line?.includes("47 listings"), false);
  }
  assert.equal(enterpriseLines.some((line) => line.includes("Reverb")), false);
  assert.match(enterpriseLines.join(" "), /Amazon and Walmart/);
  assert.match(enterpriseLines.join(" "), /\+\$3,500,000 \/ yr/);
  assert.match(pilot, /\$680,000 estimate/);
  assert.match(enterprise, /\$50,000,000/);
  assert.match(enterprise, /\$38M to \$62M/);
});

test("Commercial Sizing does not paste the live headline into the $680,000 estimate", () => {
  const sizing = bound(spec.spokes.hub.tabTemplates[2] as string);
  assert.equal(sizing.includes("follows the live retail headline"), false);
  assert.equal(sizing.includes(LIVE_HEADLINE), false);
  assert.equal(sizing.includes("{retail_headline}"), false);
  assert.match(sizing, /\$680,000\/yr/);
  assert.match(sizing, /\$38M to \$62M/);
  assert.match(sizing, /\(\$50M midpoint\)/);
  assert.match(sizing, /\+\$50M/);
  const card = sizing.split("Phase 1 (estimate)")[1]?.split("Full Enterprise Scale")[0] ?? "";
  assert.match(card, /Analyst estimate\. Not calculated from the current listing count\./);
  assert.equal(card.includes("Suppressed Listings"), false);
  assert.match(
    sizing,
    /Phase 1 Quick-Win Lift \(\$680,000\/yr\):<\/strong> Analyst estimate\. Not calculated from the current listing count\./,
  );
});

test("client copy does not discuss IntoFocus fees or retainers", () => {
  const raw = readFileSync(new URL("data/fender-v3-spec.json", root), "utf8");
  assert.equal(/retainer/i.test(raw), false);
  assert.equal(raw.includes("$20,000/month"), false);
  assert.equal(raw.includes("$240,000"), false);
  assert.equal(raw.includes("20K/mo"), false);
  assert.equal(raw.includes("208x"), false);
  assert.equal(raw.includes("2.8x"), false);
  assert.equal(raw.includes("Service Fee"), false);
});

test("the first Action Item says Featured Offer", () => {
  const actions = bound(spec.spokes.suggestions.tabTemplates[0] as string);
  const first = actions.split("action-card")[1]?.split("action-card")[0] ?? "";
  assert.match(first, /Featured Offer/);
  assert.equal(/buy button/i.test(first), false);
});
