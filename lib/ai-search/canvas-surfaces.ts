import type { CanvasMetric, CanvasNode, NodeStatus, PriorityItem } from "@/lib/canvas-sdk/types";
import { citationEvidence, groupCitations } from "@/lib/ai-search/citations";
import {
  battleSentence,
  categoryBattles,
  joinBrands,
  type CategoryBattle,
} from "@/lib/ai-search/competitors";
import { categoryLabel, engineLabel, MIN_COMPARABLE_RESOLVED } from "@/lib/ai-search/run-metrics";
import {
  engineModelLine,
  errorLine,
  pct,
  runStateLabel,
  summarizeRun,
  type AiRunSummary,
} from "@/lib/ai-search/summary";
import type { AiSearchRead } from "@/lib/ai-search/types";

export type NodeFace = Pick<CanvasNode, "status" | "title" | "stats" | "meta" | "tooltip" | "subTab">;

export const AI_TABS = {
  summary: "Run Summary",
  simulations: "Simulations",
  drift: "AI Drift",
  citations: "Citation Ecosystem",
} as const;

export const RADAR_TABS = {
  battlecards: "Category Battlecards",
  wins: "Competitor Wins",
  engines: "Engine Comparison",
} as const;

function stateFace(read: AiSearchRead, title: string, subTab: string): NodeFace | null {
  if (read.phase === "ready") return null;
  const copy = {
    loading: ["Loading run", "Reading the published AI run."],
    error: ["Read failed", `The published AI run did not load. ${read.phase === "error" ? read.message : ""}`],
    "no-run": ["No published run", "No AI run has been published yet, so no AI Search figure is shown."],
  }[read.phase];
  return {
    status: read.phase === "error" ? "danger" : "neutral",
    title,
    stats: [copy[0]],
    meta: "AI Search Visibility",
    subTab,
    tooltip: { title, desc: copy[1].trim() },
  };
}

/** Highest Fender share among categories with a comparable sample, else the largest sample. */
export function strongestCategory(battles: CategoryBattle[]): CategoryBattle | null {
  const resolved = battles.filter((b) => b.resolved > 0);
  const comparable = resolved.filter((b) => b.resolved >= MIN_COMPARABLE_RESOLVED);
  const pool = comparable.length ? comparable : resolved;
  return (
    [...pool].sort(
      (a, b) => b.fenderWins / b.resolved - a.fenderWins / a.resolved || b.resolved - a.resolved,
    )[0] ?? null
  );
}

function winStatus(summary: AiRunSummary): NodeStatus {
  const { fenderWins, resolved } = summary.commercial;
  if (resolved === 0) return "neutral";
  if (summary.completeness.isPartial) return "warning";
  const rate = fenderWins / resolved;
  return rate >= 0.75 ? "success" : rate >= 0.5 ? "warning" : "danger";
}

export type AiNodeFaces = Record<
  "spokeAeo" | "satPrompts" | "satCitations" | "satDrift" | "spokeCompetitors" | "satGap" | "satLead",
  NodeFace
>;

export function aiNodeFaces(read: AiSearchRead): AiNodeFaces {
  const pending = (title: string, subTab: string) => stateFace(read, title, subTab) as NodeFace;
  if (read.phase !== "ready") {
    return {
      spokeAeo: pending("AI Search Visibility", AI_TABS.summary),
      satPrompts: pending("AI Calls", AI_TABS.simulations),
      satCitations: pending("Citations", AI_TABS.citations),
      satDrift: pending("AI Drift", AI_TABS.drift),
      spokeCompetitors: pending("Competitive Radar", RADAR_TABS.battlecards),
      satGap: pending("Category Gap", RADAR_TABS.wins),
      satLead: pending("Category Lead", RADAR_TABS.battlecards),
    };
  }

  const s = summarizeRun(read.snapshot);
  const { commercial: c, completeness: run, drift, citations } = s;
  const state = runStateLabel(run.state);
  const engines = engineModelLine(s.enginesAndModels);
  const small = s.smallSampleEngines.map(engineLabel);
  const runLine = `${state} published run ${s.shortRunId}, completed ${s.completedAt}. ${run.answered ?? "Unknown"} of ${run.expected ?? "unknown"} calls answered. ${errorLine(s)}.`;
  const lead = strongestCategory(categoryBattles(read.snapshot.calls));
  const gap = s.largestGap;

  return {
    spokeAeo: {
      status: winStatus(s),
      title: "AI Search Visibility",
      stats: [`${pct(c.fenderWins, c.resolved)} Fender lead`, `${c.fenderWins} of ${c.resolved} resolved`],
      meta: `${state} run · ${run.answered ?? "?"} of ${run.expected ?? "?"} answered`,
      subTab: AI_TABS.summary,
      tooltip: {
        title: "AI Search Visibility",
        desc: `On commercial buying prompts, Fender/Squier was named more than any competitor in ${c.fenderWins} of ${c.resolved} resolved answers. ${c.unresolved} answers had no clear leader and ${c.errors} commercial calls failed. Engines: ${engines}. ${runLine}`,
      },
    },
    satPrompts: {
      status: run.isPartial ? "warning" : "success",
      title: `${c.calls} AI Calls`,
      stats: [`${c.resolved} resolved`, `${pct(c.fenderWins, c.resolved)} Fender lead`],
      meta: `Completed ${s.completedAt}`,
      subTab: AI_TABS.simulations,
      tooltip: {
        title: "Commercial prompt calls",
        desc: `${c.calls} commercial prompt-engine calls in the ${state.toLowerCase()} published run. The rate is ${c.fenderWins} Fender/Squier leads over ${c.resolved} resolved answers. ${s.probesAnswered} answered fact-check probes are excluded. ${c.unresolved} answers with no clear leader and ${c.errors} provider errors are reported separately, not as losses.${small.length ? ` ${small.join(", ")} has too few resolved answers to compare.` : ""} Open Simulations to see every call.`,
      },
    },
    satCitations: {
      status: citations.rows > 0 ? "warning" : "neutral",
      title: "Citations",
      stats: [
        `${citations.answersWithCitation} of ${citations.answered} answers cited`,
        `Fender-owned ${pct(citations.fenderOwnedRows, citations.rows)}`,
      ],
      meta: `${citations.rows} links · ${citations.domains} domains`,
      subTab: AI_TABS.citations,
      tooltip: {
        title: "AI Citation Ecosystem",
        desc: `${citations.answersWithCitation} of ${citations.answered} answered commercial calls cited at least one valid link, ${citations.rows} links across ${citations.domains} domains. ${citations.fenderOwnedRows} of those links point to Fender-owned pages. Run completed ${s.completedAt}.`,
      },
    },
    satDrift: {
      status: drift.totalConfirmed > 0 ? "danger" : "success",
      title: "AI Drift",
      stats: [`${drift.totalConfirmed} confirmed`, `${drift.checked} probes checked`],
      meta: `${drift.noFact} with no verified fact`,
      subTab: AI_TABS.drift,
      tooltip: {
        title: "Fact checks against verified Fender facts",
        desc: `${drift.checked} answered probe calls were compared with a fact verified on a Fender page. ${drift.confirmed} contradicted it. No contradiction matched does not guarantee the whole answer is accurate. ${drift.noFact} answered probes have no verified fact yet and ${drift.errors} probe calls failed.`,
      },
    },
    spokeCompetitors: {
      status: s.competitorWins > 0 ? "warning" : "success",
      title: "Competitive Radar",
      stats: s.topCompetitor
        ? [`${s.topCompetitor.brand} ${s.topCompetitor.wins} wins`, `of ${s.topCompetitor.resolved} resolved`]
        : ["No competitor wins", `${c.resolved} resolved`],
      meta: `${s.competitorWins} competitor wins · commercial prompts`,
      subTab: RADAR_TABS.battlecards,
      tooltip: {
        title: "Competitive Radar",
        desc: `Competitor brands were named more than Fender/Squier in ${s.competitorWins} of ${c.resolved} resolved commercial answers in the published run.${gap ? ` Largest gap: ${battleSentence(gap)}.` : ""}`,
      },
    },
    satGap: gap
      ? {
          status: "warning",
          title: `${categoryLabel(gap.category)} Gap`,
          stats: [`${gap.leaders[0]?.brand ?? "Rival"} ${gap.leaders[0]?.wins ?? 0} wins`, `of ${gap.resolved} resolved`],
          meta: `${gap.competitorWins} competitor wins`,
          subTab: RADAR_TABS.wins,
          tooltip: { title: `${categoryLabel(gap.category)} category`, desc: `${battleSentence(gap)}.` },
        }
      : {
          status: "success",
          title: "Category Gap",
          stats: ["No competitor wins"],
          meta: "Commercial prompts",
          subTab: RADAR_TABS.wins,
          tooltip: { title: "Category gap", desc: "No competitor was named most in a resolved commercial answer." },
        },
    satLead: lead
      ? {
          status: "success",
          title: `${categoryLabel(lead.category)} Lead`,
          stats: [`${pct(lead.fenderWins, lead.resolved)} Fender`, `${lead.fenderWins} of ${lead.resolved} resolved`],
          meta: "Commercial prompts",
          subTab: RADAR_TABS.battlecards,
          tooltip: {
            title: `${categoryLabel(lead.category)} category`,
            desc: `Fender/Squier was named most in ${lead.fenderWins} of ${lead.resolved} resolved ${lead.category} answers in the published run.`,
          },
        }
      : {
          status: "neutral",
          title: "Category Lead",
          stats: ["No resolved answers"],
          meta: "Commercial prompts",
          subTab: RADAR_TABS.battlecards,
          tooltip: { title: "Category lead", desc: "No commercial category has resolved answers yet." },
        },
  };
}

/** The AI Search spoke description. Never states a count the run did not return. */
export function aiSpokeDesc(read: AiSearchRead): string {
  if (read.phase === "loading") return "Reading the published AI run.";
  if (read.phase === "error") return `The published AI run did not load: ${read.message}`;
  if (read.phase === "no-run") return "No AI run has been published yet, so no AI Search figure is shown.";
  const s = summarizeRun(read.snapshot);
  const c = s.commercial;
  return `${runStateLabel(s.completeness.state)} published run, completed ${s.completedAt}: ${s.completeness.answered} of ${s.completeness.expected} calls answered, ${errorLine(s)}. On commercial prompts, Fender/Squier was named more than any competitor in ${c.fenderWins} of ${c.resolved} resolved answers (${pct(c.fenderWins, c.resolved)}). ${s.drift.confirmed} confirmed contradictions in ${s.drift.checked} fact-checked probe answers.`;
}

/** One sentence for the command center summary. Silent until the run loads. */
export function aiCommandSummary(read: AiSearchRead): string | null {
  if (read.phase === "loading") return null;
  if (read.phase !== "ready") return aiSpokeDesc(read);
  const s = summarizeRun(read.snapshot);
  const c = s.commercial;
  return `In the published AI run, Fender/Squier was named most in ${c.fenderWins} of ${c.resolved} resolved commercial answers (${runStateLabel(s.completeness.state).toLowerCase()} run, ${s.completeness.answered} of ${s.completeness.expected} calls answered).`;
}

export function competitorsSpokeDesc(read: AiSearchRead): string {
  if (read.phase !== "ready") return aiSpokeDesc(read);
  const s = summarizeRun(read.snapshot);
  return `Which brands AI engines name over Fender/Squier on commercial buying prompts in the published run. Competitors led ${s.competitorWins} of ${s.commercial.resolved} resolved answers. Fact-check probes, provider errors, and answers with no clear leader are left out.`;
}

/** Client priorities this run can prove. Nothing appears while the run is loading or missing. */
export function aiPriorityItems(read: AiSearchRead): PriorityItem[] {
  if (read.phase !== "ready") return [];
  const s = summarizeRun(read.snapshot);
  const items: PriorityItem[] = [];

  if (s.drift.totalConfirmed > 0) {
    items.push({
      id: "ai-confirmed-contradiction",
      title: `${s.drift.totalConfirmed} AI answers contradict a verified Fender fact`,
      why: `In the published run, ${s.drift.totalConfirmed} of ${s.drift.totalChecked} fact-checked answers stated something a Fender product page contradicts. The AI Drift tab quotes each answer, the verified fact, and its source page.`,
      impact: "A shopper who reads a wrong spec may buy the wrong product or return it.",
      severity: "critical",
      spokeId: "aeo",
      subTab: "AI Drift",
      defaultOwner: "client",
    });
  }

  const gap = s.largestGap;
  if (gap) {
    const calls = read.snapshot.calls.filter(
      (row) => row.category === gap.category && row.outcome === "competitor_win" && row.prompt_kind === "commercial",
    );
    const losingIds = new Set(calls.map((row) => row.id));
    const cited = citationEvidence(read.snapshot.calls, read.snapshot.citations, "commercial").rows.filter((row) =>
      losingIds.has(row.simulationId),
    );
    const domains = groupCitations(cited, (row) => row.domain).slice(0, 3).map((group) => group.key);
    const engines = joinBrands([...new Set(calls.map((row) => engineLabel(row.engine)))].sort());
    items.push({
      id: "ai-competitor-gap",
      title: battleSentence(gap),
      why: `In the published run, ${engines} named ${joinBrands(gap.leaders.map((l) => l.brand))} more often than Fender/Squier on ${gap.competitorWins} ${gap.category} buying prompts.${domains.length ? ` Those answers cited ${domains.join(", ")}.` : ""} Start with those pages: check how they describe Fender's ${gap.category} line against the brand they favor.`,
      impact: `The Competitor Wins tab lists each of the ${gap.competitorWins} answers with its engine, model, and cited pages.`,
      severity: "high",
      spokeId: "competitors",
      subTab: "Competitor Wins",
      defaultOwner: "client",
    });
  }

  return items;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Action Items cards for the AI priorities, numbered after the three retail and spec cards. */
export function aiActionCardHtml(read: AiSearchRead, firstNumber = 4): string {
  return aiPriorityItems(read)
    .map(
      (item, index) => `
  <div class="action-card${item.severity === "critical" ? " critical" : ""}" style="margin-top:8px;" data-ifai-open="${escapeHtml(item.spokeId ?? "aeo")}" data-ifai-tab="${escapeHtml(item.subTab ?? "")}">
    <div class="action-head">${firstNumber + index}. ${escapeHtml(item.title)}</div>
    <div class="action-details">${escapeHtml(item.why)}</div>
    <div class="action-impact">${escapeHtml(item.impact ?? "")}</div>
  </div>`,
    )
    .join("\n");
}

const pendingMetric = (read: AiSearchRead) =>
  read.phase === "loading"
    ? { value: "Loading", detail: "Reading the published AI run" }
    : read.phase === "error"
      ? { value: "Unavailable", detail: "The published AI run did not load" }
      : { value: "No run", detail: "No AI run has been published" };

export type AiMetricKey =
  | "overallAiWinRate"
  | "beginnerAiWinRate"
  | "resolvedSimulations"
  | "confirmedHallucinations"
  | "beginnerSovGap"
  | "strongestCategorySov";

/** AI Search widget values. Ids stay stable so saved widget choices survive. */
export function aiMetrics(read: AiSearchRead): Record<AiMetricKey, CanvasMetric> {
  const base = {
    overallAiWinRate: { id: "overall-ai-win-rate", spokeId: "aeo", label: "Overall AI Win Rate", subTab: AI_TABS.summary },
    beginnerAiWinRate: { id: "beginner-ai-win-rate", spokeId: "aeo", label: "Beginner AI Win Rate", subTab: AI_TABS.simulations },
    resolvedSimulations: { id: "resolved-simulations", spokeId: "aeo", label: "Answered AI Calls", subTab: AI_TABS.summary },
    confirmedHallucinations: { id: "confirmed-hallucinations", spokeId: "aeo", label: "Confirmed Spec Hallucinations", subTab: AI_TABS.drift },
    beginnerSovGap: { id: "beginner-sov-gap", spokeId: "competitors", label: "Beginner Category SOV Gap", subTab: RADAR_TABS.battlecards },
    strongestCategorySov: { id: "strongest-category-sov", spokeId: "competitors", label: "Strongest Category SOV", subTab: RADAR_TABS.battlecards },
  } as const;

  if (read.phase !== "ready") {
    const p = pendingMetric(read);
    return Object.fromEntries(
      Object.entries(base).map(([key, m]) => [key, { ...m, ...p, tone: "neutral", provenance: "live" }]),
    ) as Record<AiMetricKey, CanvasMetric>;
  }

  const s = summarizeRun(read.snapshot);
  const c = s.commercial;
  const beginner = s.categories.find((row) => row.key === "beginner");
  const beginnerBattle = categoryBattles(read.snapshot.calls).find((b) => b.category === "beginner");
  const rival = beginnerBattle?.leaders[0];
  const strongest = strongestCategory(categoryBattles(read.snapshot.calls));
  const live = { provenance: "live" as const };

  return {
    overallAiWinRate: {
      ...base.overallAiWinRate, ...live,
      value: pct(c.fenderWins, c.resolved),
      detail: `${c.fenderWins} of ${c.resolved} resolved commercial answers`,
      tone: c.resolved ? (c.fenderWins / c.resolved >= 0.75 ? "success" : "warning") : "neutral",
    },
    beginnerAiWinRate: {
      ...base.beginnerAiWinRate, ...live,
      value: beginner ? pct(beginner.fenderWins, beginner.resolved) : "No beginner prompts",
      detail: beginner ? `${beginner.fenderWins} of ${beginner.resolved} resolved beginner answers` : "Not in this run",
      tone: "neutral",
    },
    resolvedSimulations: {
      ...base.resolvedSimulations, ...live,
      value: `${s.completeness.answered} / ${s.completeness.expected}`,
      detail: `${runStateLabel(s.completeness.state)} run · ${errorLine(s)}`,
      tone: s.completeness.isPartial ? "warning" : "success",
    },
    confirmedHallucinations: {
      ...base.confirmedHallucinations, ...live,
      value: String(s.drift.totalConfirmed),
      detail: `Of ${s.drift.totalChecked} answers checked against a verified fact`,
      tone: s.drift.totalConfirmed > 0 ? "danger" : "success",
    },
    beginnerSovGap: {
      ...base.beginnerSovGap, ...live,
      value: beginnerBattle && beginnerBattle.resolved
        ? `${(((beginnerBattle.fenderWins - (rival?.wins ?? 0)) * 100) / beginnerBattle.resolved).toFixed(1)} pts`
        : "No beginner prompts",
      detail: beginnerBattle
        ? `Fender/Squier ${beginnerBattle.fenderWins} vs ${rival ? `${rival.brand} ${rival.wins}` : "no rival"} of ${beginnerBattle.resolved} resolved`
        : "Not in this run",
      tone: "neutral",
    },
    strongestCategorySov: {
      ...base.strongestCategorySov, ...live,
      value: strongest ? pct(strongest.fenderWins, strongest.resolved) : "No resolved answers",
      detail: strongest ? `${categoryLabel(strongest.category)} · ${strongest.fenderWins} of ${strongest.resolved} resolved` : "Not in this run",
      tone: "success",
    },
  };
}

export type AiTourLines = { hub: string; aeo: string[]; competitors: string[]; roadmap: string };

export function aiTourLines(read: AiSearchRead): AiTourLines {
  if (read.phase !== "ready") {
    const line = aiSpokeDesc(read);
    return { hub: line, aeo: [line], competitors: [line], roadmap: line };
  }
  const s = summarizeRun(read.snapshot);
  const c = s.commercial;
  const lead = `Fender/Squier named most in ${c.fenderWins} of ${c.resolved} resolved AI answers`;
  return {
    hub: lead,
    aeo: [
      `${runStateLabel(s.completeness.state)} run: ${s.completeness.answered} of ${s.completeness.expected} calls answered, completed ${s.completedAt}`,
      lead,
      `${s.drift.confirmed} confirmed contradictions in ${s.drift.checked} fact-checked probe answers`,
    ],
    competitors: [
      s.topCompetitor
        ? `${s.topCompetitor.brand} named most in ${s.topCompetitor.wins} of ${s.topCompetitor.resolved} resolved answers`
        : "No competitor named most in a resolved answer",
      s.largestGap ? battleSentence(s.largestGap) : "No category gap in this run",
      "Commercial AI-search prompts only",
    ],
    roadmap: lead,
  };
}
