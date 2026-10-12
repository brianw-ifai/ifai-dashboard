-- AI Search truth, part 5: verified probe facts (pending Brian review) and read-only grants on the canvas AI views. Idempotent.
-- p18 (Telecaster body wood) intentionally has NO fact: fender.com shows different woods by model and region, so p18 stays not_evaluated.
INSERT INTO command.fmic_ai_probe_facts (prompt_key, claim, contradiction_pattern, source_url, verified_by, verified_at)
SELECT v.prompt_key, v.claim, v.pat, v.source_url, v.verified_by, now()
FROM (VALUES
 ('p17', 'Player II Stratocaster fingerboard radius is 9.5 inches (241 mm) with 22 medium jumbo frets.', 'x', 'https://www.fender.com/products/player-ii-stratocaster', 'Worker 15 from the fender.com product page; pending Brian review'),
 ('p19', 'Fender lists Mustang Micro as a digital headphone amp with onboard DSP and no tube section.', 'x', 'https://www.fender.com/products/mustang-micro', 'Worker 15 from the fender.com product page; pending Brian review'),
 ('p33', 'Fender Jaguar scale length is 24 inches (610 mm), shorter than the 25.5 inch Fender standard.', 'x', 'https://www.fender.com/articles/behind-the-scenes/from-surf-to-shoegaze-a-history-of-the-jaguar', 'Worker 15 from the fender.com article; pending Brian review'),
 ('p34', 'Player Plus Stratocaster uses Player Plus Noiseless Strat pickups.', 'x', 'https://au.fender.com/products/player-plus-stratocaster-left-handed', 'Worker 15 from the fender.com regional page (US page not found); pending Brian review')
) AS v(prompt_key, claim, pat, source_url, verified_by)
WHERE NOT EXISTS (SELECT 1 FROM command.fmic_ai_probe_facts f WHERE f.prompt_key = v.prompt_key);

UPDATE command.fmic_ai_probe_facts SET contradiction_pattern = CASE prompt_key
  WHEN 'p17' THEN $re$player ii[^.]{0,80}\b(12|7\.25)\s*("|”|-?inch)\s*(fingerboard |fretboard |neck )?radius$re$
  WHEN 'p19' THEN $re$mustang micro(?![^.]*\b(no|not|without|doesn.?t|does not)\b)[^.]{0,60}\b(has|have|uses|contains|includes|features)\s+(a\s+|real\s+|actual\s+)?(vacuum\s+)?tubes?\b$re$
  WHEN 'p33' THEN $re$jaguar[^.]{0,60}scale length[^.]{0,20}\b(is|of|at)\s*(about\s*)?25\.5$re$
  WHEN 'p34' THEN $re$player plus[^.]{0,80}(does not|doesn.?t|do not|don.?t|lacks?|without|\bno)\s[^.]{0,40}noiseless$re$
  ELSE contradiction_pattern END
WHERE prompt_key IN ('p17','p19','p33','p34');

-- Canvas AI views are read-only for anon and authenticated.
DO $$ DECLARE v text; BEGIN
  FOREACH v IN ARRAY ARRAY['canvas_ai_current_run','canvas_ai_probes','canvas_ai_citations','canvas_ai_run_history','canvas_ai_simulations','canvas_ai_category','canvas_ai_engine','canvas_competitor_sov','canvas_freshness'] LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM anon, authenticated', v);
  END LOOP;
END $$;
NOTIFY pgrst, 'reload schema';