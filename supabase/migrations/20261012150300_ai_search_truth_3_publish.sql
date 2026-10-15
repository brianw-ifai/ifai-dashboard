-- AI Search truth, part 3 of 4: publish function and integrity guards. Idempotent.
-- A run becomes current only by command.fmic_ai_publish_run(run_id). A published run is immutable.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fmic_ai_sim_confirmed_needs_evidence') THEN
    ALTER TABLE command.fmic_ai_simulations ADD CONSTRAINT fmic_ai_sim_confirmed_needs_evidence
      CHECK (material_hallucination IS DISTINCT FROM 'confirmed' OR length(btrim(coalesce(hallucination_evidence, ''))) > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION command.fmic_ai_block_published_edit() RETURNS trigger
LANGUAGE plpgsql SET search_path = ''
AS $f$
DECLARE rid uuid;
BEGIN
  rid := CASE WHEN TG_OP = 'DELETE' THEN OLD.audit_run_id ELSE NEW.audit_run_id END;
  IF rid IS NOT NULL AND EXISTS (SELECT 1 FROM command.fmic_audit_runs WHERE id = rid AND is_published) THEN
    RAISE EXCEPTION 'run % is published and immutable', rid;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $f$;

DROP TRIGGER IF EXISTS trg_fmic_ai_sim_published_immutable ON command.fmic_ai_simulations;
CREATE TRIGGER trg_fmic_ai_sim_published_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON command.fmic_ai_simulations
  FOR EACH ROW EXECUTE FUNCTION command.fmic_ai_block_published_edit();

CREATE OR REPLACE FUNCTION command.fmic_ai_publish_run(p_run_id uuid) RETURNS void
LANGUAGE plpgsql SET search_path = ''
AS $f$
DECLARE r command.fmic_audit_runs%ROWTYPE; n integer;
BEGIN
  SELECT * INTO r FROM command.fmic_audit_runs WHERE id = p_run_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'run % not found', p_run_id; END IF;
  IF r.is_published THEN RETURN; END IF;
  IF r.run_state IS NULL OR r.run_state NOT IN ('completed', 'partial') THEN
    RAISE EXCEPTION 'run % has run_state %, only completed or partial runs can be published', p_run_id, r.run_state;
  END IF;
  IF r.prompt_set_hash IS DISTINCT FROM command.fmic_ai_prompt_set_hash() THEN
    RAISE EXCEPTION 'run % prompt_set_hash does not match the active prompt set', p_run_id;
  END IF;
  SELECT count(*) INTO n FROM command.fmic_ai_simulations WHERE audit_run_id = p_run_id;
  IF r.expected_calls IS NULL OR r.attempted_calls IS DISTINCT FROM n OR n = 0 THEN
    RAISE EXCEPTION 'run % call counts do not reconcile (attempted %, rows %)', p_run_id, r.attempted_calls, n;
  END IF;
  UPDATE command.fmic_audit_runs SET is_published = true, published_at = now() WHERE id = p_run_id;
END $f$;

REVOKE ALL ON FUNCTION command.fmic_ai_block_published_edit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION command.fmic_ai_publish_run(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION command.fmic_ai_publish_run(uuid) TO service_role;