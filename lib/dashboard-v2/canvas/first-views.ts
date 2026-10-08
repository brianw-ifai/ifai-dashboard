import type { NodeStatus } from "@/lib/canvas-sdk/types";
import { formatAsOf, formatInt, formatReading, formatUsd, isRate, UNAVAILABLE_WORD } from "../reading/format";
import { labelFor } from "../reading/labels";
import { coverageLine, figureText } from "../reading/lines";
import { statusFor } from "../reading/status";
import type { Rate, Reading, RegistryRow } from "../reading/types";
import { ACTION_ITEMS_OPEN_ID, NO_SEVERITY_KEY } from "../selectors/actions";
import { AI_ANSWER_SHARE_ID } from "../selectors/ai-answer-share";
import { CHANNEL_PRICE_COVERAGE_ID } from "../selectors/channel-price-coverage";
import { ENGINE_SPLIT_ID } from "../selectors/engine-split";
import { FEATURED_OFFER_PRESENT_ID, FEATURED_OFFER_SUPPRESSED_ID } from "../selectors/featured-offer";
import { registryFor, type AllSelections } from "../selectors/index";
import { PRICE_GAP_ID } from "../selectors/price-gap";
import { SELLER_MIX_ID } from "../selectors/seller-mix";
import { SPEC_ADDITIONAL_PROPERTY_ID, SPEC_AMAZON_COMPLETENESS_ID, SPEC_PAGE_FOUND_ID } from "../selectors/spec-readiness";
import { CATEGORY_SHARE_ID } from "../selectors/weakest-category";

/**
 * Chart data for every first view, built from the selector outputs and nothing else. No React
 * here: the first-views test builds this from the fixture and checks every plotted value against
 * the selector that produced it, and the surfaces test scans every string for stray figures.
 * Labels on marks are at most three words.
 */

export type CoverageInfo = {
  read: number;
  population: number | null;
  /** read over population, or null when the population is unknown. */
  fraction: number | null;
  partial: boolean;
  /** "read 438 of 1,007, not final" or the as-of line. */
  line: string;
};

export type HubMark = {
  id: string;
  registryId: string;
  label: string;
  figure: string;
  status: NodeStatus;
  unavailable: boolean;
  reason: string | null;
  coverage: CoverageInfo | null;
  reading: Reading<unknown>;
};

export type AsOfStripItem = {
  runId: string;
  workflow: string;
  sourceLabel: string;
  asOfText: string;
  statusLabel: string;
};

export type HubOverview = {
  marks: HubMark[];
  asOf: AsOfStripItem[];
  /** One sentence per executive output, from the registry meaning and the coverage line. */
  readMore: string[];
};

export type RateBar = {
  id: string;
  registryId: string;
  label: string;
  /** 0 to 100, or null when unavailable. */
  pct: number | null;
  numerator: number | null;
  denominator: number | null;
  figure: string;
  countText: string;
  status: NodeStatus;
  unavailable: boolean;
  reason: string | null;
  coverageLine: string;
  reading: Reading<unknown>;
};

export type PairBar = {
  category: string;
  label: string;
  registryId: string;
  clientPct: number | null;
  clientFigure: string;
  rivalName: string | null;
  rivalPct: number | null;
  rivalFigure: string;
  resolved: number;
  resolvedText: string;
  clientReading: Reading<Rate>;
  rivalReading: Reading<Rate> | null;
};

export type GroupedBars = {
  registryId: string;
  clientLabel: string;
  rows: PairBar[];
  reason: string | null;
};

export type Slice = {
  key: string;
  label: string;
  registryId: string;
  count: number | null;
  figure: string;
  /** series slices take a categorical hue; neutral slices are hatched gray. */
  tone: "series" | "neutral";
  seriesIndex: number;
  unavailable: boolean;
  reason: string | null;
  reading: Reading<number>;
};

export type StackedBar = {
  id: string;
  registryId: string;
  title: string;
  total: Reading<number>;
  totalFigure: string;
  totalLabel: string;
  slices: Slice[];
  /** True when every slice is available and the slices sum to the total. */
  sumsToTotal: boolean;
  coverageLine: string;
};

export type CountBar = { key: string; label: string; count: number; figure: string };

export type CountBars = { id: string; registryId: string; title: string; bars: CountBar[]; max: number };

export type FormulaLine = {
  key: string;
  label: string;
  value: number | null;
  text: string;
  unit: string | null;
  source: string | null;
  asOfText: string | null;
  owner: string | null;
  confidence: string | null;
};

export type FormulaTree = {
  registryId: string;
  name: string;
  formula: string;
  lines: FormulaLine[];
  /** The sum, only when every input exists. */
  totalText: string | null;
  reason: string | null;
  reading: Reading<number>;
};

export type PriceGapView = {
  registryId: string;
  label: string;
  figure: string;
  lineCount: number | null;
  lineCountText: string;
  coverageLine: string;
  reading: Reading<unknown>;
};

export type QuestionLine = {
  registryId: string;
  sellerTypeLabel: string | null;
  question: string | null;
  statusLine: string;
};

export type FirstViews = {
  hub: HubOverview;
  aeo: { categories: GroupedBars; engines: RateBar[] };
  ecommerce: { offerStates: StackedBar; sellerMix: StackedBar; question: QuestionLine; channels: RateBar[] };
  specs: { bars: RateBar[] };
  competitors: { categories: GroupedBars };
  suggestions: { byOwner: CountBars; bySeverity: CountBars };
  money: { priceGap: PriceGapView; estimates: FormulaTree[] };
};

/** Short labels for the five executive outputs. Labels only; three words at most. */
const HUB_LABELS: Record<string, string> = {
  [AI_ANSWER_SHARE_ID]: "AI answer share",
  [FEATURED_OFFER_SUPPRESSED_ID]: "Withheld above benchmark",
  [FEATURED_OFFER_PRESENT_ID]: "Featured Offer present",
  [SPEC_PAGE_FOUND_ID]: "Brand page found",
  [PRICE_GAP_ID]: "Price gap",
  [ACTION_ITEMS_OPEN_ID]: "Open Action Items",
  map_below: "Below MAP",
};

export function hubLabel(all: AllSelections, registryId: string): string {
  if (registryId === all.retail.primaryRegistryId) return "Authorized Featured Offer";
  return HUB_LABELS[registryId] ?? registryId.replace(/_/g, " ");
}

export function coverageInfo(reading: Reading<unknown>): CoverageInfo | null {
  const c = reading.coverage;
  if (!c) return null;
  const partial = reading.status === "partial";
  const fraction = c.population && c.population > 0 ? Math.min(1, c.read / c.population) : null;
  return { read: c.read, population: c.population, fraction, partial, line: coverageLine(reading) };
}

function statusOf(all: AllSelections, reading: Reading<unknown>): NodeStatus {
  return statusFor(reading, registryFor(all, reading.registryId));
}

/** A one-sentence category label: the stored category word with a capital. */
export function categoryLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ");
}

function rateBar(all: AllSelections, id: string, label: string, reading: Reading<unknown>): RateBar {
  const unavailable = reading.status === "unavailable";
  const rate = reading.status !== "unavailable" && isRate(reading.value) ? reading.value : null;
  const pctReading: Reading<unknown> = reading.status !== "unavailable" && rate ? { ...reading, value: rate.pct } : reading;
  return {
    id,
    registryId: reading.registryId,
    label,
    pct: rate ? rate.pct : null,
    numerator: rate ? rate.numerator : null,
    denominator: rate ? rate.denominator : null,
    figure: figureText(pctReading, "percent"),
    countText: rate ? `${formatInt(rate.numerator)} of ${formatInt(rate.denominator)}` : UNAVAILABLE_WORD,
    status: statusOf(all, reading),
    unavailable,
    reason: unavailable ? reading.reason : null,
    coverageLine: coverageLine(reading),
    reading,
  };
}

function slice(key: string, label: string, reading: Reading<number>, tone: Slice["tone"], seriesIndex: number): Slice {
  const unavailable = reading.status === "unavailable";
  return {
    key,
    label,
    registryId: reading.registryId,
    count: unavailable ? null : reading.value,
    figure: figureText(reading, "count"),
    tone,
    seriesIndex,
    unavailable,
    reason: unavailable ? reading.reason : null,
    reading,
  };
}

function stacked(id: string, registryId: string, title: string, total: Reading<number>, totalLabel: string, slices: Slice[]): StackedBar {
  const sum = slices.reduce<number | null>((acc, s) => (acc === null || s.count === null ? null : acc + s.count), 0);
  const sumsToTotal = total.status !== "unavailable" && sum !== null && sum === total.value;
  return {
    id,
    registryId,
    title,
    total,
    totalFigure: figureText(total, "count"),
    totalLabel,
    slices,
    sumsToTotal,
    coverageLine: coverageLine(total),
  };
}

function groupedBars(all: AllSelections): GroupedBars {
  const w = all.weakest;
  const rows: PairBar[] = [...w.categories]
    .sort((a, b) => {
      const ap = a.clientShare.status === "unavailable" ? Number.POSITIVE_INFINITY : a.clientShare.value.pct;
      const bp = b.clientShare.status === "unavailable" ? Number.POSITIVE_INFINITY : b.clientShare.value.pct;
      return ap - bp || a.category.localeCompare(b.category);
    })
    .map((c) => {
      const client = c.clientShare;
      const rival = c.rivalShare;
      return {
        category: c.category,
        label: categoryLabel(c.category),
        registryId: CATEGORY_SHARE_ID,
        clientPct: client.status === "unavailable" ? null : client.value.pct,
        clientFigure: figureText(client.status === "unavailable" ? client : { ...client, value: client.value.pct }, "percent"),
        rivalName: c.topRival,
        rivalPct: rival && rival.status !== "unavailable" ? rival.value.pct : null,
        rivalFigure: rival ? figureText(rival.status === "unavailable" ? rival : { ...rival, value: rival.value.pct }, "percent") : UNAVAILABLE_WORD,
        resolved: c.resolved,
        resolvedText: `${formatInt(c.resolved)} resolved`,
        clientReading: client,
        rivalReading: rival,
      };
    });
  return {
    registryId: CATEGORY_SHARE_ID,
    clientLabel: all.clientName ?? "brand",
    rows,
    reason: rows.length === 0 && w.reading.status === "unavailable" ? w.reading.reason : null,
  };
}

function hubOverview(all: AllSelections, execIds: string[]): HubOverview {
  const marks: HubMark[] = execIds.map((id) => {
    const reading = all.readings[id];
    const registry = registryFor(all, id);
    const unavailable = !reading || reading.status === "unavailable";
    const figure = reading ? markFigure(reading, registry) : UNAVAILABLE_WORD;
    return {
      id: `hub-mark-${id}`,
      registryId: id,
      label: hubLabel(all, id),
      figure,
      status: reading ? statusFor(reading, registry) : "neutral",
      unavailable,
      reason: !reading ? "no selector produced this reading" : reading.status === "unavailable" ? reading.reason : null,
      coverage: reading ? coverageInfo(reading) : null,
      reading: reading ?? { status: "unavailable", reason: "no selector produced this reading", coverage: null, registryId: id },
    };
  });
  const asOf: AsOfStripItem[] = all.freshness.sources.map((s) => ({
    runId: s.runId,
    workflow: s.workflowName,
    sourceLabel: labelFor("source", s.source),
    asOfText: formatAsOf(s.asOf),
    statusLabel: labelFor("run_status", s.status),
  }));
  const readMore = execIds.map((id) => {
    const registry = registryFor(all, id);
    const reading = all.readings[id];
    const meaning = registry?.meaning ?? "No registry row is stored for this reading.";
    const cover = reading ? coverageLine(reading) : UNAVAILABLE_WORD;
    return `${registry?.name ?? hubLabel(all, id)}: ${meaning} ${capital(cover)}.`;
  });
  return { marks, asOf, readMore };
}

/** The short figure for a mark: a rate shows its percent, the rest their unit. */
export function markFigure(reading: Reading<unknown>, registry: RegistryRow | null): string {
  if (reading.status !== "unavailable" && isRate(reading.value)) return figureText({ ...reading, value: reading.value.pct }, "percent");
  return figureText(reading, registry?.unit);
}

function capital(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function countBars(id: string, title: string, counts: Array<{ key: string; count: number }>, label: (key: string) => string): CountBars {
  const bars = counts.map((c) => ({ key: c.key, label: label(c.key), count: c.count, figure: formatInt(c.count) }));
  return { id, registryId: ACTION_ITEMS_OPEN_ID, title, bars, max: bars.reduce((m, b) => Math.max(m, b.count), 0) };
}

function formulaTrees(all: AllSelections): FormulaTree[] {
  return all.estimates.map((e) => {
    const byKey = new Map(e.lines.map((l) => [l.key, l]));
    const keys = e.inputKeys.length ? e.inputKeys : e.lines.map((l) => l.key);
    const lines: FormulaLine[] = keys.map((key) => {
      const line = byKey.get(key);
      return {
        key,
        label: key.replace(/_/g, " "),
        value: line ? line.value : null,
        text: line ? formatUsd(line.value) : `${UNAVAILABLE_WORD}: not stored`,
        unit: line ? labelFor("unit", line.unit) : null,
        source: line ? line.source : null,
        asOfText: line ? formatAsOf(line.asOf) : null,
        owner: line ? line.owner : null,
        confidence: line ? labelFor("confidence", line.confidence) : null,
      };
    });
    return {
      registryId: e.registryId,
      name: e.estimate?.name ?? e.registry?.name ?? e.registryId.replace(/_/g, " "),
      formula: e.estimate?.formula ?? e.registry?.formula ?? UNAVAILABLE_WORD,
      lines,
      totalText: e.reading.status === "unavailable" ? null : formatUsd(e.reading.value),
      reason: e.reading.status === "unavailable" ? e.reading.reason : null,
      reading: e.reading,
    };
  });
}

export function buildFirstViews(all: AllSelections, execIds: string[]): FirstViews {
  const name = (id: string) => registryFor(all, id)?.name ?? id.replace(/_/g, " ");
  const grouped = groupedBars(all);
  const o = all.offerStates;

  const offerStates = stacked(
    "offer-states",
    FEATURED_OFFER_SUPPRESSED_ID,
    "Featured Offer state",
    o.read,
    "listings read",
    [
      slice("present", "Present", o.present, "series", 0),
      slice("within", "Withheld within benchmark", o.withheldWithinBenchmark, "series", 1),
      slice("above", "Withheld above benchmark", o.withheldAboveBenchmark, "series", 2),
    ],
  );
  const sellerMix = stacked(
    "seller-mix",
    SELLER_MIX_ID,
    name(SELLER_MIX_ID),
    o.active,
    "active offers",
    all.sellerMix.classes.map((c, i) => slice(c.sellerClass, labelFor("seller_class", c.sellerClass), c.reading, c.sellerClass === "not_read" ? "neutral" : "series", i)),
  );
  const primary = all.retail.details[all.retail.primaryRegistryId]?.reading;
  const question: QuestionLine = {
    registryId: all.retail.primaryRegistryId,
    sellerTypeLabel: all.retail.sellerTypeLabel,
    question: all.retail.primaryQuestion,
    statusLine: primary ? formatReading(primary, "percent") : UNAVAILABLE_WORD,
  };
  const channels = all.channelCoverage.channels.map((c) => rateBar(all, `channel-${c.channel}`, c.label, c.reading));

  const specBars: RateBar[] = [
    rateBar(all, "spec-found", "Brand page found", all.spec.pageFound.reading),
    rateBar(all, "spec-additional", "additionalProperty present", all.spec.additionalPropertyPresent),
    rateBar(all, "spec-amazon", "Amazon fields filled", all.spec.amazonCompleteness.reading),
  ];

  const gap = all.priceGap;
  const priceGap: PriceGapView = {
    registryId: PRICE_GAP_ID,
    label: "price gap",
    figure: figureText(gap.reading, "usd"),
    lineCount: gap.numerator,
    lineCountText: gap.numerator === null ? UNAVAILABLE_WORD : `${formatInt(gap.numerator)} lines`,
    coverageLine: coverageLine(gap.reading),
    reading: gap.reading,
  };

  return {
    hub: hubOverview(all, execIds),
    aeo: {
      categories: grouped,
      engines: all.engineSplit.engines.map((e) => rateBar(all, `engine-${e.engine}`, e.label, e.reading)),
    },
    ecommerce: { offerStates, sellerMix, question, channels: channels.length ? channels : [rateBar(all, "channel-none", name(CHANNEL_PRICE_COVERAGE_ID), all.channelCoverage.reading)] },
    specs: { bars: specBars },
    competitors: { categories: grouped },
    suggestions: {
      byOwner: countBars("actions-by-owner", "Open by owner", all.actions.byOwner, (k) => labelFor("action_owner", k)),
      bySeverity: countBars("actions-by-severity", "Open by severity", all.actions.bySeverity, (k) => (k === NO_SEVERITY_KEY ? "not set" : labelFor("severity", k))),
    },
    money: { priceGap, estimates: formulaTrees(all) },
  };
}

/** Every visible string the first views carry, for the surfaces scan. */
export function firstViewStrings(fv: FirstViews): string[] {
  const out: string[] = [];
  for (const m of fv.hub.marks) out.push(m.label, m.figure, m.reason ?? "", m.coverage?.line ?? "");
  for (const a of fv.hub.asOf) out.push(a.workflow, a.sourceLabel, a.asOfText, a.statusLabel);
  out.push(...fv.hub.readMore);
  const grouped = (g: GroupedBars) => {
    out.push(g.clientLabel, g.reason ?? "");
    for (const r of g.rows) out.push(r.label, r.clientFigure, r.rivalName ?? "", r.rivalFigure, r.resolvedText);
  };
  grouped(fv.aeo.categories);
  grouped(fv.competitors.categories);
  const rates = (bars: RateBar[]) => {
    for (const b of bars) out.push(b.label, b.figure, b.countText, b.reason ?? "", b.coverageLine);
  };
  rates(fv.aeo.engines);
  rates(fv.ecommerce.channels);
  rates(fv.specs.bars);
  for (const s of [fv.ecommerce.offerStates, fv.ecommerce.sellerMix]) {
    out.push(s.title, s.totalFigure, s.totalLabel, s.coverageLine);
    for (const sl of s.slices) out.push(sl.label, sl.figure, sl.reason ?? "");
  }
  const q = fv.ecommerce.question;
  out.push(q.sellerTypeLabel ?? "", q.question ?? "", q.statusLine);
  for (const c of [fv.suggestions.byOwner, fv.suggestions.bySeverity]) {
    out.push(c.title);
    for (const b of c.bars) out.push(b.label, b.figure);
  }
  out.push(fv.money.priceGap.label, fv.money.priceGap.figure, fv.money.priceGap.lineCountText, fv.money.priceGap.coverageLine);
  for (const t of fv.money.estimates) {
    out.push(t.name, t.formula, t.totalText ?? "", t.reason ?? "");
    for (const l of t.lines) out.push(l.label, l.text, l.unit ?? "", l.source ?? "", l.asOfText ?? "", l.owner ?? "", l.confidence ?? "");
  }
  return out.filter(Boolean);
}

/** Every chart mark's registry id, for tests that check every mark opens a registry row. */
export function firstViewRegistryIds(fv: FirstViews): string[] {
  const ids = new Set<string>();
  for (const m of fv.hub.marks) ids.add(m.registryId);
  for (const r of fv.aeo.categories.rows) ids.add(r.registryId);
  for (const b of [...fv.aeo.engines, ...fv.ecommerce.channels, ...fv.specs.bars]) ids.add(b.registryId);
  for (const s of [fv.ecommerce.offerStates, fv.ecommerce.sellerMix]) for (const sl of s.slices) ids.add(sl.registryId);
  ids.add(fv.suggestions.byOwner.registryId);
  ids.add(fv.money.priceGap.registryId);
  for (const t of fv.money.estimates) ids.add(t.registryId);
  ids.add(ENGINE_SPLIT_ID);
  ids.add(SPEC_ADDITIONAL_PROPERTY_ID);
  ids.add(SPEC_AMAZON_COMPLETENESS_ID);
  return [...ids];
}
