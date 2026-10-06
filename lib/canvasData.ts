import { getCanvasSupabase } from "@/lib/supabase/canvas-client";
import type { CanvasBundle } from "@/lib/fender-canvas/types";

export async function loadCanvas(): Promise<CanvasBundle> {
  const supabase = getCanvasSupabase();
  const [metrics, cats, engines, sov, divisions, missing, fresh] = await Promise.all([
    supabase.from("canvas_metrics").select("*").single(),
    supabase.from("canvas_ai_category").select("*").order("fender_win_pct"),
    supabase.from("canvas_ai_engine").select("*"),
    supabase
      .from("canvas_competitor_sov")
      .select("*")
      .order("wins", { ascending: false }),
    supabase
      .from("canvas_divisions")
      .select("*")
      .order("monitored_skus", { ascending: false }),
    supabase
      .from("canvas_spec_missing_fields")
      .select("*")
      .order("sku_count", { ascending: false }),
    supabase.from("canvas_freshness").select("*"),
  ]);

  const err = [metrics, cats, engines, sov, divisions, missing, fresh].find((r) => r.error);
  if (err?.error) throw err.error;

  return {
    m: metrics.data as CanvasBundle["m"],
    cats: (cats.data ?? []) as CanvasBundle["cats"],
    engines: (engines.data ?? []) as CanvasBundle["engines"],
    sov: (sov.data ?? []) as CanvasBundle["sov"],
    divisions: (divisions.data ?? []) as CanvasBundle["divisions"],
    missing: (missing.data ?? []) as CanvasBundle["missing"],
    fresh: (fresh.data ?? []) as CanvasBundle["fresh"],
  };
}

export function listingsQuery(
  page = 0,
  size = 50,
  filter?: { status?: string; violationsOnly?: boolean; bundlesOnly?: boolean },
) {
  const supabase = getCanvasSupabase();
  let q = supabase
    .from("canvas_retail_listings")
    .select("*", { count: "exact" })
    .order("worst_leakage", { ascending: true, nullsFirst: false })
    .range(page * size, page * size + size - 1);
  if (filter?.status) q = q.eq("buybox_status", filter.status);
  if (filter?.violationsOnly) q = q.eq("is_map_violation", true);
  if (filter?.bundlesOnly) q = q.eq("is_bundle", true);
  return q;
}

export function simulationsQuery(category?: string, page = 0, size = 50) {
  const supabase = getCanvasSupabase();
  let q = supabase
    .from("canvas_ai_simulations")
    .select(
      "id,engine,category,prompt,winner,is_resolved,hallucination_flag,root_cause,remediation_patch,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(page * size, page * size + size - 1);
  if (category) q = q.eq("category", category);
  return q;
}

export function simulationDetailQuery(id: string) {
  const supabase = getCanvasSupabase();
  return supabase
    .from("canvas_ai_simulations")
    .select("answer_text,citation_urls,root_cause,remediation_patch")
    .eq("id", id)
    .single();
}

export function specRowsQuery(page = 0, size = 50) {
  const supabase = getCanvasSupabase();
  return supabase
    .from("canvas_spec_readiness")
    .select("*", { count: "exact" })
    .order("amazon_completeness_pct", { ascending: true })
    .range(page * size, page * size + size - 1);
}
