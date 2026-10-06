function listingLink(asin: string, label = asin) {
  return `<a class="listing-link asin-chip" href="https://www.amazon.com/dp/${asin}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

export const catalogConsolidationHtml = `
<div class="metric-grid-2">
  <div class="metric-card-sm">
    <span class="metric-card-label">Priority Listings</span>
    <div class="metric-card-val" style="color:var(--warning-amber);">14</div>
    <span class="metric-card-sub">Bundle listings ready for catalog-governance review</span>
  </div>
  <div class="metric-card-sm">
    <span class="metric-card-label">Action Readiness</span>
    <div class="metric-card-val" style="color:var(--success-text);">12 + 2</div>
    <span class="metric-card-sub">12 named-partner cases · 2 seller-attribution gaps</span>
  </div>
</div>

<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">
    <span>Why these listings matter to AI search</span>
  </div>
  <p style="font-size:12.5px; color:var(--text-main); line-height:1.5; margin:0;">
    An assistant answers from the pages it can read. Each row below is its own Amazon page, with its own title, attributes, and description. When that page describes a bundle instead of the official model, the assistant can repeat the bundle's version of the product.
  </p>
  <p style="font-size:12.5px; color:var(--text-muted); line-height:1.5; margin:8px 0 0;">
    The live spec sample does not fill that gap: found fender.com pages publish no machine-readable spec fields, so a marketplace listing becomes a practical source for product facts. Aligning each bundle to the correct parent, and correcting its attributes, keeps the page an assistant may cite consistent with the instrument Fender sells.
  </p>
</div>

<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">
    <span>Listing Action Queue</span>
    <span class="tag-badge tag-warning">Brand Registry Review</span>
  </div>
  <p style="font-size:11.5px; color:var(--text-muted); margin-bottom:8px;">
    Each row is a listing-level next step. Sort by partner or owner. The listing name opens its Amazon page. Parent-child updates remain subject to Amazon variation-policy eligibility and Brand Registry approval.
  </p>
  <div style="overflow-x:auto;">
    <table class="table-sm" data-ifai-sortable>
      <thead>
        <tr>
          <th>Listing</th>
          <th><button type="button" class="ifai-sort-btn" data-ifai-sort="partner">Partner / bundle</button></th>
          <th>Action</th>
          <th><button type="button" class="ifai-sort-btn" data-ifai-sort="owner">Owner</button></th>
        </tr>
      </thead>
      <tbody>
        <tr data-partner="Austin Bazaar" data-owner="Brand Registry"><td><a class="listing-link" href="https://www.amazon.com/dp/B0D8TFXHHT" target="_blank" rel="noopener noreferrer"><strong>Player II Stratocaster</strong></a><br/>${listingLink("B0D8TFXHHT")}</td><td>Austin Bazaar · Gig Bag &amp; Cable</td><td>Validate variation eligibility; submit parent-child update.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr data-partner="Photo4Less" data-owner="Catalog"><td><a class="listing-link" href="https://www.amazon.com/dp/B0D8TN41XS" target="_blank" rel="noopener noreferrer"><strong>Player II Telecaster</strong></a><br/>${listingLink("B0D8TN41XS")}</td><td>Photo4Less · Hard Case Bundle</td><td>Align bundle title and attributes to the canonical product family.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr data-partner="GearTree" data-owner="Content + BR"><td><a class="listing-link" href="https://www.amazon.com/dp/B0C9Q8X11P" target="_blank" rel="noopener noreferrer"><strong>Acoustasonic Player Tele</strong></a><br/>${listingLink("B0C9Q8X11P")}</td><td>GearTree · Starter Kit</td><td>Audit bundle specs; map eligible child to the official parent.</td><td><span class="tag-badge tag-danger">Content + BR</span></td></tr>
        <tr data-partner="Austin Bazaar" data-owner="Brand Registry"><td><a class="listing-link" href="https://www.amazon.com/dp/B09KM14J88" target="_blank" rel="noopener noreferrer"><strong>Player Precision Bass</strong></a><br/>${listingLink("B09KM14J88")}</td><td>Austin Bazaar · Deluxe Gig Bag</td><td>Confirm parent match and open a variation relationship review.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr data-partner="GearDirect" data-owner="Catalog"><td><a class="listing-link" href="https://www.amazon.com/dp/B09KM22K77" target="_blank" rel="noopener noreferrer"><strong>Player Jazz Bass</strong></a><br/>${listingLink("B09KM22K77")}</td><td>GearDirect · Bundle</td><td>Standardize model identifiers before parent-child review.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr data-partner="GearDirect" data-owner="Brand Registry"><td><a class="listing-link" href="https://www.amazon.com/dp/B08KGX4199" target="_blank" rel="noopener noreferrer"><strong>American Pro II Strat</strong></a><br/>${listingLink("B08KGX4199")}</td><td>GearDirect · Cable Kit</td><td>Validate configuration and submit eligible relationship.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr data-partner="Austin Bazaar" data-owner="Catalog"><td><a class="listing-link" href="https://www.amazon.com/dp/B08KGY8821" target="_blank" rel="noopener noreferrer"><strong>American Pro II Tele</strong></a><br/>${listingLink("B08KGY8821")}</td><td>Austin Bazaar · Strap Pack</td><td>Review bundle attributes against the official parent.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr data-partner="Attribution needed" data-owner="Attribution"><td><a class="listing-link" href="https://www.amazon.com/dp/B08K3V4M99" target="_blank" rel="noopener noreferrer"><strong>Mustang Micro Amp</strong></a><br/>${listingLink("B08K3V4M99")}</td><td>Headphone + Cable Bundle</td><td>Identify the seller, then assign catalog-governance follow-up.</td><td><span class="tag-badge tag-warning">Attribution</span></td></tr>
        <tr data-partner="Attribution needed" data-owner="Attribution"><td><a class="listing-link" href="https://www.amazon.com/dp/B07X81ML33" target="_blank" rel="noopener noreferrer"><strong>Tone Master Deluxe Reverb</strong></a><br/>${listingLink("B07X81ML33")}</td><td>Cover + Footswitch Pack</td><td>Identify the seller and validate the bundle configuration.</td><td><span class="tag-badge tag-warning">Attribution</span></td></tr>
        <tr data-partner="Austin Bazaar" data-owner="Brand Registry"><td><a class="listing-link" href="https://www.amazon.com/dp/B07N25DDK8" target="_blank" rel="noopener noreferrer"><strong>Squier Classic Vibe '60s Strat</strong></a><br/>${listingLink("B07N25DDK8")}</td><td>Austin Bazaar · Stand &amp; Bag</td><td>Confirm parent match and variation-policy eligibility.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr data-partner="Photo4Less" data-owner="Catalog"><td><a class="listing-link" href="https://www.amazon.com/dp/B07N24MM91" target="_blank" rel="noopener noreferrer"><strong>Squier Classic Vibe '50s Tele</strong></a><br/>${listingLink("B07N24MM91")}</td><td>Photo4Less · Tuner Kit</td><td>Normalize model attributes; review parent-child placement.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr data-partner="GearTree" data-owner="Brand Registry"><td><a class="listing-link" href="https://www.amazon.com/dp/B092BG24LL" target="_blank" rel="noopener noreferrer"><strong>Squier Affinity P-Bass</strong></a><br/>${listingLink("B092BG24LL")}</td><td>GearTree · Essentials Pack</td><td>Audit bundle content and submit eligible relationship.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr data-partner="Austin Bazaar" data-owner="Catalog"><td><a class="listing-link" href="https://www.amazon.com/dp/B071KNF2L4" target="_blank" rel="noopener noreferrer"><strong>Fender CD-60S Acoustic</strong></a><br/>${listingLink("B071KNF2L4")}</td><td>Austin Bazaar · Starter Kit</td><td>Confirm canonical parent and standardize bundle attributes.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr data-partner="GearDirect" data-owner="Brand Registry"><td><a class="listing-link" href="https://www.amazon.com/dp/B07B8X8GZ8" target="_blank" rel="noopener noreferrer"><strong>Fender FA-115 Acoustic Pack</strong></a><br/>${listingLink("B07B8X8GZ8")}</td><td>GearDirect · Strings Kit</td><td>Validate pack identity before variation relationship review.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
`;
