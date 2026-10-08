# Current dashboard end-to-end baseline before the run

Suite: `e2e/*.spec.ts` against `/dashboard` at commit 30599e6 (HEAD of main when the dashboard-v2 worktree was created), run twice on 2026-10-08 on this machine with the installed Chrome, port 3111, live production reads. Both runs gave the same result: 43 passed, 19 failed. The failures are deterministic and exist before any dashboard-v2 code is on the page, so the pass condition for this project is that the same 43 pass and the same 19 fail after the run. The failing specs expect labels and element ids the committed code does not have (for example the metric widget "Featured Offers Suppressed", the node title "Strategy Roadmap" in the deep-link spec, and `#simulation-list .action-card`); the main working tree's uncommitted work appears to be where those were changing.

Failing before the run (19):

- e2e/command-center.spec.ts:52:7 › command center › work can be assigned and survives a reload
- e2e/dashboard-deep-link.spec.ts:3:5 › opens a spoke from a shared dashboard URL
- e2e/guided-tour.spec.ts:127:7 › tour spotlight › the lit area never sits under the tour card
- e2e/guided-tour.spec.ts:145:7 › tour spotlight › the panel gets out of the way for the duration
- e2e/guided-tour.spec.ts:41:7 › guided tour › abandoning the tour leaves a resume offer in the header
- e2e/guided-tour.spec.ts:58:7 › guided tour › returning to the map overview brings back the guided tour launcher
- e2e/guided-tour.spec.ts:71:7 › guided tour › finishing the tour clears the resume offer
- e2e/metric-widgets.spec.ts:4:7 › configurable metric widgets › starts with three decision signals and spoke-derived categories
- e2e/panel-interactions.spec.ts:23:7 › simulation filters › no filter relies on an undefined global
- e2e/panel-interactions.spec.ts:31:7 › simulation filters › the active chip tracks the selection
- e2e/panel-interactions.spec.ts:39:7 › prompt watchlist › starring builds a per-viewer watchlist that survives a reload
- e2e/panel-interactions.spec.ts:55:7 › prompt watchlist › an empty watchlist says how to fill it
- e2e/panel-interactions.spec.ts:61:7 › prompt watchlist › unstarring removes the row from the watchlist
- e2e/panel-interactions.spec.ts:7:7 › simulation filters › filters narrow the list
- e2e/panel-layout.spec.ts:23:7 › panel layout › hides the sidebar and restores it from the edge tab
- e2e/panel-layout.spec.ts:7:7 › panel layout › starts with the full map and a hidden sidebar
- e2e/panel-layout.spec.ts:97:7 › light theme contrast › status text stays readable on light surfaces
- e2e/sdk-docs.spec.ts:14:7 › sdk routes › the SDK canvas renders
- e2e/sdk-docs.spec.ts:34:7 › sdk routes › navigating between docs pages clears the filter

Full output of the second run is kept outside the repo in the session scratchpad (e2e-baseline-head.txt).
