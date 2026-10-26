# Project Manager briefing

This note is for Brian Magazu. It is the rule for starting the next Project Manager agent. A Project Manager that opens this file is reading the briefing rule. This file assigns no worker label and replaces no handoff.

Written Monday, October 26, 2026 (America/New_York), after PM9 and PM10.

## What to change

The note pasted into the Project Manager's first message has been a build log. PM9 received about 10,000 characters. PM10 received about 21,000 characters, with "What to do first" near line 151. Both agents labeled their own commits as workers. Neither started a separate worker agent. Both left the Functional Design Document and the Technical Design Document on **Documentation version: 8.7** through the work they shipped.

PM9 built 9.1 through 9.5 on pull request 46 and wrote the documentation closeout into the PM10 handoff. PM10 published the approved preview on October 26, 2026 and said the docs were still on 8.7. It began a doc edit after a later request. At 1:35 PM ET on October 26, 2026, the public text export of both Google Docs still opened with **Documentation version: 8.7**.

The opening context is what the agent follows. A build log, a long "leave the docs alone until approval" rule, and a recommended batch written as this agent's own work produce an agent that implements and waits on the docs. A worker label on the Project Manager's own commit satisfies the word "worker" with one agent in the thread.

## How to start the next Project Manager

Send one sentence:

> You are Project Manager 11. Read `docs/pm-handoff.md` and do the first unchecked job.

Keep the prose short. The status table is allowed to make the file longer. Point at the file. Leave the build log out of the chat paste.

When PM10's session is closed, add this first line to `docs/pm8-handoff.md`, `docs/pm9-handoff.md`, and `docs/pm10-handoff.md`:

> Archive. Do not follow. The live handoff is `docs/pm-handoff.md`.

One live handoff. Three files that each open with "You are Project Manager N" will be followed by whichever one a search hits.

## The two jobs, in this order

These are the first lines of `docs/pm-handoff.md`.

1. **Docs first.** If approved work is missing from the Functional Design Document and the Technical Design Document, update those docs before any other action. Set the first line to the last approved worker label. Change only the statuses named in the handoff. Add a changelog row with the worker label, the pull request, and the commit. Reply with the new first line of each doc. "I approve," "publish," and "ship it" are that trigger. Merging, the next worker, and the next handoff wait until that reply is sent.
2. **Then delegate.** When Brian asks for new work, write one brief per task and start a separate cloud agent for each brief. A worker label belongs on a commit when a different agent made that commit. When the Project Manager is about to edit a product file, it stops and writes the brief.

## Role card

Copy the block below into `docs/pm-handoff.md` when you start the next Project Manager. Re-read the first line of both Google Docs at send time and replace every fact in the Current state section. The 8.7 line below was true at 1:35 PM ET on October 26, 2026. It is a value to verify, and it will be wrong the moment the closeout lands.

```
# PM handoff

You are Project Manager 11. You do not write product code.

Two jobs, in this order. Do the first unchecked one.

1. Docs. Approved work through worker 10.5 is on main and is missing from the
   Functional Design Document and the Technical Design Document. Update both
   before any other action. Set the first line to: Documentation version: 10.5.
   Change only the statuses in the table below. Add a changelog row for each
   worker with its pull request and commit. Reply with the new first line of
   each doc. Then check this job off.
2. Delegate. When Brian asks for new work, write one worker brief and start a
   separate cloud agent for that brief. Worker labels are 11.1, 11.2, in
   delegation order. A worker label belongs on a commit when a different agent
   made that commit. If you are about to edit a product file, stop and write
   the brief.

"I approve," "publish," and "ship it" mean: run job 1 for the work just
accepted. Product title stays v6.6. Preserve every DECISION and LATER item
unless Brian changes it. X-20 stays TARGET.

## Current state

Re-read before acting. Confirmed at <time, America/New_York>:

- FDD: https://docs.google.com/document/d/1PoeiXKR2twOaz_JcRN0e4ZQkUCuDD5qnnyrlt6ygkeU/edit
- TDD: https://docs.google.com/document/d/1K6-ghhSnJZcrch81DDhmHXXYU0pSF7tOGR9S9jiCUjk/edit
- First line of both docs: Documentation version: 8.7
- Approved code is on main. Pull request 47 merged into pull request 46.
  Pull request 46 merged at 11:55 AM ET on October 26, 2026.
- Preview of main: the production Netlify site Brian uses for this repo.

## Statuses to set in the 10.5 closeout

Every status cell is filled before this file is committed. If a cell is blank, stop and ask Brian. Status words: CURRENT, REFINE, TARGET, DECISION, LATER.

| Worker | Pull request | Commit | FDD id | Status after closeout | One sentence |
| --- | --- | --- | --- | --- | --- |
| 9.1 | 46 | 5a2b030 | C-04 | <status> | Why not Fender, from stored answers and cited pages. |
| 9.2 | 46 | 5a2b030 | X-03 | <status> | N-of-M figure leads on Run Summary and Competitive Radar. |
| 9.3 | 46 | ee4d228, 456af66 | X-23, H-02 | <status> | Hover explainers removed from the six main bubbles. |
| 9.4 | 46 | 0cfb089, 455579b | X-22 | <status> | Signal slots on hover or focus; outside click closes them. |
| 9.5 | 46 | ce1bba9 | <id> | <status> | AI Search Visibility hero percentage, the example for later bubbles. |
| 10.1 | 47 | c26a84b, e8e23c3 | <id> | <status> | Run Summary trend chart back on top, and collapsible. |
| 10.2 | 47 | b322800 | <id> | <status> | Why not Fender: one plain sentence per loss. |
| 10.3 | 47 | 79e339c, c53da2d | <id> | <status> | Satellites grow to fit hero text. |
| 10.4 | 47 | 62be134 | <id> | <status> | Hub slots drop self-evident qualifiers. |
| 10.5 | 46 | d9911c9 | <id> | <status> | Spoke header drops the badge pill and the duplicate title. |

## Already approved

The map stays on the published run. The shared date pill is the only period label. Cited pages are associations. Dollar figures stay analyst estimates. The client portal says nothing about IntoFocus fees.

## Next product question

One sentence Brian already named. The brief for it is written when he asks. Leave the implementation in the commit he would point a worker at.

## Held

Pointer only: A-06, A-02, R-06, R-11, A-04, A-07, N-07, LATER items, and the dollar formulas. Detail lives in the FDD.
```

Fill every `<status>` and `<id>` before you copy the block into `docs/pm-handoff.md`. The Project Manager then edits the Google Docs from that table and does not choose the rows itself.

On October 26, 2026, in the PM10 thread, you set the closeout label at 10.5: the documentation version matches the last worker, and later workers stay unnamed until they exist. Confirm that label in the thread before sending.

Pull request 47's title groups its batch as 10.1 through 10.4: trend chart on top, plain Why not Fender, bubbles that fit their text, and no self-evident qualifiers. The commit messages do not carry those numbers, so the worker column above is that grouping, with 10.5 on the spoke-header commit `d9911c9`. Commits `731ad1c` and `3539b10` adjust the map hover slide. Attach each one to the worker that owns that behavior, or add a row.

## Worker brief

The brief is the Project Manager's work product. It is the only place a slice's implementation detail goes. Start the worker with this text and nothing from the role card's history.

```
Worker 11.1

Outcome: <one sentence of what the screen will do>

Acceptance:
- <check a person can see>
- <check>
- <check>

Out of scope: <the neighboring bubbles, docs, and cleanup>

Branch from: main

Constraints for this slice:
- <one>
- <two>
- <three>

Report the preview URL, the commit, and any acceptance check that failed.
```

Durable copy rules already live in `AGENTS.md` and `.cursor/rules/`. Workers inherit them: no em dash in client UI, definition tooltips use `ifai-term` data attributes, dollar figures stay analyst estimates, the client portal says nothing about fees. Those rules stay out of the role card and out of the brief unless the slice can break one of them.

## What stays out of the role card

The next Project Manager can do both jobs without any of the following. Each item belongs in the commit, in the FDD, or in the one worker brief that can regress it.

- Component names, CSS classes, pixel widths, and the story of a bug that was already fixed
- Run UUIDs, scoring-method notes, and the dev-server port
- The unit-test command and the list of known end-to-end failures
- Preview links for every tab
- The previous handoff, pasted again
- A build spec for the next bubble, including locked red/yellow/green bands

The 9.5 hero-value table is a good thing for the worker who extends that pattern to read. Preloading it into the Project Manager turns the next number (11.1) into a commit label for whatever feedback arrives later. PM10 used 10.1 through 10.5 that way.

## Before you send the kickoff

- PM10's session is finished, or this card is for a new chat that will not share PM10's thread.
- The first line of both Google Docs has been read in the last few minutes and copied into Current state.
- Job 1 names the documentation version and the status table. The Project Manager does not invent which rows move.
- The prose of the role card stays short. The status table is the rest of the file.
- The kickoff is the one sentence at the top of this note.
- The chat paste is that sentence. The card lives in `docs/pm-handoff.md`.
