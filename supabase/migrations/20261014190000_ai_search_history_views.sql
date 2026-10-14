-- AI Search history, read-only public contract.
-- Idempotent. Does not alter canvas_ai_current_run or any current-run view.
-- Do not apply until Brian explicitly approves a production migration.
--
-- Client-safe history is a published completed or partial v11 run that attempted
-- its full recorded battery and contains no historical-backfill or
-- historical-unverified rows. Unpublished runs, v8 fragments, and legacy flags
-- stay out of these views.
--
-- Question role is not stored here. The client classifies each call with
-- questionRole() so the history rates cannot drift from the current-run rates.
-- Query version identity is prompt_key plus the exact prompt_text, hashed in
-- the client. This view exposes both fields and does not rewrite stored text.

CREATE OR REPLACE VIEW canvas_private.ai_history_runs AS
 SELECT r.id, r.run_kind, r.run_state, r.collector_version, r.prompt_set_hash, r.expected_calls, r.attempted_calls,
        r.answered_calls, r.error_calls, r.is_published, r.published_at, r.started_at, r.completed_at
   FROM command.fmic_audit_runs r
  WHERE r.run_kind = 'ai_simulation'
    AND r.is_published
    AND r.run_state IN ('completed', 'partial')
    AND r.prompt_set_hash IS NOT NULL
    AND r.collector_version = 'v11'
    AND r.expected_calls IS NOT NULL
    AND r.attempted_calls = r.expected_calls
    AND r.published_at IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
        FROM command.fmic_ai_simulations s
       WHERE s.audit_run_id = r.id
         AND (s.record_origin = 'historical_backfill' OR s.material_hallucination = 'historical_unverified')
    );

CREATE OR REPLACE VIEW canvas_private.ai_history_calls AS
 SELECT s.id, s.audit_run_id, s.sim_id, s.category, s.prompt_key, s.prompt_text, s.prompt_kind, s.engine, s.model,
        s.repeat_no, s.attempt_no, s.call_status, s.outcome, s.primary_brand, s.winner,
        s.material_hallucination, s.hallucination_evidence, nullif(s.root_cause, '') AS root_cause,
        rem.remediation_text, s.error_message, s.answer_text, s.citation_urls, s.created_at, r.run_state, r.published_at
   FROM command.fmic_ai_simulations s
   JOIN canvas_private.ai_history_runs r ON r.id = s.audit_run_id
   LEFT JOIN command.fmic_ai_remediations rem ON rem.simulation_id = s.id
  WHERE s.record_origin IS DISTINCT FROM 'historical_backfill'
    AND s.material_hallucination IS DISTINCT FROM 'historical_unverified';

CREATE OR REPLACE VIEW public.canvas_ai_history_runs WITH (security_invoker = false) AS
 SELECT id AS audit_run_id, run_kind, run_state, collector_version, prompt_set_hash, expected_calls, attempted_calls,
        answered_calls, error_calls, is_published, published_at, started_at, completed_at,
        (expected_calls - answered_calls) AS missing_calls
   FROM canvas_private.ai_history_runs;

CREATE OR REPLACE VIEW public.canvas_ai_history_calls WITH (security_invoker = false) AS
 SELECT id, audit_run_id, 'history_run'::text AS source_table, sim_id, engine, repeat_no, category,
        prompt_text AS prompt, winner,
        (outcome IN ('fender_win', 'competitor_win')) AS is_resolved,
        (material_hallucination = 'confirmed') AS hallucination_flag,
        root_cause, remediation_text AS remediation_patch, answer_text, citation_urls, created_at,
        prompt_key, prompt_kind, model, call_status, outcome, primary_brand, material_hallucination,
        hallucination_evidence, attempt_no, error_message, run_state, published_at
   FROM canvas_private.ai_history_calls;

CREATE OR REPLACE VIEW public.canvas_ai_history_probes WITH (security_invoker = false) AS
 SELECT c.audit_run_id, c.sim_id, c.prompt_key, c.prompt_text AS prompt, c.engine, c.model, c.call_status,
        c.material_hallucination, c.hallucination_evidence, c.root_cause, c.remediation_text,
        f.claim AS verified_claim, f.source_url AS verified_source_url, f.verified_at, c.answer_text, c.created_at
   FROM canvas_private.ai_history_calls c
   LEFT JOIN command.fmic_ai_probe_facts f ON f.prompt_key = c.prompt_key
  WHERE c.prompt_kind = 'probe';

CREATE OR REPLACE VIEW public.canvas_ai_history_citations WITH (security_invoker = false) AS
 SELECT ci.audit_run_id, ci.sim_id, ci.simulation_id, s.prompt_key, s.prompt_kind, s.category, ci.engine, ci.position, ci.url, ci.domain, ci.title
   FROM command.fmic_ai_citations ci
   JOIN canvas_private.ai_history_calls s ON s.id = ci.simulation_id;

-- Counts by the fields the client classifier needs. Role is not a column.
CREATE OR REPLACE VIEW public.canvas_ai_history_outcome_counts WITH (security_invoker = false) AS
 SELECT audit_run_id, engine, prompt_kind, prompt_key, prompt AS prompt_text, category, call_status, outcome,
        material_hallucination, primary_brand, count(*) AS calls
   FROM public.canvas_ai_history_calls
  GROUP BY audit_run_id, engine, prompt_kind, prompt_key, prompt, category, call_status, outcome,
           material_hallucination, primary_brand;

DO $$ DECLARE v text; BEGIN
  FOREACH v IN ARRAY ARRAY['canvas_ai_history_runs','canvas_ai_history_calls','canvas_ai_history_probes','canvas_ai_history_citations','canvas_ai_history_outcome_counts'] LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', v);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated, service_role', v);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
