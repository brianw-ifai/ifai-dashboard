/**
 * Action Items · Urgent Interventions work list: the five current findings,
 * each opening its home spoke/tab via data-ifai-open.
 */

import type { AiSearchRead } from "@/lib/ai-search/types";
import {
  briefingFindingsLead,
  type BriefingFinding,
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

/**
 * Renders the five briefingFindingsLead rows as clickable action cards.
 * No dollars, no lost-revenue placeholder, no history line.
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
    <div class="action-head">${escapeHtml(finding.label)}<span class="ifai-open-hint">Open details →</span></div>
    <div class="action-impact" data-urgent-finding-count="">${escapeHtml(countLabel(finding))}</div>
  </div>`;
    })
    .join("\n");
}
