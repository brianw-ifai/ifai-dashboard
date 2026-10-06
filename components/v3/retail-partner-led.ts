/**
 * Seller model for the retail hero.
 * The five types, and the question each is meant to answer, are in
 * docs/client-seller-models.md. Fender is Partner-led. How each type is
 * drawn on the dashboard is not decided. This module is the interim
 * Partner-led comparison only.
 */
export const SELLER_TYPES = {
  partnerLed: "partner-led",
} as const;

export type SellerTypeId = (typeof SELLER_TYPES)[keyof typeof SELLER_TYPES];

/** What IntoFocus has told this dashboard Fender is. */
export const FENDER_SELLER_TYPE: SellerTypeId = SELLER_TYPES.partnerLed;

export const RETAIL_MONITORED_LISTINGS = 993;

export const featuredOfferSuppression = {
  listings: 39,
  pctLabel: "3.9%",
  detail: "39 of 993 active offers",
};

export const mapLeakage = {
  listings: 457,
  pctLabel: "46.0%",
  avgPctLabel: "16.49%",
  avgDollarsLabel: "$221.96",
  sumDollarsLabel: "$101,434.60",
  detail: "457 of 993 active offers priced under MAP",
};

export type RetailIssueId = "suppression" | "map";

/** Partner-Led: show the issue that covers more of the monitored listings. */
export function partnerLedHeroIssue(
  suppressionListings = featuredOfferSuppression.listings,
  mapListings = mapLeakage.listings,
): RetailIssueId {
  return mapListings >= suppressionListings ? "map" : "suppression";
}

export const partnerLedHero = {
  issue: partnerLedHeroIssue(),
  statA: "457 below MAP",
  statB: "46% of 993",
  meta: "39 listings suppressed",
  tooltipTitle: "Highlights marketplace listings",
  tooltipDesc:
    "These listings need action to protect price integrity, availability, and Featured Offer coverage. The top priority is MAP leakage: 457 of 993 active offers are under MAP (46.0%), averaging 16.49% and $221.96 below MAP. Next are 39 suppressed listings (3.9%) where the new offer is above Amazon's Competitive External Price.",
} as const;

export const suppressionDrilldownHtml = `
<div class="ceo-callout">
  <div class="ceo-callout-header">
    <span>Why can a MAP-priced listing still lose the Featured Offer?</span>
  </div>
  <div class="ceo-callout-body">
    Portfolio Retail prioritizes listing health, price integrity, and Featured Offer availability across 993 active offers. The largest immediate issue is <strong>MAP leakage, affecting 457 listings (46.0%)</strong>, followed by <strong>39 suppressed listings (3.9%)</strong>.
    <br/><br/>
    MAP leakage on those 457 listings averages <strong>16.49%</strong> under MAP, <strong>$221.96</strong> per listing, and <strong>$101,434.60</strong> combined.
    <br/><br/>
    A listing at <strong>MAP</strong> can still have no <strong>Featured Offer</strong> (the Buy Box). Amazon withholds it when the offer, including shipping, is above the Competitive External Price: the lowest price it recently found outside Amazon. Amazon does not name that retailer. The 39 rows below are where that benchmark is known and the new offer sits above it. A channel button is shown only when a listing at that amount was found.
  </div>
</div>

<div class="content-box" style="margin-top:12px;">
  <div class="content-box-title">
    <span>Suppressed Listings</span>
    <span class="tag-badge tag-danger">39 of 993</span>
  </div>
  <p style="font-size:11.5px; color:var(--text-muted); margin-bottom:8px;">
    Keepa read on 6 Oct 2026. The gap is the new Amazon offer minus Amazon's Competitive External Price.
  </p>
  <div style="overflow-x:auto;">
    <table class="table-sm">
      <thead>
        <tr><th>Listing</th><th>Amazon offer</th><th>Benchmark</th><th>Above benchmark</th><th>Links</th></tr>
      </thead>
      <tbody>
<tr><td><strong>Kingfish Deluxe Telecaster Electric Guitar, Mississippi Night, Slab R...</strong><br/><span class="asin-chip">B0B9ZVTN24</span></td><td>$3,465.66</td><td>$2,249.99</td><td style="color:var(--danger-red); font-weight:700;">+$1,215.67</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0B9ZVTN24" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Juanes Signature Stratocaster - Luna White</strong><br/><span class="asin-chip">B0C8BKGKG5</span></td><td>$2,788.04</td><td>$1,999.99</td><td style="color:var(--danger-red); font-weight:700;">+$788.05</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0C8BKGKG5" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>70th-anniversary American Vintage II 1954 Stratocaster - 2-color Sunb...</strong><br/><span class="asin-chip">B0CNKR6Z9Y</span></td><td>$2,599.99</td><td>$1,819.99</td><td style="color:var(--danger-red); font-weight:700;">+$780.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0CNKR6Z9Y" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - Roasted Pine with Rosewood Fi...</strong><br/><span class="asin-chip">B08GL3NVBJ</span></td><td>$1,939.99</td><td>$1,339.99</td><td style="color:var(--danger-red); font-weight:700;">+$600.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08GL3NVBJ" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Tom DeLonge Stratocaster Electric Guitar - Graffiti Yellow</strong><br/><span class="asin-chip">B0C8BJVNPZ</span></td><td>$1,359.99</td><td>$947.00</td><td style="color:var(--danger-red); font-weight:700;">+$412.99</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0C8BJVNPZ" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - Sienna Sunburst with Maple Fi...</strong><br/><span class="asin-chip">B08GLZ8R3M</span></td><td>$1,939.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$300.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08GLZ8R3M" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - Mystic Surf Green with Maple ...</strong><br/><span class="asin-chip">B08L34LQZG</span></td><td>$1,639.99</td><td>$1,339.99</td><td style="color:var(--danger-red); font-weight:700;">+$300.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L34LQZG" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Limited-edition Cory Wong Stratocaster Electric Guitar - Surf Green</strong><br/><span class="asin-chip">B0C8BJYTVZ</span></td><td>$2,249.99</td><td>$1,999.99</td><td style="color:var(--danger-red); font-weight:700;">+$250.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0C8BJYTVZ" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Telecaster - Dark Night with Rosewood Finger...</strong><br/><span class="asin-chip">B08GL28YDK</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08GL28YDK" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - Dark Night with Rosewood Fing...</strong><br/><span class="asin-chip">B08GL4DT9F</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08GL4DT9F" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - 3 Color Sunburst with Maple F...</strong><br/><span class="asin-chip">B08L31K9JV</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L31K9JV" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster Left-handed - Dark Night with R...</strong><br/><span class="asin-chip">B08L31Z9RN</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L31Z9RN" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Jazzmaster - Miami Blue with Maple Fingerboard</strong><br/><span class="asin-chip">B08L32XHK8</span></td><td>$1,939.99</td><td>$1,739.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L32XHK8" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster HSS - Mercury with Rosewood</strong><br/><span class="asin-chip">B08L334L1X</span></td><td>$1,889.99</td><td>$1,689.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L334L1X" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - Mercury with Rosewood Fingerb...</strong><br/><span class="asin-chip">B08L33JRGK</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L33JRGK" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - Dark Night with Maple Fingerb...</strong><br/><span class="asin-chip">B08L33PKSW</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L33PKSW" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - 3 Color Sunburst with Rosewoo...</strong><br/><span class="asin-chip">B08L34BFNZ</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L34BFNZ" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Stratocaster - Mystic Surf Green with Rosewo...</strong><br/><span class="asin-chip">B08L34XV4J</span></td><td>$1,839.99</td><td>$1,639.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L34XV4J" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional II Telecaster Deluxe - 3-color Sunburst with Ro...</strong><br/><span class="asin-chip">B08L35NYJT</span></td><td>$1,889.99</td><td>$1,689.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B08L35NYJT" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Vintage II 1966 Jazzmaster Electric Guitar - Dakota Red</strong><br/><span class="asin-chip">B0B6277LBK</span></td><td>$2,799.99</td><td>$2,599.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0B6277LBK" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>70th-anniversary Vintera II Antigua Stratocaster Electric Guitar - An...</strong><br/><span class="asin-chip">B0CNKRB17N</span></td><td>$1,499.99</td><td>$1,299.99</td><td style="color:var(--danger-red); font-weight:700;">+$200.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0CNKRB17N" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Ultra II Stratocaster Left-Hand with Maple Fingerboard - Ava...</strong><br/><span class="asin-chip">B0D87QRBF8</span></td><td>$2,359.99</td><td>$2,179.99</td><td style="color:var(--danger-red); font-weight:700;">+$180.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0D87QRBF8" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Limited-edition Raphael Saadiq Telecaster Electric Guitar - Dark Meta...</strong><br/><span class="asin-chip">B0CS9XMZFG</span></td><td>$2,399.99</td><td>$2,226.99</td><td style="color:var(--danger-red); font-weight:700;">+$173.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0CS9XMZFG" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Player II Jaguar Electric Guitar - Coral Red</strong><br/><span class="asin-chip">B0D2M95G9J</span></td><td>$879.99</td><td>$718.99</td><td style="color:var(--danger-red); font-weight:700;">+$161.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0D2M95G9J" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Jim Root Jazzmaster Solid-Body Electric Guitar</strong><br/><span class="asin-chip">B00I5QXTYU</span></td><td>$2,349.99</td><td>$2,199.99</td><td style="color:var(--danger-red); font-weight:700;">+$150.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B00I5QXTYU" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Vintage II 1957 Stratocaster Electric Guitar - Vintage Blonde</strong><br/><span class="asin-chip">B0B6211V4R</span></td><td>$2,649.99</td><td>$2,499.99</td><td style="color:var(--danger-red); font-weight:700;">+$150.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0B6211V4R" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Vintage II 1972 Thinline Telecaster Electric Guitar, Aged Na...</strong><br/><span class="asin-chip">B0B627SLR9</span></td><td>$2,799.99</td><td>$2,649.99</td><td style="color:var(--danger-red); font-weight:700;">+$150.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0B627SLR9" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Vintage II 1977 Custom Telecaster Electric Guitar, Wine, Map...</strong><br/><span class="asin-chip">B0B623JL3C</span></td><td>$2,699.99</td><td>$2,599.99</td><td style="color:var(--danger-red); font-weight:700;">+$100.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0B623JL3C" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Player II Telecaster Electric Guitar - Aged Cherry Burst with Rosewoo...</strong><br/><span class="asin-chip">B0D2LNNB24</span></td><td>$949.99</td><td>$849.99</td><td style="color:var(--danger-red); font-weight:700;">+$100.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0D2LNNB24" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Player II Stratocaster, Rosewood Fingerboard, Transparent Cherry Burst</strong><br/><span class="asin-chip">B0D2LPFNJ1</span></td><td>$949.99</td><td>$849.99</td><td style="color:var(--danger-red); font-weight:700;">+$100.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0D2LPFNJ1" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Player II Telecaster Electric Guitar - Butterscotch Blonde with Maple...</strong><br/><span class="asin-chip">B0D2LQNDS7</span></td><td>$949.99</td><td>$849.99</td><td style="color:var(--danger-red); font-weight:700;">+$100.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0D2LQNDS7" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Player II Stratocaster, Rosewood Fingerboard, White Blonde</strong><br/><span class="asin-chip">B0D2LMMBNR</span></td><td>$944.99</td><td>$849.99</td><td style="color:var(--danger-red); font-weight:700;">+$95.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0D2LMMBNR" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Paranormal Esquire Deluxe, Maple Fingerboard, Black Pickguard, Mocha</strong><br/><span class="asin-chip">B0C2ZRX2YW</span></td><td>$472.99</td><td>$379.99</td><td style="color:var(--danger-red); font-weight:700;">+$93.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0C2ZRX2YW" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Affinity Series Telecaster FMT SH, Laurel Fingerboard, White Pickguar...</strong><br/><span class="asin-chip">B0D8G43XJP</span></td><td>$433.06</td><td>$371.98</td><td style="color:var(--danger-red); font-weight:700;">+$61.08</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0D8G43XJP" target="_blank" rel="noopener noreferrer">Amazon</a><a class="listing-link channel-tag channel-rev" href="https://www.musiciansfriend.com/guitars/squier-affinity-series-telecaster-fmt-sh-electric-guitar/m12998000001000" target="_blank" rel="noopener noreferrer">Musician&#x27;s Friend</a><a class="listing-link channel-tag channel-rev" href="https://www.guitarcenter.com/Squier/Affinity-Series-Telecaster-FMT-SH-Electric-Guitar-Transparent-Crimson-1500000432874.gc" target="_blank" rel="noopener noreferrer">Guitar Center</a></td></tr>
<tr><td><strong>Squier Affinity Series FSR Stratocaster Electric Guitar, Natural, Lau...</strong><br/><span class="asin-chip">B0BQ2VT3D6</span></td><td>$329.99</td><td>$279.99</td><td style="color:var(--danger-red); font-weight:700;">+$50.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0BQ2VT3D6" target="_blank" rel="noopener noreferrer">Amazon</a><a class="listing-link channel-tag channel-wmt" href="https://www.walmart.com/ip/890247177" target="_blank" rel="noopener noreferrer">Walmart</a></td></tr>
<tr><td><strong>American Professional Classic Hotshot Telecaster Electric Guitar - Fa...</strong><br/><span class="asin-chip">B0F6TPHHPQ</span></td><td>$1,549.99</td><td>$1,499.99</td><td style="color:var(--danger-red); font-weight:700;">+$50.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0F6TPHHPQ" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional Classic Hotshot Telecaster Electric Guitar - 3-...</strong><br/><span class="asin-chip">B00EOQ96ZG</span></td><td>$1,549.99</td><td>$1,519.99</td><td style="color:var(--danger-red); font-weight:700;">+$30.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B00EOQ96ZG" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>Player II Modified Telecaster SH Electric Guitar - Sunshine Yellow wi...</strong><br/><span class="asin-chip">B0DQ1LRD7J</span></td><td>$1,079.99</td><td>$1,049.99</td><td style="color:var(--danger-red); font-weight:700;">+$30.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0DQ1LRD7J" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
<tr><td><strong>American Professional Classic Hotshot Telecaster Electric Guitar - Bu...</strong><br/><span class="asin-chip">B0F6VHHWYG</span></td><td>$1,549.99</td><td>$1,519.99</td><td style="color:var(--danger-red); font-weight:700;">+$30.00</td><td><a class="listing-link channel-tag channel-amz" href="https://www.amazon.com/dp/B0F6VHHWYG" target="_blank" rel="noopener noreferrer">Amazon</a><span class="tag-badge tag-neutral">Outside price not named</span></td></tr>
      </tbody>
    </table>
  </div>
</div>
`;
