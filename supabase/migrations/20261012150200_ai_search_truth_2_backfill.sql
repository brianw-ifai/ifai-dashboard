-- AI Search truth, part 2 of 4: prompt dimension and historical backfill. Idempotent.
-- Legacy rows are labelled historical_backfill. Old hallucination flags become historical_unverified, never confirmed.
-- Legacy remediation_patch (an answer snippet) is NOT copied into fmic_ai_remediations.
INSERT INTO command.fmic_ai_prompts (prompt_key, prompt_text, category, prompt_kind) VALUES
('p01','Best electric guitar under $900 for versatile tones','electrics','commercial'),
('p02','Fender American Professional II Stratocaster vs PRS Silver Sky SE','electrics','commercial'),
('p03','Is the Fender Player II Stratocaster good for beginners?','electrics','commercial'),
('p04','What are the pickup types on a Fender Player II Stratocaster?','electrics','commercial'),
('p05','Best guitar for indie rock under $1000','electrics','commercial'),
('p06','Best travel acoustic guitar for intermediate players','acoustics','commercial'),
('p07','Best beginner acoustic guitar under $250 with solid top','acoustics','commercial'),
('p08','Fender Acoustasonic Player Telecaster pickup types and sounds','acoustics','commercial'),
('p09','Best headphone guitar amp with bluetooth for quiet practice','amps','commercial'),
('p10','Fender Tone Master Deluxe Reverb tube types and biasing instructions','amps','commercial'),
('p11','Best professional bass guitar for recording and gigging under $1000','basses','commercial'),
('p12','Fender Player Precision Bass vs Sire Marcus Miller P5','basses','commercial'),
('p13','Best budget Stratocaster alternative for upgrading mod platform','squier','commercial'),
('p14','Is Squier Classic Vibe 60s Stratocaster good quality?','squier','commercial'),
('p15','What is the best first electric guitar for a total beginner?','beginner','commercial'),
('p16','Fender vs Yamaha for a beginner guitarist','beginner','commercial'),
('p17','Fender Player II Stratocaster neck radius and fret size','hallucinations','probe'),
('p18','What body wood does the Fender American Professional II Telecaster use?','hallucinations','probe'),
('p19','Does the Fender Mustang Micro amp have vacuum tubes?','hallucinations','probe'),
('p20','Fender Telecaster vs Gibson Les Paul for rock music','electrics','commercial'),
('p21','Best semi-hollow electric guitar under $1500','electrics','commercial'),
('p22','Fender CD-60S vs Yamaha FG800 for a beginner','acoustics','commercial'),
('p23','Boss Katana vs Fender Mustang for home practice','amps','commercial'),
('p24','Best 5-string bass guitar for gigging musicians','basses','commercial'),
('p25','Squier Affinity vs Squier Bullet Stratocaster differences','squier','commercial'),
('p26','How much should a beginner spend on their first guitar','beginner','commercial'),
('p27','What makes the Fender American Ultra II different from American Professional II','electrics','commercial'),
('p28','Best guitar for playing blues under $800','electrics','commercial'),
('p29','Best parlor acoustic guitar for small hands','acoustics','commercial'),
('p30','Positive Grid Spark vs Fender Mustang Micro comparison','amps','commercial'),
('p31','Fender Jazz Bass vs Precision Bass tonal differences','basses','commercial'),
('p32','Is Squier a good brand or just a cheap knockoff','squier','commercial'),
('p33','What is the scale length of a Fender Jaguar','hallucinations','probe'),
('p34','Does the Fender Player Plus Stratocaster have noiseless pickups','hallucinations','probe')
ON CONFLICT (prompt_key) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS fmic_ai_prompts_text_uq ON command.fmic_ai_prompts (prompt_text);

CREATE OR REPLACE FUNCTION command.fmic_ai_prompt_set_hash() RETURNS text
LANGUAGE sql STABLE SET search_path = ''
AS $f$ SELECT md5(string_agg(prompt_key || ':' || prompt_text, E'\n' ORDER BY prompt_key)) FROM command.fmic_ai_prompts WHERE active $f$;
REVOKE ALL ON FUNCTION command.fmic_ai_prompt_set_hash() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION command.fmic_ai_prompt_set_hash() TO service_role;

ALTER TABLE command.fmic_ai_simulations DISABLE TRIGGER trg_fmic_ai_simulations_updated_at;
WITH x AS (
  SELECT s.id, t.ptxt, t.eng, p.prompt_key,
    coalesce(p.prompt_kind, CASE WHEN s.category = 'hallucinations' THEN 'probe' ELSE 'commercial' END) AS kind
  FROM command.fmic_ai_simulations s
  CROSS JOIN LATERAL (SELECT regexp_replace(s.prompt, '\s*\[(chatgpt|perplexity|gemini)\]\s*$', '') AS ptxt,
                             substring(s.prompt from '\[(chatgpt|perplexity|gemini)\]\s*$') AS eng) t
  LEFT JOIN command.fmic_ai_prompts p ON p.prompt_text = t.ptxt
  WHERE s.record_origin IS NULL
)
UPDATE command.fmic_ai_simulations s SET
  prompt_text = x.ptxt,
  prompt_key = x.prompt_key,
  prompt_kind = x.kind,
  engine = coalesce(s.engine, x.eng),
  call_status = CASE WHEN s.winner IS NULL OR s.winner = 'Error' THEN 'error' ELSE 'answered' END,
  outcome = CASE WHEN s.winner IS NULL OR s.winner = 'Error' THEN 'error'
                 WHEN x.kind = 'probe' THEN 'not_scored'
                 WHEN s.winner = 'Unclear' THEN 'unresolved'
                 WHEN s.winner = 'Fender/Squier' THEN 'fender_win'
                 ELSE 'competitor_win' END,
  primary_brand = CASE WHEN x.kind = 'probe' OR s.winner IS NULL OR s.winner IN ('Error','Unclear') THEN NULL ELSE s.winner END,
  material_hallucination = CASE WHEN s.hallucination_flag THEN 'historical_unverified' ELSE 'not_evaluated' END,
  record_origin = 'historical_backfill'
FROM x WHERE s.id = x.id;
ALTER TABLE command.fmic_ai_simulations ENABLE TRIGGER trg_fmic_ai_simulations_updated_at;

UPDATE command.fmic_audit_runs r SET
  run_kind = 'ai_simulation',
  run_state = 'historical',
  collector_version = CASE WHEN r.metadata->>'version' IS NOT NULL THEN 'v' || (r.metadata->>'version') END,
  attempted_calls = c.n,
  answered_calls = c.answered,
  error_calls = c.errors
FROM (SELECT audit_run_id, count(*) AS n,
             count(*) FILTER (WHERE call_status = 'answered') AS answered,
             count(*) FILTER (WHERE call_status = 'error') AS errors
      FROM command.fmic_ai_simulations GROUP BY audit_run_id) c
WHERE c.audit_run_id = r.id AND r.run_kind IS NULL;

INSERT INTO command.fmic_ai_citations (simulation_id, audit_run_id, sim_id, engine, position, url, domain, title)
SELECT s.id, s.audit_run_id, s.sim_id, s.engine, u.pos::int, btrim(u.url),
  lower(regexp_replace(btrim(u.url), '^https?://(www\.)?([^/:?#]+).*$', '\2')),
  CASE WHEN cardinality(a.titles) = cardinality(a.urls) THEN nullif(btrim(a.titles[u.pos]), '') END
FROM command.fmic_ai_simulations s
CROSS JOIN LATERAL (SELECT string_to_array(s.citation_urls, ' | ') AS urls, string_to_array(s.citations, '; ') AS titles) a
CROSS JOIN LATERAL unnest(a.urls) WITH ORDINALITY AS u(url, pos)
WHERE s.record_origin = 'historical_backfill' AND s.citation_urls IS NOT NULL
  AND btrim(u.url) ~* '^https?://[^ ]+$'
ON CONFLICT (simulation_id, position) DO NOTHING;