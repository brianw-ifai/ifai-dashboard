import assert from "node:assert/strict";
import { test } from "node:test";
import { beginnerSovLine } from "../lib/fender-canvas/beginner-sov.ts";
import { buildLiveCommandCenter } from "../lib/fender-canvas/command-center-from-live.ts";
import { groupHallucinationCauses } from "../lib/fender-canvas/hallucination-causes.ts";
import type { CanvasBundle } from "../lib/fender-canvas/types.ts";

function bundle(): CanvasBundle {
  return {
    m: {
      catalog_skus: 3598,
      catalog_bundles: 941,
      seller_harvested: 1025,
      seller_harvested_pct: 28.5,
      division_count: 13,
      bb_total: 1025,
      bb_1p: 85,
      bb_3p: 851,
      bb_unharvested: 68,
      bb_no_offer: 21,
      bb_1p_pct: 8.3,
      bb_3p_pct: 83,
      bb_unharvested_pct: 6.6,
      active_offer_coverage_pct: 28.5,
      amz_below_map: 455,
      amz_avg_drift: -10,
      wmt_checked: 1,
      wmt_leaks: 1,
      mf_checked: 1,
      mf_leaks: 1,
      offamz_avg_leak: -5,
      map_violation_skus: 533,
      bundle_reviews: null,
      spec_checked: 913,
      spec_avg_amazon_pct: 91.8,
      spec_fender_found: 99,
      spec_fender_found_pct: 10.8,
      spec_avg_fender_pct: 87.5,
      spec_missing_additional_property: 99,
      spec_missing_field_types: 13,
      sim_total: 4287,
      sim_runs: 522,
      sim_resolved: 3885,
      sim_wins: 3209,
      sim_win_pct: 82.6,
      sim_unclear: 260,
      sim_errors: 142,
      sim_hallucinations: 222,
      sim_hallucination_risk: 630,
      weakest_category: "beginner",
      weakest_win_pct: 58.5,
      weakest_top_competitor: "Yamaha",
      weakest_competitor_pct: 38.7,
      weakest_sov_gap_pts: 19.9,
      strongest_category: "hallucinations",
      strongest_win_pct: 100,
      strongest_wins: 587,
      strongest_resolved: 587,
    },
    cats: [],
    engines: [],
    sov: [
      {
        category: "beginner",
        competitor: "Yamaha",
        wins: 2,
        category_resolved: 3,
        sov_pct: 66.7,
      },
      {
        category: "beginner",
        competitor: "Fender/Squier",
        wins: 1,
        category_resolved: 3,
        sov_pct: 33.3,
      },
    ],
    divisions: Array.from({ length: 13 }, (_, index) => ({
      division: `Division ${index + 1}`,
      monitored_skus: 10,
      buybox_pct: null,
      splinter_bundles: null,
      schema_sync_pct: null,
      primary_threat: null,
      strategic_action: null,
    })),
    missing: [],
    fresh: [],
  };
}

test("beginner share of voice uses the stored competitor percents", () => {
  const line = beginnerSovLine(bundle().sov);
  assert.equal(line, "Yamaha 66.7% vs Fender/Squier 33.3%");
});

test("command center uses live offer counts and drops unsourced claims", () => {
  const spec = buildLiveCommandCenter(bundle());
  const text = [spec.desc, spec.summary, ...spec.items.flatMap((item) => [item.title, item.why, item.impact])]
    .filter(Boolean)
    .join("\n");

  assert.match(text, /3,598/);
  assert.match(text, /1,025/);
  assert.match(text, /8\.3%/);
  assert.match(text, /13 divisions/);
  assert.match(text, /Yamaha 66\.7% vs Fender\/Squier 33\.3%/);
  assert.match(text, /222/);
  assert.doesNotMatch(text, /3,430|993|7\.4%|16\.7%|Fourteen|14 catalog|2,420|fingerboard|dual humbucker/i);
  assert.equal(spec.items.length, 6);
});

test("hallucination groups are the stored root causes and their row counts", () => {
  const summary = groupHallucinationCauses([
    { root_cause: "Mustang Micro tube claim", engine: "perplexity", category: "hallucinations", prompt: "tubes?" },
    { root_cause: "Mustang Micro tube claim", engine: "gemini", category: "hallucinations", prompt: "tubes?" },
    { root_cause: "Tone Master tube claim", engine: "chatgpt", category: "amps", prompt: "bias?" },
    { root_cause: "Acoustasonic humbucker", engine: "perplexity", category: "acoustics", prompt: "pickups?" },
    { root_cause: "  ", engine: "chatgpt", category: "amps", prompt: "empty" },
  ]);

  assert.equal(summary.flagged, 5);
  assert.equal(summary.missingRootCause, 1);
  assert.deepEqual(
    summary.groups.map((group) => [group.rootCause, group.count]),
    [
      ["Mustang Micro tube claim", 2],
      ["Acoustasonic humbucker", 1],
      ["Tone Master tube claim", 1],
    ],
  );
  assert.equal(
    summary.groups.some((group) => /12-inch|fingerboard/i.test(group.rootCause)),
    false,
  );
});
