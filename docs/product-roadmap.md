# IntoFocus product roadmap

This file records approved product direction that is not yet a build task. It does not change production data, collectors, schedules, or client-facing claims.

## AI Search history and trends

Status: long-term plan. Not built.

### Historical calendar

- Give the user a calendar that marks dates with published AI Search runs.
- Selecting a date opens that exact immutable run: its prompt-set version, engines and models, completeness, errors, answers, outcomes, citations, and publication time.
- The client-facing calendar shows published runs only. Internal experimental and failed runs remain available to authorized IntoFocus operators without becoming client truth.
- A missing date means no published run. It must not be rendered as a zero or carried forward from another date.
- Calendar navigation must preserve evidence links so every historical metric can open the calls and citations behind it.

### Query win trend

- For each query, show a line graph over the period in which that exact query version was active.
- Provide **Overall** and **By engine** views. “Engine” is the correct product term: ChatGPT, Gemini, Perplexity, Claude, and similar systems are not all GPTs.
- At each published run, the overall point is Fender/Squier leads divided by resolved answers for that query across the selected engines. The by-engine view draws one line per engine from that engine's resolved answer.
- Show the numerator and denominator on hover or focus. Answers with no clear leader and provider errors stay outside the win-rate denominator and remain visible as separate coverage counts.
- A date with no resolved answer is a gap, not 0%. Do not interpolate or carry the previous point forward.
- Small samples still show their exact percentage and count, with a warning that a few additional answers could move the result sharply.
- A prompt text edit creates a new query version. Do not join materially different wording into one continuous line. The chart may show adjacent versions with a visible version boundary.
- Mark engine/model changes and prompt-set changes on the timeline so a model upgrade is not mistaken for a brand-performance change.
- Category, role, product-family, market, and prompt-set filters must use the same definitions as the current guided view.

### Data and collection prerequisites

- Keep every run, call, outcome, citation, engine, model, timestamp, prompt key, and prompt-set hash. Published runs remain immutable.
- Version prompt text and its active-from/active-through period instead of overwriting the active row.
- Store an explicit question role and catalog/category mapping for user-authored prompts; do not rely only on text classification.
- Expose a read-only historical-call view keyed by run for the dashboard. `canvas_ai_run_history` currently exposes run summaries, while the client call view exposes only the current published run.
- Establish and monitor the approved collector cadence before promising a refresh frequency to clients.
- Keep experimental runs separate from published trend data until an authorized user publishes them.

