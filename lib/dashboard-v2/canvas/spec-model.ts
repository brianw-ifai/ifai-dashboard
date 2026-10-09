import { basePath } from "@/lib/dashboard-v2/data/client-paths";
import type {
  CanvasEdge,
  CanvasLegendItem,
  CanvasMetric,
  CanvasNode,
  CommandCenterSpec,
  NodeStatus,
  PriorityItem,
  PrioritySeverity,
  TickerTone,
  TourStep,
} from "@/lib/canvas-sdk/types";
import { formatAsOf, formatInt, formatReading, isRate, UNAVAILABLE_WORD } from "../reading/format";
import { asOfLine, coverageLine, figureText, formatPoints, numeratorDenominatorSentence } from "../reading/lines";
import { statusFor } from "../reading/status";
import type { Reading, RegistryUnit } from "../reading/types";
import { ACTION_ITEMS_OPEN_ID } from "../selectors/actions";
import { AI_ANSWER_SHARE_ID } from "../selectors/ai-answer-share";
import { AMAZON_OFFER_SHARE_ID } from "../selectors/amazon-offer-share";
import { BUNDLE_SHARE_ID } from "../selectors/bundle-share";
import { CATALOG_MONITORED_ID } from "../selectors/catalog";
import { CHANNEL_PRICE_COVERAGE_ID } from "../selectors/channel-price-coverage";
import { ECOMMERCE_TO_AI_LINK_ID } from "../selectors/ecommerce-to-ai-link";
import { ENGINE_SPLIT_ID } from "../selectors/engine-split";
import { ESTIMATE_ENTERPRISE_ID, ESTIMATE_PHASE1_ID } from "../selectors/estimate";
import { FEATURED_OFFER_PRESENT_ID, FEATURED_OFFER_SUPPRESSED_ID } from "../selectors/featured-offer";
import { READING_FRESHNESS_ID } from "../selectors/freshness";
import { registryFor, type AllSelections } from "../selectors/index";
import { MAP_BELOW_ID } from "../selectors/map-below";
import { PRICE_GAP_ID } from "../selectors/price-gap";
import { SELLER_MIX_ID, SELLER_READ_COVERAGE_ID } from "../selectors/seller-mix";
import { SPEC_ADDITIONAL_PROPERTY_ID, SPEC_AMAZON_COMPLETENESS_ID, SPEC_PAGE_FOUND_ID } from "../selectors/spec-readiness";
import { CATEGORY_SHARE_ID } from "../selectors/weakest-category";
import { WRONG_SPEC_FLAGS_ID } from "../selectors/wrong-spec-flags";
import { buildFirstViews, firstViewStrings, markFigure, type FirstViews } from "./first-views";

/**
 * The plain-data half of the dashboard v2 canvas spec: nodes, edges, focus targets, spoke
 * definitions, command center, tour, metric widgets, tickers, legend, and the cards each spoke
 * shows. No React here, so the surfaces test can build it under node:test. build-spec.tsx adds
 * the render functions. No figure, status, or rank is typed in this file; each comes from a
 * selector reading through formatReading and statusFor.
 */

export type SpokeId = "hub" | "aeo" | "ecommerce" | "specs" | "competitors" | "suggestions" | "money";

export const SPOKE_ORDER: SpokeId[] = ["hub", "aeo", "ecommerce", "specs", "competitors", "suggestions", "money"];

export type SpokeDef = {
  id: SpokeId;
  /** The SDK keys its icons and column layout by node id, so these ids are layout slots, not labels. */
  nodeId: string;
  title: string;
  navLabel: string;
  badge: string;
  desc: string;
  /** The guided tour's name for the area when it differs from the title (see README, Area names). */
  tourTitle: string;
  tabs: string[];
  next: SpokeId;
  x: number;
  y: number;
  r: number;
  titleSize?: number;
  /** The registry row whose reading leads this spoke. */
  primary: string;
  /** A second registry row shown on the bubble. */
  secondary: string | null;
};

/** Short labels drawn next to a figure on a bubble. Labels only. */
const SHORT_LABEL: Record<string, string> = {
  [AI_ANSWER_SHARE_ID]: "answer share",
  [CATEGORY_SHARE_ID]: "weakest category",
  [WRONG_SPEC_FLAGS_ID]: "wrong-spec answers",
  [ENGINE_SPLIT_ID]: "by engine",
  [FEATURED_OFFER_SUPPRESSED_ID]: "withheld above benchmark",
  [FEATURED_OFFER_PRESENT_ID]: "Featured Offer present",
  [AMAZON_OFFER_SHARE_ID]: "Amazon Retail",
  [SELLER_READ_COVERAGE_ID]: "seller read",
  [SELLER_MIX_ID]: "seller mix",
  [MAP_BELOW_ID]: "below MAP",
  [CHANNEL_PRICE_COVERAGE_ID]: "outside prices",
  [BUNDLE_SHARE_ID]: "bundles",
  [SPEC_PAGE_FOUND_ID]: "brand page found",
  [SPEC_ADDITIONAL_PROPERTY_ID]: "missing additionalProperty",
  [SPEC_AMAZON_COMPLETENESS_ID]: "Amazon fields filled",
  [ECOMMERCE_TO_AI_LINK_ID]: "ecommerce to AI link",
  [PRICE_GAP_ID]: "price gap",
  [ESTIMATE_PHASE1_ID]: "first-phase estimate",
  [ESTIMATE_ENTERPRISE_ID]: "enterprise estimate",
  [ACTION_ITEMS_OPEN_ID]: "open Action Items",
  [READING_FRESHNESS_ID]: "oldest reading",
  [CATALOG_MONITORED_ID]: "monitored ASINs",
};

export function shortLabel(registryId: string): string {
  return SHORT_LABEL[registryId] ?? registryId.replace(/_/g, " ");
}

/** Which spoke owns each registry row, for widgets and deep links. */
const SPOKE_FOR: Record<string, SpokeId> = {
  [AI_ANSWER_SHARE_ID]: "aeo",
  [CATEGORY_SHARE_ID]: "aeo",
  [WRONG_SPEC_FLAGS_ID]: "aeo",
  [ENGINE_SPLIT_ID]: "aeo",
  [FEATURED_OFFER_SUPPRESSED_ID]: "ecommerce",
  [FEATURED_OFFER_PRESENT_ID]: "ecommerce",
  [AMAZON_OFFER_SHARE_ID]: "ecommerce",
  [SELLER_READ_COVERAGE_ID]: "ecommerce",
  [SELLER_MIX_ID]: "ecommerce",
  [MAP_BELOW_ID]: "ecommerce",
  [CHANNEL_PRICE_COVERAGE_ID]: "ecommerce",
  [BUNDLE_SHARE_ID]: "ecommerce",
  [SPEC_PAGE_FOUND_ID]: "specs",
  [SPEC_ADDITIONAL_PROPERTY_ID]: "specs",
  [SPEC_AMAZON_COMPLETENESS_ID]: "specs",
  [ECOMMERCE_TO_AI_LINK_ID]: "money",
  [PRICE_GAP_ID]: "money",
  [ESTIMATE_PHASE1_ID]: "money",
  [ESTIMATE_ENTERPRISE_ID]: "money",
  [ACTION_ITEMS_OPEN_ID]: "suggestions",
  [READING_FRESHNESS_ID]: "hub",
  [CATALOG_MONITORED_ID]: "hub",
};

export function spokeFor(all: AllSelections, registryId: string): SpokeId {
  if (registryId === all.retail.primaryRegistryId) return "ecommerce";
  return SPOKE_FOR[registryId] ?? "hub";
}

/** Hub and spoke positions reuse the current dashboard's layout; the money spoke takes the old roadmap slot. */
export function spokeDefs(all: AllSelections): SpokeDef[] {
  return [
    {
      id: "hub",
      nodeId: "hub",
      title: "Brand Portfolio",
      navLabel: "Portfolio",
      badge: "Executive readings",
      desc: "The five executive outputs with their coverage, and when each source was last read.",
      tourTitle: "Brand Portfolio",
      tabs: ["Overview", "Read more", "Sources"],
      next: "aeo",
      x: 800,
      y: 500,
      r: 98,
      primary: all.retail.headline?.registryId ?? FEATURED_OFFER_SUPPRESSED_ID,
      secondary: AI_ANSWER_SHARE_ID,
    },
    {
      id: "aeo",
      nodeId: "spoke-aeo",
      title: "AI Search Visibility",
      navLabel: "AI Search Visibility",
      badge: "AI answers",
      desc: "How often AI assistants name the brand when a shopper asks, by category and by engine, and the answers that state a wrong spec.",
      tourTitle: "AI Search Visibility",
      tabs: ["Overview", "Answers", "Wrong specs", "Read more"],
      next: "ecommerce",
      x: 440,
      y: 320,
      r: 86,
      titleSize: 14.5,
      primary: AI_ANSWER_SHARE_ID,
      secondary: CATEGORY_SHARE_ID,
    },
    {
      id: "ecommerce",
      nodeId: "spoke-retail",
      title: "Portfolio Retail",
      navLabel: "Portfolio Retail",
      badge: "Featured Offer",
      desc: "Who holds the Featured Offer on each active listing, where Amazon withholds it above its outside benchmark, and the outside prices on file.",
      tourTitle: "Portfolio Retail",
      tabs: ["Overview", "Listings", "Suppressed", "Outside prices", "Read more"],
      next: "specs",
      x: 1160,
      y: 320,
      r: 86,
      titleSize: 13.5,
      primary: all.retail.headline?.registryId ?? FEATURED_OFFER_SUPPRESSED_ID,
      secondary: SELLER_READ_COVERAGE_ID,
    },
    {
      id: "specs",
      nodeId: "spoke-specs",
      title: "AI Readiness",
      navLabel: "AI Readiness",
      badge: "Product data",
      desc: "Whether the brand's product data is ready for AI engines to read: brand pages found, additionalProperty blocks, and Amazon field completeness.",
      tourTitle: "Product Readiness",
      tabs: ["Overview", "Pages", "Read more"],
      next: "competitors",
      x: 440,
      y: 680,
      r: 78,
      titleSize: 13.5,
      primary: SPEC_PAGE_FOUND_ID,
      secondary: SPEC_AMAZON_COMPLETENESS_ID,
    },
    {
      id: "competitors",
      nodeId: "spoke-competitors",
      title: "Competitive Radar",
      navLabel: "Competitive Radar",
      badge: "Share by category",
      desc: "The brand's answer share against the top rival in each prompt category, with the resolved answers each share rests on.",
      tourTitle: "Competitive Radar",
      tabs: ["Overview", "Categories", "Read more"],
      next: "suggestions",
      x: 1160,
      y: 680,
      r: 78,
      titleSize: 13,
      primary: CATEGORY_SHARE_ID,
      secondary: ENGINE_SPLIT_ID,
    },
    {
      id: "suggestions",
      nodeId: "spoke-fixes",
      title: "Action Items",
      navLabel: "Action Items",
      badge: "Next steps",
      desc: "Stored actions, each tied to the reading that raised it, with its owner and status.",
      tourTitle: "Action Items",
      tabs: ["Overview", "Read more"],
      next: "money",
      x: 800,
      y: 180,
      r: 74,
      titleSize: 14,
      primary: ACTION_ITEMS_OPEN_ID,
      secondary: null,
    },
    {
      id: "money",
      nodeId: "spoke-roadmap",
      title: "Estimates",
      navLabel: "Estimates",
      badge: "Money as a formula",
      desc: "The price gap on suppressed listings, and the uplift estimates with the inputs each formula needs.",
      tourTitle: "Estimates",
      tabs: ["Overview", "Price gap lines", "Read more"],
      next: "hub",
      x: 800,
      y: 820,
      r: 74,
      titleSize: 14,
      primary: PRICE_GAP_ID,
      secondary: ESTIMATE_PHASE1_ID,
    },
  ];
}

type SatelliteDef = { id: string; spoke: SpokeId; title: string; registryId: string; x: number; y: number; r: number };

/** At most two satellites per spoke, each bound to one registry row, on the current layout's coordinates. */
function satelliteDefs(): SatelliteDef[] {
  return [
    { id: "sat-weakest-category", spoke: "aeo", title: "Weakest category", registryId: CATEGORY_SHARE_ID, x: 240, y: 200, r: 52 },
    { id: "sat-wrong-specs", spoke: "aeo", title: "Wrong specs", registryId: WRONG_SPEC_FLAGS_ID, x: 180, y: 360, r: 52 },
    { id: "sat-suppressed-offers", spoke: "ecommerce", title: "Suppressed offers", registryId: FEATURED_OFFER_SUPPRESSED_ID, x: 1360, y: 200, r: 54 },
    { id: "sat-seller-read", spoke: "ecommerce", title: "Seller read", registryId: SELLER_READ_COVERAGE_ID, x: 1420, y: 360, r: 54 },
    { id: "sat-page-found", spoke: "specs", title: "Page found", registryId: SPEC_PAGE_FOUND_ID, x: 230, y: 720, r: 50 },
    { id: "sat-additional-property", spoke: "specs", title: "additionalProperty", registryId: SPEC_ADDITIONAL_PROPERTY_ID, x: 320, y: 870, r: 48 },
    { id: "sat-rival-share", spoke: "competitors", title: "Top rival", registryId: CATEGORY_SHARE_ID, x: 1370, y: 720, r: 51 },
    { id: "sat-engine-split", spoke: "competitors", title: "Share by engine", registryId: ENGINE_SPLIT_ID, x: 1280, y: 870, r: 48 },
  ];
}

export const SEVERITY_ORDER: NodeStatus[] = ["danger", "warning", "success", "neutral"];

function worst(statuses: NodeStatus[]): NodeStatus {
  for (const s of SEVERITY_ORDER) if (statuses.includes(s)) return s;
  return "neutral";
}

export function readingOf(all: AllSelections, registryId: string): Reading<unknown> | null {
  return all.readings[registryId] ?? null;
}

export function unitOf(all: AllSelections, registryId: string): RegistryUnit | undefined {
  return registryFor(all, registryId)?.unit;
}

export function statusOf(all: AllSelections, registryId: string): NodeStatus {
  const reading = readingOf(all, registryId);
  if (!reading) return "neutral";
  return statusFor(reading, registryFor(all, registryId));
}

/** The full formatted line for a registry id, or the unavailable word when the selectors produced nothing. */
export function lineOf(all: AllSelections, registryId: string): string {
  const reading = readingOf(all, registryId);
  if (!reading) return `${UNAVAILABLE_WORD}: no selector produced this reading`;
  return formatReading(reading, unitOf(all, registryId));
}

/** The figure alone (or the unavailable word). */
export function figureOf(all: AllSelections, registryId: string): string {
  const reading = readingOf(all, registryId);
  if (!reading) return UNAVAILABLE_WORD;
  return figureText(reading, unitOf(all, registryId));
}

/** A bubble stat: the figure followed by a short label, or the label marked unavailable. */
export function statOf(all: AllSelections, registryId: string): string {
  const reading = readingOf(all, registryId);
  const label = shortLabel(registryId);
  if (!reading || reading.status === "unavailable") return `${label}: ${UNAVAILABLE_WORD}`;
  if (isRate(reading.value)) {
    return `${figureText({ ...reading, value: reading.value.pct }, "percent")} ${label}`;
  }
  return `${figureOf(all, registryId)} ${label}`;
}

/** The second stat for a rate: its numerator and denominator. */
export function countStatOf(all: AllSelections, registryId: string): string | null {
  const reading = readingOf(all, registryId);
  if (!reading || reading.status === "unavailable" || !isRate(reading.value)) return null;
  return `${formatInt(reading.value.numerator)} of ${formatInt(reading.value.denominator)}`;
}

/** Coverage or as-of line for a node's meta. */
export function metaOf(all: AllSelections, registryId: string): string {
  const reading = readingOf(all, registryId);
  if (!reading) return UNAVAILABLE_WORD;
  return coverageLine(reading);
}

export function tooltipOf(all: AllSelections, registryId: string, fallbackTitle: string): { title: string; desc: string } {
  const registry = registryFor(all, registryId);
  const reading = readingOf(all, registryId);
  const title = registry?.name ?? fallbackTitle;
  const meaning = registry?.meaning ?? "No registry row is stored for this reading.";
  const asOf = reading ? asOfLine(reading) : UNAVAILABLE_WORD;
  return { title, desc: `${meaning} ${asOf[0].toUpperCase()}${asOf.slice(1)}.` };
}

export function severityOf(status: NodeStatus): PrioritySeverity {
  if (status === "danger") return "critical";
  if (status === "warning") return "high";
  return "moderate";
}

export function tickerToneOf(status: NodeStatus): TickerTone {
  if (status === "danger") return "danger";
  if (status === "warning") return "warning";
  return "success";
}

/** The numerator-and-denominator sentence for an item's "why". */
export function whyOf(all: AllSelections, registryId: string): string {
  const registry = registryFor(all, registryId);
  const reading = readingOf(all, registryId);
  const detail = all.details[registryId];
  if (!reading) return `${registry?.meaning ?? ""} ${UNAVAILABLE_WORD}.`.trim();
  const sentence = numeratorDenominatorSentence(
    reading,
    { numerator: detail?.numerator ?? null, denominator: detail?.denominator ?? null },
    registry,
    unitOf(all, registryId),
  );
  const cover = reading.status === "partial" ? ` ${coverageLine(reading)[0].toUpperCase()}${coverageLine(reading).slice(1)}.` : "";
  return `${registry?.meaning ?? ""} ${sentence}${cover}`.trim();
}

export type CardModel = {
  id: string;
  registryId: string;
  label: string;
  value: string;
  sub: string;
  tone: NodeStatus;
};

function card(all: AllSelections, id: string, registryId: string, label: string, reading: Reading<unknown> | null, unit?: RegistryUnit, subExtra?: string): CardModel {
  const registry = registryFor(all, registryId);
  const r = reading ?? readingOf(all, registryId);
  const status = r ? statusFor(r, registry) : "neutral";
  const value = r ? figureText(r, unit ?? registry?.unit) : UNAVAILABLE_WORD;
  const extra = subExtra ? (/[.?!]$/.test(subExtra) ? subExtra : `${subExtra}.`) : null;
  const sub = r ? [extra, coverageLine(r)].filter(Boolean).join(" ") : UNAVAILABLE_WORD;
  return { id, registryId, label, value, sub, tone: status };
}

/** The cards each spoke's first tab shows. Labels are registry names; values and subs are formatted readings. */
export function spokeCards(all: AllSelections): Record<SpokeId, CardModel[]> {
  const name = (id: string) => registryFor(all, id)?.name ?? shortLabel(id);
  const retailPrimary = all.retail.primaryRegistryId;
  const w = all.weakest;

  const hub: CardModel[] = [
    card(all, "hub-retail", retailPrimary, name(retailPrimary), null),
    card(all, "hub-suppressed", FEATURED_OFFER_SUPPRESSED_ID, name(FEATURED_OFFER_SUPPRESSED_ID), null),
    card(all, "hub-ai", AI_ANSWER_SHARE_ID, name(AI_ANSWER_SHARE_ID), null),
    card(all, "hub-spec", SPEC_PAGE_FOUND_ID, name(SPEC_PAGE_FOUND_ID), null),
    card(all, "hub-gap", PRICE_GAP_ID, name(PRICE_GAP_ID), null),
    card(all, "hub-actions", ACTION_ITEMS_OPEN_ID, name(ACTION_ITEMS_OPEN_ID), null),
    card(all, "hub-catalog", CATALOG_MONITORED_ID, name(CATALOG_MONITORED_ID), null, undefined, `${figureText(all.catalog.active.reading, "count")} with an active offer`),
    card(all, "hub-freshness", READING_FRESHNESS_ID, name(READING_FRESHNESS_ID), null, undefined, all.freshness.oldest ? `oldest source ${all.freshness.oldest.workflowName}` : undefined),
  ];

  const aeo: CardModel[] = [
    card(all, "aeo-share", AI_ANSWER_SHARE_ID, name(AI_ANSWER_SHARE_ID), null),
    card(all, "aeo-weakest", CATEGORY_SHARE_ID, name(CATEGORY_SHARE_ID), null, undefined, w.category ? `${w.category}; top rival ${w.topRival ?? UNAVAILABLE_WORD} ${w.rivalShare ? figureText(w.rivalShare) : ""}`.trim() : undefined),
    card(all, "aeo-wrong-spec", WRONG_SPEC_FLAGS_ID, name(WRONG_SPEC_FLAGS_ID), null),
    ...all.engineSplit.engines.map((e) => card(all, `aeo-engine-${e.engine}`, ENGINE_SPLIT_ID, `${name(ENGINE_SPLIT_ID)}, ${e.label}`, e.reading, "percent")),
  ];

  const ecommerce: CardModel[] = [
    card(all, "retail-primary", retailPrimary, name(retailPrimary), null, undefined, all.retail.primaryQuestion ?? undefined),
    card(all, "retail-suppressed", FEATURED_OFFER_SUPPRESSED_ID, name(FEATURED_OFFER_SUPPRESSED_ID), null),
    card(all, "retail-present", FEATURED_OFFER_PRESENT_ID, name(FEATURED_OFFER_PRESENT_ID), null),
    card(all, "retail-amazon", AMAZON_OFFER_SHARE_ID, name(AMAZON_OFFER_SHARE_ID), null),
    card(all, "retail-seller-read", SELLER_READ_COVERAGE_ID, name(SELLER_READ_COVERAGE_ID), null),
    ...all.sellerMix.classes.map((c) => card(all, `retail-seller-${c.sellerClass}`, SELLER_MIX_ID, `${name(SELLER_MIX_ID)}, ${c.label}`, c.reading, "count")),
    card(all, "retail-map", MAP_BELOW_ID, name(MAP_BELOW_ID), null),
    ...all.channelCoverage.channels.map((c) => card(all, `retail-channel-${c.channel}`, CHANNEL_PRICE_COVERAGE_ID, `${name(CHANNEL_PRICE_COVERAGE_ID)}, ${c.label}`, c.reading, "percent")),
    card(all, "retail-bundles", BUNDLE_SHARE_ID, name(BUNDLE_SHARE_ID), null),
  ];

  const specs: CardModel[] = [
    card(all, "spec-found", SPEC_PAGE_FOUND_ID, name(SPEC_PAGE_FOUND_ID), null),
    card(all, "spec-additional", SPEC_ADDITIONAL_PROPERTY_ID, name(SPEC_ADDITIONAL_PROPERTY_ID), null),
    card(all, "spec-amazon", SPEC_AMAZON_COMPLETENESS_ID, name(SPEC_AMAZON_COMPLETENESS_ID), null),
  ];

  const competitors: CardModel[] = [
    card(all, "comp-weakest", CATEGORY_SHARE_ID, `${name(CATEGORY_SHARE_ID)}, brand share`, null, undefined, w.category ?? undefined),
    card(all, "comp-rival", CATEGORY_SHARE_ID, `${name(CATEGORY_SHARE_ID)}, top rival`, w.rivalShare, "percent", w.topRival ?? undefined),
    card(all, "comp-gap", CATEGORY_SHARE_ID, `${name(CATEGORY_SHARE_ID)}, gap`, w.gapPoints.status === "unavailable" ? w.gapPoints : { ...w.gapPoints, value: formatPoints(w.gapPoints.value) }, "none"),
    card(all, "comp-engines", ENGINE_SPLIT_ID, name(ENGINE_SPLIT_ID), null),
  ];

  const suggestions: CardModel[] = [
    card(all, "actions-open", ACTION_ITEMS_OPEN_ID, name(ACTION_ITEMS_OPEN_ID), null),
    ...all.actions.byOwner.map((o) => ({
      id: `actions-owner-${o.key}`,
      registryId: ACTION_ITEMS_OPEN_ID,
      label: `${name(ACTION_ITEMS_OPEN_ID)}, owner ${o.key}`,
      value: formatInt(o.count),
      sub: coverageLine(all.actions.reading),
      tone: "neutral" as NodeStatus,
    })),
  ];

  const money: CardModel[] = [
    card(all, "money-gap", PRICE_GAP_ID, name(PRICE_GAP_ID), null),
    ...all.estimates.map((e) => card(all, `money-${e.registryId}`, e.registryId, name(e.registryId), null, undefined, e.estimate ? `formula: ${e.estimate.formula}` : undefined)),
    card(all, "money-link", ECOMMERCE_TO_AI_LINK_ID, name(ECOMMERCE_TO_AI_LINK_ID), null, undefined, `measured sides: ${figureOf(all, AI_ANSWER_SHARE_ID)} ${shortLabel(AI_ANSWER_SHARE_ID)}; ${figureOf(all, FEATURED_OFFER_SUPPRESSED_ID)} ${shortLabel(FEATURED_OFFER_SUPPRESSED_ID)}`),
  ];

  return { hub, aeo, ecommerce, specs, competitors, suggestions, money };
}

/** The five executive outputs the hub summarizes. */
export function executiveRegistryIds(all: AllSelections): string[] {
  return [
    all.retail.headline?.registryId ?? FEATURED_OFFER_SUPPRESSED_ID,
    AI_ANSWER_SHARE_ID,
    SPEC_PAGE_FOUND_ID,
    PRICE_GAP_ID,
    ACTION_ITEMS_OPEN_ID,
  ];
}

export type SpecModel = {
  brand: { name: string; subtitle: string };
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  focusTargets: Record<string, { x: number; y: number }>;
  spokes: SpokeDef[];
  cards: Record<SpokeId, CardModel[]>;
  commandCenter: CommandCenterSpec;
  tour: TourStep[];
  metrics: CanvasMetric[];
  metricDefaults: [string | null, string | null, string | null];
  tickers: Array<{ id: string; label: string; tone: TickerTone; spokeId: SpokeId; subTab?: string; registryId: string }>;
  legend: CanvasLegendItem[];
  /** "Readings as of <oldest> (oldest source)". */
  headerText: string;
  /** Chart data for every first view, from the same readings the figures use. */
  firstViews: FirstViews;
  /** Which registry ids each surface element is bound to, for the surfaces test. */
  bindings: {
    nodes: Record<string, string[]>;
    commandItems: Record<string, string>;
    tour: Record<string, string[]>;
    metrics: Record<string, string>;
    tickers: Record<string, string>;
  };
};

export function headerText(all: AllSelections): string {
  const f = all.freshness;
  if (f.reading.status === "unavailable" || !f.oldest) return `Readings ${UNAVAILABLE_WORD}: ${f.reading.status === "unavailable" ? f.reading.reason : "no source read"}`;
  return `Readings as of ${formatAsOf(f.oldest.asOf)} (oldest source)`;
}

function edgeKind(status: NodeStatus): CanvasEdge["kind"] {
  if (status === "danger") return "critical";
  if (status === "warning") return "warning";
  return "default";
}

export const METRIC_STORAGE_KEY = "ifai:dashboard-v2:metric-widgets:v1";
export const COMMAND_STORAGE_KEY = "ifai:dashboard-v2:command-center:v1";

export function buildSpecModel(all: AllSelections): SpecModel {
  const spokes = spokeDefs(all);
  const satellites = satelliteDefs();
  const cards = spokeCards(all);
  const name = (id: string) => registryFor(all, id)?.name ?? shortLabel(id);

  const bindings: SpecModel["bindings"] = { nodes: {}, commandItems: {}, tour: {}, metrics: {}, tickers: {} };
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];
  const focusTargets: Record<string, { x: number; y: number }> = {};

  const hubDef = spokes.find((s) => s.id === "hub") as SpokeDef;
  const execIds = executiveRegistryIds(all);
  const hubStats = [...execIds]
    .map((id) => ({ id, stat: statOf(all, id) }))
    .sort((a, b) => a.stat.length - b.stat.length || execIds.indexOf(a.id) - execIds.indexOf(b.id))
    .slice(0, 2);
  const hubStatus = worst(execIds.map((id) => statusOf(all, id)));
  const hubTooltip = tooltipOf(all, CATALOG_MONITORED_ID, hubDef.title);
  nodes.push({
    id: hubDef.nodeId,
    x: hubDef.x,
    y: hubDef.y,
    r: hubDef.r,
    status: hubStatus,
    variant: "hub",
    title: hubDef.title,
    stats: hubStats.map((s) => s.stat),
    meta: headerText(all),
    logoSrc: `${basePath()}/image.png`,
    spokeId: "hub",
    tooltip: { title: hubDef.title, desc: hubTooltip.desc },
  });
  bindings.nodes[hubDef.nodeId] = [...hubStats.map((s) => s.id), CATALOG_MONITORED_ID, READING_FRESHNESS_ID];
  focusTargets.hub = { x: hubDef.x, y: hubDef.y };

  for (const def of spokes) {
    if (def.id === "hub") continue;
    const stats = [statOf(all, def.primary)];
    const count = countStatOf(all, def.primary);
    if (count) stats.push(count);
    else if (def.secondary) stats.push(statOf(all, def.secondary));
    const tooltip = tooltipOf(all, def.primary, def.title);
    const status = statusOf(all, def.primary);
    nodes.push({
      id: def.nodeId,
      x: def.x,
      y: def.y,
      r: def.r,
      status,
      title: def.title,
      titleSize: def.titleSize,
      stats,
      meta: metaOf(all, def.primary),
      spokeId: def.id,
      tooltip,
    });
    bindings.nodes[def.nodeId] = [def.primary, ...(count || !def.secondary ? [] : [def.secondary])];
    edges.push({ x1: hubDef.x, y1: hubDef.y, x2: def.x, y2: def.y, kind: edgeKind(status) });
    focusTargets[def.id] = { x: def.x, y: def.y };
  }

  for (const sat of satellites) {
    const parent = spokes.find((s) => s.id === sat.spoke) as SpokeDef;
    const status = statusOf(all, sat.registryId);
    const isRival = sat.id === "sat-rival-share";
    const isEngines = sat.id === "sat-engine-split";
    const rival = all.weakest.rivalShare;
    let stats: string[];
    if (isRival) {
      stats = [
        rival && rival.status !== "unavailable" ? `${figureText({ ...rival, value: rival.value.pct }, "percent")} ${all.weakest.topRival ?? "top rival"}` : `top rival: ${UNAVAILABLE_WORD}`,
        all.weakest.category ? `in ${all.weakest.category}` : `category: ${UNAVAILABLE_WORD}`,
      ];
    } else if (isEngines && all.engineSplit.engines.length > 0) {
      // One short figure per engine instead of the composite line.
      stats = all.engineSplit.engines.map((e) =>
        e.reading.status === "unavailable" ? `${e.label}: ${UNAVAILABLE_WORD}` : `${figureText({ ...e.reading, value: e.reading.value.pct }, "percent")} ${e.label}`,
      );
    } else {
      stats = [statOf(all, sat.registryId), countStatOf(all, sat.registryId) ?? metaOf(all, sat.registryId)];
    }
    const tooltip = tooltipOf(all, sat.registryId, sat.title);
    nodes.push({
      id: sat.id,
      x: sat.x,
      y: sat.y,
      r: sat.r,
      status: isRival && rival ? statusFor(rival, registryFor(all, sat.registryId)) : status,
      title: sat.title,
      stats,
      meta: metaOf(all, sat.registryId),
      spokeId: sat.spoke,
      subTab: parent.tabs[0],
      tooltip,
    });
    bindings.nodes[sat.id] = [sat.registryId];
    edges.push({ x1: parent.x, y1: parent.y, x2: sat.x, y2: sat.y, kind: edgeKind(status) });
    focusTargets[`${sat.spoke}:${sat.title}`] = { x: sat.x, y: sat.y };
  }

  // Command center: the retail headline and its coverage, then the top finding of each other spoke.
  const items: PriorityItem[] = [];
  const retail = all.retail;
  if (retail.headline) {
    const id = retail.headline.registryId;
    items.push({
      id: `cc-${id}`,
      title: name(id),
      why: whyOf(all, id),
      impact: lineOf(all, id),
      severity: severityOf(statusOf(all, id)),
      spokeId: "ecommerce",
      subTab: spokes.find((s) => s.id === "ecommerce")?.tabs[0],
    });
    bindings.commandItems[`cc-${id}`] = id;
  }
  for (const f of retail.coverage) {
    const id = f.registryId;
    const reason = f.reading.status === "unavailable" ? f.reading.reason : lineOf(all, id);
    items.push({
      id: `cc-coverage-${id}`,
      title: `${name(id)}: ${UNAVAILABLE_WORD}`,
      why: `${registryFor(all, id)?.meaning ?? ""} ${reason}${retail.primaryQuestion ? ` The seller type's question: ${retail.primaryQuestion}` : ""}`.trim(),
      severity: severityOf(statusOf(all, id)),
      spokeId: "ecommerce",
      subTab: spokes.find((s) => s.id === "ecommerce")?.tabs[0],
    });
    bindings.commandItems[`cc-coverage-${id}`] = id;
  }
  const topFindings: Array<{ spoke: SpokeId; registryId: string }> = [
    { spoke: "aeo", registryId: CATEGORY_SHARE_ID },
    { spoke: "specs", registryId: SPEC_PAGE_FOUND_ID },
    { spoke: "competitors", registryId: ENGINE_SPLIT_ID },
    { spoke: "suggestions", registryId: ACTION_ITEMS_OPEN_ID },
    { spoke: "money", registryId: PRICE_GAP_ID },
  ];
  for (const { spoke, registryId } of topFindings) {
    const def = spokes.find((s) => s.id === spoke) as SpokeDef;
    const itemId = `cc-${spoke}-${registryId}`;
    items.push({
      id: itemId,
      title: name(registryId),
      why: whyOf(all, registryId),
      impact: lineOf(all, registryId),
      severity: severityOf(statusOf(all, registryId)),
      spokeId: spoke,
      subTab: def.tabs[0],
    });
    bindings.commandItems[itemId] = registryId;
  }
  const commandCenter: CommandCenterSpec = {
    badge: "Readings",
    title: "What needs attention",
    desc: "Confirmed findings lead. An unavailable reading sits beside the headline as coverage, never as the headline.",
    summary: `${figureOf(all, ACTION_ITEMS_OPEN_ID)} open Action Items. ${headerText(all)}.`,
    items,
    storageKey: COMMAND_STORAGE_KEY,
  };

  // Tour: seven steps, one per node, whose displays are formatted readings only.
  const tour: TourStep[] = spokes.map((def, index) => {
    const ids = def.id === "hub" ? execIds : [def.primary, ...(def.secondary ? [def.secondary] : [])];
    const displays = ids.map((id) => `${name(id)}: ${lineOf(all, id)}`);
    bindings.tour[String(index)] = ids;
    return {
      nodeId: def.id,
      targetX: def.x,
      targetY: def.y,
      radius: def.r + 60,
      title: def.tourTitle,
      subtitle: name(ids[0]),
      category: def.badge,
      displays,
      value: figureOf(all, ids[0]),
    };
  });

  // Metric widgets: one per registry row the selectors produced.
  const metrics: CanvasMetric[] = Object.keys(all.readings).map((id) => {
    const registry = registryFor(all, id);
    const reading = all.readings[id];
    const provenance: CanvasMetric["provenance"] =
      registry?.confidence === "estimate" ? "estimate" : registry?.confidence === "assumption" ? "recorded" : "live";
    bindings.metrics[`metric-${id}`] = id;
    return {
      id: `metric-${id}`,
      spokeId: spokeFor(all, id),
      label: name(id),
      value: markFigure(reading, registry),
      detail: coverageLine(reading),
      tone: statusOf(all, id),
      subTab: spokes.find((s) => s.id === spokeFor(all, id))?.tabs[0],
      provenance,
    };
  });
  const metricDefaults: SpecModel["metricDefaults"] = [
    `metric-${FEATURED_OFFER_SUPPRESSED_ID}`,
    `metric-${AI_ANSWER_SHARE_ID}`,
    `metric-${ACTION_ITEMS_OPEN_ID}`,
  ].map((id) => (metrics.some((m) => m.id === id) ? id : null)) as SpecModel["metricDefaults"];

  const tickerIds: Array<{ id: string; registryId: string; spoke: SpokeId }> = [
    { id: "ticker-retail", registryId: retail.headline?.registryId ?? FEATURED_OFFER_SUPPRESSED_ID, spoke: "ecommerce" },
    { id: "ticker-ai", registryId: AI_ANSWER_SHARE_ID, spoke: "aeo" },
    { id: "ticker-gap", registryId: PRICE_GAP_ID, spoke: "money" },
  ];
  const tickers = tickerIds.map((t) => {
    bindings.tickers[t.id] = t.registryId;
    return {
      id: t.id,
      label: `${name(t.registryId)}: ${lineOf(all, t.registryId)}`,
      tone: tickerToneOf(statusOf(all, t.registryId)),
      spokeId: t.spoke,
      subTab: spokes.find((s) => s.id === t.spoke)?.tabs[0],
      registryId: t.registryId,
    };
  });

  const legend: CanvasLegendItem[] = [
    { status: "danger", label: "Needs attention" },
    { status: "warning", label: "Watch, or not final" },
    { status: "success", label: "On track" },
  ];

  return {
    brand: { name: "IntoFocus", subtitle: all.clientName ?? UNAVAILABLE_WORD },
    nodes,
    edges,
    focusTargets,
    spokes,
    cards,
    commandCenter,
    tour,
    metrics,
    metricDefaults,
    tickers,
    legend,
    headerText: headerText(all),
    firstViews: buildFirstViews(all, execIds),
    bindings,
  };
}

/** Every visible string in the model, by surface, for the surfaces test. */
export function surfaceStrings(model: SpecModel): Record<string, string[]> {
  const out: Record<string, string[]> = { nodes: [], commandCenter: [], tour: [], metrics: [], tickers: [], cards: [], header: [], firstViews: [] };
  for (const n of model.nodes) out.nodes.push(n.title, ...n.stats, n.meta ?? "", n.tooltip.title, n.tooltip.desc);
  const cc = model.commandCenter;
  out.commandCenter.push(cc.title, cc.desc, cc.summary ?? "", cc.badge ?? "");
  for (const item of cc.items) out.commandCenter.push(item.title, item.why, item.impact ?? "");
  for (const step of model.tour) out.tour.push(step.title, step.subtitle, step.category, step.value, ...step.displays);
  for (const m of model.metrics) out.metrics.push(m.label, m.value, m.detail);
  for (const t of model.tickers) out.tickers.push(t.label);
  for (const list of Object.values(model.cards)) for (const c of list) out.cards.push(c.label, c.value, c.sub);
  out.header.push(model.headerText, model.brand.name, model.brand.subtitle);
  out.firstViews.push(...firstViewStrings(model.firstViews));
  for (const key of Object.keys(out)) out[key] = out[key].filter(Boolean);
  return out;
}
