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
    <span>Consolidation Opportunity by Partner</span>
    <span class="tag-badge tag-neutral">14 Priority Listings</span>
  </div>
  <p style="font-size:11.5px; color:var(--text-muted); margin-bottom:12px;">
    The largest near-term upside is concentrated in a small set of partner bundle listings. Review eligibility, then align each bundle to the correct Fender parent-child structure without disrupting the partner offer.
  </p>
  <div style="display:grid; gap:9px;" aria-label="Priority listings by partner">
    <div style="display:grid; grid-template-columns:110px 1fr 28px; gap:8px; align-items:center;">
      <strong style="font-size:11px;">Austin Bazaar</strong>
      <div style="height:9px; border-radius:999px; background:rgba(148,163,184,.14); overflow:hidden;"><div style="width:100%; height:100%; border-radius:999px; background:linear-gradient(90deg,var(--warning-amber),#f59e0b);"></div></div>
      <span style="font-size:11px; font-weight:700;">5</span>
    </div>
    <div style="display:grid; grid-template-columns:110px 1fr 28px; gap:8px; align-items:center;">
      <strong style="font-size:11px;">GearDirect</strong>
      <div style="height:9px; border-radius:999px; background:rgba(148,163,184,.14); overflow:hidden;"><div style="width:60%; height:100%; border-radius:999px; background:linear-gradient(90deg,var(--warning-amber),#f59e0b);"></div></div>
      <span style="font-size:11px; font-weight:700;">3</span>
    </div>
    <div style="display:grid; grid-template-columns:110px 1fr 28px; gap:8px; align-items:center;">
      <strong style="font-size:11px;">Photo4Less</strong>
      <div style="height:9px; border-radius:999px; background:rgba(148,163,184,.14); overflow:hidden;"><div style="width:40%; height:100%; border-radius:999px; background:linear-gradient(90deg,var(--warning-amber),#f59e0b);"></div></div>
      <span style="font-size:11px; font-weight:700;">2</span>
    </div>
    <div style="display:grid; grid-template-columns:110px 1fr 28px; gap:8px; align-items:center;">
      <strong style="font-size:11px;">GearTree</strong>
      <div style="height:9px; border-radius:999px; background:rgba(148,163,184,.14); overflow:hidden;"><div style="width:40%; height:100%; border-radius:999px; background:linear-gradient(90deg,var(--warning-amber),#f59e0b);"></div></div>
      <span style="font-size:11px; font-weight:700;">2</span>
    </div>
    <div style="display:grid; grid-template-columns:110px 1fr 28px; gap:8px; align-items:center;">
      <strong style="font-size:11px;">Attribution needed</strong>
      <div style="height:9px; border-radius:999px; background:rgba(148,163,184,.14); overflow:hidden;"><div style="width:40%; height:100%; border-radius:999px; background:linear-gradient(90deg,#38bdf8,#22d3ee);"></div></div>
      <span style="font-size:11px; font-weight:700;">2</span>
    </div>
  </div>
</div>

<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">
    <span>Listing Action Queue</span>
    <span class="tag-badge tag-warning">Brand Registry Review</span>
  </div>
  <p style="font-size:11.5px; color:var(--text-muted); margin-bottom:8px;">
    Each row is a listing-level next step. Parent-child updates remain subject to Amazon variation-policy eligibility and Brand Registry approval.
  </p>
  <div style="overflow-x:auto;">
    <table class="table-sm">
      <thead>
        <tr><th>Listing</th><th>Partner / bundle</th><th>Action</th><th>Owner</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Player II Stratocaster</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B0D8TFXHHT" target="_blank" rel="noopener noreferrer">B0D8TFXHHT</a></td><td>Austin Bazaar · Gig Bag &amp; Cable</td><td>Validate variation eligibility; submit parent-child update.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr><td><strong>Player II Telecaster</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B0D8TN41XS" target="_blank" rel="noopener noreferrer">B0D8TN41XS</a></td><td>Photo4Less · Hard Case Bundle</td><td>Align bundle title and attributes to the canonical product family.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr><td><strong>Acoustasonic Player Tele</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B0C9Q8X11P" target="_blank" rel="noopener noreferrer">B0C9Q8X11P</a></td><td>GearTree · Starter Kit</td><td>Audit bundle specs; map eligible child to the official parent.</td><td><span class="tag-badge tag-danger">Content + BR</span></td></tr>
        <tr><td><strong>Player Precision Bass</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B09KM14J88" target="_blank" rel="noopener noreferrer">B09KM14J88</a></td><td>Austin Bazaar · Deluxe Gig Bag</td><td>Confirm parent match and open a variation relationship review.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr><td><strong>Player Jazz Bass</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B09KM22K77" target="_blank" rel="noopener noreferrer">B09KM22K77</a></td><td>GearDirect · Bundle</td><td>Standardize model identifiers before parent-child review.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr><td><strong>American Pro II Strat</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B08KGX4199" target="_blank" rel="noopener noreferrer">B08KGX4199</a></td><td>GearDirect · Cable Kit</td><td>Validate configuration and submit eligible relationship.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr><td><strong>American Pro II Tele</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B08KGY8821" target="_blank" rel="noopener noreferrer">B08KGY8821</a></td><td>Austin Bazaar · Strap Pack</td><td>Review bundle attributes against the official parent.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr><td><strong>Mustang Micro Amp</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B08K3V4M99" target="_blank" rel="noopener noreferrer">B08K3V4M99</a></td><td>Headphone + Cable Bundle</td><td>Identify the seller, then assign catalog-governance follow-up.</td><td><span class="tag-badge tag-warning">Attribution</span></td></tr>
        <tr><td><strong>Tone Master Deluxe Reverb</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B07X81ML33" target="_blank" rel="noopener noreferrer">B07X81ML33</a></td><td>Cover + Footswitch Pack</td><td>Identify the seller and validate the bundle configuration.</td><td><span class="tag-badge tag-warning">Attribution</span></td></tr>
        <tr><td><strong>Squier Classic Vibe '60s Strat</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B07N25DDK8" target="_blank" rel="noopener noreferrer">B07N25DDK8</a></td><td>Austin Bazaar · Stand &amp; Bag</td><td>Confirm parent match and variation-policy eligibility.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr><td><strong>Squier Classic Vibe '50s Tele</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B07N24MM91" target="_blank" rel="noopener noreferrer">B07N24MM91</a></td><td>Photo4Less · Tuner Kit</td><td>Normalize model attributes; review parent-child placement.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr><td><strong>Squier Affinity P-Bass</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B092BG24LL" target="_blank" rel="noopener noreferrer">B092BG24LL</a></td><td>GearTree · Essentials Pack</td><td>Audit bundle content and submit eligible relationship.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
        <tr><td><strong>Fender CD-60S Acoustic</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B071KNF2L4" target="_blank" rel="noopener noreferrer">B071KNF2L4</a></td><td>Austin Bazaar · Starter Kit</td><td>Confirm canonical parent and standardize bundle attributes.</td><td><span class="tag-badge tag-neutral">Catalog</span></td></tr>
        <tr><td><strong>Fender FA-115 Acoustic Pack</strong><br/><a class="asin-chip" href="https://www.amazon.com/dp/B07B8X8GZ8" target="_blank" rel="noopener noreferrer">B07B8X8GZ8</a></td><td>GearDirect · Strings Kit</td><td>Validate pack identity before variation relationship review.</td><td><span class="tag-badge tag-neutral">Brand Registry</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
`;
