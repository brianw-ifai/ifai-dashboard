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

type ShownChannel = {
  name: string;
  count: number;
};

/** A channel is shown only when this read returned a stored price for it. */
function channelsInRead(rows: BelowMapListing[]): {
  amazon: boolean;
  walmart: boolean;
  musiciansFriend: boolean;
  summary: ShownChannel[];
} {
  const walmart = rows.filter((row) => row.wmtPrice != null).length;
  const musiciansFriend = rows.filter((row) => row.mfPrice != null).length;
  const summary: ShownChannel[] = [];
  if (rows.length > 0) summary.push({ name: "Amazon", count: rows.length });
  if (walmart > 0) summary.push({ name: "Walmart", count: walmart });
  if (musiciansFriend > 0) summary.push({ name: "Musician's Friend", count: musiciansFriend });
  return {
    amazon: rows.length > 0,
    walmart: walmart > 0,
    musiciansFriend: musiciansFriend > 0,
    summary,
  };
}

function walmartCell(row: BelowMapListing): string {
  if (row.wmtPrice == null) return "<td></td>";
  const link = row.wmtUrl
    ? ` <a class="listing-link channel-tag channel-wmt" href="${escapeHtml(row.wmtUrl)}" target="_blank" rel="noopener noreferrer">Walmart</a>`
    : "";
  return `<td>${formatMoney(row.wmtPrice)}${link}</td>`;
}

function musiciansFriendCell(row: BelowMapListing): string {
  if (row.mfPrice == null) return "<td></td>";
  return `<td>${formatMoney(row.mfPrice)}</td>`;
}

function channelSummary(rows: BelowMapListing[]): string {
  const channels = channelsInRead(rows).summary;
  if (!channels.length) return "";
  return `<ul class="tour-card-list" style="margin:8px 0 0;">
    ${channels
      .map(
        (channel) =>
          `<li><strong>${escapeHtml(channel.name)}</strong> · ${formatCount(channel.count)} ${channel.count === 1 ? "listing" : "listings"}</li>`,
      )
      .join("")}
  </ul>`;
}

function listingTable(rows: BelowMapListing[]): string {
  const channels = channelsInRead(rows);
  const headers = ["Listing", "ASIN", "MAP"];
  if (channels.amazon) headers.push("Amazon");
  headers.push("Gap");
  if (channels.walmart) headers.push("Walmart");
  if (channels.musiciansFriend) headers.push("Musician's Friend");

  const body = rows.length
    ? rows
        .map((row) => {
          const href = amazonHref(row.asin);
          const asin = escapeHtml(row.asin);
          const asinCell = href
            ? `<a class="listing-link" href="${href}" target="_blank" rel="noopener noreferrer"><span class="asin-chip">${asin}</span></a>`
            : `<span class="asin-chip">${asin}</span>`;
          const amazonCell = channels.amazon ? `<td>${formatMoney(row.offerPrice)}</td>` : "";
          const walmart = channels.walmart ? walmartCell(row) : "";
          const musiciansFriend = channels.musiciansFriend ? musiciansFriendCell(row) : "";
          return `<tr><td><strong>${escapeHtml(row.title)}</strong></td><td>${asinCell}</td><td>${formatMoney(row.mapPrice)}</td>${amazonCell}<td style="color:var(--danger-red); font-weight:700;">${formatMoney(row.dollarGap)}</td>${walmart}${musiciansFriend}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${headers.length}">No active offers are under MAP.</td></tr>`;

  return `<div style="overflow:auto; max-height:520px; margin-top:12px;">
    <table class="table-sm">
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${body}
      </tbody>
    </table>
  </div>`;
}

export function buildMapLeakageHtml(reading: PortfolioRetailReading): string {
  const summary =
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
  </p>
  ${channelSummary(reading.rows)}
  <div class="content-box-title" style="margin-top:14px;">Listings</div>
  ${listingTable(reading.rows)}`
      : `<p style="font-size:12.5px; color:var(--text-main); line-height:1.5; margin:12px 0 0;">
    ${MAP_COUNT_SLOT} ${MAP_GAP_SLOT}
  </p>`;

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
  <div class="content-box-title">Summary</div>
  ${summary}
</div>
`;
}

export const mapLeakageHtml = buildMapLeakageHtml(unavailableRetailReading);
