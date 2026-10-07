import assert from "node:assert/strict";
import { test } from "node:test";
import { listingChannelFacts, mapTabModel, type MapSourceRow } from "../lib/fender-canvas/map-channels.ts";

function row(overrides: Partial<MapSourceRow> & Pick<MapSourceRow, "asin">): MapSourceRow {
  return {
    model_name: overrides.asin,
    title: null,
    map_price: 100,
    offer_price: 80,
    worst_leakage: -20,
    wmt_price: null,
    wmt_url: null,
    mf_price: null,
    mf_leakage: null,
    ...overrides,
  };
}

test("channels appear only when this read stored a price", () => {
  const model = mapTabModel([
    row({
      asin: "B000000001",
      offer_price: 80,
      worst_leakage: -20,
      wmt_price: 77.5,
      wmt_url: "https://www.walmart.com/ip/1",
      mf_price: 79,
      mf_leakage: -21,
    }),
    row({ asin: "B000000002", offer_price: 90, worst_leakage: -10, wmt_url: "https://www.walmart.com/ip/skip" }),
    row({ asin: "B000000003", offer_price: 70, worst_leakage: -30, wmt_price: 65 }),
  ]);

  assert.equal(model.count, 3);
  assert.deepEqual(
    model.channels.map((channel) => channel.name),
    ["Amazon", "Walmart", "Musician's Friend"],
  );
  assert.equal(model.channels[1]?.count, 2);
  assert.equal(model.channels[2]?.count, 1);
  assert.equal(model.showWalmart, true);
  assert.equal(model.showMusiciansFriend, true);
  assert.equal(model.combinedGap, -60);
  assert.equal(model.averageGap, -20);
});

test("Amazon-only rows do not invent Walmart or Musician's Friend", () => {
  const model = mapTabModel([row({ asin: "B000000004", offer_price: 40, map_price: 50, worst_leakage: -10 })]);
  assert.deepEqual(model.channels.map((channel) => channel.name), ["Amazon"]);
  assert.equal(model.showWalmart, false);
  assert.equal(model.showMusiciansFriend, false);
});

test("a listing that is no longer returned is not counted", () => {
  const first = mapTabModel([
    row({ asin: "B000000001" }),
    row({ asin: "B000000009", worst_leakage: -30 }),
  ]);
  const next = mapTabModel([row({ asin: "B000000009", worst_leakage: -30 })]);
  assert.equal(first.count, 2);
  assert.equal(next.count, 1);
});

test("an empty channel price read leaves Amazon, Walmart, and Musician's Friend only", () => {
  const model = mapTabModel(
    [
      row({
        asin: "B000000001",
        wmt_price: 70,
        mf_price: 69,
      }),
    ],
    [],
  );
  assert.deepEqual(
    model.channels.map((channel) => channel.name),
    ["Amazon", "Walmart", "Musician's Friend"],
  );
  assert.deepEqual(model.extraChannels, []);
  assert.equal(model.showWalmart, true);
  assert.equal(model.showMusiciansFriend, true);
});

test("sweetwater and reverb stay hidden until a price is stored", () => {
  const model = mapTabModel(
    [row({ asin: "B000000001", wmt_price: 70 })],
    [
      {
        asin: "B000000001",
        channel: "sweetwater",
        price: null,
        url: null,
        checked_at: "2026-10-07T00:00:00Z",
      },
      {
        asin: "B000000001",
        channel: "reverb",
        price: 0,
        url: "https://reverb.com/item/1",
        checked_at: "2026-10-07T00:00:00Z",
      },
    ],
  );
  assert.deepEqual(model.extraChannels, []);
  assert.equal(model.showWalmart, true);
  assert.equal(model.showMusiciansFriend, false);
});

test("a stored price shows that channel and does not invent the other", () => {
  const model = mapTabModel(
    [row({ asin: "B000000001", offer_price: 80, wmt_price: 77 })],
    [
      {
        asin: "B000000001",
        channel: "sweetwater",
        price: "88.50",
        url: "https://www.sweetwater.com/store/detail/1",
        checked_at: "2026-10-07T00:00:00Z",
      },
      {
        asin: "B000000002",
        channel: "sweetwater",
        price: 90,
        url: null,
        checked_at: "2026-10-07T00:00:00Z",
      },
    ],
  );
  assert.deepEqual(
    model.channels.map((channel) => channel.name),
    ["Amazon", "Walmart"],
  );
  assert.deepEqual(model.extraChannels, [{ channel: "sweetwater", name: "Sweetwater", count: 1 }]);
  assert.equal(model.extraChannels.some((channel) => channel.name === "Reverb"), false);
});

test("a later channel appears from inserted rows, after sweetwater and reverb", () => {
  const model = mapTabModel(
    [
      row({ asin: "B000000001", offer_price: null, worst_leakage: null }),
      row({ asin: "B000000002", offer_price: null, worst_leakage: null }),
      row({ asin: "B000000003", offer_price: null, worst_leakage: null }),
    ],
    [
      {
        asin: "B000000003",
        channel: "guitar-center",
        price: 70,
        url: null,
        checked_at: "2026-10-07T00:00:00Z",
      },
      {
        asin: "B000000001",
        channel: "reverb",
        price: 10,
        url: null,
        checked_at: "2026-10-07T00:00:00Z",
      },
      {
        asin: "B000000002",
        channel: "sweetwater",
        price: 12,
        url: null,
        checked_at: "2026-10-07T00:00:00Z",
      },
      {
        asin: "B000000002",
        channel: "sweetwater",
        price: 12,
        url: null,
        checked_at: "2026-10-07T00:00:00Z",
      },
    ],
  );
  assert.deepEqual(
    model.extraChannels.map((channel) => ({ channel: channel.channel, count: channel.count })),
    [
      { channel: "sweetwater", count: 1 },
      { channel: "reverb", count: 1 },
      { channel: "guitar-center", count: 1 },
    ],
  );
  assert.equal(model.extraChannels[2]?.name, "Guitar Center");
  assert.equal(model.count, 3);
});

test("a stored price at or above MAP is not a channel count", () => {
  const model = mapTabModel([
    row({
      asin: "B000000001",
      map_price: 100,
      offer_price: 100,
      amz_leakage: 0,
      wmt_price: 110,
      wmt_leakage: 10,
      mf_price: 90,
      mf_leakage: -10,
    }),
  ]);
  assert.deepEqual(
    model.channels.map((channel) => channel.name),
    ["Musician's Friend"],
  );
  assert.equal(model.channels[0]?.count, 1);
  assert.equal(model.showAmazon, true);
  assert.equal(model.showWalmart, true);
});

test("a channel price with no listing MAP is not counted and does not invent a price", () => {
  const model = mapTabModel([], [
    {
      asin: "B000000009",
      channel: "sweetwater",
      price: 12,
      url: null,
      checked_at: "2026-10-07T00:00:00Z",
    },
  ]);
  assert.deepEqual(model.extraChannels, []);
  assert.deepEqual(model.channels, []);
});

test("B0CMW1YK74 keeps the Amazon gap and the Musician's Friend gap apart", () => {
  const source = row({
    asin: "B0CMW1YK74",
    map_price: 2497.99,
    offer_price: 2049.99,
    amz_leakage: -448,
    worst_leakage: -858,
    mf_price: 1639.99,
    mf_leakage: -858,
  });
  const facts = listingChannelFacts(source);
  const amazon = facts.find((fact) => fact.name === "Amazon");
  const musiciansFriend = facts.find((fact) => fact.name === "Musician's Friend");
  assert.equal(amazon?.price, 2049.99);
  assert.equal(amazon?.gap, -448);
  assert.equal(musiciansFriend?.price, 1639.99);
  assert.equal(musiciansFriend?.gap, -858);
  assert.equal(facts.some((fact) => fact.name === "Walmart"), false);
  assert.notEqual(amazon?.gap, source.worst_leakage);

  const model = mapTabModel([source]);
  assert.deepEqual(
    model.channels.map((channel) => channel.name),
    ["Amazon", "Musician's Friend"],
  );
  assert.equal(model.showWalmart, false);
});
