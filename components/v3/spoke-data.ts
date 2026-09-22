export type SpokeId =
  | "hub"
  | "aeo"
  | "ecommerce"
  | "specs"
  | "competitors"
  | "suggestions"
  | "roadmap";

export type SpokeDefinition = {
  badge: string;
  title: string;
  desc: string;
  tabs: string[];
  render: (tabIdx: number) => string;
};

export const spokeData = {
      hub: {
        badge: "PORTFOLIO CORE · MASTER COMMAND",
        title: "FMIC Brand Portfolio Command & Executive Briefing",
        desc: "Unified omnichannel intelligence across 124 monitored SKUs in 5 divisions: Electric (Strat/Tele), Acoustic/Hybrid (Acoustasonic), Bass (P-Bass/Jazz), Amps (Tone Master), and Squier.",
        tabs: ["Executive Briefing & Dual-Index", "Division Performance Matrix", "Enterprise Commercial Sizing"],
        render: (tabIdx: number) => {
          if (tabIdx === 0) {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>Executive Briefing · For CEO Joe</span>
                </div>
                <div class="ceo-callout-body">
                  Fender is at a generational inflection point: over 40% of instrument discovery and pre-purchase research now happens in AI conversational engines (ChatGPT, Perplexity, Claude, Gemini). While Fender retains unmatched heritage recognition, our products lose head-to-head recommendations in the critical $600–$1,200 bracket because competitors (PRS SE, Taylor, Yamaha) possess unified reviews and clean structured specifications that AI crawlers can parse as indisputable facts.
                </div>
                <div class="ceo-callout-footer">
                  Strategic takeaway: Catalog fragmentation on Amazon and missing schema on Fender.com directly starves AI models of authoritative data.
                </div>
              </div>

              <div class="dual-index-grid" style="margin-top:12px;">
                <div class="dual-index-card">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="metric-card-label">External AI Scan Index</span>
                    <span class="dual-index-badge tag-danger">Volatile LLM Scan</span>
                  </div>
                  <div class="dual-index-val" style="color:var(--danger-red);">
                    41 <span style="font-size:14px; color:var(--text-subtle); font-weight:600;">/ 100</span>
                  </div>
                  <span class="metric-card-sub" style="color:var(--danger-text);">🔻 −11 pts in past 30 days</span>
                  <p style="font-size:11px; color:var(--text-subtle); margin-top:4px; line-height:1.35;">
                    Non-deterministic external scan across 100 category prompts. Fluctuates with LLM stochastic sampling and web drift.
                  </p>
                </div>

                <div class="dual-index-card" style="border-color:rgba(99, 102, 241, 0.4);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="metric-card-label">IntoFocus Readiness Score</span>
                    <span class="dual-index-badge tag-success">Deterministic Control</span>
                  </div>
                  <div class="dual-index-val" style="color:var(--accent-purple);">
                    52% <span style="font-size:14px; color:var(--success-green); font-weight:700;">➔ Target: 94%</span>
                  </div>
                  <div class="readiness-progress-bar">
                    <div class="readiness-progress-fill" style="width: 52%;"></div>
                  </div>
                  <p style="font-size:11px; color:var(--text-subtle); margin-top:6px; line-height:1.35;">
                    Measures the 4 factors Fender 100% controls: Canonical Schemas (34%), Brand Registry (46%), MAP (58%), Community Grounding (70%).
                  </p>
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">
                  <span>Portfolio Quick-Look (124 Monitored ASINs)</span>
                  <span class="tag-badge tag-neutral">5 Brand Divisions</span>
                </div>
                <div class="metric-grid-2">
                  <div class="metric-card-sm">
                    <span class="metric-card-label">Buy Box Retention</span>
                    <div class="metric-card-val" style="color:var(--danger-red);">68%</div>
                    <span class="metric-card-sub">18% Suppressed · 14% Lost to 3P</span>
                  </div>
                  <div class="metric-card-sm">
                    <span class="metric-card-label">Enterprise Potential</span>
                    <div class="metric-card-val" style="color:var(--success-green);">+$28.4M</div>
                    <span class="metric-card-sub">Annualized GMV Lift across FMIC</span>
                  </div>
                </div>
              </div>
            `;
          } else if (tabIdx === 1) {
            return `
              <div class="content-box">
                <div class="content-box-title">Portfolio Health by Product Division</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>Division</th><th>SKUs</th><th>Buy Box</th><th>Splinter ASINs</th><th>Schema</th><th>Primary Rival Threat</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Solid-Body Electrics</strong></td>
                      <td>46</td>
                      <td><span style="color:var(--danger-red); font-weight:700;">64%</span></td>
                      <td>12 Bundles</td>
                      <td><span class="tag-badge tag-warning">68%</span></td>
                      <td>PRS SE Series (-3% SOV)</td>
                    </tr>
                    <tr>
                      <td><strong>Acoustic & Hybrids</strong></td>
                      <td>28</td>
                      <td><span style="color:var(--danger-red); font-weight:700;">61%</span></td>
                      <td>6 Bundles</td>
                      <td><span class="tag-badge tag-danger">42%</span></td>
                      <td>Taylor GS Mini (-47% SOV)</td>
                    </tr>
                    <tr>
                      <td><strong>Bass Guitars</strong></td>
                      <td>22</td>
                      <td><span style="color:var(--warning-amber); font-weight:700;">71%</span></td>
                      <td>4 Bundles</td>
                      <td><span class="tag-badge tag-warning">55%</span></td>
                      <td>Ibanez GSR / Sire (-18% SOV)</td>
                    </tr>
                    <tr>
                      <td><strong>Digital Amps & Audio</strong></td>
                      <td>16</td>
                      <td><span style="color:var(--success-green); font-weight:700;">81%</span></td>
                      <td>2 Bundles</td>
                      <td><span class="tag-badge tag-warning">75%</span></td>
                      <td>Boss Katana / Spark (-36% SOV)</td>
                    </tr>
                    <tr>
                      <td><strong>Squier Entry Tier</strong></td>
                      <td>12</td>
                      <td><span style="color:var(--warning-amber); font-weight:700;">69%</span></td>
                      <td>4 Bundles</td>
                      <td><span class="tag-badge tag-warning">48%</span></td>
                      <td>Yamaha Pacifica (-24% SOV)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
          } else {
            return `
              <div class="content-box">
                <div class="content-box-title">Commercial Sizing: Pilot vs Full Enterprise Portfolio</div>
                <p style="font-size:12px; color:var(--text-muted); line-height:1.45;">
                  To properly justify an enterprise advisory retainer ($20,000/month = $240,000/year), IntoFocus models ROI across both the immediate 14-ASIN pilot and the broader FMIC catalog (Fender USA, Ensenada, Squier, Jackson, Gretsch, EVH).
                </p>

                <div class="dual-index-grid" style="margin-top:10px;">
                  <div class="dual-index-card" style="border-color:var(--border-color);">
                    <span class="metric-card-label">Phase 1 Pilot (14 ASINs)</span>
                    <div class="metric-card-val" style="color:var(--success-green);">+$680,000 <span style="font-size:12px; color:var(--text-subtle);">/ yr</span></div>
                    <span class="metric-card-sub">Immediate Buy Box & Review Consolidation</span>
                    <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">
                      Recovers 1,405 reviews across Player Strat/Tele and Acoustasonic, instantly boosting conversion on core hero listings.
                    </div>
                  </div>

                  <div class="dual-index-card" style="border-color:rgba(16, 185, 129, 0.4); background:rgba(16, 185, 129, 0.04);">
                    <span class="metric-card-label" style="color:var(--success-text);">Full Enterprise Scale (1,450+ SKUs)</span>
                    <div class="metric-card-val" style="color:var(--success-green);">+$28.4M – $42.6M <span style="font-size:12px; color:var(--text-subtle);">/ yr</span></div>
                    <span class="metric-card-sub">Catalog-Wide Buy Box + AEO Conversion Grounding</span>
                    <div style="font-size:11.5px; color:var(--text-muted); margin-top:6px;">
                      Across Fender, Squier, Jackson, EVH, and Gretsch. Yields a <strong>118x enterprise ROI</strong> on annual service fee.
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
          return "";
        }
      },

      ecommerce: {
        badge: "CRITICAL SPOKE · RETAIL HEALTH",
        title: "Full-Catalog E-Commerce, Buy Box & Brand Registry",
        desc: "Catalog Buy Box retention is currently 68% across 124 monitored SKUs. 14 critical ASINs suffer from algorithmic suppression or 3P bundle undercutting across Amazon, Reverb, and Walmart.",
        tabs: ["14-ASIN Buy Box & Price Leakage Explorer", "Brand Registry & Partner Harmonization", "Multi-Marketplace MAP (Amazon, Reverb, Walmart)"],
        render: (tabIdx: number) => {
          if (tabIdx === 0) {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>Explain to CEO Joe · What Does "Buy Box 68%" Actually Mean?</span>
                </div>
                <div class="ceo-callout-body">
                  When a customer searches for a Fender guitar on Amazon and clicks "Add to Cart", the sale goes to whoever owns the <strong>Buy Box</strong> button. At 68%, Fender and its verified direct channels only capture 68 out of every 100 customer purchases. The other 32% are lost in two distinct ways:
                  <ul style="margin:6px 0 0 16px; padding:0;">
                    <li><strong>18% are "Suppressed Buy Boxes" (No Winner):</strong> Amazon's algorithm detected a lower price on Walmart or Reverb, removing the 1-click buy button entirely. Conversion drops by ~65%.</li>
                    <li><strong>14% are Won by 3P Bundlers:</strong> Authorized partners (Austin Bazaar, GearTree) bundle cheap bags or cables to undercut our minimum advertised price (MAP).</li>
                  </ul>
                </div>
              </div>

              <div class="metric-grid-2" style="margin-top:12px;">
                <div class="metric-card-sm">
                  <span class="metric-card-label">Portfolio Buy Box</span>
                  <div class="metric-card-val" style="color:var(--danger-red);">68% <span style="font-size:12px; color:var(--text-subtle);">(Target: 95%)</span></div>
                  <span class="metric-card-sub">18% Suppressed · 14% Lost to 3P</span>
                </div>
                <div class="metric-card-sm">
                  <span class="metric-card-label">Splintered Reviews</span>
                  <div class="metric-card-val" style="color:var(--warning-amber);">2,420+</div>
                  <span class="metric-card-sub">Scattered across 14 rogue bundles</span>
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">
                  <span>14 Flagged ASINs Drill-Down (Catalog Price Leakage)</span>
                  <span class="tag-badge tag-danger">14 Urgent ASINs</span>
                </div>
                
                <div style="overflow-x:auto;">
                  <table class="table-sm" id="asin-table">
                    <thead>
                      <tr><th>SKU / Model</th><th>Child ASIN</th><th>Partner / Bundle</th><th>MAP</th><th>Offer</th><th>Leak</th><th>Reviews</th><th>Channels</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Player II Stratocaster</strong></td>
                        <td><span class="asin-chip">B0D8TFXHHT</span></td>
                        <td>Austin Bazaar Gig Bag & Cable</td>
                        <td>$849.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$808.00</td>
                        <td>-$41.99</td>
                        <td><strong style="color:var(--warning-amber);">240</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span><span class="channel-tag channel-rev">REV</span></td>
                      </tr>
                      <tr>
                        <td><strong>Player II Telecaster</strong></td>
                        <td><span class="asin-chip">B0D8TN41XS</span></td>
                        <td>Photo4Less Hard Case Bundle</td>
                        <td>$849.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$814.99</td>
                        <td>-$35.00</td>
                        <td><strong style="color:var(--warning-amber);">180</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span></td>
                      </tr>
                      <tr>
                        <td><strong>Acoustasonic Player Tele</strong></td>
                        <td><span class="asin-chip">B0C9Q8X11P</span></td>
                        <td>GearTree Starter Kit Bundle</td>
                        <td>$1,199.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$1,149.00</td>
                        <td>-$50.99</td>
                        <td><strong style="color:var(--warning-amber);">310</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span><span class="channel-tag channel-wmt">WMT</span></td>
                      </tr>
                      <tr>
                        <td><strong>Player Precision Bass</strong></td>
                        <td><span class="asin-chip">B09KM14J88</span></td>
                        <td>Austin Bazaar Deluxe Gig Bag</td>
                        <td>$869.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$829.00</td>
                        <td>-$40.99</td>
                        <td><strong style="color:var(--warning-amber);">195</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span></td>
                      </tr>
                      <tr>
                        <td><strong>Player Jazz Bass</strong></td>
                        <td><span class="asin-chip">B09KM22K77</span></td>
                        <td>GearDirect Express Bundle</td>
                        <td>$899.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$854.99</td>
                        <td>-$45.00</td>
                        <td><strong style="color:var(--warning-amber);">140</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span><span class="channel-tag channel-rev">REV</span></td>
                      </tr>
                      <tr>
                        <td><strong>American Pro II Strat</strong></td>
                        <td><span class="asin-chip">B08KGX4199</span></td>
                        <td>GearDirect Instrument Cable Kit</td>
                        <td>$1,799.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$1,719.99</td>
                        <td>-$80.00</td>
                        <td><strong style="color:var(--warning-amber);">210</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span></td>
                      </tr>
                      <tr>
                        <td><strong>American Pro II Tele</strong></td>
                        <td><span class="asin-chip">B08KGY8821</span></td>
                        <td>Austin Bazaar Tweed Strap Pack</td>
                        <td>$1,799.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$1,724.99</td>
                        <td>-$75.00</td>
                        <td><strong style="color:var(--warning-amber);">165</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span><span class="channel-tag channel-rev">REV</span></td>
                      </tr>
                      <tr>
                        <td><strong>Mustang Micro Amp</strong></td>
                        <td><span class="asin-chip">B08K3V4M99</span></td>
                        <td>Headphone + Cable Bundle</td>
                        <td>$119.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$109.99</td>
                        <td>-$10.00</td>
                        <td><strong style="color:var(--warning-amber);">480</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span><span class="channel-tag channel-wmt">WMT</span></td>
                      </tr>
                      <tr>
                        <td><strong>Tone Master Deluxe Reverb</strong></td>
                        <td><span class="asin-chip">B07X81ML33</span></td>
                        <td>Fitted Cover + Footswitch Pack</td>
                        <td>$1,049.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$989.99</td>
                        <td>-$60.00</td>
                        <td><strong style="color:var(--warning-amber);">95</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span></td>
                      </tr>
                      <tr>
                        <td><strong>Squier Classic Vibe '60s Strat</strong></td>
                        <td><span class="asin-chip">B07N25DDK8</span></td>
                        <td>Austin Bazaar Stand & Bag Pack</td>
                        <td>$459.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$429.99</td>
                        <td>-$30.00</td>
                        <td><strong style="color:var(--warning-amber);">320</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span></td>
                      </tr>
                      <tr>
                        <td><strong>Squier Classic Vibe '50s Tele</strong></td>
                        <td><span class="asin-chip">B07N24MM91</span></td>
                        <td>Photo4Less Clip-on Tuner Kit</td>
                        <td>$459.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$434.99</td>
                        <td>-$25.00</td>
                        <td><strong style="color:var(--warning-amber);">290</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span><span class="channel-tag channel-wmt">WMT</span></td>
                      </tr>
                      <tr>
                        <td><strong>Squier Affinity P-Bass</strong></td>
                        <td><span class="asin-chip">B092BG24LL</span></td>
                        <td>GearTree Essentials Pack</td>
                        <td>$299.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$279.99</td>
                        <td>-$20.00</td>
                        <td><strong style="color:var(--warning-amber);">175</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span></td>
                      </tr>
                      <tr>
                        <td><strong>Fender CD-60S Acoustic</strong></td>
                        <td><span class="asin-chip">B071KNF2L4</span></td>
                        <td>Austin Bazaar Starter Kit</td>
                        <td>$229.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$209.99</td>
                        <td>-$20.00</td>
                        <td><strong style="color:var(--warning-amber);">510</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span><span class="channel-tag channel-rev">REV</span></td>
                      </tr>
                      <tr>
                        <td><strong>Fender FA-115 Acoustic Pack</strong></td>
                        <td><span class="asin-chip">B07B8X8GZ8</span></td>
                        <td>GearDirect Spare Strings Kit</td>
                        <td>$199.99</td>
                        <td style="color:var(--danger-red); font-weight:700;">$184.99</td>
                        <td>-$15.00</td>
                        <td><strong style="color:var(--warning-amber);">380</strong></td>
                        <td><span class="channel-tag channel-amz">AMZ</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          } else if (tabIdx === 1) {
            return `
              <div class="ceo-callout" style="border-color:rgba(16, 185, 129, 0.4);">
                <div class="ceo-callout-header" style="color:var(--success-text);">
                  <span>Partner Governance · Why We Do NOT Send Cease & Desists</span>
                </div>
                <div class="ceo-callout-body">
                  Key sellers like <strong>Austin Bazaar</strong> and <strong>Crazy Dave's Music</strong> are Fender's most valuable e-commerce distribution partners. They hold legitimate <strong>Amazon Brand Registry catalog access</strong> granted by Fender to create bundles.
                  <br/><br/>
                  The issue is NOT piracy or counterfeit—it is <strong>listing architecture</strong>. By creating separate standalone ASINs for their bundles, their customer reviews are isolated from Fender's official catalog. 
                  <br/><br/>
                  <strong>The Real Danger to Fender:</strong>
                  <ul style="margin:4px 0 0 16px;">
                    <li><strong>Review Dilution:</strong> 2,420+ reviews are splintered away from the parent Player Stratocaster and Telecaster listings.</li>
                    <li><strong>Lost Badges:</strong> Because reviews are fragmented across 4–5 bundle pages, Fender misses the critical review threshold needed to win the <strong>"Amazon's Overall Pick" badge</strong>, which instead goes to PRS SE or Yamaha Pacifica.</li>
                    <li><strong>AI Hallucinations:</strong> When 3P dealers write custom bundle titles with inaccuracies, generative AI engines scrape those descriptions as canonical facts!</li>
                  </ul>
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">The Solution: Brand Registry Variation Harmonization</div>
                <div class="action-card" style="border-left-color:var(--success-green);">
                  <div class="action-head">Fold Bundles into Canonical Parent-Child Variations</div>
                  <div class="action-details">
                    Work collaboratively with Austin Bazaar and GearTree through Amazon Brand Registry to nest authorized bundles as secondary variations under the official Fender Parent ASIN. 
                    <br/><br/>
                    <strong>Immediate Outcome:</strong> Austin Bazaar keeps their bundle sales, but all 1,405 reviews immediately pool onto the parent listing, instantly triggering the Amazon "Overall Pick" badge and protecting MAP integrity.
                  </div>
                  <div class="action-impact">
                    Recovers 2,420 reviews · Zero partner friction · +$380,000/yr Buy Box recapture
                  </div>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>MAP (Minimum Advertised Price) Health & Cross-Channel Dynamics</span>
                </div>
                <div class="ceo-callout-body">
                  <strong>What is MAP?</strong> Minimum Advertised Price is the lowest price a retailer agrees to publicly display for a brand's product.
                  <br/><br/>
                  <strong>The Starter Kit Loophole:</strong> Partners bundle a $1,199 Acoustasonic Player with a $20 bag and sell the bundle for $1,149. This technically sidesteps strict single-item MAP rules, but wrecks marketplace price integrity.
                  <br/><br/>
                  <strong>Cross-Channel Price Crawlers:</strong>
                  When a bundle is listed below MAP on Amazon, scraping bots from <strong>Walmart</strong> and <strong>Reverb</strong> instantly match or beat the lower price. Amazon's Fair Pricing algorithm then detects the off-Amazon discount and suppresses Fender's Buy Box on Amazon entirely!
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">Multi-Marketplace Leakage Overview</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>Marketplace Channel</th><th>Violations</th><th>Average Price Drift</th><th>Algorithmic Impact</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Amazon</strong></td>
                      <td>14 ASINs</td>
                      <td>-$42.00</td>
                      <td><span class="tag-badge tag-danger">Buy Box Suppression</span></td>
                    </tr>
                    <tr>
                      <td><strong>Walmart Marketplace</strong></td>
                      <td>8 Listings</td>
                      <td>-$38.00</td>
                      <td><span class="tag-badge tag-warning">Automated Price Match</span></td>
                    </tr>
                    <tr>
                      <td><strong>Reverb (Brand New / Open Box)</strong></td>
                      <td>11 Listings</td>
                      <td>-$55.00</td>
                      <td><span class="tag-badge tag-danger">MAP Floor Erosion</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
          }
          return "";
        }
      },

      aeo: {
        badge: "CRITICAL SPOKE · BRAND AEO",
        title: "Brand AI Visibility, Citations & AI Simulations",
        desc: "Fender's brand visibility across 100 conversational prompts in ChatGPT, Perplexity, Claude, Gemini, and Copilot averages 41/100. Controllable Readiness Score is 52%.",
        tabs: ["Dual-Index Health & Executive Briefing", "100 AI Simulations Explorer", "Citation Ecosystem & DTC Opportunity", "AI Spec Hallucination Engine"],
        render: (tabIdx: number) => {
          if (tabIdx === 0) {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>Explain to CEO Joe · Why AEO Determines Future Market Share</span>
                </div>
                <div class="ceo-callout-body">
                  When potential buyers ask ChatGPT or Perplexity, <em>"What electric guitar should I buy under $1,000 for blues and indie rock?"</em>, the AI doesn't return a list of blue links. It generates a synthesized recommendation with 2 or 3 specific guitars. If Fender's Player II isn't structured for AI ingestion, the LLM recommends PRS SE or Yamaha Pacifica instead. <strong>Zero-click conversational search is replacing Google SEO.</strong>
                </div>
              </div>

              <div class="dual-index-grid" style="margin-top:12px;">
                <div class="dual-index-card">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="metric-card-label">External AI Scan Index</span>
                    <span class="dual-index-badge tag-danger">Volatile LLM Scan</span>
                  </div>
                  <div class="dual-index-val" style="color:var(--danger-red);">
                    41 <span style="font-size:14px; color:var(--text-subtle); font-weight:600;">/ 100</span>
                  </div>
                  <span class="metric-card-sub" style="color:var(--danger-text);">🔻 −11 pts in past 30 days</span>
                  <p style="font-size:11px; color:var(--text-subtle); margin-top:4px; line-height:1.35;">
                    Down 11 points due to non-deterministic crawler updates and competitor comparison videos on YouTube.
                  </p>
                </div>

                <div class="dual-index-card" style="border-color:rgba(99, 102, 241, 0.4);">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="metric-card-label">IntoFocus Readiness Score</span>
                    <span class="dual-index-badge tag-success">Deterministic Control</span>
                  </div>
                  <div class="dual-index-val" style="color:var(--accent-purple);">
                    52% <span style="font-size:14px; color:var(--success-green); font-weight:700;">➔ Target: 94%</span>
                  </div>
                  <div class="readiness-progress-bar">
                    <div class="readiness-progress-fill" style="width: 52%;"></div>
                  </div>
                  <p style="font-size:11px; color:var(--text-subtle); margin-top:6px; line-height:1.35;">
                    The true compass: ticks upward as we inject JSON-LD specs, nest Brand Registry ASINs, and harmonize MAP.
                  </p>
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">Heritage vs Value Prompt Disparity</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>Prompt Query Category</th><th>Fender Appearance</th><th>Primary Winner</th><th>Root Cause</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Heritage & Icon Prompts</strong> ("Classic rock guitars", "Stratocaster history")</td>
                      <td><span style="color:var(--success-green); font-weight:700;">84%</span></td>
                      <td>Fender</td>
                      <td>Unassailable 70-year brand legacy in training weights</td>
                    </tr>
                    <tr>
                      <td><strong>Value & Spec Comparisons</strong> ("Best guitar under $900", "Best fretwork")</td>
                      <td><span style="color:var(--danger-red); font-weight:700;">18%</span></td>
                      <td>PRS SE / Yamaha</td>
                      <td>Competitors provide clean tabular specs; Fender pages lack schema</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
          } else if (tabIdx === 1) {
            return `
              <div class="content-box">
                <div class="content-box-title">
                  <span>100 AI Simulations Query Explorer</span>
                  <span class="tag-badge tag-danger">100 Simulations Run</span>
                </div>
                <p style="font-size:12px; color:var(--text-muted); line-height:1.4;">
                  Drill down into simulated user queries tracked across ChatGPT-4o, Perplexity AI, Claude 3.5 Sonnet, and Google Gemini:
                </p>

                <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
                  <div class="action-card critical">
                    <div class="action-head">
                      <span>Query: "Best electric guitar under $900 for versatile tones"</span>
                      <span class="tag-badge tag-danger">Fender Win: 28%</span>
                    </div>
                    <div class="action-details">
                      • <strong>Engines Tracked:</strong> ChatGPT (Lost), Perplexity (Lost), Claude (Won), Gemini (Lost).<br/>
                      • <strong>AI Consensual Winner:</strong> PRS SE Custom 24 / Yamaha Pacifica 611.<br/>
                      • <strong>Why Fender Lost:</strong> AI cited PRS SE fret consistency and coil-split versatility extracted from tabular Amazon A+ grids.<br/>
                      • <strong>Remediation:</strong> Deploy 4-column comparison table on Player II Amazon A+ content.
                    </div>
                  </div>

                  <div class="action-card critical">
                    <div class="action-head">
                      <span>Query: "Best travel acoustic guitar for intermediate players"</span>
                      <span class="tag-badge tag-danger">Fender Win: 11%</span>
                    </div>
                    <div class="action-details">
                      • <strong>Engines Tracked:</strong> ChatGPT (Lost), Perplexity (Lost), Claude (Lost), Gemini (Lost).<br/>
                      • <strong>AI Consensual Winner:</strong> Taylor GS Mini (58% of all citations).<br/>
                      • <strong>Why Fender Lost:</strong> Taylor GS Mini has a single canonical listing with 1,200+ reviews; Fender Malibu/CP-60S listings are fragmented.<br/>
                      • <strong>Remediation:</strong> Launch "Travel Acoustic Shootout" hub on Fender.com and consolidate Amazon acoustic ASINs.
                    </div>
                  </div>

                  <div class="action-card" style="border-left-color:var(--warning-amber);">
                    <div class="action-head">
                      <span>Query: "Best desktop practice amp with bluetooth"</span>
                      <span class="tag-badge tag-warning">Fender Win: 38%</span>
                    </div>
                    <div class="action-details">
                      • <strong>Engines Tracked:</strong> ChatGPT (Won), Perplexity (Lost), Claude (Lost), Gemini (Lost).<br/>
                      • <strong>AI Consensual Winner:</strong> Positive Grid Spark MINI / Boss Katana 50.<br/>
                      • <strong>Why Fender Lost:</strong> Mustang Micro praised for form factor, but AI penalized lack of direct app editing compared to Spark.<br/>
                      • <strong>Remediation:</strong> Publish Mustang Micro v2 feature comparison table on DTC web.
                    </div>
                  </div>

                  <div class="action-card" style="border-left-color:var(--success-green);">
                    <div class="action-head">
                      <span>Query: "Fender Stratocaster vs PRS SE Custom 24"</span>
                      <span class="tag-badge tag-success">Fender Win: 82%</span>
                    </div>
                    <div class="action-details">
                      • <strong>Engines Tracked:</strong> ChatGPT (Won), Perplexity (Won), Claude (Won), Gemini (Won).<br/>
                      • <strong>Outcome:</strong> Strong direct matchup. AI recommends Stratocaster for single-coil chime and neck comfort; PRS for modern rock humbuckers.
                    </div>
                  </div>
                </div>
              </div>
            `;
          } else if (tabIdx === 2) {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>What is "Fender DTC" & Where Do AI Models Learn?</span>
                </div>
                <div class="ceo-callout-body">
                  <strong>Fender DTC (Direct-to-Consumer):</strong> Fender's own e-commerce store at <em>fender.com</em>. While it has high brand prestige, it currently only generates <strong>12% of total AI citations</strong> for guitar buying queries.
                  <br/><br/>
                  AI models draw <strong>55% of their opinions</strong> from third-party discussions (Reddit /r/Guitar, TalkBass) and retail listings (Amazon, Sweetwater). To win in AI search, Fender must turn fender.com into an authoritative comparison authority that feeds GPTBot directly!
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">AI Citation Ecosystem Breakdown</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>Citation Channel</th><th>Citation Share</th><th>Current Fender Footprint</th><th>Action Plan</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Reddit & Enthusiast Forums</strong> (/r/Guitar, TalkBass)</td>
                      <td><strong>31%</strong></td>
                      <td><span class="tag-badge tag-warning">Moderate</span> Strong legacy lore, weak in $600-$900 value debates</td>
                      <td>Launch verified community engineering engagement</td>
                    </tr>
                    <tr>
                      <td><strong>Amazon & Retail Product Listings</strong></td>
                      <td><strong>24%</strong></td>
                      <td><span class="tag-badge tag-danger">Diluted</span> 14 splinter ASINs fragmenting review scores</td>
                      <td>Consolidate under Brand Registry variation trees</td>
                    </tr>
                    <tr>
                      <td><strong>Editorial & Media Reviews</strong> (Guitar World, Premier Guitar)</td>
                      <td><strong>19%</strong></td>
                      <td><span class="tag-badge tag-success">Strong</span> Frequent top placement in roundup reviews</td>
                      <td>Syndicate official press specs into Google Merchant Feed</td>
                    </tr>
                    <tr>
                      <td><strong>YouTube Video Transcripts</strong> (Andertons, Mary Spender)</td>
                      <td><strong>14%</strong></td>
                      <td><span class="tag-badge tag-success">Strong</span> Heavy creator coverage for new product launches</td>
                      <td>Provide structured caption metadata to YouTube crawlers</td>
                    </tr>
                    <tr>
                      <td><strong>Brand DTC</strong> (fender.com)</td>
                      <td><strong>12%</strong></td>
                      <td><span class="tag-badge tag-warning">Under-Indexed</span> Schema valid, but lacks head-to-head comparison pages</td>
                      <td>Publish DTC Comparison Hubs (Strat vs PRS / Acoustasonic vs Taylor)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
          } else {
            return `
              <div class="content-box">
                <div class="content-box-title">
                  <span>Detected AI Spec Hallucinations & Rogue Bundles</span>
                  <span class="tag-badge tag-danger">Critical Remediation</span>
                </div>
                <p style="font-size:12px; color:var(--text-muted); line-height:1.45;">
                  When official catalog pages lack tabular specifications in machine-readable JSON-LD, conversational LLMs attempt to scrape specs from unauthorized third-party bundle listings, resulting in severe technical hallucinations:
                </p>

                <div class="action-card critical" style="margin-top:8px;">
                  <div class="action-head">1. The "Dual Humbucker" Acoustasonic Hallucination</div>
                  <div class="action-details">
                    • <strong>The Bug:</strong> ChatGPT and Perplexity frequently state that the Acoustasonic Player Telecaster features "dual humbuckers" for heavy distortion.<br/>
                    • <strong>Root Cause:</strong> A 3P seller bundle on Amazon (<span class="asin-chip">B0C9Q8X11P</span>) erroneously stuffed "Humbucker pickup pack" into its product title and bullet points.<br/>
                    • <strong>Commercial Harm:</strong> Buyers seeking clean acoustic-electric tones reject the guitar thinking it has metal pickups; return rates increase.<br/>
                    • <strong>Remediation:</strong> Correct child ASIN metadata via Brand Registry and deploy Schema.org <code>pickupConfiguration: "Fender/Fishman Piezo + Tim Shaw Acoustic Engine"</code>.
                  </div>
                </div>

                <div class="action-card critical" style="margin-top:8px;">
                  <div class="action-head">2. The "12-Inch Fingerboard Radius" Player II Error</div>
                  <div class="action-details">
                    • <strong>The Bug:</strong> Claude 3.5 Sonnet occasionally informs users that the Player II Stratocaster has a flat 12-inch fingerboard radius.<br/>
                    • <strong>Root Cause:</strong> 3P multi-pack listings combined Jackson JS22 specs (which have 12"-16" compound radiuses) on the same product page.<br/>
                    • <strong>True Spec:</strong> <strong>9.5-inch Modern C</strong> with rolled edges.<br/>
                    • <strong>Remediation:</strong> Inject explicit <code>fingerboardRadius: "9.5 in"</code> JSON-LD schema on all Player II product detail pages.
                  </div>
                </div>
              </div>
            `;
          }
          return "";
        }
      },

      specs: {
        badge: "WATCH SPOKE · SPEC COVERAGE",
        title: "Cross-Category Spec Matrix & Schema.org Health",
        desc: "34% Schema.org structured completeness across 124 catalog pages. 14 of 18 primary product lines lack tabular comparison modules.",
        tabs: ["Catalog Spec Readiness & Executive Guide", "Machine-Readable Schema.org Audit", "Amazon A+ Comparison Matrix Blueprint"],
        render: (tabIdx: number) => {
          if (tabIdx === 0) {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>Explain to CEO Joe · What is Schema.org & Why Does AI Need It?</span>
                </div>
                <div class="ceo-callout-body">
                  When human beings look at <em>fender.com</em>, they read descriptive marketing paragraphs: <em>"Crafted for bold expression with timeless curves..."</em>
                  <br/><br/>
                  AI crawlers (GPTBot, ClaudeBot, PerplexityBot) cannot reliably extract technical dimensions from poetic marketing copy. <strong>Schema.org JSON-LD</strong> is a hidden, standardized machine-readable code block behind the page that states facts directly:
                  <div style="background:var(--bg-surface); padding:8px; border-radius:6px; font-family:var(--font-mono); font-size:11px; margin-top:6px; border:1px solid var(--border-color);">
                    "bodyWood": "Alder", "fingerboardRadius": "9.5 in", "nutWidth": "1.650 in", "frets": 22
                  </div>
                  Without this, AI engines guess—or scrape incorrect specs from unauthorized Amazon bundles!
                </div>
              </div>

              <div class="metric-grid-2" style="margin-top:12px;">
                <div class="metric-card-sm">
                  <span class="metric-card-label">Catalog Schema Coverage</span>
                  <div class="metric-card-val" style="color:var(--warning-amber);">34% <span style="font-size:12px; color:var(--text-subtle);">(124 SKUs)</span></div>
                  <span class="metric-card-sub">Missing machine-readable attributes</span>
                </div>
                <div class="metric-card-sm">
                  <span class="metric-card-label">Missing Amazon A+ Grids</span>
                  <div class="metric-card-val" style="color:var(--danger-red);">78%</div>
                  <span class="metric-card-sub">14 of 18 catalog product lines</span>
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">Structured Spec Completeness by Division</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>Division</th><th>Schema Markup</th><th>Tabular Grid</th><th>AEO Readiness</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>Electrics (Strat/Tele)</strong></td><td>68% Valid</td><td><span style="color:var(--danger-red);">Missing (10/14)</span></td><td><span class="tag-badge tag-warning">Partial</span></td></tr>
                    <tr><td><strong>Acoustics & Hybrids</strong></td><td>42% Valid</td><td><span style="color:var(--danger-red);">Missing (8/8)</span></td><td><span class="tag-badge tag-danger">Poor</span></td></tr>
                    <tr><td><strong>Bass Lines</strong></td><td>55% Valid</td><td><span style="color:var(--danger-red);">Missing (6/6)</span></td><td><span class="tag-badge tag-warning">Partial</span></td></tr>
                    <tr><td><strong>Digital Amps & Audio</strong></td><td>75% Valid</td><td><span style="color:var(--warning-amber);">Partial (2/4)</span></td><td><span class="tag-badge tag-warning">Moderate</span></td></tr>
                  </tbody>
                </table>
              </div>
            `;
          } else if (tabIdx === 1) {
            return `
              <div class="content-box">
                <div class="content-box-title">Missing Schema.org JSON-LD Technical Properties</div>
                <p style="font-size:12px; color:var(--text-muted);">
                  The following 6 technical attributes are currently missing from fender.com product templates, forcing AI engines to pull from third-party Amazon listings:
                </p>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
                  <div style="background:var(--bg-surface); padding:8px 10px; border-radius:6px; font-size:11.5px; border:1px solid var(--border-color);">
                    ❌ <code>fingerboardRadius</code> (Causes 12" radius bug)
                  </div>
                  <div style="background:var(--bg-surface); padding:8px 10px; border-radius:6px; font-size:11.5px; border:1px solid var(--border-color);">
                    ❌ <code>pickupConfiguration</code> (Causes Acoustasonic bug)
                  </div>
                  <div style="background:var(--bg-surface); padding:8px 10px; border-radius:6px; font-size:11.5px; border:1px solid var(--border-color);">
                    ❌ <code>nutWidth</code> (Critical for beginner search)
                  </div>
                  <div style="background:var(--bg-surface); padding:8px 10px; border-radius:6px; font-size:11.5px; border:1px solid var(--border-color);">
                    ❌ <code>scaleLength</code> (Crucial for travel queries)
                  </div>
                  <div style="background:var(--bg-surface); padding:8px 10px; border-radius:6px; font-size:11.5px; border:1px solid var(--border-color);">
                    ❌ <code>bodyWoodType</code> (Alder vs Basswood vs Poplar)
                  </div>
                  <div style="background:var(--bg-surface); padding:8px 10px; border-radius:6px; font-size:11.5px; border:1px solid var(--border-color);">
                    ❌ <code>numberOfFrets</code> (21 vintage vs 22 modern)
                  </div>
                </div>

                <div class="action-card" style="margin-top:12px; border-left-color:var(--accent-purple);">
                  <div class="action-head">Ready-to-Deploy JSON-LD Code Blueprint</div>
                  <pre style="background:#090d16; padding:10px; border-radius:6px; font-size:11px; color:#a5b4fc; overflow-x:auto; margin-top:6px; border:1px solid var(--border-color);"><code>{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Fender Player II Stratocaster",
  "image": "https://fender.com/img/player2-strat-sunburst.jpg",
  "brand": { "@type": "Brand", "name": "Fender" },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "fingerboardRadius", "value": "9.5 in (241 mm)" },
    { "@type": "PropertyValue", "name": "pickupConfiguration", "value": "SSS Player Series Alnico 5" },
    { "@type": "PropertyValue", "name": "bodyWoodType", "value": "Alder" },
    { "@type": "PropertyValue", "name": "nutWidth", "value": "1.650 in (42 mm)" }
  ]
}</code></pre>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>What is Amazon A+ Content & Why Does It Win AI Queries?</span>
                </div>
                <div class="ceo-callout-body">
                  <strong>Amazon A+ Content:</strong> Enhanced visual branding modules on Amazon product pages (graphics, diagrams, and comparison charts).
                  <br/><br/>
                  When A+ comparison tables are present, Amazon's Rufus AI and external LLMs (ChatGPT, Claude) parse the table columns directly. This allows Fender to define its own tiering hierarchy rather than letting PRS or Taylor frame our products.
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">Recommended 4-Column A+ Matrix Structure</div>
                <p style="font-size:12px; color:var(--text-muted); line-height:1.45;">
                  Extract vendor specs directly rather than quoting competitor comparison charts. Standardizes the upgrade path across 14 catalog lines:
                </p>

                <table class="table-sm" style="margin-top:6px;">
                  <thead>
                    <tr><th>Specification</th><th>Squier Classic Vibe</th><th>Player II Series</th><th>American Performer</th><th>American Pro II</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>Price Point</strong></td><td>$459.99</td><td>$849.99</td><td>$1,399.99</td><td>$1,799.99</td></tr>
                    <tr><td><strong>Body Wood</strong></td><td>Poplar / Nato</td><td>Alder / Chambered Ash</td><td>Alder</td><td>Select Alder / Roasted Pine</td></tr>
                    <tr><td><strong>Pickups</strong></td><td>Fender-Designed Alnico</td><td>Player II Alnico 5</td><td>Yosemite Single-Coil</td><td>V-Mod II Single-Coil</td></tr>
                    <tr><td><strong>Fretwork</strong></td><td>Narrow Tall</td><td>Medium Jumbo (Rolled Edges)</td><td>Jumbo</td><td>Narrow Tall (Hand-Rolled)</td></tr>
                    <tr><td><strong>Country of Origin</strong></td><td>Indonesia</td><td>Ensenada, Mexico</td><td>Corona, California (USA)</td><td>Corona, California (USA)</td></tr>
                  </tbody>
                </table>
              </div>
            `;
          }
          return "";
        }
      },

      competitors: {
        badge: "BENCHMARK SPOKE · RADAR",
        title: "Brand Competitive Radar & Category SOV",
        desc: "Benchmarking Fender's AI visibility across 6 primary rivals in Electric, Acoustic, Bass, and Amp categories.",
        tabs: ["Cross-Category SOV & Catalog Scope", "Direct Rival Battlecards", "Acoustic & Practice Amp Gaps"],
        render: (tabIdx: number) => {
          if (tabIdx === 0) {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>Clarifying Catalog Scope & Category Gaps</span>
                </div>
                <div class="ceo-callout-body">
                  <strong>Where does Squier fit?</strong> Squier is Fender's 100% owned entry-level brand. In this canvas, Squier products (Affinity, Classic Vibe) are evaluated directly alongside Fender because they represent Fender's frontline defense against Yamaha and Ibanez in the high-volume under-$500 market.
                  <br/><br/>
                  <strong>What does "Gap to Leader" mean?</strong> The percentage difference between the top recommended brand in that category and Fender/Squier. In acoustics, Taylor holds a staggering 47-point lead over Fender in AI recommendations.
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">Share of Voice (SOV) in Conversational Engine Answers</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>Category / Sub-Bracket</th><th>Leader Brand</th><th>Leader SOV</th><th>Fender SOV</th><th>Gap to Leader</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>Solid-Body Electrics ($700-$1k)</strong></td><td>PRS SE Series</td><td>34%</td><td>31%</td><td><span style="color:var(--warning-amber); font-weight:700;">-3%</span></td></tr>
                    <tr><td><strong>Entry Electrics (Under $350)</strong></td><td>Yamaha Pacifica</td><td>48%</td><td>24% (Squier)</td><td><span style="color:var(--danger-red); font-weight:700;">-24%</span></td></tr>
                    <tr><td><strong>Travel & Compact Acoustics</strong></td><td>Taylor (GS Mini)</td><td>58%</td><td>11%</td><td><span style="color:var(--danger-red); font-weight:700;">-47%</span></td></tr>
                    <tr><td><strong>Entry Active Bass (Under $450)</strong></td><td>Ibanez (GSR/SR)</td><td>46%</td><td>28% (Squier)</td><td><span style="color:var(--danger-red); font-weight:700;">-18%</span></td></tr>
                    <tr><td><strong>Practice Amps (Digital Modeling)</strong></td><td>Positive Grid / Boss</td><td>62%</td><td>26%</td><td><span style="color:var(--danger-red); font-weight:700;">-36%</span></td></tr>
                  </tbody>
                </table>
              </div>
            `;
          } else if (tabIdx === 1) {
            return `
              <div class="content-box">
                <div class="content-box-title">Primary Rival AEO Strategies</div>
                <div class="action-card" style="border-left-color:#f97316;">
                  <div class="action-head">1. Taylor Guitars (Acoustic Dominance)</div>
                  <div class="action-details">
                    • <strong>Why They Win:</strong> Strict 100% MAP enforcement prevents price splintering. Taylor has a unified GS Mini listing with 1,200+ 5-star reviews on Amazon.<br/>
                    • <strong>AI Footprint:</strong> When users ask for "best travel guitar", AI engines cite the GS Mini's ES-B electronics and compact scale.<br/>
                    • <strong>Counter-Play:</strong> Launch Fender.com Acoustasonic vs GS Mini head-to-head comparison page highlighting amplified versatility.
                  </div>
                </div>

                <div class="action-card" style="border-left-color:#6366f1; margin-top:8px;">
                  <div class="action-head">2. PRS Guitars (SE Series Electrics)</div>
                  <div class="action-details">
                    • <strong>Why They Win:</strong> Heavy YouTube creator partnership push comparing SE fretwork consistency against Player I Stratocasters.<br/>
                    • <strong>AI Footprint:</strong> AI engines quote PRS SE coil-splitting versatility as superior value.<br/>
                    • <strong>Counter-Play:</strong> Highlight Player II rolled fretboard edges and Alnico 5 pickups in Amazon A+ tables to recapture the 3% gap.
                  </div>
                </div>

                <div class="action-card" style="border-left-color:#06b6d4; margin-top:8px;">
                  <div class="action-head">3. Yamaha (Entry-Level Pacifica)</div>
                  <div class="action-details">
                    • <strong>Why They Win:</strong> Universally recommended on Reddit /r/Guitar as the undisputed "best beginner guitar for the money."<br/>
                    • <strong>AI Footprint:</strong> Scrapes forum threads praising Pacifica 112V pickup configuration (HSS).<br/>
                    • <strong>Counter-Play:</strong> Seed verified community engagement on Squier Sonic and Classic Vibe build quality improvements.
                  </div>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="content-box">
                <div class="content-box-title">Digital Amps & Practice Gear Gap</div>
                <p style="font-size:12px; color:var(--text-muted); line-height:1.45;">
                  Positive Grid Spark and Boss Katana capture 62% of all AI citations for home practice amps due to dense Reddit forum recommendations praising companion apps and Bluetooth features.
                </p>

                <div class="action-card" style="border-left-color:var(--accent-fender); margin-top:8px;">
                  <div class="action-head">Fender Tone Master & Mustang Micro Playbook</div>
                  <div class="action-details">
                    Fender Mustang Micro headphone amp is loved by users (480 reviews on bundle B08K3V4M99 alone), but AI crawlers don't see its firmware updates or USB-C audio recording capabilities.
                    <br/><br/>
                    <strong>Tactical Action:</strong> Add structured technical feature bullets to Mustang Micro DTC pages detailing 12 amp models, 12 effects combinations, and low-latency Mac/PC USB interface recording.
                  </div>
                </div>
              </div>
            `;
          }
          return "";
        }
      },

      suggestions: {
        badge: "OPPORTUNITY SPOKE · REVENUE LIFT",
        title: "Portfolio Suggestion Engine & Enterprise ROI",
        desc: "18 prioritized brand interventions ranked by revenue recovery and AI visibility score lift.",
        tabs: ["Top 5 Urgent Fixes", "18-Action Priority Matrix", "Financial ROI: Pilot vs Enterprise Scale"],
        render: (tabIdx: number) => {
          if (tabIdx === 0) {
            return `
              <div class="metric-grid-2">
                <div class="metric-card-sm">
                  <span class="metric-card-label">Annual Revenue Recovery</span>
                  <div class="metric-card-val" style="color:var(--success-green);">+$680K <span style="font-size:12px; color:var(--text-subtle);">Pilot</span></div>
                  <span class="metric-card-sub">Buy Box + Direct AI conversions (14 ASINs)</span>
                </div>
                <div class="metric-card-sm">
                  <span class="metric-card-label">Full Enterprise Opportunity</span>
                  <div class="metric-card-val" style="color:var(--accent-purple);">+$28.4M</div>
                  <span class="metric-card-sub">Annualized across 1,450+ FMIC SKUs</span>
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">Top 5 Urgent Portfolio Interventions</div>
                
                <div class="action-card critical">
                  <div class="action-head">1. Submit Brand Registry Ticket to Nest 14 Splinter Bundle ASINs</div>
                  <div class="action-details">Work with Austin Bazaar and GearTree to nest authorized bundle offers as variations under verified parent ASINs across Strat, Tele, Bass, and Acoustasonic lines.</div>
                  <div class="action-impact">Recovers 2,420 reviews & eliminates 3P Buy Box undercutting (+$380k/yr)</div>
                </div>

                <div class="action-card critical" style="margin-top:8px;">
                  <div class="action-head">2. Issue Automated MAP Parity Guidance to 4 Key Partner Accounts</div>
                  <div class="action-details">Standardize bundle pricing thresholds for GearDirect, Austin Bazaar, and GearTree to eliminate -$42 average price suppression across Amazon, Reverb, and Walmart.</div>
                  <div class="action-impact">Restores Buy Box from 68% ➔ 95% on 14 hero listings</div>
                </div>

                <div class="action-card" style="margin-top:8px;">
                  <div class="action-head">3. Deploy Tabular Spec Comparison Matrices on 14 Catalog Pages</div>
                  <div class="action-details">Add standardized HTML spec tables across DTC and Amazon A+ content (nut width, radius, pickup type, tonewood).</div>
                  <div class="action-impact">Feeds crawler answer engines; +14 pts AEO lift</div>
                </div>

                <div class="action-card" style="margin-top:8px;">
                  <div class="action-head">4. Publish DTC Category Shootout Hubs (Strat vs PRS / Acoustasonic vs Taylor)</div>
                  <div class="action-details">Create authoritative comparison pages on fender.com to directly feed AI engine crawlers with verified manufacturer data.</div>
                  <div class="action-impact">Recaptures 22% head-to-head citation share</div>
                </div>

                <div class="action-card" style="margin-top:8px;">
                  <div class="action-head">5. Launch Reddit /r/Guitar & Community Verification Initiative</div>
                  <div class="action-details">Target authoritative community engagement on Reddit (31% of AI context) highlighting Player II fret improvements and Mustang Micro firmware updates.</div>
                  <div class="action-impact">Direct lift in LLM sentiment and entry-level citations</div>
                </div>
              </div>
            `;
          } else if (tabIdx === 1) {
            return `
              <div class="content-box">
                <div class="content-box-title">18-Action Implementation Matrix</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>#</th><th>Action Item</th><th>Division</th><th>Est. Effort</th><th>Impact</th><th>Roadmap Phase</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>1</td><td>Amazon ASIN Variation Merger (14 SKUs)</td><td>Brand-wide</td><td>3 Days</td><td><span class="tag-badge tag-danger">Critical</span></td><td>Phase 1 (Days 1–30)</td></tr>
                    <tr><td>2</td><td>3P MAP Enforcement & Account Harmonization</td><td>Brand-wide</td><td>1 Week</td><td><span class="tag-badge tag-danger">Critical</span></td><td>Phase 1 (Days 1–30)</td></tr>
                    <tr><td>3</td><td>A+ Tabular Spec Modules (14 Lines)</td><td>Electrics/Bass</td><td>2 Weeks</td><td><span class="tag-badge tag-danger">Critical</span></td><td>Phase 2 (Days 31–60)</td></tr>
                    <tr><td>4</td><td>DTC Head-to-Head Comparison Hubs</td><td>Acoustic/Electric</td><td>2 Weeks</td><td><span class="tag-badge tag-warning">High</span></td><td>Phase 2 (Days 31–60)</td></tr>
                    <tr><td>5</td><td>Reddit Community Citation Campaign</td><td>Brand-wide</td><td>Ongoing</td><td><span class="tag-badge tag-warning">High</span></td><td>Phase 3 (Days 61–90)</td></tr>
                    <tr><td>6</td><td>JSON-LD Schema Markup (6 Missing Fields)</td><td>DTC Web</td><td>1 Week</td><td><span class="tag-badge tag-warning">High</span></td><td>Phase 1 (Days 1–30)</td></tr>
                    <tr><td>7</td><td>Acoustasonic vs Taylor GS Mini Repositioning</td><td>Acoustic</td><td>2 Weeks</td><td><span class="tag-badge tag-warning">High</span></td><td>Phase 2 (Days 31–60)</td></tr>
                    <tr><td>8</td><td>Mustang Micro & Tone Master Digital PR</td><td>Amps</td><td>3 Weeks</td><td><span class="tag-badge tag-neutral">Medium</span></td><td>Phase 3 (Days 61–90)</td></tr>
                  </tbody>
                </table>
              </div>
            `;
          } else {
            return `
              <div class="ceo-callout" style="border-color:rgba(16, 185, 129, 0.4);">
                <div class="ceo-callout-header" style="color:var(--success-text);">
                  <span>Commercial Sizing · Sizing the Enterprise Value for Fender</span>
                </div>
                <div class="ceo-callout-body">
                  For a global enterprise like Fender ($1B+ brand), a $680,000 revenue lift is an attractive test run, but does not tell the full story.
                  <br/><br/>
                  The <strong>$680,000 figure represents Phase 1 Quick-Wins across only 14 hero ASINs</strong>. When the same listing hygiene and AEO optimization are scaled across Fender's full multi-brand portfolio (Fender, Squier, Jackson, EVH, Gretsch), the addressable financial upside reaches <strong>$28.4M to $42.6M annually</strong>!
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">
                  <span>Interactive Financial ROI Model</span>
                  <div class="segmented-control" id="roi-mode-control">
                    <button class="segmented-btn active" id="btn-roi-pilot" onclick="window.toggleRoiMode('pilot')">Phase 1 Pilot ($680K)</button>
                    <button class="segmented-btn" id="btn-roi-enterprise" onclick="window.toggleRoiMode('enterprise')">Full Enterprise ($28.4M+)</button>
                  </div>
                </div>

                <div id="roi-content-pilot">
                  <div class="metric-grid-2" style="margin-top:8px;">
                    <div class="metric-card-sm">
                      <span class="metric-card-label">Phase 1 Quick-Win Lift</span>
                      <div class="metric-card-val" style="color:var(--success-green);">$680,000 <span style="font-size:12px; color:var(--text-subtle);">/ yr</span></div>
                      <span class="metric-card-sub">Evaluated across 14 Pilot ASINs</span>
                    </div>
                    <div class="metric-card-sm">
                      <span class="metric-card-label">Service Fee Multiplier</span>
                      <div class="metric-card-val" style="color:var(--accent-purple);">2.8x ROI</div>
                      <span class="metric-card-sub">Immediate payback on pilot scope</span>
                    </div>
                  </div>
                  <ul class="tour-card-list" style="font-size:12px; margin-top:10px;">
                    <li>Amazon Buy Box Recapture (68% ➔ 95% on 14 ASINs): <strong>+$380,000 / yr</strong></li>
                    <li>Conversational AI Assisted DTC Conversions: <strong>+$190,000 / yr</strong></li>
                    <li>Reduced Return Rates via Precise Technical Schemas: <strong>+$65,000 / yr</strong></li>
                    <li>Consolidated Review Synergy (Overall Pick Badges): <strong>+$45,000 / yr</strong></li>
                  </ul>
                </div>

                <div id="roi-content-enterprise" style="display:none;">
                  <div class="metric-grid-2" style="margin-top:8px;">
                    <div class="metric-card-sm">
                      <span class="metric-card-label">Full Enterprise Portfolio GMV Lift</span>
                      <div class="metric-card-val" style="color:var(--success-green);">$28,400,000 <span style="font-size:12px; color:var(--text-subtle);">/ yr</span></div>
                      <span class="metric-card-sub">Across 1,450+ Active SKUs</span>
                    </div>
                    <div class="metric-card-sm">
                      <span class="metric-card-label">Enterprise ROI Multiple</span>
                      <div class="metric-card-val" style="color:var(--accent-purple);">118x ROI</div>
                      <span class="metric-card-sub">On $20K/mo ($240K/yr) Retainer</span>
                    </div>
                  </div>
                  <ul class="tour-card-list" style="font-size:12px; margin-top:10px;">
                    <li>Catalog-Wide Buy Box & Suppressed Listing Recapture: <strong>+$14,200,000 / yr</strong></li>
                    <li>Generative AI Search Conversion Lift (Zero-Click & Chat Referral): <strong>+$9,600,000 / yr</strong></li>
                    <li>Elimination of Return Costs from Spec Hallucinations: <strong>+$2,800,000 / yr</strong></li>
                    <li>Cross-Marketplace MAP Governance (Amazon, Walmart, Reverb): <strong>+$1,800,000 / yr</strong></li>
                  </ul>
                </div>
              </div>
            `;
          }
          return "";
        }
      },

      roadmap: {
        badge: "STRATEGY SPOKE · 90 DAYS",
        title: "Executive Portfolio Transformation Roadmap",
        desc: "Phased 30-60-90 Day execution timeline to lift brand health from 41/100 to 88/100 and Buy Box to 95%.",
        tabs: ["30-60-90 Day Phased Timeline", "Executive KPI Target Matrix", "Flexible Resourcing & Engagement Model"],
        render: (tabIdx: number) => {
          if (tabIdx === 0) {
            return `
              <div class="content-box">
                <div class="content-box-title">30-60-90 Day Milestone Phasing</div>
                
                <div class="action-card critical">
                  <div class="action-head">Phase 1: Days 1–30 (Retail Containment & ASIN Consolidation)</div>
                  <div class="action-details">
                    • Harmonize 14 splinter Amazon ASINs under Brand Registry parentage.<br/>
                    • Standardize bundle MAP policies with Austin Bazaar and GearTree.<br/>
                    • Inject missing Schema.org JSON-LD technical fields on fender.com.
                  </div>
                  <div class="action-impact">Milestone Target: Buy Box 68% ➔ 88% | Readiness Score 52% ➔ 68%</div>
                </div>

                <div class="action-card" style="margin-top:8px;">
                  <div class="action-head">Phase 2: Days 31–60 (Content Depth & A+ Comparison Grids)</div>
                  <div class="action-details">
                    • Publish tabular comparison matrices across 14 top Amazon A+ catalog lines.<br/>
                    • Launch DTC Shootout Hubs (Player II vs PRS SE, Acoustasonic vs Taylor).<br/>
                    • Standardize technical specifications across Sweetwater & GC dealer feeds.
                  </div>
                  <div class="action-impact">Milestone Target: Buy Box ➔ 92% | Readiness Score ➔ 82%</div>
                </div>

                <div class="action-card" style="margin-top:8px; border-left-color:var(--success-green);">
                  <div class="action-head">Phase 3: Days 61–90 (Authority Scaling & Community Citation)</div>
                  <div class="action-details">
                    • Launch verified Reddit /r/Guitar & forum citation grounding.<br/>
                    • Monitor real-time AEO crawl simulator for prompt recovery.<br/>
                    • Achieve full Buy Box retention (95%) and unlock Amazon Overall Pick badges.
                  </div>
                  <div class="action-impact">Milestone Target: Full Readiness 94% | +$680k Pilot / +$28.4M Enterprise</div>
                </div>
              </div>
            `;
          } else if (tabIdx === 1) {
            return `
              <div class="metric-grid-2">
                <div class="metric-card-sm">
                  <span class="metric-card-label">Controllable Readiness Target</span>
                  <div class="metric-card-val" style="color:var(--accent-purple);">52% ➔ 94%</div>
                  <span class="metric-card-sub">+42 pt net operational recovery</span>
                </div>
                <div class="metric-card-sm">
                  <span class="metric-card-label">Buy Box Retention Target</span>
                  <div class="metric-card-val" style="color:var(--success-green);">68% ➔ 95%</div>
                  <span class="metric-card-sub">Eliminates 14 rogue ASIN leaks</span>
                </div>
              </div>

              <div class="content-box" style="margin-top:10px;">
                <div class="content-box-title">Executive 30-60-90 Day KPI Target Matrix</div>
                <table class="table-sm">
                  <thead>
                    <tr><th>Core Performance Indicator</th><th>Baseline</th><th>Day 30</th><th>Day 60</th><th>Day 90 Target</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>IntoFocus Controllable Readiness Score</strong></td>
                      <td>52%</td>
                      <td>68%</td>
                      <td>82%</td>
                      <td><span style="color:var(--accent-purple); font-weight:700;">94%</span></td>
                      <td><span class="tag-badge tag-warning">Active Sprint</span></td>
                    </tr>
                    <tr>
                      <td><strong>Amazon Buy Box Retention</strong></td>
                      <td>68%</td>
                      <td>88%</td>
                      <td>92%</td>
                      <td><span style="color:var(--success-green); font-weight:700;">95%+</span></td>
                      <td><span class="tag-badge tag-danger">Critical Fix</span></td>
                    </tr>
                    <tr>
                      <td><strong>Rogue 3P ASIN Splinters</strong></td>
                      <td>14 Active</td>
                      <td>5 Active</td>
                      <td>2 Active</td>
                      <td><span style="color:var(--success-green); font-weight:700;">0 Active</span></td>
                      <td><span class="tag-badge tag-danger">Harmonizing</span></td>
                    </tr>
                    <tr>
                      <td><strong>Schema.org Specification Sync</strong></td>
                      <td>34%</td>
                      <td>65%</td>
                      <td>85%</td>
                      <td><span style="color:var(--success-green); font-weight:700;">98% Sync</span></td>
                      <td><span class="tag-badge tag-warning">In Dev</span></td>
                    </tr>
                    <tr>
                      <td><strong>AI Model Citation Share (SOV)</strong></td>
                      <td>32%</td>
                      <td>48%</td>
                      <td>64%</td>
                      <td><span style="color:var(--accent-purple); font-weight:700;">76% Share</span></td>
                      <td><span class="tag-badge tag-neutral">Scheduled</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
          } else {
            return `
              <div class="ceo-callout">
                <div class="ceo-callout-header">
                  <span>Flexible Resourcing & Engagement Model</span>
                </div>
                <div class="ceo-callout-body">
                  IntoFocus adapts to Fender's internal capacity. Brands can either leverage our end-to-end managed service or have IntoFocus act as the specialized AI intelligence co-pilot for Fender's internal digital marketing team.
                </div>
              </div>

              <div class="content-box" style="margin-top:12px;">
                <div class="content-box-title">
                  <span>Select Operating Model</span>
                  <div class="segmented-control" id="resourcing-mode-control">
                    <button class="segmented-btn active" id="btn-resourcing-managed" onclick="window.toggleResourcingMode('managed')">IntoFocus Turnkey Managed</button>
                    <button class="segmented-btn" id="btn-resourcing-copilot" onclick="window.toggleResourcingMode('copilot')">Fender Co-Pilot Enablement</button>
                  </div>
                </div>

                <div id="resourcing-content-managed">
                  <div class="action-card" style="border-left-color:var(--accent-purple); margin-top:8px;">
                    <div class="action-head">
                      <span>Full Turnkey AEO Execution (IntoFocus Lead)</span>
                      <span class="tag-badge tag-success">Turnkey Sprint</span>
                    </div>
                    <div class="action-details">
                      • <strong>Amazon Brand Registry Management:</strong> IntoFocus prepares and submits all variation nesting cases and liaises with key accounts (Austin Bazaar, GearTree).<br/>
                      • <strong>Schema & Technical Engineering:</strong> IntoFocus codes and tests JSON-LD schema files and delivers plug-and-play CMS assets for fender.com.<br/>
                      • <strong>A+ Comparison Matrices:</strong> IntoFocus designs, writes, and uploads 4-column comparison tables across 14 lines.<br/>
                      • <strong>Continuous Multi-LLM Auditing:</strong> Weekly automated benchmark scans tracking ChatGPT, Claude, Perplexity, and Gemini.
                    </div>
                  </div>
                </div>

                <div id="resourcing-content-copilot" style="display:none;">
                  <div class="action-card" style="border-left-color:var(--accent-cyan); margin-top:8px;">
                    <div class="action-head">
                      <span>Fender In-House Co-Pilot (Advisory & Tooling)</span>
                      <span class="tag-badge tag-neutral">Internal Delivery</span>
                    </div>
                    <div class="action-details">
                      • <strong>Strategic Playbooks:</strong> IntoFocus provides weekly drift audit tickets, variation templates, and pre-written schema snippets.<br/>
                      • <strong>Internal Execution:</strong> Fender's in-house e-commerce ops and web engineering teams execute the uploads and partner discussions.<br/>
                      • <strong>Advisory & Verification:</strong> Bi-weekly executive steering sessions with IntoFocus AEO architects to verify crawler adoption.
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
          return "";
        }
      }
} as Record<SpokeId, SpokeDefinition>;

export type TourStep = {
  nodeId: SpokeId | "hub";
  targetX: number;
  targetY: number;
  radius: number;
  title: string;
  subtitle: string;
  category: string;
  displays: string[];
  value: string;
};

export const tourSteps = [
      {
        nodeId: "hub",
        targetX: 800,
        targetY: 500,
        radius: 185,
        title: "1. Brand Portfolio Diagnostic Hub",
        subtitle: "FMIC Omnichannel Health & AI Citation Topology",
        category: "BRAND CORE",
        displays: [
          "Aggregate Brand AI Health Index (41/100) across 124 monitored SKUs.",
          "Cross-functional linkages connecting Retail Buy Box, AEO Citations, Specs, and Competitors.",
          "Real-time alerts on 4 active divisional anomalies across Electric, Acoustic, Bass, and Amps."
        ],
        value: "Provides executive leadership with a single unified topology showing how Amazon listing hygiene and structured specs directly control Fender's brand visibility in generative AI search."
      },
      {
        nodeId: "aeo",
        targetX: 440,
        targetY: 320,
        radius: 125,
        title: "2. Brand AEO & AI Visibility Engine",
        subtitle: "100 Tracked Prompts Across 5 AI Engines",
        category: "AEO ENGINE",
        displays: [
          "Brand citation distribution: Reddit (31%), Retail (24%), Editorial (19%), YouTube (14%), DTC (12%).",
          "Prompt simulation engine testing 100 queries in ChatGPT, Perplexity, Claude, Gemini, and Copilot.",
          "Division-by-division visibility scoring: Electrics (52), Bass (48), Squier (45), Amps (34), Acoustics (26)."
        ],
        value: "Pinpoints exactly where Fender is being omitted in AI recommendations and reveals which high-authority external sources (Reddit, retail catalogs) must be optimized."
      },
      {
        nodeId: "ecommerce",
        targetX: 1160,
        targetY: 320,
        radius: 125,
        title: "3. Full-Catalog E-Commerce & Buy Box Integrity",
        subtitle: "Amazon Buy Box, 3P MAP Drift & Brand Registry Harmonization",
        category: "RETAIL HEALTH",
        displays: [
          "Catalog-wide Buy Box retention at 68% (18% suppressed due to off-Amazon pricing; 14% lost to 3P bundles).",
          "14 flagged 3P bundle listings scattering 2,420+ authentic customer reviews.",
          "MAP price undercutting on Amazon triggering automated price drops on Reverb and Walmart."
        ],
        value: "Directly protects brand profit margin and review velocity through Brand Registry variation nesting with key distribution partners (Austin Bazaar, GearTree) rather than adversarial legal action."
      },
      {
        nodeId: "specs",
        targetX: 440,
        targetY: 680,
        radius: 120,
        title: "4. Cross-Category Spec Matrix & Schema Health",
        subtitle: "Schema.org Machine-Readability & A+ Comparison Grids",
        category: "SPEC READINESS",
        displays: [
          "34% Schema.org structured data completeness across the catalog.",
          "6 missing Schema attributes (fingerboard radius, nut width, pickup configs) causing AI hallucination bugs.",
          "A+ comparison matrix gap across 14 of 18 key catalog lines."
        ],
        value: "Ensures conversational search engines parse accurate, manufacturer-verified specifications instead of quoting competitor comparison charts or inaccurate 3P bundle copy."
      },
      {
        nodeId: "competitors",
        targetX: 1160,
        targetY: 680,
        radius: 120,
        title: "5. Brand Competitive Radar & Threat Analysis",
        subtitle: "Cross-Division Share of Voice (SOV) Benchmarks",
        category: "COMPETITORS",
        displays: [
          "Share of Voice gap vs. 6 primary rivals across Electrics, Acoustics, Bass, and Digital Amps.",
          "Taylor Guitars dominance (58% SOV) in travel/acoustic queries.",
          "Boss Katana & Spark MINI control (62% SOV) in digital practice amp recommendations."
        ],
        value: "Arms brand marketing and product teams with competitive intelligence to defend search territory, reposition product copy, and exploit competitor weaknesses."
      },
      {
        nodeId: "suggestions",
        targetX: 800,
        targetY: 820,
        radius: 115,
        title: "6. Portfolio Suggestion Engine (+$680k Pilot / +$28.4M Enterprise)",
        subtitle: "18 High-Impact Fixes Ranked by Effort & ROI",
        category: "OPPORTUNITY",
        displays: [
          "18 prioritized interventions ranked by estimated revenue lift and visibility points gained.",
          "Top 5 immediate actions: Brand Registry nesting, MAP harmonization, A+ spec tables, Shootout hubs, Reddit outreach.",
          "Commercial sizing: +$680K Pilot lift across 14 ASINs ➔ +$28.4M - $42.6M Enterprise GMV scale across FMIC."
        ],
        value: "Eliminates guesswork by delivering a prioritized, mathematically ranked action plan with measurable financial ROI across all 5 FMIC divisions."
      },
      {
        nodeId: "roadmap",
        targetX: 800,
        targetY: 180,
        radius: 110,
        title: "7. Executive 90-Day Portfolio Transformation Roadmap",
        subtitle: "30-60-90 Day Milestone Execution Timeline",
        category: "ROADMAP",
        displays: [
          "Phased execution timeline designed to elevate controllable readiness from 52% to 94% within 90 days.",
          "Phase 1: Retail Containment (Days 1–30) ➔ Phase 2: Content Depth (Days 31–60) ➔ Phase 3: Authority Scaling (Days 61–90).",
          "Flexible resourcing: Choose between IntoFocus Turnkey Managed Sprint vs. Fender Internal Co-Pilot Enablement."
        ],
        value: "Provides a structured executive roadmap for cross-functional teams to align on milestones and deliverables without rigid cost constraints."
      }
] as TourStep[];
