import type { SpokeDefinition } from "./spoke-data";

type RetailRow = {
  category: string;
  model: string;
  asin: string;
  partner: string;
  leakage: string;
  reviews: string;
  channels: string;
  open: string;
  tab: string;
  action: string;
};

const RETAIL_ROWS: RetailRow[] = [
  { category: "player", model: "Player II Stratocaster", asin: "B0D8TFXHHT", partner: "Austin Bazaar", leakage: "−$41.99", reviews: "240", channels: "Amazon · Reverb", open: "specs", tab: "Schema.org", action: "Inspect spec risk" },
  { category: "player", model: "Player II Telecaster", asin: "B0D8TN41XS", partner: "Photo4Less", leakage: "−$35.00", reviews: "180", channels: "Amazon", open: "ecommerce", tab: "Catalog", action: "Plan consolidation" },
  { category: "player", model: "Acoustasonic Player Tele", asin: "B0C9Q8X11P", partner: "GearTree", leakage: "−$50.99", reviews: "310", channels: "Amazon · Walmart", open: "aeo", tab: "Hallucination", action: "Inspect AI error" },
  { category: "player", model: "Player Precision Bass", asin: "B09KM14J88", partner: "Austin Bazaar", leakage: "−$40.99", reviews: "195", channels: "Amazon", open: "ecommerce", tab: "Catalog", action: "Plan consolidation" },
  { category: "player", model: "Player Jazz Bass", asin: "B09KM22K77", partner: "GearDirect", leakage: "−$45.00", reviews: "140", channels: "Amazon · Reverb", open: "ecommerce", tab: "Catalog", action: "Plan consolidation" },
  { category: "american", model: "American Pro II Strat", asin: "B08KGX4199", partner: "GearDirect", leakage: "−$80.00", reviews: "210", channels: "Amazon", open: "ecommerce", tab: "MAP", action: "Review partner drift" },
  { category: "american", model: "American Pro II Tele", asin: "B08KGY8821", partner: "Austin Bazaar", leakage: "−$75.00", reviews: "165", channels: "Amazon · Reverb", open: "ecommerce", tab: "MAP", action: "Review partner drift" },
  { category: "amps", model: "Mustang Micro Amp", asin: "B08K3V4M99", partner: "Bundle offer", leakage: "−$10.00", reviews: "480", channels: "Amazon · Walmart", open: "aeo", tab: "Hallucination", action: "Inspect AI error" },
  { category: "amps", model: "Tone Master Deluxe Reverb", asin: "B07X81ML33", partner: "Bundle offer", leakage: "−$60.00", reviews: "95", channels: "Amazon", open: "ecommerce", tab: "Catalog", action: "Plan consolidation" },
  { category: "squier", model: "Squier Classic Vibe '60s Strat", asin: "B07N25DDK8", partner: "Austin Bazaar", leakage: "−$30.00", reviews: "320", channels: "Amazon", open: "ecommerce", tab: "Catalog", action: "Plan consolidation" },
  { category: "squier", model: "Squier Classic Vibe '50s Tele", asin: "B07N24MM91", partner: "Photo4Less", leakage: "−$25.00", reviews: "290", channels: "Amazon · Walmart", open: "ecommerce", tab: "MAP", action: "Review partner drift" },
  { category: "squier", model: "Squier Affinity P-Bass", asin: "B092BG24LL", partner: "GearTree", leakage: "−$20.00", reviews: "175", channels: "Amazon", open: "ecommerce", tab: "Catalog", action: "Plan consolidation" },
  { category: "acoustic", model: "Fender CD-60S Acoustic", asin: "B071KNF2L4", partner: "Austin Bazaar", leakage: "−$20.00", reviews: "510", channels: "Amazon · Reverb", open: "ecommerce", tab: "MAP", action: "Review partner drift" },
  { category: "acoustic", model: "Fender FA-115 Acoustic Pack", asin: "B07B8X8GZ8", partner: "GearDirect", leakage: "−$15.00", reviews: "380", channels: "Amazon", open: "ecommerce", tab: "Catalog", action: "Plan consolidation" },
];

const rowHtml = RETAIL_ROWS.map(
  (row) => `<tr data-category="${row.category}">
    <td><strong>${row.model}</strong></td>
    <td><span class="asin-chip">${row.asin}</span></td>
    <td>${row.partner}</td>
    <td style="color:var(--danger-red);font-weight:700;">${row.leakage}</td>
    <td>${row.reviews}</td>
    <td>${row.channels}</td>
    <td><span class="ifai-open-hint" data-ifai-open="${row.open}" data-ifai-tab="${row.tab}">${row.action} →</span></td>
  </tr>`,
).join("");

const opportunity = `
<div class="metric-grid-2">
  <div class="metric-card-sm"><span class="metric-card-label">Immediate Catalog Fix</span><div class="metric-card-val" style="color:var(--danger-red);">14 ASINs</div><span class="metric-card-sub">Live pilot audit · partner bundles with review or price leakage</span></div>
  <div class="metric-card-sm"><span class="metric-card-label">Reviews Eligible for Pooling</span><div class="metric-card-val" style="color:var(--warning-amber);">2,420+</div><span class="metric-card-sub">Recoverable through Brand Registry variation nesting</span></div>
  <div class="metric-card-sm"><span class="metric-card-label">Amazon Price Drift</span><div class="metric-card-val" style="color:var(--danger-red);">−$77.58</div><span class="metric-card-sub">Live average across 118 active-offer SKUs</span></div>
  <div class="metric-card-sm"><span class="metric-card-label">Phase 1 Annual Lift</span><div class="metric-card-val tone-success">+$680K <span class="metric-card-provenance is-estimate">Estimate</span></div><span class="metric-card-sub">Modeled across the 14-ASIN pilot, not yet measured</span></div>
</div>
<div class="action-card critical" style="margin-top:12px;">
  <div class="action-head">Start here: consolidate the 14 pilot ASINs with authorized partners</div>
  <div class="action-details">Nest valid bundles under Fender parent ASINs, set bundle price floors, and correct the product facts AI engines ingest.</div>
  <div class="action-impact">Pooled reviews → stronger conversion signals → fewer price-matching triggers → better Buy Box eligibility</div>
</div>
<div class="ceo-callout" style="margin-top:12px;">
  <div class="ceo-callout-header"><span>How much of the Buy Box picture is confirmed?</span></div>
  <div class="ceo-callout-body">A live scan found active Amazon offers for 993 of 3,430 monitored SKUs (29.0%). Amazon Retail is the confirmed 1P seller on 74 of those offers (7.4%). Seller ownership for the other 919 is still unknown, so 7.4% is a confirmed floor, not a complete retention rate.<br/><br/><strong>Data coverage:</strong> seller-level Keepa data covers 74 of 3,430 SKUs (2.2%) as of Sep 29, 2026. Don't treat the unclassified 92.6% as lost share until the backfill completes.</div>
</div>
<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title"><span>14-ASIN commercial opportunity explorer</span><span class="tag-badge tag-neutral">Pilot audit · Sep 29, 2026</span></div>
  <p style="font-size:11.5px;color:var(--text-muted);">Filter by product family. Each row links to the catalog, pricing, or AI evidence behind the next action.</p>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 12px;" data-ifai-filter-group="retail-asin-list">
    <button class="segmented-btn active" data-ifai-filter="all">All (14)</button>
    <button class="segmented-btn" data-ifai-filter="player">Player &amp; Acoustasonic (5)</button>
    <button class="segmented-btn" data-ifai-filter="american">American Pro II (2)</button>
    <button class="segmented-btn" data-ifai-filter="squier">Squier (3)</button>
    <button class="segmented-btn" data-ifai-filter="amps">Amps (2)</button>
    <button class="segmented-btn" data-ifai-filter="acoustic">Acoustic (2)</button>
  </div>
  <div style="overflow-x:auto;"><table class="table-sm"><thead><tr><th>Product</th><th>Child ASIN</th><th>Partner</th><th>Price Leak</th><th>Reviews</th><th>Channels</th><th>Drill In</th></tr></thead><tbody id="retail-asin-list">${rowHtml}</tbody></table></div>
</div>`;

const catalog = `
<div class="metric-grid-2">
  <div class="metric-card-sm"><span class="metric-card-label">Commercial Outcome</span><div class="metric-card-val tone-success">+18% <span class="metric-card-provenance is-estimate">Estimate</span></div><span class="metric-card-sub">Hero listing conversion lift after review pooling, not yet measured</span></div>
  <div class="metric-card-sm"><span class="metric-card-label">Review Signal Restored</span><div class="metric-card-val" style="color:var(--warning-amber);">2,420+</div><span class="metric-card-sub">Reviews eligible to pool under official parents</span></div>
</div>
<div class="ceo-callout" style="margin-top:12px;"><div class="ceo-callout-header"><span>Why collaborate with partners instead of removing their listings?</span></div><div class="ceo-callout-body">Austin Bazaar, Crazy Dave's Music, and GearTree are authorized dealers. The problem is listing architecture, not partner legitimacy. Standalone bundles trap reviews and can publish conflicting specs. Variation nesting preserves partner sales while restoring Fender's canonical product signal.</div></div>
<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">Brand Registry variation-nesting playbook</div>
  <div class="action-card critical"><div class="action-head">1. Validate the parent-child relationship</div><div class="action-details">Confirm the core instrument is identical and the child differs only by approved accessories. Reject bundles that alter the represented product or mix model specifications.</div></div>
  <div class="action-card" style="margin-top:8px;"><div class="action-head">2. Submit the partner-supported variation case</div><div class="action-details">Fender opens the Brand Registry ticket with the official parent ASIN, partner child ASIN, variation theme, approved title, images, and accessory manifest.</div></div>
  <div class="action-card" style="margin-top:8px;"><div class="action-head">3. Verify the commercial result</div><div class="action-details">Check that reviews pool, the correct specs remain canonical, partner offers stay purchasable, and the parent becomes eligible for stronger badges and conversion signals.</div><div class="action-impact">Owner: Fender marketplace operations + authorized dealer account lead</div></div>
</div>
<div class="ceo-callout" style="margin-top:12px;"><div class="ceo-callout-header"><span>What can go wrong during consolidation?</span></div><div class="ceo-callout-body">Amazon can reject a variation when products aren't materially the same, the variation theme is invalid, or partner metadata conflicts with Fender's contribution. Preserve screenshots and case IDs, fix the contribution at the source, and escalate through Brand Registry rather than repeatedly resubmitting the same evidence.</div></div>
<div class="ifai-open-hint" data-ifai-open="ecommerce" data-ifai-tab="MAP">Next: see which partner price patterns need a commercial conversation →</div>`;

const map = `
<div class="metric-grid-2">
  <div class="metric-card-sm"><span class="metric-card-label">Amazon Exposure</span><div class="metric-card-val" style="color:var(--danger-red);">118 SKUs</div><span class="metric-card-sub">−$77.58 average drift across active offers</span></div>
  <div class="metric-card-sm"><span class="metric-card-label">Cross-Channel Triggers</span><div class="metric-card-val" style="color:var(--warning-amber);">19 listings</div><span class="metric-card-sub">8 Walmart + 11 Reverb listings in the current audit</span></div>
</div>
<div class="ceo-callout" style="margin-top:12px;"><div class="ceo-callout-header"><span>How does a bundle discount suppress Amazon conversion?</span></div><div class="ceo-callout-body">A partner can price a guitar-plus-accessories bundle below the standalone MAP floor. Walmart and Reverb pricing bots can copy that effective price. Amazon then sees a cheaper comparable offer off-site and may suppress the Buy Box, even when Fender's own Amazon price hasn't changed.</div></div>
<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">Which partner should the team contact first?</div>
  <p style="font-size:11px;color:var(--text-muted);">Partner averages below are calculated from the 14-ASIN pilot table, not the broader 118-SKU Amazon audit.</p>
  <table class="table-sm"><thead><tr><th>Partner</th><th>Pilot ASINs</th><th>Average Undercut</th><th>First Conversation</th></tr></thead><tbody>
    <tr><td><strong>GearDirect</strong></td><td>3</td><td>−$46.67</td><td>Highest named-partner average; align premium-line bundle floors</td></tr>
    <tr><td><strong>Austin Bazaar</strong></td><td>5</td><td>−$41.60</td><td>Largest pilot footprint; standardize accessory valuation</td></tr>
    <tr><td><strong>GearTree</strong></td><td>2</td><td>−$35.50</td><td>Fix Acoustasonic metadata and bundle pricing together</td></tr>
    <tr><td><strong>Photo4Less</strong></td><td>2</td><td>−$30.00</td><td>Review case and tuner bundle floor logic</td></tr>
  </tbody></table>
</div>
<div class="content-box" style="margin-top:12px;"><div class="content-box-title">Channel consequence</div><table class="table-sm"><thead><tr><th>Channel</th><th>Observed Scope</th><th>Average Drift</th><th>Response</th></tr></thead><tbody>
  <tr><td><strong>Amazon</strong></td><td>118 active-offer SKUs</td><td>−$77.58</td><td>Resolve source bundle and suppressed Buy Box</td></tr>
  <tr><td><strong>Walmart</strong></td><td>8 listings</td><td>−$38.00</td><td>Stop automated price-match propagation</td></tr>
  <tr><td><strong>Reverb</strong></td><td>11 listings</td><td>−$55.00</td><td>Separate new, mint, and open-box policy</td></tr>
  <tr><td><strong>Sweetwater</strong></td><td>0 violations</td><td>$0.00</td><td>Use as the compliant reference feed</td></tr>
</tbody></table></div>
<div class="ifai-open-hint" data-ifai-open="suggestions" data-ifai-tab="ROI">See the modeled revenue impact and assumptions →</div>`;

const tabs = [opportunity, catalog, map];

export const portfolioRetailSpoke: SpokeDefinition = {
  badge: "CRITICAL SPOKE · RETAIL HEALTH",
  title: "Portfolio Retail",
  desc: "Prioritize 14 pilot ASINs where partner bundles split reviews, leak price, and can suppress Amazon conversion. Drill into the product, partner, marketplace, and AI evidence behind each action.",
  tabs: [
    "14 Flagged ASINs & Commercial Opportunity",
    "Catalog Consolidation & Brand Registry",
    "MAP (Minimum Advertised Price) by Partner & Channel",
  ],
  navLabel: "Portfolio Retail",
  next: "competitors",
  render: (tabIdx) => tabs[tabIdx] ?? "",
};
