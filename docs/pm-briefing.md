# Project Manager briefing

This note is for Brian Magazu. It is the rule for starting a Project Manager and for leaving it running. A Project Manager that opens this file is reading the briefing rule. This file assigns no worker label and replaces no handoff.

Written Monday, October 26, 2026 (America/New_York), after PM9 and PM10. Revised the same day so the Project Manager chooses the next small batch from the Functional Design Document.

## What you do

You approve work, and you occasionally hand off to a new Project Manager. You do not edit the handoff between batches.

Two approvals, each one sentence:

- **"Go ahead"** accepts the batch the Project Manager just proposed. It then delegates that batch to workers.
- **"I approve," "publish," or "ship it"** accepts the preview. The Project Manager updates the Functional Design Document and the Technical Design Document before it does anything else.

**"Hand off"** starts a fresh Project Manager. The outgoing one rewrites the State section. You send the new one this sentence:

> Continue as Project Manager. Read `docs/pm-handoff.md` and do the first job.

Copy the role card into `docs/pm-handoff.md` once, at the first handoff after PM10's session is closed. After that, only a Project Manager writes the file, and only the State section changes.

When PM10's session is closed, add this first line to `docs/pm8-handoff.md`, `docs/pm9-handoff.md`, and `docs/pm10-handoff.md`:

> Archive. Do not follow. The live handoff is `docs/pm-handoff.md`.

## Why the card stays standing

PM9 and PM10 each received the previous handoff as a long paste (about 10,000 and 21,000 characters). Both labeled their own commits as workers. Neither started a separate worker agent. Both left the docs on **Documentation version: 8.7**. At 1:35 PM ET on October 26, 2026, the public text export of both Google Docs still opened on 8.7.

A card that lists the next batch, the status table, and the last build log has to be rewritten every time you approve something. The Project Manager then follows that paste and implements it. The standing card below gives it the job of reading the FDD, proposing a small batch, and writing the doc closeout when you approve the preview.

## The role card

Copy this block into `docs/pm-handoff.md` once. Leave the State section as written for that first copy. The Project Manager replaces State only when you say to hand off.

```
# PM handoff

You are the current Project Manager. You do not write product code.

Read the Functional Design Document and the Technical Design Document,
then the State section below. If State and the Google Docs disagree, the
Google Docs win. Report the documentation version, then do the first job
that applies.

1. Close the docs. If work you can see on the approved preview is missing
   from the docs, propose the closeout in one short table: worker, FDD id,
   status you will set, one sentence. Wait for "go ahead." Then update both
   docs. Set the first line to the last approved worker label. Add a
   changelog row with the worker, the pull request, and the commit. Reply
   with the new first line of each doc.
2. Choose the next small batch from the FDD, using the rules below. Propose
   it in a few sentences. Wait for "go ahead." Then write one worker brief
   and start a separate cloud agent for each worker.
3. On "hand off," replace only the State section, keep it under 25 lines,
   and stop.

"I approve," "publish," and "ship it" on a preview mean job 1 for that
preview, using the statuses in the batch he already accepted. Product title
stays v6.6. Preserve every DECISION and LATER item unless he changes it.
X-20 stays TARGET.

A worker label belongs on a commit when a different agent made that commit.
If you are about to edit a product file, stop and write the brief.

## How to choose the next batch

Read the FDD after the doc closeout. A batch is one to three workers and
one preview. Each worker changes one thing a person can see.

Prefer, in order:

1. An open REFINE item whose acceptance is already partly met on screen.
2. A TARGET item that continues the last approved screen.
3. A TARGET item he named in this thread.

Skip DECISION items until he decides. Skip LATER items. Skip the held list.
If he names a change himself, that change is the batch. Propose the worker
split and wait. If nothing is a clear next step, ask him one question.

The proposal names each worker label, the FDD id, what will be visible,
what status that row will move to if he approves the preview, and what you
are leaving out. Worker labels continue from State. The next Project
Manager's workers use the next whole number.

## Standing rules

The map stays on the published run. The shared date pill is the only period
label. Cited pages are associations. Dollar figures stay analyst estimates.
The client portal says nothing about IntoFocus fees.

Held, until he says otherwise: A-06, A-02, R-06, R-11, A-04, A-07, N-07,
LATER items, and the dollar formulas. Detail lives in the FDD.

- FDD: https://docs.google.com/document/d/1PoeiXKR2twOaz_JcRN0e4ZQkUCuDD5qnnyrlt6ygkeU/edit
- TDD: https://docs.google.com/document/d/1K6-ghhSnJZcrch81DDhmHXXYU0pSF7tOGR9S9jiCUjk/edit

## State

Replace this whole section on handoff. Keep it under 25 lines. The Google
Docs win if this block is stale.

- You are PM11. Next feature workers are 11.1, 11.2, 11.3.
- At 1:35 PM ET on October 26, 2026, both docs opened on Documentation
  version: 8.7. Re-read the first line before acting.
- He approved the preview and it is on main. Pull request 47 merged into
  pull request 46. Pull request 46 merged at 11:55 AM ET on October 26.
- He set the closeout label at 10.5. Use 10.1 through 10.4 for the four
  themes in pull request 47's title, in that order: trend chart, plain Why
  not Fender, bubbles that fit their text, no self-evident qualifiers.
  10.5 is commit d9911c9, the spoke header. Hover-slide commits 731ad1c and
  3539b10 belong with the bubble work.
- First job is the 10.5 doc closeout if the first line is still behind main.
  Propose the statuses from the FDD. Wait for "go ahead." Then edit the docs.
- After that, propose the next small batch from the FDD.
```

## Worker brief

The brief is what a worker receives. It is the only place a slice's implementation detail goes. The Project Manager writes a new one for each worker. You do not.

```
Worker 11.1

Outcome: <one sentence of what the screen will do>

Acceptance:
- <check a person can see>
- <check>
- <check>

Out of scope: <the neighboring work, the docs, and cleanup>

Branch from: main

FDD id: <id>
Status this earns if the preview is approved: <CURRENT or REFINE>

Constraints for this slice:
- <one>
- <two>

Report the preview URL, the commit, and any acceptance check that failed.
```

Durable copy rules already live in `AGENTS.md` and `.cursor/rules/`. Workers inherit them: no em dash in client UI, definition tooltips use `ifai-term` data attributes, dollar figures stay analyst estimates, the client portal says nothing about fees. Repeat one of those in the brief only when this slice can break it.

## What stays out of the handoff

The State section is a pointer. It stays under 25 lines because a longer one becomes the next build log. Leave these out of `docs/pm-handoff.md`:

- Component names, CSS classes, pixel widths, and the story of a bug already fixed
- Run UUIDs, scoring-method notes, and the dev-server port
- The unit-test command and the list of known end-to-end failures
- A link to every tab
- The previous handoff, pasted again
- The red/yellow/green bands and any other build spec for a later bubble

The worker who extends the 9.5 hero-value pattern reads that commit. The Project Manager proposes the batch and names the FDD id. PM10 turned a preloaded 10.1 into its own commit labels when later feedback was a different batch.

## Before the first kickoff

- PM10's session is finished.
- `docs/pm-handoff.md` is the role card above, copied once.
- The three older handoffs open with the archive line.
- The chat paste is the one kickoff sentence.
