type Listing = {
  name: string;
  asin: string;
  bundle: string;
  map: string;
  offer: string;
  gap: string;
  channels: Array<"amazon" | "walmart" | "reverb">;
};

const listings: Listing[] = [
  { name: "Player II Stratocaster", asin: "B0D8TFXHHT", bundle: "Austin Bazaar Gig Bag & Cable", map: "$849.99", offer: "$808.00", gap: "-$41.99", channels: ["amazon", "reverb"] },
  { name: "Player II Telecaster", asin: "B0D8TN41XS", bundle: "Photo4Less Hard Case Bundle", map: "$849.99", offer: "$814.99", gap: "-$35.00", channels: ["amazon"] },
  { name: "Acoustasonic Player Tele", asin: "B0C9Q8X11P", bundle: "GearTree Starter Kit Bundle", map: "$1,199.99", offer: "$1,149.00", gap: "-$50.99", channels: ["amazon", "walmart"] },
  { name: "Player Precision Bass", asin: "B09KM14J88", bundle: "Austin Bazaar Deluxe Gig Bag", map: "$869.99", offer: "$829.00", gap: "-$40.99", channels: ["amazon"] },
  { name: "Player Jazz Bass", asin: "B09KM22K77", bundle: "GearDirect Express Bundle", map: "$899.99", offer: "$854.99", gap: "-$45.00", channels: ["amazon", "reverb"] },
  { name: "American Pro II Strat", asin: "B08KGX4199", bundle: "GearDirect Instrument Cable Kit", map: "$1,799.99", offer: "$1,719.99", gap: "-$80.00", channels: ["amazon"] },
  { name: "American Pro II Tele", asin: "B08KGY8821", bundle: "Austin Bazaar Tweed Strap Pack", map: "$1,799.99", offer: "$1,724.99", gap: "-$75.00", channels: ["amazon", "reverb"] },
  { name: "Mustang Micro Amp", asin: "B08K3V4M99", bundle: "Headphone + Cable Bundle", map: "$119.99", offer: "$109.99", gap: "-$10.00", channels: ["amazon", "walmart"] },
  { name: "Tone Master Deluxe Reverb", asin: "B07X81ML33", bundle: "Fitted Cover + Footswitch Pack", map: "$1,049.99", offer: "$989.99", gap: "-$60.00", channels: ["amazon"] },
  { name: "Squier Classic Vibe '60s Strat", asin: "B07N25DDK8", bundle: "Austin Bazaar Stand & Bag Pack", map: "$459.99", offer: "$429.99", gap: "-$30.00", channels: ["amazon"] },
  { name: "Squier Classic Vibe '50s Tele", asin: "B07N24MM91", bundle: "Photo4Less Clip-on Tuner Kit", map: "$459.99", offer: "$434.99", gap: "-$25.00", channels: ["amazon", "walmart"] },
  { name: "Squier Affinity P-Bass", asin: "B092BG24LL", bundle: "GearTree Essentials Pack", map: "$299.99", offer: "$279.99", gap: "-$20.00", channels: ["amazon"] },
  { name: "Fender CD-60S Acoustic", asin: "B071KNF2L4", bundle: "Austin Bazaar Starter Kit", map: "$229.99", offer: "$209.99", gap: "-$20.00", channels: ["amazon", "reverb"] },
  { name: "Fender FA-115 Acoustic Pack", asin: "B07B8X8GZ8", bundle: "GearDirect Spare Strings Kit", map: "$199.99", offer: "$184.99", gap: "-$15.00", channels: ["amazon"] },
];

function amazonLink(asin: string, label: string) {
  return `<a class="listing-link" href="https://www.amazon.com/dp/${asin}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function listingRows(channel: Listing["channels"][number]) {
  return listings
    .filter((listing) => listing.channels.includes(channel))
    .map(
      (listing) => `<tr>
        <td>${amazonLink(listing.asin, `<strong>${listing.name}</strong>`)}<br/><a class="listing-link asin-chip" href="https://www.amazon.com/dp/${listing.asin}" target="_blank" rel="noopener noreferrer">${listing.asin}</a></td>
        <td>${listing.bundle}</td>
        <td>${listing.map}</td>
        <td style="color:var(--danger-red); font-weight:700;">${listing.offer}</td>
        <td style="color:var(--danger-red); font-weight:700;">${listing.gap}</td>
      </tr>`,
    )
    .join("");
}

function consequence(label: string, description: string, tone: "danger" | "warning" | "success") {
  const badge = tone === "danger" ? "tag-danger" : tone === "warning" ? "tag-warning" : "tag-success";
  return `<span class="tag-badge ${badge} ifai-term" tabindex="0" data-ifai-tooltip-title="${label}" data-ifai-tooltip-desc="${description}" aria-label="${label}: ${description}">${label}</span>`;
}

function channelRow(options: {
  id: string;
  name: string;
  violations: string;
  drift: string;
  tone: "danger" | "warning" | "success";
  consequenceLabel: string;
  consequenceDesc: string;
  note: string;
  rows: string;
}) {
  const table = options.rows
    ? `<table class="table-sm">
        <thead><tr><th>Listing</th><th>Bundle</th><th>MAP</th><th>Offer</th><th>Gap</th></tr></thead>
        <tbody>${options.rows}</tbody>
      </table>`
    : `<p style="margin:0; color:var(--text-muted);">No listing in this summary is below MAP.</p>`;
  return `<tr class="map-channel-row" data-ifai-expand="${options.id}" tabindex="0" role="button" aria-expanded="false">
      <td><strong>${options.name}</strong></td>
      <td>${options.violations}</td>
      <td>${options.drift}</td>
      <td>${consequence(options.consequenceLabel, options.consequenceDesc, options.tone)}</td>
    </tr>
    <tr class="map-channel-detail" data-ifai-detail="${options.id}" hidden>
      <td colspan="4">
        <p style="font-size:11.5px; color:var(--text-muted); margin:0 0 8px;">${options.note}</p>
        ${table}
      </td>
    </tr>`;
}

export const mapLeakageHtml = `
<div class="ceo-callout">
  <div class="ceo-callout-header">
    <span>What is MAP, and how does price leakage work?</span>
  </div>
  <div class="ceo-callout-body">
    <strong>What is MAP?</strong> Minimum Advertised Price (MAP) is the lowest price a retail partner legally agrees to display publicly in its store or online listing. It protects brand prestige and guarantees healthy retail margins.
    <br/><br/>
    <strong>The Starter Kit Bundle Loophole:</strong>
    Partners can't sell a standalone Player II Stratocaster below MAP ($849.99). Instead, they bundle the guitar with a $15 gig bag and a $5 cable and price the whole package at $808.00. They argue that the guitar wasn't sold below MAP and that only the accessories were 'discounted'.
    <br/><br/>
    <strong>The Cross-Marketplace Crawler Trap:</strong>
    Automated pricing bots on <strong>Walmart Marketplace</strong> and <strong>Reverb</strong> crawl Amazon and instantly match or beat the $808 price. Amazon's algorithm then detects the cheaper off-Amazon prices and <strong>suppresses Fender's Featured Offer on Amazon entirely.</strong>
  </div>
</div>

<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">Multi-Marketplace Price Leakage Summary</div>
  <p style="font-size:11.5px; color:var(--text-muted); margin:0 0 8px;">
    Select a channel to open its listing rows. Hover a consequence to read what that label means for the Featured Offer.
  </p>
  <table class="table-sm map-channel-table">
    <thead>
      <tr><th>Marketplace Channel</th><th>Violations</th><th>Average Price Drift</th><th>Algorithmic Consequence</th></tr>
    </thead>
    <tbody>
      ${channelRow({
        id: "amazon",
        name: "Amazon.com",
        violations: "457 active offers",
        drift: "16.49% avg · $221.96 avg · $101,434.60 sum",
        tone: "danger",
        consequenceLabel: "Featured Offer withheld / seller split",
        consequenceDesc: "These offers are below MAP. Amazon can withhold the Featured Offer when the price, including shipping, is above its Competitive External Price, and the sale can also split across more than one seller.",
        note: "14 priority listings inside the 457 active offers under MAP. Each name opens the Amazon page. The other offers are included in the channel total and are not listed row by row in this view.",
        rows: listingRows("amazon"),
      })}
      ${channelRow({
        id: "walmart",
        name: "Walmart Marketplace",
        violations: "8 Listings",
        drift: "-$38.00",
        tone: "warning",
        consequenceLabel: "Automated price match",
        consequenceDesc: "A lower price on Walmart can be copied by automated pricing. When Amazon sees that lower off-Amazon price, it can withhold the Featured Offer on the matching listing.",
        note: "3 of the 14 priority listings are also tracked on Walmart. The channel total is 8 listings; the other 5 are not in this priority set, so they are not shown as rows.",
        rows: listingRows("walmart"),
      })}
      ${channelRow({
        id: "reverb",
        name: "Reverb (Brand New / Open Box)",
        violations: "11 Listings",
        drift: "-$55.00",
        tone: "danger",
        consequenceLabel: "MAP floor erosion",
        consequenceDesc: "New and open-box prices below MAP on Reverb lower the off-Amazon price Amazon compares against. Amazon can then withhold the Featured Offer even when the Amazon offer itself is at MAP.",
        note: "4 of the 14 priority listings are also tracked on Reverb. The channel total is 11 listings; the other 7 are not in this priority set, so they are not shown as rows.",
        rows: listingRows("reverb"),
      })}
      ${channelRow({
        id: "sweetwater",
        name: "Sweetwater Sound",
        violations: "0 Violations",
        drift: "$0.00",
        tone: "success",
        consequenceLabel: "Prices at MAP",
        consequenceDesc: "No tracked Sweetwater price in this summary sits below MAP, so this channel is not creating the off-Amazon price that can withhold a Featured Offer.",
        note: "No Sweetwater listing in this summary is below MAP.",
        rows: "",
      })}
    </tbody>
  </table>
</div>
`;
