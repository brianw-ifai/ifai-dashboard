import {
  MAP_COUNT_SLOT,
  MAP_GAP_SLOT,
  formatCount,
  formatGapPct,
  formatMoney,
  formatSharePct,
  mapCountSentence,
  mapGapSentence,
  unavailableRetailReading,
  type BelowMapListing,
  type PortfolioRetailReading,
} from "@/components/v3/portfolio-retail-reading";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function amazonHref(asin: string): string | null {
  if (!/^[A-Z0-9]{10}$/.test(asin)) return null;
  return `https://www.amazon.com/dp/${asin}`;
}

function otherPrices(row: BelowMapListing): string {
  const parts: string[] = [];
  if (row.wmtPrice != null) {
    const link = row.wmtUrl
      ? ` <a class="listing-link channel-tag channel-wmt" href="${escapeHtml(row.wmtUrl)}" target="_blank" rel="noopener noreferrer">Walmart</a>`
      : "";
    parts.push(`<div>Walmart ${formatMoney(row.wmtPrice)}${link}</div>`);
  }
  if (row.mfPrice != null) {
    parts.push(`<div>Musician&#39;s Friend ${formatMoney(row.mfPrice)}</div>`);
  }
  return parts.join("");
}

function listingRows(rows: BelowMapListing[]): string {
  return rows
    .map((row) => {
      const href = amazonHref(row.asin);
      const asin = escapeHtml(row.asin);
      const asinCell = href
        ? `<a class="listing-link" href="${href}" target="_blank" rel="noopener noreferrer"><span class="asin-chip">${asin}</span></a>`
        : `<span class="asin-chip">${asin}</span>`;
      return `<tr><td><strong>${escapeHtml(row.title)}</strong></td><td>${asinCell}</td><td>${formatMoney(row.mapPrice)}</td><td>${formatMoney(row.offerPrice)}</td><td style="color:var(--danger-red); font-weight:700;">${formatMoney(row.dollarGap)}</td><td>${otherPrices(row)}</td></tr>`;
    })
    .join("");
}

export function buildMapLeakageHtml(reading: PortfolioRetailReading): string {
  const metrics =
    reading.status === "ready"
      ? `<div class="metric-grid-2" style="margin-top:8px;">
    <div class="metric-card-sm">
      <span class="metric-card-label">Listings under MAP</span>
      <div class="metric-card-val" style="color:var(--danger-red);">${formatCount(reading.belowMap)}</div>
      <span class="metric-card-sub">${formatSharePct(reading.pctOfActive)} of ${formatCount(reading.activeOffers)} active offers</span>
    </div>
    <div class="metric-card-sm">
      <span class="metric-card-label">Average gap</span>
      <div class="metric-card-val" style="color:var(--danger-red);">${formatGapPct(reading.avgPercentGap)}</div>
      <span class="metric-card-sub">${formatMoney(reading.avgDollarGap)} per listing · ${formatMoney(reading.combinedDollarGap)} combined</span>
    </div>
  </div>
  <p style="font-size:12.5px; color:var(--text-main); line-height:1.5; margin:12px 0 0;">
    ${mapCountSentence(reading)} ${mapGapSentence(reading)} From the latest listing read. A listing that is no longer under MAP is not listed.
  </p>`
      : `<p style="font-size:12.5px; color:var(--text-main); line-height:1.5; margin:12px 0 0;">
    ${MAP_COUNT_SLOT} ${MAP_GAP_SLOT}
  </p>`;

  const table =
    reading.status === "ready"
      ? `<div style="overflow:auto; max-height:520px; margin-top:12px;">
    <table class="table-sm">
      <thead>
        <tr><th>Listing</th><th>ASIN</th><th>MAP</th><th>Offer</th><th>Gap</th><th>Other prices</th></tr>
      </thead>
      <tbody>
        ${reading.rows.length ? listingRows(reading.rows) : `<tr><td colspan="6">No active offers are under MAP.</td></tr>`}
      </tbody>
    </table>
  </div>`
      : "";

  return `
<div class="ceo-callout">
  <div class="ceo-callout-header">
    <span>What is MAP?</span>
  </div>
  <div class="ceo-callout-body">
    <strong>MAP</strong> (Minimum Advertised Price) is the lowest price a retail partner agrees to display publicly.
  </div>
</div>

<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">Active offers under MAP</div>
  ${metrics}
  ${table}
</div>
`;
}

export const mapLeakageHtml = buildMapLeakageHtml(unavailableRetailReading);
