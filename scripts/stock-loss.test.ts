// node --experimental-strip-types --import ./scripts/register-alias.mjs --import ./scripts/register-ts-extensions.mjs --test scripts/stock-loss.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  lostSales,
  lostSalesPopulationPie,
  noBuyBoxAtRisk,
  sumLostSales,
  type StockLossRow,
} from "../lib/fender-canvas/stock-loss.ts";

function row(patch: Partial<StockLossRow> & Pick<StockLossRow, "asin">): StockLossRow {
  return {
    title: patch.asin,
    smartscout_snapshot_date: "2026-10-01",
    smartscout_monthly_revenue: 1000,
    smartscout_ttm_revenue: 12000,
    history_through: "2026-10-28",
    in_stock_days_30: 20,
    oos_days_90: 10,
    observed_days_365: 365,
    in_stock_days_365: 300,
    oos_days_365: 50,
    suppressed_days_365: 5,
    baseline_method: "ttm_per_in_stock_day",
    baseline_daily_revenue: 40,
    est_lost_revenue_oos_365: 2000,
    est_lost_revenue_suppressed_365_max: 9999,
    ...patch,
  };
}

test("sumLostSales adds only lostSales(); nulls drop out", () => {
  const rows = [
    row({ asin: "A", est_lost_revenue_oos_365: 100, est_lost_revenue_suppressed_365_max: 5000 }),
    row({ asin: "B", est_lost_revenue_oos_365: 250, est_lost_revenue_suppressed_365_max: 8000 }),
    row({
      asin: "C",
      baseline_method: null,
      baseline_daily_revenue: null,
      est_lost_revenue_oos_365: null,
      est_lost_revenue_suppressed_365_max: null,
    }),
  ];
  assert.equal(lostSales(rows[0]!), 100);
  assert.equal(lostSales(rows[2]!), null);
  assert.equal(noBuyBoxAtRisk(rows[0]!), 5000);

  const sum = sumLostSales(rows);
  assert.equal(sum.total, 350);
  assert.equal(sum.estimatedCount, 2);
  assert.equal(sum.notEstimatedCount, 1);
  assert.equal(sum.affectedCount, 3);
  // Upper bound stays off the total.
  assert.notEqual(sum.total, 100 + 250 + 5000 + 8000);
});

test("sumLostSales never treats null as zero; empty set is Not estimated", () => {
  assert.deepEqual(sumLostSales([]), {
    total: null,
    estimatedCount: 0,
    notEstimatedCount: 0,
    affectedCount: 0,
  });

  const onlyNulls = [
    row({
      asin: "X",
      baseline_method: null,
      est_lost_revenue_oos_365: null,
      est_lost_revenue_suppressed_365_max: 4000,
    }),
  ];
  const sum = sumLostSales(onlyNulls);
  assert.equal(sum.total, null);
  assert.equal(sum.estimatedCount, 0);
  assert.equal(sum.notEstimatedCount, 1);
  assert.equal(noBuyBoxAtRisk(onlyNulls[0]!), null);
});

test("lostSalesPopulationPie mirrors estimated vs Not estimated", () => {
  const sum = sumLostSales([
    row({ asin: "A", est_lost_revenue_oos_365: 10 }),
    row({ asin: "B", baseline_method: null, est_lost_revenue_oos_365: null }),
  ]);
  const pie = lostSalesPopulationPie(sum);
  assert.ok(pie);
  assert.equal(pie!.total, 2);
  assert.deepEqual(
    pie!.slices.map((s) => [s.key, s.count]),
    [
      ["matched", 1],
      ["contradicted", 1],
    ],
  );
  assert.equal(lostSalesPopulationPie(sumLostSales([])), null);
});
