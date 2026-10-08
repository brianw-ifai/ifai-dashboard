/**
 * The one place a stored enum code becomes words a reader sees. Every CHECK list in
 * docs/v2/schema/ifai-dashboard-v2.schema.json has a kind here, and the labels test fails when a
 * code in the schema has no label. Raw codes (amazon_retail, not_read, in_progress) never reach
 * the screen; surfaces call labelFor() and the table columns name their labelKind.
 */

export type LabelKind =
  | "seller_type"
  | "marketplace"
  | "authorization_status"
  | "retailer"
  | "source"
  | "trigger_type"
  | "run_status"
  | "offer_status"
  | "seller_class"
  | "channel"
  | "match_status"
  | "engine"
  | "outcome"
  | "legacy_source"
  | "unit"
  | "confidence"
  | "registry_owner"
  | "action_owner"
  | "action_status"
  | "severity"
  | "reading_status";

export const ENUM_LABELS: Record<LabelKind, Record<string, string>> = {
  seller_type: {
    partner_led: "Partner-led",
    brand_led_marketplace: "Brand-led marketplace",
    amazon_retail_only: "Amazon Retail only",
    hybrid: "Hybrid",
    no_managed_presence: "No managed presence",
  },
  marketplace: { amazon: "Amazon" },
  authorization_status: { authorized: "authorized", not_authorized: "not authorized" },
  retailer: { amazon: "Amazon" },
  source: {
    keepa_product: "Amazon product data",
    keepa_seller: "Amazon seller read",
    walmart_price: "Walmart prices",
    musiciansfriend_price: "Musician's Friend prices",
    sweetwater_price: "Sweetwater prices",
    reverb_price: "Reverb prices",
    spec_check: "Product data check",
    ai_battery: "AI answer battery",
  },
  trigger_type: { scheduled: "scheduled", manual: "manual", webhook: "webhook", backfill: "backfill" },
  run_status: { complete: "complete", partial: "not final", failed: "failed" },
  offer_status: { active: "active offer", no_active_offer: "no active offer" },
  seller_class: {
    amazon_retail: "Amazon Retail",
    third_party: "third-party seller",
    not_read: "not read yet",
    no_offer: "no offer",
  },
  channel: {
    amazon: "Amazon",
    walmart: "Walmart",
    musiciansfriend: "Musician's Friend",
    sweetwater: "Sweetwater",
    reverb: "Reverb",
  },
  match_status: { priced: "priced", no_match: "no match" },
  engine: { chatgpt: "ChatGPT", perplexity: "Perplexity", gemini: "Gemini", unknown: "engine not recorded" },
  outcome: { resolved: "brand resolved", unclear: "unclear", error: "call failed" },
  legacy_source: { live: "live table", run1_archive: "first-run archive", conflict_snapshot: "conflict snapshot" },
  unit: { percent: "percent", count: "count", usd: "US dollars", timestamp: "date and time", none: "no unit" },
  confidence: { measured: "measured", estimate: "estimate", target: "target", assumption: "assumption" },
  registry_owner: { intofocus: "IntoFocus", client: "client", coo: "COO", mixed: "IntoFocus and client" },
  action_owner: { intofocus: "IntoFocus", client: "client", unassigned: "unassigned" },
  action_status: { open: "open", in_progress: "in progress", done: "done" },
  severity: { high: "high", medium: "medium", low: "low" },
  reading_status: { complete: "complete", partial: "not final", unavailable: "unavailable" },
};

/** Schema table and column pairs that hold an enum, mapped to the label kind that names them. */
export const SCHEMA_ENUM_KINDS: Record<string, LabelKind> = {
  "seller_type.seller_type": "seller_type",
  "seller.marketplace": "marketplace",
  "seller_authorization.authorization_status": "authorization_status",
  "listing.retailer": "retailer",
  "reading_run.source": "source",
  "reading_run.trigger_type": "trigger_type",
  "reading_run.status": "run_status",
  "listing_offer_reading.offer_status": "offer_status",
  "listing_offer_reading.seller_class": "seller_class",
  "listing_channel_price.channel": "channel",
  "listing_channel_price.match_status": "match_status",
  "ai_answer.engine": "engine",
  "ai_answer.outcome": "outcome",
  "ai_answer.legacy_source": "legacy_source",
  "metric_registry.unit": "unit",
  "metric_registry.confidence": "confidence",
  "estimate.confidence": "confidence",
  "estimate_input.confidence": "confidence",
  "action_item.owner": "action_owner",
  "action_item.status": "action_status",
  "action_item.severity": "severity",
};

/** Words for a code that has no label: underscores become spaces so a raw code never shows. */
export function humanizeCode(code: string): string {
  return code.replace(/_/g, " ").trim();
}

export function hasLabel(kind: LabelKind, code: string): boolean {
  return Object.prototype.hasOwnProperty.call(ENUM_LABELS[kind], code);
}

/**
 * The label for one stored code. Null or empty codes read as "not stored". An unknown code is
 * humanized rather than shown raw.
 */
export function labelFor(kind: LabelKind, code: string | null | undefined): string {
  if (code === null || code === undefined || code === "") return "not stored";
  return ENUM_LABELS[kind][code] ?? humanizeCode(code);
}

/** Looks a code up across every kind, for places that only hold a code (dimension values). */
export function labelForAnyKind(code: string | null | undefined): string {
  if (code === null || code === undefined || code === "") return "not stored";
  for (const kind of Object.keys(ENUM_LABELS) as LabelKind[]) {
    if (hasLabel(kind, code)) return ENUM_LABELS[kind][code];
  }
  return humanizeCode(code);
}

/** The codes of one kind in their stored order, for select filters and sort ranks. */
export function codesOf(kind: LabelKind): string[] {
  return Object.keys(ENUM_LABELS[kind]);
}

/** Every raw code that carries an underscore, for the leak test. */
export function underscoredCodes(): string[] {
  const out = new Set<string>();
  for (const map of Object.values(ENUM_LABELS)) for (const code of Object.keys(map)) if (code.includes("_")) out.add(code);
  return [...out];
}
