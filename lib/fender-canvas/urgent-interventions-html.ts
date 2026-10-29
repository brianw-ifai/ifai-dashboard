/**
 * Action Items · Urgent Interventions work list: the five current findings,
 * each opening its home spoke/tab via data-ifai-open.
 */

import type { AiSearchRead } from "@/lib/ai-search/types";
import {
  BRIEFING_COUNT_MISSING,
  briefingFindingsLead,
  type BriefingFinding,
  type BriefingFindingId,
} from "@/lib/fender-canvas/briefing-retail-lead";
import type { RetailCanvasRead } from "@/lib/fender-canvas/portfolio-retail-display";
import type { FindabilityRead } from "@/lib/findability/copy";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** N of M when stored; otherwise the same missing label briefingFindingsLead already uses. */
function countLabel(finding: BriefingFinding): string {
  return finding.ratio ?? finding.percent;
}

function cardClass(finding: BriefingFinding): string {
  return finding.tone === "danger" ? "action-card critical" : "action-card";
}

function hasStoredReading(finding: BriefingFinding): boolean {
  return (
    finding.ratio != null &&
    finding.numerator != null &&
    finding.denominator != null &&
    finding.percent !== BRIEFING_COUNT_MISSING
  );
}

/** Operator next step when the finding has a stored N of M. Two sentences at most. */
const STORED_ACTIONS: Record<BriefingFindingId, string> = {
  buy_box:
    "These listings have no one-click offer. Correct each offer so a shopper can add the product to the cart.",
  map_leakage:
    "These offers are advertised below the lowest price a partner agreed to show. Raise those prices back to that floor.",
  splintered_bundles:
    "These bundles are their own listings, so their reviews stay split. Nest each bundle under the official parent listing so the reviews sit on one page.",
  exact_official_product:
    "Publish one fender.com page for each exact product that does not have one. A page for the whole line covers more than one model, so an assistant can attach the wrong specs.",
  unbranded_discovery:
    "When someone asks what to buy without naming Fender, assistants name Fender this often. Fix the withheld offers, the prices under the floor, the split bundles, and the missing exact pages, which are what an assistant can repeat.",
};

/** When the figure is missing, do not advise as if the count were known. */
const MISSING_ACTIONS: Record<BriefingFindingId, string> = {
  buy_box: "The Buy Box reading is not stored.",
  map_leakage: "The MAP reading is not stored.",
  splintered_bundles: "The catalog reading is not stored.",
  exact_official_product: "The official-page reading is not stored.",
  unbranded_discovery: "The AI Search reading is not stored.",
};

function actionCopy(finding: BriefingFinding): string {
  return hasStoredReading(finding) ? STORED_ACTIONS[finding.id] : MISSING_ACTIONS[finding.id];
}

/**
 * Renders the five briefingFindingsLead rows as clickable action cards.
 * No dollars, no lost-revenue placeholder, no history line.
 * Buy Box and MAP jargon stay for annotateGlossary (do not pre-mark ifai-term).
 */
export function urgentInterventionsHtml(
  retail: RetailCanvasRead,
  findability: FindabilityRead,
  ai: AiSearchRead,
): string {
  const { findings } = briefingFindingsLead(retail, findability, ai);
  return findings
    .map((finding, index) => {
      const style = index === 0 ? "" : ' style="margin-top:8px;"';
      return `
  <div class="${cardClass(finding)}"${style} data-ifai-open="${escapeHtml(finding.spokeId)}" data-ifai-tab="${escapeHtml(finding.tab)}" data-urgent-finding="${escapeHtml(finding.id)}">
    <div class="action-head">${escapeHtml(finding.label)}</div>
    <div class="action-details" data-urgent-finding-action="">${escapeHtml(actionCopy(finding))}</div>
    <div class="action-head"><span class="ifai-open-hint">Open details →</span></div>
    <div class="action-impact" data-urgent-finding-count="">${escapeHtml(countLabel(finding))}</div>
  </div>`;
    })
    .join("\n");
}
