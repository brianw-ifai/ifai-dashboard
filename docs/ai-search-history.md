# AI Search history

Status: repository contract only. The migration `supabase/migrations/20261014190000_ai_search_history_views.sql` is not applied to production. Do not apply it without Brian's explicit approval.

## What the live views can do today

`public.canvas_ai_run_history` lists run summaries, including unpublished and development runs. `public.canvas_ai_current_run` and the call, probe, and citation views still expose one published run. The history control reads the summary list for the calendar. Selecting another live run cannot load its calls until the new views exist, and the panel says so instead of showing a zero.

Re-queried at 2026-10-14 19:27 UTC: 468 rows in `canvas_ai_run_history`. One trustworthy published run: `b28d6086-65f3-4d12-a775-ea724ea58f22`, partial, v11, prompt set `7336a48b5f1b2e7be7136319aee3d454`, 102 expected and attempted, 75 answered, 27 errors, published 2026-10-12. One unpublished v11 sibling used the same hash. The other rows are not a trend.

## Trusted history

A run is trusted when it is published, `completed` or `partial`, collector `v11`, has a prompt-set hash, and `attempted_calls` equals `expected_calls`. Runs that contain `record_origin = historical_backfill` or `material_hallucination = historical_unverified` are excluded. The client uses the same `questionRole()` classifier as the current run. The SQL views do not store a second role.

`prompt_key` is the logical question. The query version is that key plus the exact stored prompt text. `prompt_set_hash` is the battery for the run. A wording change or a battery change breaks the line and lists the questions on each side.

## Authentication limit

The existing canvas views grant `SELECT` to both `anon` and `authenticated`. There is no separate internal role the browser can use. Because of that, this change does not add a public view of legacy call text. The "Include legacy test runs" control can show summary fields that `canvas_ai_run_history` already exposes. Full legacy call inspection is fixture-only (`?ai-history=fixture`).

## Fixtures

`?ai-history=fixture` supplies several trustworthy sample runs so the calendar, the two rates, the engine breakdown, an exact question version, and a question-set boundary can be reviewed before more weekly runs exist. The map and the Current action stay on the live published run.
