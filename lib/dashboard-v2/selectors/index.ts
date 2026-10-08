import { formatAsOf, formatInt, formatReading, formatReadingParts, formatUsd } from "../reading/format";
import { asOfLine, coverageLine, figureText, formatPoints, numeratorDenominatorSentence } from "../reading/lines";
import type { Reading, RegistryRow } from "../reading/types";
import type { ListingCurrentRow, SandboxBundle } from "../data/types";
import { selectActions, type Actions } from "./actions";
import { selectAiAnswerShare } from "./ai-answer-share";
import { selectAmazonOfferShare } from "./amazon-offer-share";
import { selectBundleShare } from "./bundle-share";
import { selectCatalog, type Catalog } from "./catalog";
import { selectChannelPriceCoverage, type ChannelPriceCoverage } from "./channel-price-coverage";
import { registryRow, toRegistryRow, type MetricReading } from "./common";
import { selectEcommerceToAiLink, type EcommerceToAiLink } from "./ecommerce-to-ai-link";
import { selectEngineSplit, type EngineSplit } from "./engine-split";
import { selectEstimates, type Estimate } from "./estimate";
import { selectFeaturedOfferPresent, selectFeaturedOfferStates, selectFeaturedOfferSuppressed, type FeaturedOfferStates } from "./featured-offer";
import { selectFreshness, type Freshness } from "./freshness";
import { selectMapBelow } from "./map-below";
import { selectPriceGapAboveBenchmark, type PriceGap } from "./price-gap";
import { selectRetailHeadline, type RetailHeadline } from "./retail-headline";
import { selectSellerMix, type SellerMix } from "./seller-mix";
import { selectSpecReadiness, type SpecReadiness } from "./spec-readiness";
import { selectWeakestCategory, type WeakestCategory } from "./weakest-category";
import { selectWrongSpecFlags } from "./wrong-spec-flags";

export * from "./actions";
export * from "./ai-answer-share";
export * from "./amazon-offer-share";
export * from "./bundle-share";
export * from "./catalog";
export * from "./channel-price-coverage";
export * from "./common";
export * from "./ecommerce-to-ai-link";
export * from "./engine-split";
export * from "./estimate";
export * from "./featured-offer";
export * from "./freshness";
export * from "./map-below";
export * from "./price-gap";
export * from "./retail-headline";
export * from "./seller-mix";
export * from "./spec-readiness";
export * from "./weakest-category";
export * from "./wrong-spec-flags";

export type AllSelections = {
  bundle: SandboxBundle;
  /** One primary reading per registry id the selectors produced. */
  readings: Record<string, Reading<unknown>>;
  /** The stored numerator and denominator and the run behind metric readings, by registry id. */
  details: Record<string, MetricReading>;
  aiAnswerShare: MetricReading;
  weakest: WeakestCategory;
  wrongSpec: MetricReading;
  engineSplit: EngineSplit;
  retail: RetailHeadline;
  amazonOfferShare: MetricReading;
  sellerMix: SellerMix;
  featuredPresent: MetricReading;
  featuredSuppressed: MetricReading;
  /** The Featured Offer states the retail first view stacks. */
  offerStates: FeaturedOfferStates;
  mapBelow: MetricReading;
  channelCoverage: ChannelPriceCoverage;
  bundleShare: MetricReading;
  spec: SpecReadiness;
  link: EcommerceToAiLink;
  priceGap: PriceGap;
  estimates: Estimate[];
  actions: Actions;
  freshness: Freshness;
  catalog: Catalog;
  clientName: string | null;
};

/** Runs every selector once over the bundle. Surfaces read from this, never from the bundle directly. */
export function selectAll(bundle: SandboxBundle, listings?: ListingCurrentRow[]): AllSelections {
  const aiAnswerShare = selectAiAnswerShare(bundle);
  const weakest = selectWeakestCategory(bundle);
  const wrongSpec = selectWrongSpecFlags(bundle);
  const engineSplit = selectEngineSplit(bundle);
  const retail = selectRetailHeadline(bundle);
  const amazonOfferShare = selectAmazonOfferShare(bundle);
  const sellerMix = selectSellerMix(bundle);
  const featuredPresent = selectFeaturedOfferPresent(bundle);
  const featuredSuppressed = selectFeaturedOfferSuppressed(bundle);
  const offerStates = selectFeaturedOfferStates(bundle);
  const mapBelow = selectMapBelow(bundle);
  const channelCoverage = selectChannelPriceCoverage(bundle);
  const bundleShare = selectBundleShare(bundle);
  const spec = selectSpecReadiness(bundle);
  const link = selectEcommerceToAiLink(bundle);
  const priceGap = selectPriceGapAboveBenchmark(bundle, listings);
  const estimates = selectEstimates(bundle);
  const actions = selectActions(bundle);
  const freshness = selectFreshness(bundle);
  const catalog = selectCatalog(bundle);
  const client = bundle.client.error ? null : (bundle.client.rows[0] ?? null);

  const details: Record<string, MetricReading> = {
    [aiAnswerShare.reading.registryId]: aiAnswerShare,
    [wrongSpec.reading.registryId]: wrongSpec,
    [amazonOfferShare.reading.registryId]: amazonOfferShare,
    [sellerMix.coverage.reading.registryId]: sellerMix.coverage,
    [featuredPresent.reading.registryId]: featuredPresent,
    [featuredSuppressed.reading.registryId]: featuredSuppressed,
    [mapBelow.reading.registryId]: mapBelow,
    [bundleShare.reading.registryId]: bundleShare,
    [spec.pageFound.reading.registryId]: spec.pageFound,
    [spec.additionalPropertyMissing.reading.registryId]: spec.additionalPropertyMissing,
    [spec.amazonCompleteness.reading.registryId]: spec.amazonCompleteness,
    [link.link.reading.registryId]: link.link,
    [priceGap.reading.registryId]: priceGap,
    [catalog.monitored.reading.registryId]: catalog.monitored,
    [retail.primaryRegistryId]: retail.details[retail.primaryRegistryId],
  };

  const readings: Record<string, Reading<unknown>> = {};
  for (const [id, d] of Object.entries(details)) readings[id] = d.reading;
  readings[weakest.reading.registryId] = weakest.reading;
  readings[engineSplit.reading.registryId] = engineSplit.reading;
  readings[sellerMix.reading.registryId] = sellerMix.reading;
  readings[channelCoverage.reading.registryId] = channelCoverage.reading;
  for (const e of estimates) readings[e.registryId] = e.reading;
  readings[actions.reading.registryId] = actions.reading;
  readings[freshness.reading.registryId] = freshness.reading;

  return {
    bundle,
    readings,
    details,
    aiAnswerShare,
    weakest,
    wrongSpec,
    engineSplit,
    retail,
    amazonOfferShare,
    sellerMix,
    featuredPresent,
    featuredSuppressed,
    offerStates,
    mapBelow,
    channelCoverage,
    bundleShare,
    spec,
    link,
    priceGap,
    estimates,
    actions,
    freshness,
    catalog,
    clientName: client?.name ?? null,
  };
}

export function registryFor(all: AllSelections, registryId: string): RegistryRow | null {
  return registryRow(all.bundle, registryId);
}

function unitFor(all: AllSelections, registryId: string) {
  return registryFor(all, registryId)?.unit;
}

/** Every line a surface may show for one reading: figure, full line, coverage, as-of, and the stored sentence. */
export function readingLines(all: AllSelections, registryId: string): string[] {
  const reading = all.readings[registryId];
  if (!reading) return [];
  const unit = unitFor(all, registryId);
  const detail = all.details[registryId];
  const lines = [
    formatReading(reading, unit),
    figureText(reading, unit),
    formatReadingParts(reading, unit).note ?? "",
    coverageLine(reading),
    asOfLine(reading),
  ];
  if (detail) {
    lines.push(numeratorDenominatorSentence(reading, { numerator: detail.numerator, denominator: detail.denominator }, detail.registry, unit));
  }
  return lines.filter(Boolean);
}

/**
 * Every formatted string the selectors can produce for this bundle. The surfaces test tokenizes
 * these and refuses any figure on a surface that is not among them.
 */
export function allFormattedStrings(all: AllSelections): string[] {
  const out: string[] = [];
  for (const id of Object.keys(all.readings)) out.push(...readingLines(all, id));

  if (!all.bundle.registry.error) {
    for (const row of all.bundle.registry.rows) {
      const r = toRegistryRow(row);
      out.push(r.name, r.meaning, r.formula, r.population, r.notes, r.source_tables);
    }
  }
  if (all.clientName) out.push(all.clientName);
  if (all.retail.primaryQuestion) out.push(all.retail.primaryQuestion);
  if (all.retail.sellerTypeLabel) out.push(all.retail.sellerTypeLabel);
  out.push(all.retail.rule);
  for (const f of all.retail.findings) out.push(formatReading(f.reading, unitFor(all, f.registryId)), coverageLine(f.reading));

  const w = all.weakest;
  if (w.category) out.push(w.category);
  if (w.topRival) out.push(w.topRival);
  if (w.rivalShare) out.push(formatReading(w.rivalShare), figureText(w.rivalShare));
  if (w.gapPoints.status !== "unavailable") out.push(formatPoints(w.gapPoints.value));
  for (const c of w.categories) {
    out.push(c.category, formatReading(c.clientShare), figureText(c.clientShare), formatInt(c.resolved));
    if (c.topRival) out.push(c.topRival);
    if (c.rivalShare) out.push(formatReading(c.rivalShare), figureText(c.rivalShare));
  }
  for (const e of all.engineSplit.engines) out.push(e.label, formatReading(e.reading), figureText(e.reading));
  for (const c of all.sellerMix.classes) out.push(c.label, formatReading(c.reading, "count"), figureText(c.reading, "count"));
  for (const r of Object.values(all.offerStates)) out.push(formatReading(r, "count"), figureText(r, "count"), coverageLine(r));
  out.push(formatReading(all.spec.additionalPropertyPresent), figureText(all.spec.additionalPropertyPresent));
  if (all.spec.additionalPropertyPresent.status !== "unavailable") {
    out.push(formatInt(all.spec.additionalPropertyPresent.value.numerator), formatInt(all.spec.additionalPropertyPresent.value.denominator));
  }
  for (const c of all.channelCoverage.channels) out.push(c.label, formatReading(c.reading), figureText(c.reading));

  for (const e of all.estimates) {
    if (e.estimate) out.push(e.estimate.name, e.estimate.formula, e.estimate.unit, asOfLine(e.reading), formatAsOf(e.estimate.as_of));
    out.push(...e.inputKeys, ...e.missing);
    for (const line of e.lines) out.push(line.key, formatUsd(line.value), line.source, formatAsOf(line.asOf), line.owner, line.confidence);
  }
  for (const line of all.priceGap.lines) {
    out.push(line.asin, line.title ?? "", formatUsd(line.offerPrice), formatUsd(line.benchmark), formatUsd(line.gap), formatAsOf(line.readAt));
  }
  if (all.priceGap.linesTotal !== null) out.push(formatUsd(all.priceGap.linesTotal));

  for (const row of all.actions.rows) out.push(row.title, row.owner, row.status, row.severity ?? "", formatAsOf(row.created_at));
  for (const c of [...all.actions.byOwner, ...all.actions.byStatus, ...all.actions.bySeverity]) out.push(c.key, formatInt(c.count));
  out.push(formatInt(all.actions.open.length), formatInt(all.actions.rows.length));

  for (const s of all.freshness.sources) {
    out.push(s.workflowName, s.source, formatAsOf(s.asOf), s.status, `${formatInt(s.read)} of ${formatInt(s.population)}`);
    if (s.aiRunCount !== null) out.push(formatInt(s.aiRunCount));
  }
  for (const c of all.catalog.byCategory) out.push(c.category, formatReading(c.reading, "count"), figureText(c.reading, "count"));
  out.push(formatReading(all.catalog.active.reading, "count"), figureText(all.catalog.active.reading, "count"), coverageLine(all.catalog.active.reading));

  return out.filter((s) => typeof s === "string" && s.length > 0);
}
