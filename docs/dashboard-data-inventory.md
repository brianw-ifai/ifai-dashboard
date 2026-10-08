> **Superseded on 2026-10-08.** This file describes the authored canvas of 17 Sep 2026 and no longer matches `/dashboard`. The current surfaces, pipeline, and tables are in `docs/v2/01-baseline-audit.md`; the figures the new dashboard at `/dashboard-v2` shows are defined in `docs/v2/02-metric-registry.md` and stored in the sandbox `metric_registry` table. Keep this file only as a record of what the old canvas claimed.

# V3 canvas data inventory

Exhaustive catalogue of every data point on the **Fender Brand Intelligence Canvas** (`/v3`): where each value appears, and any calculation behind it.

**As of:** 17 Sep 2026 (ported from Toolbelt `fender-brand-canvas.html` v33, updated 13:57 UTC)  
**Sources:** `components/v3/fender-canvas-spec.tsx`, `components/v3/spoke-data.ts`

---

## 0. How to read this file

- **Nothing here is live.** There are no `fetch()` calls, API routes, or database reads. Every number is a TypeScript literal or an HTML string inside a spoke `render()` function.
- **Featured Offer is the Buy Box.** Amazon's current name is Featured Offer. Buy Box and BB in this file mean that same button. New writing uses Featured Offer. See `docs/featured-offer-high-price.md`.
- **Fender is Partner-led.** The five seller types are in `docs/client-seller-models.md`. How each type is drawn on the dashboard is not decided.
- **No runtime aggregation.** Spoke panels, node stats, tickers, and tour copy are all authored independently. If a total “should” equal its parts, that arithmetic was done by hand in the copy, not in code.
- **“Appearances”** lists every UI surface that shows the same value (or the same fact restated). Duplicate rows are intentional.

### Canvas chrome

| Field | Value |
| --- | --- |
| Brand name | Fender Brand Intelligence Canvas |
| Subtitle | FMIC Omnichannel Intelligence · **124 Monitored ASINs** |
| Badge | Portfolio View |
| Path badge | 3P RETAIL DRIFT DILUTING BRAND AI CITATIONS |

**Filters** (camera targets only — they do not slice or recompute data):

- Entire Brand Portfolio (124 SKUs)
- Electric Division (Strat, Tele, Jazzmaster)
- Acoustic & Hybrids (Acoustasonic, Paramount)
- Bass Division (Precision, Jazz Bass)
- Amps & Digital Audio (Tone Master, Mustang)
- Squier Entry Tier (Affinity, Classic Vibe)

**Tickers** (always visible in the shell):

| Ticker | Value | Opens |
| --- | --- | --- |
| Buy Box | **68%** (14 ASINs Suppressed / 3P Split) | ecommerce / Buy Box tab |
| AEO Scan · Readiness | **41** · **52%** | aeo / Dual-Index tab |
| Lift | **+$680K Pilot** (+$28.4M Enterprise) | suggestions / ROI tab |

**Legend:** Critical / Buy Box Loss · At Risk / Spec Drift · On Track / Lift Target.

### What's new in Toolbelt v33 (this port)

The hub is now a real drilldown (executive briefing, dual-index, division matrix, enterprise sizing). Buy Box is explained as **18% suppressed + 14% lost to 3P**, with a **14-ASIN** leakage table. Suggestions split **+$680K pilot** vs **+$28.4M–$42.6M enterprise**. Roadmap targets **Readiness 52% → 94%** and offers Turnkey vs Co-Pilot resourcing. Later spoke-table sections below were written against the previous file; treat `spoke-data.ts` as source of truth for every cell.

---

## 1. Master KPI index

Headline numbers a viewer sees, with every reuse.

| Metric | Value | Calculated? | Appearances |
| --- | --- | --- | --- |
| Brand AEO / AI scan | **41 / 100**, −11 pts / 30d | No | Ticker; hub **41%**; AEO spoke; hub dual-index; AEO dual-index tab; tour 1–2 |
| IntoFocus Readiness | **52%**, target **94%** | No. +42 pt = 94−52, stated. | Ticker; AEO spoke meta; hub dual-index; AEO tab 0; roadmap KPI/phases; tour 7 |
| Tracked prompts | **100** queries × **5** engines | No | AEO desc; simulations tab; tour 2 |
| Brand prompt SOV | **32%** | No | PROMPTS satellite |
| Buy-box coverage | **68%** = **18% suppressed** + **14% lost to 3P**, target **95%** | Stated split, not computed | Ticker; retail spoke; BUY BOX satellite; hub quick-look; ecommerce callout; roadmap |
| Flagged ASINs | **14** | Full 14-row table in ecommerce tab 0 | Ticker; retail spoke **14 Flagged**; ecommerce desc/table; action #1; roadmap |
| Splintered reviews | **2,420+** (also **2.4K**) | Hub commercial tab restates **1,405** on 14-ASIN pilot | ASIN satellite; ecommerce; Brand Registry tab; hub commercial sizing |
| Catalog size (monitored) | **124 SKUs / ASINs** | Hub division table sums to 124 | Subtitle; filters; hub; BUY BOX |
| Full enterprise catalog | **1,450+ SKUs** (Fender, Squier, Jackson, EVH, Gretsch) | No | Hub commercial tab; suggestions ROI enterprise mode |
| Divisions | **5** (Electrics, Acoustics, Bass, Amps, Squier) | Hub SKU table 46+28+22+16+12=124 | Hub meta; hub tab 1; filters |
| Active anomalies | **4** | No | Hub node; tour 1 |
| Schema / spec coverage | **34%** | No | SPEC spoke; SCHEMA satellite; readiness factors; tour 4 |
| Missing A+ grids | **78%** · **14 of 18** | 14/18 ≈ 78%, stated | A+ TABLES satellite; specs |
| Schema gaps | **6** missing JSON-LD fields (tour); satellite still says **14** fields/bugs | Mixed | AI DRIFT 14 spec bugs; action #6 says 6 fields; tour 4 says 6 |
| MAP undercut | **−$52 avg**, **15** sellers on satellite; 3 marketplaces in MAP tab | No | MAP satellite; ecommerce tab 2 (Amazon, Walmart, Reverb) |
| Pilot revenue | **+$680K / yr** on 14 ASINs | 380+190+65+45=680 | Ticker; suggestions; hub; ROI pilot toggle; tour 6 |
| Enterprise revenue | **+$28.4M – $42.6M / yr** | Enterprise breakdown 14.2+9.6+2.8+1.8=28.4 | Ticker; hub tab 2; suggestions ROI enterprise; tour 6 |
| Enterprise ROI | **118×** on annual service fee; pilot **2.8×** | Stated. Fee cited as $20k/mo = $240k/yr; 28.4M/240k ≈ 118 | Hub tab 2; ROI enterprise mode |
| Readiness lift | **52% → 94%** (+42 pts) | Stated | Roadmap KPI headline; phases 52→68→82→94 |
| Open fixes | **18** | Action table still shows rows 1–8 | BRAND FIXES; suggestions; tour 6 |
| Open fixes | **18** | Action table only renders rows 1–8 | BRAND FIXES spoke; suggestions desc; tour step 6 |
| Competitive rivals | **6** | No | COMPETITIVE RADAR spoke; competitors desc |
| Competitive gap | **−29%** | Not the mean of the five SOV gaps (−25.6) | COMPETITIVE RADAR spoke |
| Taylor / acoustic SOV | **58%** | No | TAYLOR/PRS satellite; AEO prompt “travel acoustic” winner; SOV table; tour step 5 |
| PRS SE mid-tier SOV | **34%** | No | TAYLOR/PRS tooltip; SOV table leader for $700–$1k electrics |
| Boss / Spark practice-amp SOV | **62%** | No | BOSS/SPARK satellite; SOV table; amps gap tab; tour step 5 |
| Citation Reddit | **31%** | No | CITATIONS satellite; AEO tab 1; suggestion #5; tour step 2 |
| Citation Amazon / retail | **24%** | No | AEO tab 1; tour step 2 |
| Citation editorial | **19%** | No | AEO tab 1; tour step 2 |
| Citation YouTube | **14%** | No | AEO tab 1; tour step 2 |
| Citation DTC | **12%** | No | CITATIONS satellite **12% DTC**; AEO tab 1; AEO tab 1 copy; tour step 2 |
| Community + retail | **55%** | 31+24=55, stated not computed | CITATIONS tooltip; AEO tab 1 copy |
| Roadmap horizon | **90 days** (30 / 60 / 90) | No | ROADMAP spoke; roadmap tabs; tour step 7 |
| Team hours | **390** | 120+160+80+30=390, stated not computed | Roadmap resources tab |
| Tooling & legal budget | **$42,500** | 16,500+18,000+8,000=42,500, stated not computed | Roadmap resources tab |
| Stated ROI | **16×** | 680000/42500 ≈ 16.0, stated not computed | Roadmap resources subcopy |

---

## 2. Graph nodes

From `fenderCanvasSpec.nodes`. Stats on the bubble are what the canvas shows at rest; tooltips add a sentence of the same facts.

| Node id | Title | Stats | Meta | Tooltip extras |
| --- | --- | --- | --- | --- |
| `hub` | BRAND PORTFOLIO | 41%, 4 Anomalies | 124 SKUs · **5 Divisions** | Opens Master Executive Briefing (new hub spoke) |
| `spoke-aeo` | BRAND AEO | 41/100, −11 pts | 100 Tracked Queries | Strong heritage recognition diluted in spec & value queries |
| `spoke-retail` | PORTFOLIO RETAIL | 68%, **14 Flagged** | 124 ASINs · Buy Box | 18% suppressed, 14% lost to 3P |
| `spoke-specs` | SPEC READINESS | 34%, 14 Gaps | Schema & A+ Grids | 14 of 18 lines lack comparison grids |
| `spoke-competitors` | COMPETITIVE RADAR | 6 Rivals, −29% Gap | Taylor · PRS · Boss · Yamaha | Also Gibson/Epiphone, Ibanez in tooltip |
| `spoke-fixes` | BRAND FIXES | 18 Fixes, +$680K | Pilot / Enterprise | +$680k Pilot / +$28.4M Enterprise |
| `spoke-roadmap` | ROADMAP | 90 Days, 88/100 | Target Index | Lift AEO from 41 to 88 |
| `sat-prompts` | PROMPTS | 32% | Brand SOV | 100 prompts × 5 engines; 32% general SOV |
| `sat-citations` | CITATIONS | 12% DTC, 31% Reddit | — | Reddit & Amazon = 55%; DTC 12% |
| `sat-drift` | AI DRIFT | 14 Spec Bugs | Woods / Radius | Acoustasonic, Player II, Tone Master |
| `sat-buybox` | BUY BOX | 68% | 124 SKUs | 15 unauthorized 3P merchants |
| `sat-asin` | ASIN SPLIT | 28 Bundles | 2.4K Reviews | Strat, Tele, Acoustasonic |
| `sat-map` | MAP DRIFT | −$52 avg | 15 Sellers | $52 3P undercut triggering crawler omission |
| `sat-schema` | SCHEMA.ORG | 34% Sync | 14 Fields Missing | JSON-LD technical specs |
| `sat-tables` | A+ TABLES | 78% Gap | 14 of 18 Lines | Missing structured comparison grids |
| `sat-taylor` | TAYLOR / PRS | 58% SOV | Acoustics/SE | Taylor 58% travel/acoustic; PRS SE 34% mid-tier electrics |
| `sat-amps` | BOSS / SPARK | 62% SOV | Digital Amps | Katana, Spark MINI, Yamaha Pacifica |

---

## 3. Spoke: AEO (`spokeData.aeo`)

**Badge:** CRITICAL SPOKE · BRAND AEO  
**Title:** Brand AI Visibility & Prompt Citations  
**Desc:** Visibility across 100 conversational prompts in ChatGPT, Perplexity, Claude, Gemini, and Copilot averages **41/100**, diluted by competitor review dominance in non-heritage queries.  
**Tabs:** Brand Prompt Analysis · Citation Sources · Division Breakdown · AI Hallucination Engine

### 3.1 Brand Prompt Analysis

| Metric | Value | Subcopy |
| --- | --- | --- |
| Brand AI Index | 41 / 100 | −11 pts in past 30 days |
| Heritage vs Value Prompts | 84% vs 18% | High on Strat/Tele; low on value |
| Simulations badge | 100 Simulations | Across 5 AI engines |

| Prompt query | Division | Fender appearance | Primary winner |
| --- | --- | --- | --- |
| Best electric guitar under $900 | Electrics | 28% | PRS SE / Yamaha 611 |
| Best travel acoustic guitar | Acoustics | 11% | Taylor GS Mini (58%) |
| Best beginner bass under $400 | Bass | 44% | Ibanez GSR200 |
| Best practice amp with bluetooth | Amps | 38% | Positive Grid Spark / Katana |
| Fender Stratocaster vs PRS SE | Electrics | 82% | Fender Player II / PRS |
| Best hybrid acoustic-electric guitar | Acoustic | 64% | Acoustasonic Tele / Taylor T5z |

Travel-acoustic **11%** / Taylor **58%** also appear on the SOV table and TAYLOR/PRS satellite.

### 3.2 Citation Sources

Copy: community discussions + retail listings = **55%** of citations; Fender DTC = **12%**.

| Source channel | Citation share | Fender authority status |
| --- | --- | --- |
| Reddit & Forums (r/Guitar, TalkBass, TDPRI) | 31% | Moderate — strong lore, weak in $300–$800 value threads |
| Amazon & Retail Listings | 24% | Diluted — 28 splinter ASINs fragment review signals |
| Editorial & Buying Guides (Guitar World, GC) | 19% | Strong — frequent top placement in roundups |
| YouTube Transcripts & Reviews | 14% | Strong — artist demos & creator videos |
| Brand DTC (fender.com) | 12% | Passive — schema valid, no shootout tables |

Shares sum to 100%. Same five weights are restated in tour step 2 and (partially) on the CITATIONS satellite.

### 3.3 Division Breakdown

| Division / category | Monitored SKUs | AEO index | Key vulnerability |
| --- | --- | --- | --- |
| Solid-Body Electrics | 46 | 52 / 100 | Buy box erosion & 3P bundles on Player II |
| Acoustic & Hybrids | 28 | 26 / 100 | Taylor GS Mini dominating travel/compact queries |
| Bass Guitars | 22 | 48 / 100 | Ibanez and Sire taking entry active-pickup recs |
| Digital Amps & Audio | 16 | 34 / 100 | Boss Katana & Spark MINI sweeping practice-amp prompts |
| Squier Entry Tier | 12 | 45 / 100 | Yamaha Pacifica 112V recommended as superior value |

SKU sum 46+28+22+16+12 = **124**. Restated in tour step 2 as Electrics 52, Bass 48, Squier 45, Amps 34, Acoustics 26.

This partition is **not** the same as the ecommerce division table in §4.1 (different labels; both claim 124).

### 3.4 AI Hallucination Engine

When catalog pages lack tabular specs, engines hallucinate from 3P dealer copy.

| # | Bug | Claimed spec | True / cause | Engines |
| --- | --- | --- | --- | --- |
| 1 | Player II fingerboard radius | 12-inch flat radius (Jackson JS22) | **9.5-inch Modern C** | Perplexity, Claude |
| 2 | Acoustasonic body depth & pickup count | Dual humbuckers | Rogue Amazon bundle ASIN **B0C9Q8X11P** | ChatGPT |

B0C9Q8X11P is the same child ASIN as the GearTree Acoustasonic bundle in §4.2.

---

## 4. Spoke: Ecommerce (`spokeData.ecommerce`)

**Badge:** CRITICAL SPOKE · RETAIL HEALTH  
**Title:** Full-Catalog E-Commerce & Buy Box Integrity  
**Desc:** Across 124 SKUs, Buy Box **68%**. **28** unauthorized 3P bundle ASINs have splintered **2,400+** reviews.  
**Tabs:** Catalog Buy Box Overview · ASIN Splintering Matrix · MAP & 3P Price Leakage

### 4.1 Catalog Buy Box Overview

| Metric | Value | Subcopy |
| --- | --- | --- |
| Portfolio Buy Box | 68% (target 95%) | Lost across **41** high-volume listings |
| Splintered Reviews | 2,420+ | Scattered across 28 rogue 3P ASINs |

| Division | Monitored ASINs | Buy box retention | Rogue bundles |
| --- | --- | --- | --- |
| Player II Electrics | 32 | 64% | 12 |
| American Professional II | 24 | 74% | 4 |
| Acoustasonic & Acoustics | 28 | 61% | 6 |
| Precision & Jazz Bass | 22 | 71% | 4 |
| Amps (Tone Master / Mustang) | 18 | 81% | 2 |

ASIN sum 32+24+28+22+18 = **124**. Bundle sum 12+4+6+4+2 = **28**. Squier is absent here.

68% is **not** a weighted average of 64/74/61/71/81.

### 4.2 ASIN Splintering Matrix

| Child ASIN | Model & non-authorized bundle | Reviews | Current price |
| --- | --- | --- | --- |
| B0D8TFXHHT | Player Strat + Austin Bazaar Bag & Cable | 240 | $808.00 (−$41) |
| B0D8TN41XS | Player Tele + Photo4Less Hard Case Bundle | 180 | $814.99 (−$35) |
| B0C9Q8X11P | Acoustasonic Player + GearTree Starter Kit | 310 | $1,149.00 (−$50) |
| B09KM14J88 | Player Precision Bass + Austin Bazaar Gig Bag | 195 | $829.00 (−$40) |
| B08K3V4M99 | Mustang Micro Headphone Amp + Cable Pack | 480 | $109.99 (−$10) |

Stated: merging these 5 consolidates **1,405 reviews** back to official parent ASINs and unlocks Amazon “Overall Pick” across **4** product categories.

### 4.3 MAP & 3P Price Leakage

| 3P merchant | Active ASINs | Avg MAP undercut | Severity |
| --- | --- | --- | --- |
| GearDirect Express | 14 | −$41.00 | Critical |
| Austin Bazaar | 22 | −$35.00 | Critical |
| Photo4Less | 9 | −$45.00 | High |
| GearTree | 11 | −$30.00 | High |

Merchant ASIN sum 14+22+9+11 = **56** — not the **15** sellers on the MAP satellite, and not 124. These four names are the “4 chronic 3P resellers” in suggestions #2 and roadmap phase 1.

Austin Bazaar, Photo4Less, and GearTree also appear as bundle partners in §4.2. GearDirect Express appears only here.

---

## 5. Spoke: Specs (`spokeData.specs`)

**Badge:** WATCH SPOKE · SPEC COVERAGE  
**Title:** Cross-Category Spec Matrix & Schema.org Health  
**Desc:** **34%** Schema.org completeness across 124 catalog pages. **14 of 18** primary product lines lack tabular comparison modules.  
**Tabs:** Catalog Spec Coverage · JSON-LD Schema Audit · Amazon A+ Table Gaps

### 5.1 Catalog Spec Coverage

| Metric | Value | Subcopy |
| --- | --- | --- |
| Catalog Spec Coverage | 34% (124 SKUs) | Missing machine-readable attributes |
| Missing A+ Grids | 78% | 14 of 18 catalog product lines |

| Division | Schema markup | Tabular grid | AEO readiness |
| --- | --- | --- | --- |
| Electrics (Strat/Tele) | 68% Valid | Missing (10/14) | Partial |
| Acoustics & Hybrids | 42% Valid | Missing (8/8) | Poor |
| Bass Lines | 55% Valid | Missing (6/6) | Partial |
| Digital Amps & Audio | 75% Valid | Partial (2/4) | Moderate |

Grid “missing” counts 10+8+6 = 24 plus 2/4 partial — **not** reconciled in code to “14 of 18 lines.” Squier is absent. Schema %s are not rolled up to the 34% headline.

### 5.2 JSON-LD Schema Audit

Copy: GPTBot, ClaudeBot, and PerplexityBot parse these Schema.org attributes.

Listed missing properties (6):

- `fingerboardRadius`
- `pickupConfiguration`
- `nutWidth`
- `scaleLength`
- `bodyWoodType`
- `numberOfFrets`

Nodes and tour say **14** fields/attributes missing. This tab lists 6 names.

### 5.3 Amazon A+ Table Gaps

Recommended 4-column A+ matrix price ladder:

| Column | Series | Price |
| --- | --- | --- |
| 1 | Squier Classic Vibe | $459 |
| 2 | Player II Series | $849 |
| 3 | American Performer | $1,399 |
| 4 | American Pro II | $1,799 |

---

## 6. Spoke: Competitors (`spokeData.competitors`)

**Badge:** BENCHMARK SPOKE · RADAR  
**Title:** Competitive Radar & Category SOV  
**Desc:** Benchmarking against **6** primary rivals in Electric, Acoustic, Bass, and Amp.  
**Tabs:** Cross-Category SOV · Direct Rival Battlecards · Acoustic & Amp Gaps

Rivals named across the spoke: Gibson/Epiphone, Taylor, PRS, Ibanez, Boss, Yamaha, plus Sire (bass) and Positive Grid Spark.

### 6.1 Cross-Category SOV

| Category / sub-bracket | Leader brand | Leader SOV | Fender SOV | Gap |
| --- | --- | --- | --- | --- |
| Solid-Body Electrics ($700–$1k) | PRS SE Series | 34% | 31% | −3% |
| Entry Electrics (Under $350) | Yamaha Pacifica | 48% | 24% (Squier) | −24% |
| Travel & Compact Acoustics | Taylor (GS Mini) | 58% | 11% | −47% |
| Entry Active Bass (Under $450) | Ibanez (GSR/SR) | 46% | 28% (Squier) | −18% |
| Practice Amps (Digital Modeling) | Positive Grid / Boss | 62% | 26% | −36% |

Each gap equals leader − Fender (stated). Radar node **−29%** is not the mean of these five (−25.6).

Fender travel-acoustic **11%** matches the AEO prompt table. Practice-amp leader **62%** matches the BOSS/SPARK satellite; Fender **26%** here vs **38%** appearance on the bluetooth practice-amp prompt — different series, both authored.

### 6.2 Direct Rival Battlecards

| Rival | Stated strategy / assets |
| --- | --- |
| Taylor Guitars | **100%** strict MAP; unified GS Mini (**1,000+ reviews**); interactive wood selector on DTC; dominates travel acoustic citations |
| PRS Guitars (SE) | Comparison videos + rich tabular specs; engines quote SE fretwork consistency over Player Series |

### 6.3 Acoustic & Amp Gaps

Positive Grid Spark and Boss Katana capture **62%** of AI citations for home practice amps (Reddit density, companion apps, Bluetooth).

---

## 7. Spoke: Suggestions (`spokeData.suggestions`)

**Badge:** OPPORTUNITY SPOKE · REVENUE LIFT  
**Title:** Portfolio Suggestion Engine & High-Impact Fixes  
**Desc:** **18** prioritized interventions ranked by estimated revenue recovery and AI visibility lift.  
**Tabs:** Top 5 Urgent Fixes · Full 18-Action Catalog · Financial ROI Model

### 7.1 Top 5 Urgent Fixes

| Metric | Value | Subcopy |
| --- | --- | --- |
| Annual Revenue Recovery | +$680K / yr | Buy Box + Direct AI conversions |
| Visibility Point Lift | +47 pts | Target: 41 → 88 / 100 |

| # | Action | Stated impact |
| --- | --- | --- |
| 1 | Brand Registry ticket to merge **28** splinter ASINs (Austin Bazaar, GearTree, Photo4Less; Strat, Tele, Bass, Acoustasonic) | Recovers **2,420** reviews; stops 3P buy-box poaching **+$380k/yr** |
| 2 | MAP cease-and-desist to **4** chronic 3P resellers (GearDirect Express, Austin Bazaar) | Buy Box 68% → 95%; eliminates **−$52** price suppression on **41** listings |
| 3 | Tabular spec comparison matrices on **14** catalog pages (nut width, radius, pickup type, tonewood) | Feeds crawlers; **+14 pts** AEO lift |
| 4 | DTC shootout hubs (Strat vs PRS / Acoustasonic vs Taylor) | Recaptures **22%** head-to-head citation share |
| 5 | Reddit r/Guitar & community verification (Player II frets, Mustang Micro firmware) | Direct lift in LLM sentiment; Reddit is **31%** of AI context |

### 7.2 Full 18-Action Catalog

Title promises 18; the table only has rows **1–8**.

| # | Action item | Division | Est. effort | Impact |
| --- | --- | --- | --- | --- |
| 1 | Amazon ASIN Variation Merger (28 SKUs) | Brand-wide | 3 Days | Critical |
| 2 | 3P MAP Enforcement & Account Warnings | Brand-wide | 1 Week | Critical |
| 3 | A+ Tabular Spec Modules (14 Lines) | Electrics/Bass | 2 Weeks | Critical |
| 4 | DTC Head-to-Head Comparison Hubs | Acoustic/Electric | 2 Weeks | High |
| 5 | Reddit Community Citation Campaign | Brand-wide | Ongoing | High |
| 6 | JSON-LD Schema Markup (14 Missing Fields) | DTC Web | 1 Week | High |
| 7 | Acoustasonic vs Taylor GS Mini Repositioning | Acoustic | 2 Weeks | High |
| 8 | Mustang Micro & Tone Master Digital PR | Amps | 3 Weeks | Medium |

### 7.3 Financial ROI Model

Stated total **+$680,000 / yr**:

| Line | Amount |
| --- | --- |
| Amazon Buy Box recapture (68% → 95%) | +$380,000 / yr |
| Conversational AI assisted DTC conversions | +$190,000 / yr |
| Reduced returns via precise pre-purchase AI specs | +$65,000 / yr |
| Consolidated review synergy (Overall Pick badges) | +$45,000 / yr |

380+190+65+45 = 680. Not computed in code.

---

## 8. Spoke: Roadmap (`spokeData.roadmap`)

**Badge:** STRATEGY SPOKE · 90 DAYS  
**Title:** Executive Portfolio Transformation Roadmap  
**Desc:** 30-60-90 day plan to lift brand health from **41/100** to **88/100** and Buy Box to **95%**.  
**Tabs:** 90-Day Execution Timeline · KPI Milestones · Resource Allocation

### 8.1 90-Day Execution Timeline

| Phase | Days | Work | Milestone targets |
| --- | --- | --- | --- |
| 1 · Retail containment | 1–30 | Merge 28 ASINs; MAP warnings to 4; inject JSON-LD on DTC | Buy Box 68% → **88%**; AEO 41 → **58** |
| 2 · Content depth | 31–60 | 14 comparison matrices; DTC shootouts; standardize Sweetwater & Guitar Center feed titles | Buy Box → **92%**; AEO → **74** |
| 3 · Authority scaling | 61–90 | Reddit/forum engagement; AEO crawl simulator; full buy box; Overall Pick badges | Score **88/100**; **+$680k** annual lift |

### 8.2 KPI Milestones

Headlines: AEO **41 → 88 / 100** (+47 pt); Buy Box **68% → 95%** (eliminates 28 rogue ASIN leaks).

| Core KPI | Baseline | Day 30 | Day 60 | Day 90 target | Status tag |
| --- | --- | --- | --- | --- | --- |
| Brand AEO Visibility Index | 41 / 100 | 58 | 74 | 88 / 100 | Active Sprint |
| Amazon Buy Box Retention | 68% | 88% | 92% | 95%+ | Critical Fix |
| Rogue 3P ASIN Splinters | 28 Active | 12 Active | 4 Active | 0 Active | Ticket Queued |
| Schema.org Specification Sync | 34% | 65% | 85% | 98% Sync | In Dev |
| AI Model Citation Share (SOV) | 32% | 48% | 64% | 76% Share | Scheduled |
| Annualized Value Recovery | $0 | +$180k | +$420k | +$680k / yr | High ROI |

Measurement cadence copy: weekly synthetic multi-LLM runs (GPT-4o, Claude 3.5, Gemini 1.5, Perplexity) plus daily Amazon Buy Box scrapes across 124 SKUs.

Day 30/60 AEO and buy-box targets match phase 1/2 milestones.

### 8.3 Resource Allocation

| Metric | Value | Subcopy |
| --- | --- | --- |
| Total allocated effort | 390 team hours | 4 internal squads |
| Tooling & legal budget | $42,500 | 16× 1-year ROI on +$680k lift |

| Workstream | Hours | Cost | Personnel | Core tasks / tooling |
| --- | --- | --- | --- | --- |
| 1. E-Commerce Ops & Brand Protection (Amazon) | 120 | $16,500 | 1 e-com lead + ops specialist (sprints 1–3) | Consolidate 28 ASINs; MAP C&D to 4 undercutters. Tooling: buy-box scrape suite **$4.5k** + Brand Registry legal pool **$12k** |
| 2. DTC Web Engineering & Technical SEO | 160 | $18,000 | 1 front-end engineer + 1 technical content architect (sprints 2–5) | JSON-LD across 124 SKUs; comparison grids for 14 lines; Player II vs PRS SE shootout hubs |
| 3. Product Marketing & Community Relations | 80 | $8,000 | 1 product specialist + 1 community advocate (sprints 4–6) | Reddit r/Guitar, TalkBass, TDPRI; syndicate creator transcripts. Tooling: AEO prompt simulator & sentiment tracker |
| 4. Executive Sponsorship & Commercial Governance | 30 | Internal | VP of Digital Commerce + Corporate Counsel | MAP review with Sweetwater and Guitar Center; bi-weekly steering sign-offs |

Hours 120+160+80+30 = **390**. Cash 16,500+18,000+8,000 = **$42,500**. Workstream 1 tooling 4.5+12 = 16.5. Not computed in code.

---

## 9. Guided tour (`tourSteps`)

Seven steps. Each restates KPIs already listed above; no new metrics except phrasing.

| Step | Node | Displays (data restated) |
| --- | --- | --- |
| 1 | hub | AEO 41/100 across 124 SKUs; 4 divisional anomalies (Electric, Acoustic, Bass, Amps) |
| 2 | aeo | Citations 31 / 24 / 19 / 14 / 12; 100 queries × 5 engines; division scores 52 / 48 / 45 / 34 / 26 |
| 3 | ecommerce | Buy Box 68% vs 95% target; 28 rogue listings; 2,420+ reviews; 4 unauthorized MAP sellers |
| 4 | specs | Schema 34%; 14 missing attributes (radius, nut width, pickup configs); A+ gap 14 of 18 lines |
| 5 | competitors | SOV vs 6 rivals; Taylor 58% travel/acoustic; Boss/Spark 62% digital practice amps |
| 6 | suggestions | 18 interventions; top 5 (ASIN merge, MAP, A+ tables, shootouts, Reddit); +$680,000 / year |
| 7 | roadmap | AEO 41 → 88 in 90 days; phases 1–3; Buy Box → 95%; +$680k run-rate |

---

## 10. Narrative arithmetic (not executed)

None of this runs in code. It is implied by the copy.

| Claim | Implied arithmetic |
| --- | --- |
| Community + retail 55% | 31 + 24 |
| Division SKU total 124 (AEO table) | 46+28+22+16+12 |
| Division ASIN total 124 (ecommerce table) | 32+24+28+22+18 |
| Rogue bundles 28 | 12+4+6+4+2 |
| Top-5 review merge 1,405 | 240+180+310+195+480 |
| A+ gap 78% | 14 / 18 ≈ 0.778 |
| Visibility lift +47 pts | 88 − 41 |
| $680k total | 380+190+65+45 |
| 390 hours | 120+160+80+30 |
| $42,500 budget | 16,500+18,000+8,000 |
| Workstream 1 $16,500 | 4.5k + 12k |
| 16× ROI | 680,000 / 42,500 |
| SOV gaps | leader SOV − Fender SOV |

Camera focus targets, node `x/y/r`, and edge coordinates are layout, not business data.

---

## 11. Internal inconsistencies

Places where hardcoded headlines disagree with the tables behind them.

| Issue | Detail |
| --- | --- |
| 4 divisions vs 5 | Hub and fixes say **4 Divisions**. Filters and the AEO division table include **Squier** as a fifth. Tour step 1 lists Electric, Acoustic, Bass, Amps (no Squier). |
| Two different 124-SKU partitions | AEO divisions (Electrics 46, Acoustics 28, Bass 22, Amps 16, Squier 12) ≠ ecommerce divisions (Player II 32, Am Pro II 24, Acoustics 28, Bass 22, Amps 18). Both sum to 124. |
| Buy box 68% vs division rates | 64 / 74 / 61 / 71 / 81 are not averaged into 68%. |
| 15 sellers vs 4 merchants | MAP satellite: **15 sellers**, −$52 avg. MAP table: **4** named merchants, 56 ASINs. Buy-box tooltip: **15 unauthorized 3P**. |
| Review count spelling | `2.4K` / `2,400+` / `2,420+` used interchangeably. |
| 14 missing schema fields vs 6 listed | Nodes/tour/action #6 say 14 missing fields. JSON-LD tab lists 6 property names. |
| 14 of 18 A+ lines vs grid table | Specs grid “missing” counts do not add to 14. |
| 18-action catalog shows 8 rows | Title and spoke stats say 18; table stops at #8. |
| −29% competitive gap | Not the average of the five SOV gaps (−3, −24, −47, −18, −36). |
| Practice-amp Fender % | SOV table Fender **26%** vs AEO prompt appearance **38%**. |
| High-volume listings 41 | Ecommerce tab 0 says buy box lost across **41** listings. Suggestion #2 says −$52 suppression on **41** listings. Not tied to 124 or 28. |

---

## 12. Source file map

```
components/v3/fender-canvas-spec.tsx    brand chrome, filters, tickers,
                                        nodes, tooltips, edges, legend
components/v3/spoke-data.ts             spoke HTML panels + tour copy
components/v3/FenderBrandCanvas.tsx     mounts IntelligenceCanvas with
                                        fenderCanvasSpec (no extra metrics)
```

SDK docs (`/sdk/docs`) reuse Buy Box **68%** and schema **34%** as component-demo values only. They are not part of this canvas’s data layer.

If a number is on screen and not in this file, it is almost certainly a CSS size, layout coordinate, or decorative SVG point — not a business metric.
