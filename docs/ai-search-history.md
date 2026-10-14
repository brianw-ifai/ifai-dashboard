# AI Search history

Status: repository contract only. The migration `supabase/migrations/20261014190000_ai_search_history_views.sql` is not applied. Do not apply it, and do not publish a run, until Brian sends this sentence:

> I approve applying supabase/migrations/20261014190000_ai_search_history_views.sql so the October 11 run 7c3e9f52-4b1a-4d8e-9a6f-2e5d81b0c4a7 and the unpublished October 12 run e775ee16-ec5b-45b0-8918-579181b44aff become readable in the history views. Do not publish the unpublished run.

## What can be reviewed before that approval

The default dashboard stays on the published October 12 run `b28d6086-65f3-4d12-a775-ea724ea58f22`. Its headline rates stay 56.5% unbranded discovery and 95.7% branded consideration.

`?ai-history=fixture` opens a copy of the three stored review runs. The copy is labeled in the panel: it is not a live database read. The calendar, the two rates, the scoring-method marker, the two missing October 11 calls, and the citation caution on the earlier October 12 run can be inspected from that copy. Current and Return to current go back to the live published run. The map stays on that published run.

On the live dashboard, the calendar already lists the same three runs because `canvas_ai_run_history` exposes their summaries. Choosing a run other than the current one says call-level history is unavailable and does not show a zero. All time says the same until the views exist.

## Review set

Re-queried from `public.canvas_ai_run_history` on 2026-10-14: 468 rows. Collectors: 396 v8, 1 v9, 1 v10, 2 v11, and 68 with no collector. The history calendar offers only these three. October 11 is the only run that day. October 12 has these two and no other fragment.

| Day | Run | What the rows say |
| --- | --- | --- |
| 2026-10-11 | `7c3e9f52-4b1a-4d8e-9a6f-2e5d81b0c4a7` | v10, unpublished, historical. 100 answered calls and no error rows. Two calls were not stored: p15 on Perplexity, “What is the best first electric guitar for a total beginner?”, and p24 on ChatGPT, “Best 5-string bass guitar for gigging musicians” Those stay gaps. Six rows are `historical_unverified`. Outcomes were backfilled from the original winner label. 468 citation rows. The copy records the count and does not list each URL. |
| 2026-10-12 earlier | `e775ee16-ec5b-45b0-8918-579181b44aff` | v11, unpublished, partial. Same 102 question-engine pairs and the same prompt text as the published run. Simulation rows: 73 answered, 29 errors. The audit-run counter still says 72 and 30; the history view counts the rows and does not update that counter. 2 citation rows. The panel says those citations were mostly not stored and are not evidence that the citation ecosystem changed. |
| 2026-10-12 published | `b28d6086-65f3-4d12-a775-ea724ea58f22` | The current dashboard run. Partial v11, same prompt text, 75 answered, 27 errors, 243 citation rows. Published 2026-10-12. |

October 11 is labeled “Original winner labels.” Both October 12 runs are labeled “Mention-based scoring.” The trend may connect them. The scoring change is marked and does not break the line. A later change to the stored question wording still breaks the line. This review set does not need that boundary: the stored wording matches the current prompt set.

The earlier October 12 run can contribute to both rate trends. It is not published and it is not the current run.

Every other historical or fragment run stays out of the calendar and the trend.

## Trusted history after approval

A future published run is readable when it is published, `completed` or `partial`, collector `v11`, has a prompt-set hash, attempted every expected call, and has no `historical_backfill` or `historical_unverified` row. The two runs named in the migration are readable in addition to that rule. The client uses the same `questionRole()` classifier, denominators, small-sample labels, and drill-downs as the current run. The SQL views do not store a second role.

`prompt_key` is the logical question. The query version is that key plus the exact stored prompt text. Matching wording is one question set even when the older run has no prompt-set hash.

## Authentication

The history views grant `SELECT` to `anon` and `authenticated`, the same as the existing canvas views. They do not grant insert, update, or delete. They do not change stored rows or `canvas_ai_current_run`.
