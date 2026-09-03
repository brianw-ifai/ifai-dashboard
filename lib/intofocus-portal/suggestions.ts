export type ChipTone = "bad" | "warn" | "good";

export type SuggestionChip = { text: string; t: ChipTone };

export type SuggestionEvidence = { k: string; v: string; n: string };

export type Suggestion = {
  id: string;
  rank: number;
  area: string;
  title: string;
  whyShort: string;
  whyMobile: string;
  impact: string;
  impactNote: string;
  effort: string;
  status: string;
  chips: SuggestionChip[];
  rationale: string;
  link: string;
  evidence: SuggestionEvidence[];
};

export const SUGGESTIONS: Suggestion[] = [
 {id:'s1',rank:1,area:'Both',title:"Recategorise Roadster 20 from “Portable Bluetooth Speakers” to “Guitar Amplifiers”",
  whyShort:"41 of your 100 tracked prompts are answered from category round-ups and Amazon browse pages that never include the speaker category. The product is structurally excluded before quality is even considered.",
  whyMobile:"41/100 tracked prompts are answered from a category you aren't listed in.",
  impact:'High',impactNote:'+6–9 vis. pts',effort:'Low · ~2h',status:'Not started',
  chips:[{text:'AMAZON · browse node',t:'bad'},{text:'AEO · 3/100 runs',t:'bad'}],
  rationale:"Assistants answering “battery powered guitar amp” and its 40 variants pull from category listing pages and retailer round-ups. Roadster 20 sits in Portable Bluetooth Speakers, so it is absent from every source those answers cite. This is the cheapest structural fix in the account: a taxonomy correction, not a content programme.",
  link:"Category placement (E-commerce) → prompt coverage (AEO)",
  evidence:[
   {k:'Amazon browse node',v:'Portable Bluetooth Speakers',n:'Should be Guitar Amplifiers › Combo'},
   {k:'Prompts blocked by category',v:'41 / 100',n:'Prompt set “portable amps”, 30d'},
   {k:"Appearance, “battery powered guitar amp”",v:'3 / 100 runs',n:'Competitor median 38 / 100'},
   {k:'Category page citations, 30d',v:'0',n:'Marlowe Amps: 61'}]},
 {id:'s2',rank:2,area:'AEO',title:"Publish 4 camping & busking use-case posts targeting “guitar amp for camping”",
  whyShort:"You are cited on Reddit and forum sources 3.4× less than Marlowe Amps for camping-use language, and community sources carry 31% of citation weight in your category — the highest of any source type.",
  whyMobile:"Cited 3.4× less than Marlowe on community sources, which carry 31% of weight here.",
  impact:'High',impactNote:'+4–7 pts / 12 prompts',effort:'Medium · ~3 wks',status:'In progress',
  chips:[{text:'AEO · 7 vs 24 citations',t:'bad'},{text:'WEIGHT · community 31%',t:'warn'}],
  rationale:"Camping and busking language is where your category is growing and where you have no owned content. Assistants resolve these prompts from community threads and long-form use-case posts. Four posts with named conditions (battery hours, weight, weather) are enough to enter the citation set; we see competitors enter within 3–5 weeks of publishing.",
  link:"No owned use-case content (web) → community citation gap (AEO)",
  evidence:[
   {k:'Reddit citations, 30d',v:'7',n:'Marlowe Amps: 24'},
   {k:'Community source weight',v:'31%',n:'Your category; retail 24%, editorial 19%'},
   {k:"“guitar amp for camping”",v:'8 / 100 runs',n:'−4 vs 30d ago'},
   {k:'Owned use-case pages',v:'0',n:'Competitor set median: 6'}]},
 {id:'s3',rank:3,area:'Both',title:"Recover the buy box on Trailhead Mini — lost 22 of the last 30 days",
  whyShort:"Ridgeline Deals has held the buy box at $12 below your price since 11 Aug. Nine days later three assistants stopped naming Trailhead Mini in practice-amp answers; appearance fell from 34 to 11 runs per 100.",
  whyMobile:"Buy box lost since 11 Aug; appearance fell 34 → 11 runs per 100 nine days later.",
  impact:'High',impactNote:'+9 pts recoverable',effort:'Medium · ~1 wk',status:'Not started',
  chips:[{text:'AMAZON · buy box 27%',t:'bad'},{text:'AEO · 34 → 11 runs',t:'bad'},{text:'LAG · 9 days',t:'warn'}],
  rationale:"This is the clearest causal chain in the account. Losing the buy box removed your listing from the “add to cart” surface that retail round-ups and assistants read as canonical. The visibility loss lagged the commercial loss by nine days — the interval it takes cited sources to refresh. Reclaiming the buy box has historically recovered appearance within two weeks.",
  link:"Buy-box loss (E-commerce) → appearance collapse (AEO), 9-day lag",
  evidence:[
   {k:'Buy box share, 30d',v:'27%',n:'Was 96% through 10 Aug'},
   {k:'Sellers on listing',v:'9',n:'Was 2; 6 unauthorised'},
   {k:'Appearance rate',v:'11 / 100 runs',n:'Was 34 / 100 on 20 Aug'},
   {k:'Units per session',v:'−41%',n:'Keepa + Amazon, 30d'}]},
 {id:'s4',rank:4,area:'E-com',title:"Rebuild A+ content on Campfire 10 with a spec comparison table",
  whyShort:"Three modules, no comparison table. Six of eight competitor listings have one, and comparison tables are the second-most-cited source type for spec-qualified prompts in your category.",
  whyMobile:"No comparison table; 6 of 8 competitors have one.",
  impact:'Medium',impactNote:'+2 ranks est.',effort:'Medium · ~2 wks',status:'Not started',
  chips:[{text:'AMAZON · 3 modules',t:'warn'},{text:'AEO · spec prompts 41%',t:'warn'}],
  rationale:"Spec-qualified prompts (“under 10 lbs”, “12 hour battery”) are 41% of your tracked set. Assistants resolve them from structured spec surfaces. Your A+ content is lifestyle imagery with no extractable table, so the listing cannot answer the question even when it ranks.",
  link:"Thin A+ content (E-commerce) → spec-prompt absence (AEO)",
  evidence:[
   {k:'A+ modules',v:'3',n:'Category median: 7'},
   {k:'Comparison table present',v:'No',n:'6 of 8 competitors: Yes'},
   {k:'Spec-qualified prompts',v:'41 / 100',n:'You appear in 9'},
   {k:'Conversion, detail page',v:'6.1%',n:'Category median 9.4%'}]},
 {id:'s5',rank:5,area:'Both',title:"Defend “fender portable amp” — Voxwell has bid on it for 19 consecutive days",
  whyShort:"A competitor is buying your brand term on Amazon and Google, and now appears above you in two assistants' answers for branded prompts. Brand keyword defense is scoring 0 of 2 on Readiness.",
  whyMobile:"Voxwell has bid on your brand term for 19 days and now outranks you in branded prompts.",
  impact:'Medium',impactNote:'+3 pts branded',effort:'Low · ~4h',status:'Not started',
  chips:[{text:'ADS · 19 days',t:'bad'},{text:'READINESS · 0/2',t:'bad'}],
  rationale:"Branded prompts are the last thing to lose and the easiest to reclaim: a brand-registry complaint plus defensive bids. Left alone, competitor copy becomes the cited description of your own products.",
  link:"Unopposed brand bidding (E-commerce) → branded-prompt displacement (AEO)",
  evidence:[
   {k:'Days bid, consecutive',v:'19',n:'Voxwell Audio'},
   {k:'Branded prompt appearance',v:'71 / 100',n:'Was 94 / 100 in July'},
   {k:'Defensive bids live',v:'0',n:'Brand registry: eligible'},
   {k:'Readiness: brand defense',v:'0 / 2 checks',n:'Both failing since 14 Aug'}]},
 {id:'s6',rank:6,area:'E-com',title:"Consolidate 4 duplicate listings splitting 312 reviews on Nightowl",
  whyShort:"The same product exists four times. The winning variant carries 41 reviews; the other 271 are stranded on listings assistants never see.",
  whyMobile:"4 duplicate listings split 312 reviews; the visible one carries 41.",
  impact:'Medium',impactNote:'+271 visible reviews',effort:'High · ~4 wks',status:'Not started',
  chips:[{text:'AMAZON · 4 ASINs',t:'warn'},{text:'REVIEWS · 41 visible',t:'bad'}],
  rationale:"Review count is a heavily weighted trust signal in retail-sourced answers. Consolidation is slow (case work with Seller Support) but it is the only way to make the review base countable.",
  link:"Duplicate ASINs (E-commerce) → understated review authority (AEO)",
  evidence:[
   {k:'Duplicate ASINs',v:'4',n:'B0F2K…, B0F7T…, B0G11…, B0G4M…'},
   {k:'Reviews on winning ASIN',v:'41',n:'Total across duplicates: 312'},
   {k:'Review count in cited answers',v:'41',n:'Marlowe equivalent: 288'},
   {k:'Est. case duration',v:'3–4 weeks',n:'Historic median'}]},
 {id:'s7',rank:7,area:'AEO',title:"Add weight / battery-hours / wattage tables to 12 product pages",
  whyShort:"Spec extraction failed on 12 of 17 owned pages. Assistants that cannot parse a spec omit the product from constrained answers rather than guess.",
  whyMobile:"Spec extraction failed on 12 of 17 owned product pages.",
  impact:'Medium',impactNote:'+2–4 pts',effort:'Medium · ~2 wks',status:'Done',
  chips:[{text:'WEB · 12/17 pages',t:'warn'},{text:'AEO · parse fail',t:'warn'}],
  rationale:"Cheap, mechanical and durable. Structured specs on owned pages give assistants a citable primary source that is not mediated by a retailer.",
  link:"Unstructured owned pages (web) → constrained-prompt omission (AEO)",
  evidence:[
   {k:'Pages missing spec table',v:'12 / 17',n:'Crawl 30 Aug'},
   {k:'Constrained prompts',v:'23 / 100',n:'You appear in 4'},
   {k:'Schema.org Product markup',v:'Partial',n:'No weight, no battery'},
   {k:'Shipped',v:'28 Aug 2026',n:'12 pages published'}]},
 {id:'s8',rank:8,area:'Both',title:"Launch post-purchase review requests on Basecamp 30 — 14 reviews vs category median 180",
  whyShort:"A six-month-old product with almost no review base. Review velocity is the input assistants use to decide whether a product is established enough to recommend.",
  whyMobile:"14 reviews against a category median of 180.",
  impact:'Low',impactNote:'+1–2 pts, slow',effort:'Low · ~6h',status:'Not started',
  chips:[{text:'REVIEWS · 14',t:'warn'},{text:'VELOCITY · 2.1/wk',t:'warn'}],
  rationale:"Long-horizon, low-cost. Nothing else changes until the review base clears roughly 60; we surface it now because the flow takes a day to set up and then runs itself.",
  link:"Low review velocity (E-commerce) → “not established” exclusion (AEO)",
  evidence:[
   {k:'Reviews',v:'14',n:'Category median: 180'},
   {k:'Review velocity',v:'2.1 / week',n:'Competitor median: 11.4'},
   {k:'Rating',v:'4.6',n:'Healthy — volume is the gap'},
   {k:'Appearance rate',v:'2 / 100 runs',n:'Launched 4 Mar 2026'}]}];
