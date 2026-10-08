// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/measured-retail-channels.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { tabIndexFromSlug, tabSlug } from "../lib/canvas-sdk/canvas-url-state.ts";
import { bindCopy } from "../lib/fender-canvas/template-vars.ts";
import { MAP_PRICES_NOT_STORED } from "../lib/fender-canvas/portfolio-retail.ts";

const root = new URL("..", import.meta.url);
const spec = JSON.parse(readFileSync(new URL("data/fender-v3-spec.json", root), "utf8"));

const LIVE_HEADLINE = "Suppressed Listings: 47 listings.";
const OLD_SLUG = "multi-marketplace-channel-scope-sweetwater-reverb-walmart";
const NOT_MEASURED =
  "Sweetwater and Reverb are not measured because listing_channel_price has no writer.";

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function actionCard(html: string, index: number): string {
  const cards = html.split(/<div class="action-card/).slice(1);
  const card = cards[index] ?? "";
  const head = card.match(/action-head">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const details = card.match(/action-details">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const impact = card.match(/action-impact">([\s\S]*?)<\/div>/)?.[1] ?? "";
  return `${head}\n${details}\n${impact}`;
}

test("the second Action Item connects an official MAP source", () => {
  const actions = bindCopy(spec.spokes.suggestions.tabTemplates[0] as string, {
    retail_headline: LIVE_HEADLINE,
    phase_one_lift: "+$680K",
    enterprise_potential: "+$38M to $62M",
    catalog_skus: "3,598",
    map_read_line: "MAP prices are unread.",
  });
  const second = actionCard(actions, 1);
  const text = plain(second);
  const rawCard = (spec.spokes.suggestions.tabTemplates[0] as string).split(/<div class="action-card/)[2] ?? "";

  assert.match(text, /2\. Connect Fender's official MAP source/);
  assert.match(
    text,
    /Load Fender's official MAP file or price list before measuring retailer compliance\. Amazon, Walmart, and Musician's Friend shelf prices can stay visible, but they cannot be called MAP gaps\./,
  );
  assert.match(text, /Fender MAP prices have not been stored\./);
  assert.equal(text.includes(LIVE_HEADLINE), false);
  assert.equal(text.includes("{retail_headline}"), false);
  assert.equal(text.includes("$"), false);
  assert.equal(/\d/.test(text.replace(/^2\. /, "")), false);
  assert.equal(/sweetwater|reverb/i.test(text), false);
  assert.equal(/title=/.test(rawCard), false);
  assert.equal(/below MAP|MAP violation|parity guidance/i.test(text), false);
});

test("Measured Retail Channels does not call shelf prices a MAP violation", () => {
  const tabs = spec.spokes.competitors.tabs as string[];
  assert.deepEqual(tabs, [
    "Head-to-Head Category Battlecards",
    "Rival Strategies & Countermeasures",
    "Measured Retail Channels",
  ]);

  const html = spec.spokes.competitors.tabTemplates[2] as string;
  const text = plain(html);
  assert.match(
    text,
    /Amazon, Walmart, and Musician's Friend have stored shelf-price fields in the retail system\./,
  );
  assert.match(text, /Walmart and Musician's Friend are partial readings\./);
  assert.match(text, new RegExp(NOT_MEASURED.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(text, /A missing retailer price is not zero\./);
  assert.match(
    text,
    /Retailer shelf prices cannot be called MAP compliance until an official Fender MAP source is connected\./,
  );
  assert.equal(/\d/.test(text), false);
  assert.equal(/title=/.test(html), false);
  assert.equal(/maintains strict MAP|scrape|suppression/i.test(text), false);

  const withoutNotMeasured = text.replace(NOT_MEASURED, "");
  assert.equal(/sweetwater|reverb/i.test(withoutNotMeasured), false);

  const spoke = plain(
    [...tabs, ...(spec.spokes.competitors.tabTemplates as string[])].join(" "),
  );
  assert.equal(spoke.replace(NOT_MEASURED, "").match(/sweetwater|reverb/gi), null);
});

test("a copied channel-scope URL still opens Measured Retail Channels", () => {
  const tabs = spec.spokes.competitors.tabs as string[];
  assert.equal(tabSlug("Measured Retail Channels"), "measured-retail-channels");
  assert.equal(tabSlug("Multi-Marketplace Channel Scope (Sweetwater, Reverb, Walmart)"), OLD_SLUG);
  assert.equal(tabIndexFromSlug(tabs, OLD_SLUG), 2);
  assert.equal(tabIndexFromSlug(tabs, tabSlug(tabs[2] ?? "")), 2);
  assert.equal(tabs[tabIndexFromSlug(tabs, OLD_SLUG)], "Measured Retail Channels");
});

test("the MAP not-stored sentence and ROI amounts stay where they were", () => {
  assert.equal(MAP_PRICES_NOT_STORED, "Fender MAP prices have not been stored.");
  const roi = spec.spokes.suggestions.tabTemplates[1] as string;
  assert.match(roi, /\$680,000 estimate/);
  assert.match(roi, /\+\$38M to \$62M|\$38M to \$62M/);
  assert.match(roi, /\+\$3,500,000 \/ yr/);
  const raw = readFileSync(new URL("data/fender-v3-spec.json", root), "utf8");
  assert.equal(raw.includes("Sweetwater maintains"), false);
  assert.equal(/AI models scrape/i.test(raw), false);
  assert.equal(raw.includes("Standardize Bundle MAP Parity"), false);
});
