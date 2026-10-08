import { expect, test } from "./fixtures";

const OLD_SLUG = "multi-marketplace-channel-scope-sweetwater-reverb-walmart";

const CHANNEL_SENTENCES = [
  "Amazon, Walmart, and Musician's Friend have stored shelf-price fields in the retail system.",
  "Walmart and Musician's Friend are partial readings.",
  "Sweetwater and Reverb are not measured because listing_channel_price has no writer.",
  "A missing retailer price is not zero.",
  "Retailer shelf prices cannot be called MAP compliance until an official Fender MAP source is connected.",
];

test("the second Action Item connects a MAP source and does not claim a gap", async ({
  canvas,
  page,
}) => {
  await canvas.open();
  await canvas.openSpokeFromMap("Action Items");
  await canvas.openTab("Urgent Interventions");

  const card = page.locator(".action-card").nth(1);
  await expect(card.locator(".action-head")).toHaveText("2. Connect Fender's official MAP source");
  await expect(card.locator(".action-details")).toHaveText(
    "Load Fender's official MAP file or price list before measuring retailer compliance. Amazon, Walmart, and Musician's Friend shelf prices can stay visible, but they cannot be called MAP gaps.",
  );
  await expect(card.locator(".action-impact")).toHaveText("Fender MAP prices have not been stored.");
  await expect(card).not.toContainText("Sweetwater");
  await expect(card).not.toContainText("Reverb");
  await expect(card).not.toContainText("$");
  await expect(card).not.toContainText("listings");
  await expect(card.locator("[title]")).toHaveCount(0);
});

test("Measured Retail Channels names shelf prices and does not claim a MAP violation", async ({
  canvas,
  page,
}) => {
  await canvas.open();
  await page.goto(`/dashboard?spoke=competitors&tab=${OLD_SLUG}`);
  await expect(page.locator(".ifai-canvas.column-layout")).toHaveCount(1);
  await expect(canvas.activeTab).toHaveText("Measured Retail Channels");
  await expect(page).toHaveURL(/tab=measured-retail-channels/);

  const body = page.locator(".drilldown-body");
  for (const sentence of CHANNEL_SENTENCES) {
    await expect(body).toContainText(sentence);
  }
  await expect(body).not.toContainText("maintains strict MAP");
  await expect(body).not.toContainText("scrape");
  await expect(body).not.toContainText("suppression");

  const mapTerm = body.locator(".ifai-term", { hasText: "MAP" }).first();
  await expect(mapTerm).toBeVisible();
  await expect(mapTerm).toHaveAttribute("data-ifai-tooltip-desc", /.+/);
  await expect(mapTerm).not.toHaveAttribute("title");

  const text = (await body.innerText()).replace(
    "Sweetwater and Reverb are not measured because listing_channel_price has no writer.",
    "",
  );
  expect(text).not.toMatch(/sweetwater|reverb/i);
});

test("the current Measured Retail Channels slug opens the same tab", async ({ canvas, page }) => {
  await canvas.open();
  await page.goto("/dashboard?spoke=competitors&tab=measured-retail-channels");
  await expect(canvas.activeTab).toHaveText("Measured Retail Channels");
  await expect(page.locator(".drilldown-tabs .drilldown-tab-btn")).toHaveText([
    "Head-to-Head Category Battlecards",
    "Rival Strategies & Countermeasures",
    "Measured Retail Channels",
  ]);

  await canvas.openTab("Rival Strategies");
  const body = page.locator(".drilldown-body");
  await expect(body).toContainText(
    "Category share of voice is the table on Head-to-Head Category Battlecards.",
  );
  await expect(body).not.toContainText("Sweetwater");
  await expect(body).not.toContainText("Reverb");
  await expect(body).not.toContainText("MAP");
});
