-- AI Search truth, part 1 of 4: additive schema. Nothing is deleted or rewritten here.
-- Run model: a run is only current when explicitly published (see canvas_ai_current_run).
ALTER TABLE command.fmic_audit_runs
  ADD COLUMN IF NOT EXISTS run_kind text,
  ADD COLUMN IF NOT EXISTS run_state text,
  ADD COLUMN IF NOT EXISTS collector_version text,
  ADD COLUMN IF NOT EXISTS prompt_set_hash text,
  ADD COLUMN IF NOT EXISTS expected_calls integer,
  ADD COLUMN IF NOT EXISTS attempted_calls integer,
  ADD COLUMN IF NOT EXISTS answered_calls integer,
  ADD COLUMN IF NOT EXISTS error_calls integer,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fmic_audit_runs_run_state_check') THEN
    ALTER TABLE command.fmic_audit_runs ADD CONSTRAINT fmic_audit_runs_run_state_check
      CHECK (run_state IS NULL OR run_state IN ('running','completed','partial','failed','historical'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fmic_audit_runs_published_check') THEN
    ALTER TABLE command.fmic_audit_runs ADD CONSTRAINT fmic_audit_runs_published_check
      CHECK (NOT is_published OR (prompt_set_hash IS NOT NULL AND run_state IN ('completed','partial')));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS command.fmic_ai_prompts (
  prompt_key text PRIMARY KEY,
  prompt_text text NOT NULL,
  category character varying(60) NOT NULL,
  prompt_kind text NOT NULL CHECK (prompt_kind IN ('commercial','probe')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ground truth for probes. A probe is only ever marked confirmed against a row here.
CREATE TABLE IF NOT EXISTS command.fmic_ai_probe_facts (
  prompt_key text PRIMARY KEY REFERENCES command.fmic_ai_prompts(prompt_key),
  claim text NOT NULL,
  contradiction_pattern text NOT NULL,
  source_url text NOT NULL,
  verified_by text NOT NULL,
  verified_at timestamptz NOT NULL
);

ALTER TABLE command.fmic_ai_simulations
  ADD COLUMN IF NOT EXISTS prompt_key text,
  ADD COLUMN IF NOT EXISTS prompt_text text,
  ADD COLUMN IF NOT EXISTS prompt_kind text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS call_status text,
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS primary_brand text,
  ADD COLUMN IF NOT EXISTS material_hallucination text,
  ADD COLUMN IF NOT EXISTS hallucination_evidence text,
  ADD COLUMN IF NOT EXISTS attempt_no integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS record_origin text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fmic_ai_sim_call_status_check') THEN
    ALTER TABLE command.fmic_ai_simulations ADD CONSTRAINT fmic_ai_sim_call_status_check
      CHECK (call_status IS NULL OR call_status IN ('answered','error'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fmic_ai_sim_outcome_check') THEN
    ALTER TABLE command.fmic_ai_simulations ADD CONSTRAINT fmic_ai_sim_outcome_check
      CHECK (outcome IS NULL OR outcome IN ('fender_win','competitor_win','unresolved','error','not_scored'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fmic_ai_sim_halluc_check') THEN
    ALTER TABLE command.fmic_ai_simulations ADD CONSTRAINT fmic_ai_sim_halluc_check
      CHECK (material_hallucination IS NULL OR material_hallucination IN ('none','confirmed','suspected','historical_unverified','not_evaluated'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fmic_ai_sim_kind_check') THEN
    ALTER TABLE command.fmic_ai_simulations ADD CONSTRAINT fmic_ai_sim_kind_check
      CHECK (prompt_kind IS NULL OR prompt_kind IN ('commercial','probe'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS fmic_ai_simulations_run_sim_uq
  ON command.fmic_ai_simulations (audit_run_id, sim_id);

CREATE TABLE IF NOT EXISTS command.fmic_ai_citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES command.fmic_ai_simulations(id) ON DELETE CASCADE,
  audit_run_id uuid,
  sim_id integer,
  engine text,
  position integer NOT NULL,
  url text NOT NULL,
  domain text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fmic_ai_citations_sim_pos_uq UNIQUE (simulation_id, position)
);
CREATE INDEX IF NOT EXISTS fmic_ai_citations_run_idx ON command.fmic_ai_citations (audit_run_id);
CREATE INDEX IF NOT EXISTS fmic_ai_citations_domain_idx ON command.fmic_ai_citations (domain);

-- Only real remediation is stored. No row means no remediation.
CREATE TABLE IF NOT EXISTS command.fmic_ai_remediations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL UNIQUE REFERENCES command.fmic_ai_simulations(id) ON DELETE CASCADE,
  remediation_text text NOT NULL CHECK (length(btrim(remediation_text)) > 0),
  basis text NOT NULL,
  source text NOT NULL CHECK (source IN ('curated','reviewed_generated')),
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['fmic_ai_prompts','fmic_ai_probe_facts','fmic_ai_citations','fmic_ai_remediations'] LOOP
    EXECUTE format('ALTER TABLE command.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON command.%I', t || '_authenticated_select', t);
    EXECUTE format('CREATE POLICY %I ON command.%I FOR SELECT TO authenticated USING (true)', t || '_authenticated_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON command.%I', t || '_service_role_all', t);
    EXECUTE format('CREATE POLICY %I ON command.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t || '_service_role_all', t);
    EXECUTE format('REVOKE ALL ON command.%I FROM PUBLIC, anon', t);
    EXECUTE format('GRANT SELECT ON command.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON command.%I TO service_role', t);
  END LOOP;
END $$;