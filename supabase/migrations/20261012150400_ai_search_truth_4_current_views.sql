-- AI Search truth, part 4 of 4: current-run views. Idempotent. Existing canvas_* columns keep their names, order and types; new columns are appended.
-- Current run = the latest PUBLISHED run (published_at, then id). Never newest timestamp, never a union of runs.
CREATE OR REPLACE VIEW canvas_private.ai_current_run AS
 SELECT r.id, r.run_state, r.collector_version, r.prompt_set_hash, r.expected_calls, r.attempted_calls,
        r.answered_calls, r.error_calls, r.started_at, r.completed_at, r.published_at
   FROM command.fmic_audit_runs r
  WHERE r.is_published
  ORDER BY r.published_at DESC, r.id DESC
  LIMIT 1;

CREATE OR REPLACE VIEW canvas_private.ai_current_calls AS
 SELECT s.id, s.audit_run_id, s.sim_id, s.category, s.prompt_key, s.prompt_text, s.prompt_kind, s.engine, s.model,
        s.repeat_no, s.attempt_no, s.call_status, s.outcome, s.primary_brand, s.winner,
        s.material_hallucination, s.hallucination_evidence, nullif(s.root_cause, '') AS root_cause,
        rem.remediation_text, s.error_message, s.answer_text, s.citation_urls, s.created_at, c.run_state, c.published_at
   FROM command.fmic_ai_simulations s
   JOIN canvas_private.ai_current_run c ON c.id = s.audit_run_id
   LEFT JOIN command.fmic_ai_remediations rem ON rem.simulation_id = s.id;

CREATE OR REPLACE VIEW public.canvas_ai_simulations WITH (security_invoker = false) AS
 SELECT id, audit_run_id, 'current_run'::text AS source_table, sim_id, engine, repeat_no, category,
        prompt_text AS prompt, winner,
        (outcome IN ('fender_win', 'competitor_win')) AS is_resolved,
        (material_hallucination = 'confirmed') AS hallucination_flag,
        root_cause, remediation_text AS remediation_patch, answer_text, citation_urls, created_at,
        prompt_key, prompt_kind, model, call_status, outcome, primary_brand, material_hallucination,
        hallucination_evidence, attempt_no, error_message, run_state, published_at
   FROM canvas_private.ai_current_calls;

CREATE OR REPLACE VIEW public.canvas_ai_category WITH (security_invoker = false) AS
 WITH s AS (SELECT * FROM canvas_private.ai_current_calls WHERE prompt_kind = 'commercial'),
 r AS (SELECT * FROM s WHERE outcome IN ('fender_win', 'competitor_win')),
 c AS (SELECT category, count(*) AS resolved,
              count(*) FILTER (WHERE outcome = 'fender_win' AND material_hallucination IS DISTINCT FROM 'confirmed') AS fender_wins
         FROM r GROUP BY category),
 comp AS (SELECT DISTINCT ON (category) category, primary_brand::character varying(100) AS top_competitor, count(*) AS top_competitor_wins
            FROM r WHERE outcome = 'competitor_win' GROUP BY category, primary_brand
           ORDER BY category, count(*) DESC, primary_brand),
 a AS (SELECT category, count(*) AS total_sims,
              count(*) FILTER (WHERE outcome = 'unresolved') AS unclear,
              count(*) FILTER (WHERE outcome = 'error') AS errors,
              count(*) FILTER (WHERE material_hallucination = 'confirmed') AS hallucinations
         FROM s GROUP BY category)
 SELECT a.category, a.total_sims, COALESCE(c.resolved, 0::bigint) AS resolved,
        COALESCE(c.fender_wins, 0::bigint) AS fender_wins,
        round(100.0 * c.fender_wins::numeric / NULLIF(c.resolved, 0)::numeric, 1) AS fender_win_pct,
        comp.top_competitor, COALESCE(comp.top_competitor_wins, 0::bigint) AS top_competitor_wins,
        round(100.0 * comp.top_competitor_wins::numeric / NULLIF(c.resolved, 0)::numeric, 1) AS top_competitor_pct,
        round(100.0 * (COALESCE(c.fender_wins, 0::bigint) - COALESCE(comp.top_competitor_wins, 0::bigint))::numeric / NULLIF(c.resolved, 0)::numeric, 1) AS sov_gap_pts,
        a.unclear, a.errors, a.hallucinations
   FROM a LEFT JOIN c USING (category) LEFT JOIN comp USING (category);

CREATE OR REPLACE VIEW public.canvas_ai_engine WITH (security_invoker = false) AS
 SELECT COALESCE(engine, 'unknown'::character varying) AS engine,
        count(*) FILTER (WHERE prompt_kind = 'commercial') AS total_sims,
        count(*) FILTER (WHERE prompt_kind = 'commercial' AND outcome IN ('fender_win', 'competitor_win')) AS resolved,
        count(*) FILTER (WHERE prompt_kind = 'commercial' AND outcome = 'fender_win' AND material_hallucination IS DISTINCT FROM 'confirmed') AS fender_wins,
        round(100.0 * (count(*) FILTER (WHERE prompt_kind = 'commercial' AND outcome = 'fender_win' AND material_hallucination IS DISTINCT FROM 'confirmed'))::numeric
              / NULLIF(count(*) FILTER (WHERE prompt_kind = 'commercial' AND outcome IN ('fender_win', 'competitor_win')), 0)::numeric, 1) AS fender_win_pct,
        count(*) FILTER (WHERE material_hallucination = 'confirmed') AS hallucinations
   FROM canvas_private.ai_current_calls
  GROUP BY COALESCE(engine, 'unknown'::character varying);

CREATE OR REPLACE VIEW public.canvas_competitor_sov WITH (security_invoker = false) AS
 WITH r AS (SELECT category, (CASE WHEN outcome = 'fender_win' THEN 'Fender/Squier' ELSE primary_brand END)::character varying(100) AS winner
              FROM canvas_private.ai_current_calls
             WHERE prompt_kind = 'commercial' AND outcome IN ('fender_win', 'competitor_win')),
 g AS (SELECT COALESCE(r.category, 'all'::character varying) AS category, r.winner AS competitor, count(*) AS wins
         FROM r GROUP BY GROUPING SETS ((r.category, r.winner), (r.winner))),
 t AS (SELECT COALESCE(r.category, 'all'::character varying) AS category, count(*) AS resolved
         FROM r GROUP BY GROUPING SETS ((r.category), ()))
 SELECT g.category, g.competitor, g.wins, t.resolved AS category_resolved,
        round(100.0 * g.wins::numeric / NULLIF(t.resolved, 0)::numeric, 1) AS sov_pct
   FROM g JOIN t USING (category);

CREATE OR REPLACE VIEW public.canvas_freshness WITH (security_invoker = false) AS
 SELECT job_key, last_run_at, cursor_offset, updated_at FROM command.fmic_job_state
 UNION ALL
 SELECT 'kpi_recompute'::character varying, max(created_at), NULL::integer, max(created_at) FROM command.fmic_brand_kpi_summary
 UNION ALL
 SELECT 'ai_simulations'::character varying, c.completed_at, NULL::integer, c.published_at FROM canvas_private.ai_current_run c;

CREATE OR REPLACE VIEW public.canvas_ai_current_run WITH (security_invoker = false) AS
 SELECT id AS audit_run_id, run_state, collector_version, prompt_set_hash, expected_calls, attempted_calls,
        answered_calls, error_calls, started_at, completed_at, published_at,
        (expected_calls - answered_calls) AS missing_calls
   FROM canvas_private.ai_current_run;

CREATE OR REPLACE VIEW public.canvas_ai_probes WITH (security_invoker = false) AS
 SELECT c.audit_run_id, c.sim_id, c.prompt_key, c.prompt_text AS prompt, c.engine, c.model, c.call_status,
        c.material_hallucination, c.hallucination_evidence, c.root_cause, c.remediation_text,
        f.claim AS verified_claim, f.source_url AS verified_source_url, f.verified_at, c.answer_text, c.created_at
   FROM canvas_private.ai_current_calls c
   LEFT JOIN command.fmic_ai_probe_facts f ON f.prompt_key = c.prompt_key
  WHERE c.prompt_kind = 'probe';

CREATE OR REPLACE VIEW public.canvas_ai_citations WITH (security_invoker = false) AS
 SELECT ci.audit_run_id, ci.sim_id, ci.simulation_id, s.prompt_key, s.prompt_kind, s.category, ci.engine, ci.position, ci.url, ci.domain, ci.title
   FROM command.fmic_ai_citations ci
   JOIN canvas_private.ai_current_calls s ON s.id = ci.simulation_id;

CREATE OR REPLACE VIEW public.canvas_ai_run_history WITH (security_invoker = false) AS
 SELECT id AS audit_run_id, run_kind, run_state, collector_version, prompt_set_hash, expected_calls, attempted_calls,
        answered_calls, error_calls, is_published, published_at, started_at, completed_at
   FROM command.fmic_audit_runs WHERE run_kind = 'ai_simulation';

DO $$ DECLARE v text; BEGIN
  FOREACH v IN ARRAY ARRAY['canvas_ai_current_run','canvas_ai_probes','canvas_ai_citations','canvas_ai_run_history','canvas_ai_simulations','canvas_ai_category','canvas_ai_engine','canvas_competitor_sov','canvas_freshness'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', v);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated', v);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', v);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';