export type CanvasMetricsRow = {
  kpi?: Record<string, unknown> | null;
  catalog_skus: number | null;
  catalog_bundles: number | null;
  seller_harvested: number | null;
  seller_harvested_pct: number | null;
  division_count: number | null;
  bb_total: number | null;
  bb_1p: number | null;
  bb_3p: number | null;
  bb_unharvested: number | null;
  bb_no_offer: number | null;
  bb_1p_pct: number | null;
  bb_3p_pct: number | null;
  bb_unharvested_pct: number | null;
  active_offer_coverage_pct: number | null;
  amz_below_map: number | null;
  amz_avg_drift: number | null;
  wmt_checked: number | null;
  wmt_leaks: number | null;
  mf_checked: number | null;
  mf_leaks: number | null;
  offamz_avg_leak: number | null;
  map_violation_skus: number | null;
  bundle_reviews: number | null;
  spec_checked: number | null;
  spec_avg_amazon_pct: number | null;
  spec_fender_found: number | null;
  spec_fender_found_pct: number | null;
  spec_avg_fender_pct: number | null;
  spec_missing_additional_property: number | null;
  spec_missing_field_types: number | null;
  sim_total: number | null;
  sim_runs: number | null;
  sim_resolved: number | null;
  sim_wins: number | null;
  sim_win_pct: number | null;
  sim_unclear: number | null;
  sim_errors: number | null;
  sim_hallucinations: number | null;
  sim_hallucination_risk: number | null;
  weakest_category: string | null;
  weakest_win_pct: number | null;
  weakest_top_competitor: string | null;
  weakest_competitor_pct: number | null;
  weakest_sov_gap_pts: number | null;
  strongest_category: string | null;
  strongest_win_pct: number | null;
  strongest_wins: number | null;
  strongest_resolved: number | null;
};

export type CanvasAiCategoryRow = {
  category: string;
  fender_win_pct: number | null;
  top_competitor: string | null;
  top_competitor_pct: number | null;
  resolved?: number | null;
  hallucinations?: number | null;
};

export type CanvasAiEngineRow = {
  engine: string;
  fender_win_pct: number | null;
  resolved: number | null;
};

export type CanvasCompetitorSovRow = {
  category: string;
  competitor: string;
  wins: number | null;
  category_resolved?: number | null;
  sov_pct: number | null;
};

export type CanvasDivisionRow = {
  division: string;
  monitored_skus: number | null;
  buybox_pct: number | null;
  schema_sync_pct: number | null;
  splinter_bundles: number | null;
  primary_threat: string | null;
  strategic_action: string | null;
};

export type CanvasSpecMissingRow = {
  field: string;
  sku_count: number | null;
  source: string | null;
};

export type CanvasFreshnessRow = {
  job_key: string;
  last_run_at: string | null;
};

export type CanvasRetailListingRow = {
  asin: string;
  model_name: string | null;
  title: string | null;
  bundle_name: string | null;
  buybox_seller_name: string | null;
  map_price: number | null;
  offer_price: number | null;
  worst_leakage: number | null;
  reviews_count: number | null;
  channels: string | null;
  buybox_status: string | null;
  is_map_violation: boolean | null;
  is_bundle: boolean | null;
  wmt_price: number | null;
  wmt_leakage: number | null;
  wmt_url: string | null;
  mf_price: number | null;
  mf_leakage: number | null;
  competitive_price_threshold_cents?: number | null;
  featured_offer_withheld?: boolean | null;
  competitive_offer_suppressed?: boolean | null;
};

export type CanvasSimulationRow = {
  id: string;
  engine: string | null;
  category: string | null;
  prompt: string | null;
  winner: string | null;
  is_resolved: boolean | null;
  hallucination_flag: boolean | null;
  root_cause: string | null;
  remediation_patch: string | null;
  created_at: string | null;
};

export type CanvasSpecReadinessRow = {
  asin: string;
  model_name: string | null;
  amazon_completeness_pct: number | null;
  fender_completeness_pct: number | null;
  fender_page_found: boolean | null;
  amazon_missing_fields: string | null;
};

export type CanvasBundle = {
  m: CanvasMetricsRow;
  cats: CanvasAiCategoryRow[];
  engines: CanvasAiEngineRow[];
  sov: CanvasCompetitorSovRow[];
  divisions: CanvasDivisionRow[];
  missing: CanvasSpecMissingRow[];
  fresh: CanvasFreshnessRow[];
};
