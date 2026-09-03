const C={ink:'#16161a',ink2:'#5c5c66',ink3:'#8e8e99',ink4:'#a8a8b2',line:'#e8e8ec',acc:'#4b45c6',accBg:'#f4f3fd',accBorder:'#dcdbf6',bad:'#b3372c',badBg:'#fdeceb',good:'#10744a',goodBg:'#e9f4ee',warn:'#8a5a00',warnBg:'#fdf3e2',mono:'ui-monospace,SFMono-Regular,Menlo,monospace',sans:"-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,sans-serif"};

const SUGGESTIONS=[
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

class Component extends DCLogic {
  state={screen:'hub',hubMode:'today',mapDark:false,mapStacked:false,views:{},drawer:null,drills:{},statuses:{},choices:{},area:'All',status:'All',sort:'Recommended',help:false,resp:false};

  view(){return this.state.views[this.state.screen]||(this.props.defaultView==='Data'?'data':'simple');}
  set(k,v){this.setState(s=>({[k]:v}));}
  setView(v){this.setState(s=>({views:Object.assign({},s.views,{[s.screen]:v})}));}
  go(screen){this.setState({screen:screen,drawer:null,help:false});}
  statusOf(s){return this.state.statuses[s.id]||s.status;}
  cycle(s){const o=['Not started','In progress','Done'];const cur=this.statusOf(s);const nx=o[(o.indexOf(cur)+1)%3];this.setState(st=>({statuses:Object.assign({},st.statuses,{[s.id]:nx})}));}
  chipStyle(active){return active?{color:'#ffffff',bg:C.ink,border:C.ink}:{color:C.ink2,bg:'#ffffff',border:C.line};}
  statusStyle(v){if(v==='Done')return{color:C.good,bg:C.goodBg,border:'#cfe6da'};if(v==='In progress')return{color:C.warn,bg:C.warnBg,border:'#f0dfbc'};return{color:C.ink2,bg:'#ffffff',border:C.line};}

  decorate(s){
    const st=this.statusOf(s), ss=this.statusStyle(st);
    return Object.assign({},s,{status:st,statusColor:ss.color,statusBg:ss.bg,statusBorder:ss.border,
      impactColor:s.impact==='High'?C.bad:s.impact==='Medium'?C.warn:C.ink2,
      rowBg:this.state.drawer===s.id?'#fbfbfe':'#ffffff',
      chips:(s.chips||[]).map(c=>({text:c.text,bg:c.t==='bad'?C.badBg:c.t==='warn'?C.warnBg:'#f4f4f6',color:c.t==='bad'?C.bad:c.t==='warn'?C.warn:C.ink2})),
      open:()=>this.setState({screen:'sug',drawer:s.id}),
      cycle:()=>this.cycle(s)});
  }

  renderVals(){
    const scr=this.state.screen, v=this.view(), isData=v==='data';
    const meta={hub:this.state.hubMode==='map'
        ?{title:'Where you stand',sub:'Every module in the product, with its current state. The link between AEO and E-commerce is drawn, not asserted.',stamp:'Wednesday, 2 September 2026 · data through 06:00'}
        :{title:'What to do today',sub:'Three items are costing you AI visibility right now. Each one names the e-commerce signal behind it.',stamp:'Wednesday, 2 September 2026 · data through 06:00'},
      sug:{title:'Suggestion Engine',sub:'8 open recommendations. The default order is our opinion — work top down. Every suggestion cites the AEO or e-commerce signal that produced it.',stamp:'Re-ranked 2 September, 06:00 · 8 open'},
      read:{title:'Readiness Score',sub:'Eighteen checks that are objectively true or false today. No modelling, no confidence interval — every line shows the value it was measured against.',stamp:'Checked 2 September, 05:40'},
      aeo:{title:'AEO — AI visibility',sub:'How assistants answer the 100 prompts we track for you, and which sources they pulled from.',stamp:'100 prompts · 30-day window · 5 assistants'},
      ecom:{title:'E-commerce performance',sub:'What is actually happening where people buy — and, for each finding, the AI-visibility effect it produced.',stamp:'Amazon + Keepa + web · through 1 September'}}[scr]||{title:'',sub:'',stamp:''};

    const showLocked=this.props.showLockedModules!==false;
    const navItems=[['hub','Home',false],['sug','Suggestion Engine',false],['read','Readiness Score',false],['aeo','AEO',false],['ecom','E-commerce',false],['ba','Before / after',true],['ai','AI Assistants',true]];

    const filtered=SUGGESTIONS.filter(s=>{
      const st=this.statusOf(s);
      if(this.state.area!=='All'&&s.area!==this.state.area&&s.area!=='Both')return false;
      if(this.state.status!=='All'&&st!==this.state.status)return false;
      return true;});
    const order={High:0,Medium:1,Low:2}, eff=s=>s.effort.indexOf('Low')===0?0:s.effort.indexOf('Medium')===0?1:2;
    const sorted=filtered.slice().sort((a,b)=>{
      if(this.state.sort==='Impact')return order[a.impact]-order[b.impact]||a.rank-b.rank;
      if(this.state.sort==='Effort')return eff(a)-eff(b)||a.rank-b.rank;
      return a.rank-b.rank;});

    const rows=sorted.map(s=>this.decorate(s));
    const dv=this.dataView(scr);

    const simpleOn=!isData;
    return {
      title:meta.title,subtitle:meta.sub,stamp:meta.stamp,
      crumbVis:scr==='hub'?'hidden':'visible',
      isHub:scr==='hub',
      todayBg:this.state.hubMode==='today'?C.ink:'#ffffff',todayColor:this.state.hubMode==='today'?'#ffffff':C.ink2,
      mapBg:this.state.hubMode==='map'?C.ink:'#ffffff',mapColor:this.state.hubMode==='map'?'#ffffff':C.ink2,
      setToday:()=>this.set('hubMode','today'),setMap:()=>this.set('hubMode','map'),
      m:this.mapVals(),
      isData:isData,hubSimple:scr==='hub'&&simpleOn&&this.state.hubMode==='today',
      mapSimple:scr==='hub'&&simpleOn&&this.state.hubMode==='map',
      sugSimple:scr==='sug'&&simpleOn,
      readSimple:scr==='read'&&simpleOn,aeoSimple:scr==='aeo'&&simpleOn,ecomSimple:scr==='ecom'&&simpleOn,
      simpleBg:simpleOn?C.ink:'#ffffff',simpleColor:simpleOn?'#ffffff':C.ink2,
      dataBg:isData?C.ink:'#ffffff',dataColor:isData?'#ffffff':C.ink2,
      setSimple:()=>this.setView('simple'),setData:()=>this.setView('data'),
      nav:navItems.filter(n=>showLocked||!n[2]).map(([id,label,locked])=>({label:label,locked:locked,
        bg:scr===id?'#f1f1f4':'transparent',color:locked?'#b3b3bd':scr===id?C.ink:C.ink2,
        weight:scr===id?'600':'400',cursor:locked?'default':'pointer',
        go:locked?()=>{}:()=>this.go(id)})),
      goHub:()=>this.go('hub'),goSug:()=>this.go('sug'),goRead:()=>this.go('read'),goAeo:()=>this.go('aeo'),goEcom:()=>this.go('ecom'),
      openHelp:()=>this.set('help',true),closeHelp:()=>this.set('help',false),help:this.state.help,
      topFour:SUGGESTIONS.slice(0,4).map(s=>this.decorate(s)),
      tiles:showLocked?this.tiles():this.tiles().slice(0,4),
      rows:rows,rowCount:rows.length+' of 8 suggestions shown · default order is the recommendation',
      respRows:SUGGESTIONS.slice(0,3).map(s=>this.decorate(s)),
      resp:this.state.resp,respLabel:this.state.resp?'Hide 390px view':'Show 390px view',
      toggleResp:()=>this.set('resp',!this.state.resp),
      areaChips:['All','AEO','E-com','Both'].map(l=>{const a=this.chipStyle(this.state.area===(l==='All'?'All':l));return{label:l==='All'?'All areas':l,color:a.color,bg:a.bg,border:a.border,go:()=>this.set('area',l)};}),
      statusChips:['All','Not started','In progress','Done'].map(l=>{const a=this.chipStyle(this.state.status===l);return{label:l==='All'?'Any status':l,color:a.color,bg:a.bg,border:a.border,go:()=>this.set('status',l)};}),
      sortChips:['Recommended','Impact','Effort'].map(l=>{const on=this.state.sort===l;return{label:l,color:on?C.acc:C.ink2,bg:on?C.accBg:'transparent',go:()=>this.set('sort',l)};}),
      drawer:this.drawerVals(),drawerOpen:!!this.state.drawer,
      positions:this.positions(),prompts:this.prompts(),sources:this.sources(),products:this.products(),findings:this.findings(),
      dataset:dv.name,dataGrid:dv.grid,dataCols:dv.cols,dataRows:dv.rows,dataCount:dv.rows.length+' rows'
    };
  }

  cell(v,opt){opt=opt||{};return{v:v,align:opt.align||'left',color:opt.color||C.ink,weight:opt.weight||'400',font:opt.mono?C.mono:C.sans};}

  dataView(scr){
    const R=(...cells)=>({cells:cells});
    if(scr==='sug'){
      return {name:'suggestions.open · 2026-09-02T06:00Z',grid:'34px 1fr 74px 92px 68px 82px 104px',
        cols:[{label:'#',align:'left'},{label:'action',align:'left'},{label:'area',align:'left'},{label:'impact_pts',align:'right'},{label:'effort_h',align:'right'},{label:'status',align:'left'},{label:'signal_ref',align:'left'}],
        rows:SUGGESTIONS.map(s=>R(this.cell(s.rank,{mono:true,color:C.ink4}),this.cell(s.title),this.cell(s.area,{mono:true,color:C.ink2}),this.cell(s.impactNote.replace(/[^0-9–.]/g,''),{align:'right',mono:true,weight:'600'}),this.cell(s.effort.replace(/[^0-9]/g,'')||'—',{align:'right',mono:true}),this.cell(this.statusOf(s),{mono:true,color:C.ink2}),this.cell(s.chips[0].text,{mono:true,color:C.ink3})))};
    }
    if(scr==='read'){
      const rows=[];
      this.positions().forEach(p=>p.checks.forEach(c=>rows.push(R(this.cell(p.name,{mono:true,color:C.ink3}),this.cell(c.label),this.cell(c.pass?'PASS':'FAIL',{mono:true,weight:'600',color:c.pass?C.good:C.bad}),this.cell(c.value,{align:'right',mono:true}),this.cell(c.threshold.replace('Threshold ',''),{align:'right',mono:true,color:C.ink3}),this.cell(c.source,{mono:true,color:C.ink3})))));
      return {name:'readiness.eval · 2026-09-02T05:40Z',grid:'1fr 1.9fr 62px 96px 96px 1.1fr',
        cols:[{label:'position',align:'left'},{label:'check',align:'left'},{label:'result',align:'left'},{label:'value',align:'right'},{label:'threshold',align:'right'},{label:'source',align:'left'}],rows:rows};
    }
    if(scr==='aeo'){
      return {name:'aeo.runs · 30d · 5 assistants',grid:'1.7fr 84px 80px 64px 1.1fr 96px',
        cols:[{label:'prompt',align:'left'},{label:'appears',align:'right'},{label:'rate',align:'right'},{label:'Δ 30d',align:'right'},{label:'top_source',align:'left'},{label:'runs',align:'right'}],
        rows:this.prompts().map(p=>R(this.cell(p.q,{mono:true}),this.cell(p.rate,{align:'right',mono:true,weight:'600'}),this.cell(p.pct,{align:'right',mono:true,color:C.ink2}),this.cell(p.delta,{align:'right',mono:true,color:p.deltaColor}),this.cell(p.src,{mono:true,color:C.ink3}),this.cell('100',{align:'right',mono:true,color:C.ink4})))};
    }
    if(scr==='ecom'){
      return {name:'catalogue.performance · 2026-09-01',grid:'1.4fr 108px 76px 62px 68px 68px 80px 68px',
        cols:[{label:'product',align:'left'},{label:'asin',align:'left'},{label:'buy_box',align:'right'},{label:'rank',align:'right'},{label:'Δ rank',align:'right'},{label:'price',align:'right'},{label:'reviews',align:'right'},{label:'sellers',align:'right'}],
        rows:this.products().map(p=>R(this.cell(p.name),this.cell(p.asin,{mono:true,color:C.ink3}),this.cell(p.buybox,{align:'right',mono:true,weight:'600',color:p.buyboxColor}),this.cell(p.rank,{align:'right',mono:true}),this.cell(p.move,{align:'right',mono:true,color:p.moveColor}),this.cell(p.price,{align:'right',mono:true}),this.cell(p.reviews,{align:'right',mono:true}),this.cell(p.sellers,{align:'right',mono:true})))};
    }
    return {name:'metrics.snapshot · 2026-09-02T06:00Z',grid:'1.7fr 0.7fr 0.7fr 0.8fr 1.4fr',
      cols:[{label:'metric',align:'left'},{label:'value',align:'right'},{label:'Δ 30d',align:'right'},{label:'updated',align:'right'},{label:'source',align:'left'}],
      rows:[['AI visibility score','34','−13','06:00','aeo.runs · 5 assistants'],['Readiness checks passing','11 / 18','−2','05:40','readiness.eval'],['Buy-box coverage, catalogue','62%','−31 pp','04:10','amazon.offers'],['Tracked prompts with appearance','34 / 100','−13','06:00','aeo.runs'],['Citations, community sources','7','−9','06:00','citation.graph'],['Unauthorised sellers','14','+9','04:10','amazon.offers'],['Median rank, tracked ASINs','38','+22','04:10','keepa.rank'],['Review velocity, catalogue','5.4 / wk','−2.7','04:10','keepa.reviews'],['Open suggestions','8','+3','06:00','suggestion.engine']]
        .map(r=>R(this.cell(r[0]),this.cell(r[1],{align:'right',mono:true,weight:'600'}),this.cell(r[2],{align:'right',mono:true,color:r[2].indexOf('−')===0||r[2].indexOf('+')===0&&r[0].indexOf('Unauth')===0?C.bad:C.bad}),this.cell(r[3],{align:'right',mono:true,color:C.ink4}),this.cell(r[4],{mono:true,color:C.ink3})))};
  }

  tiles(){
    const t=(title,body,metric,mc,go,badge)=>({title:title,body:body,metric:metric,metricColor:mc,go:go,badge:badge||'',cursor:'pointer',bg:'#ffffff',titleColor:C.ink,bodyColor:C.ink2});
    const locked=(title,body)=>({title:title,body:body,metric:'Ask your liaison to preview',metricColor:'#b3b3bd',go:()=>{},badge:'Not in your plan',cursor:'default',bg:'#fcfcfd',titleColor:'#9a9aa5',bodyColor:'#b3b3bd'});
    return [
      t('Suggestion Engine','Every recommendation, ranked, with the signal that produced it.','8 open · 3 high impact',C.bad,()=>this.go('sug')),
      t('AEO','Prompt-level visibility, trend and citation sources.','34 / 100 · −13 in 30d',C.bad,()=>this.go('aeo')),
      t('E-commerce','Buy box, rank, price, reviews, sellers, competitors.','5 findings · 2 urgent',C.bad,()=>this.go('ecom')),
      t('Readiness Score','Eighteen objective checks across the AEO battlefronts.','11 / 18 passing',C.warn,()=>this.go('read')),
      locked('Before / after','Onboarding state against today, across both halves.'),
      locked('AI Assistants','Working assistants for the tasks the suggestions create.')];
  }

  mapTheme(){
    return this.state.mapDark
      ? {bg:'#0e0e11',node:'#20202a',nodeAlt:'#25252f',border:'#383843',line:'#45454f',ink:'#f2f2f4',ink2:'#a3a3ad',ink3:'#83838f',acc:'#8b85f0',accBg:'#262340',accBorder:'#4a4479',bad:'#e0685c',badBg:'#3a2320',warn:'#d9a441',warnBg:'#332816',good:'#4bab7d',lockBg:'#151519',lockBorder:'#2a2a32',lockInk:'#5f5f6b'}
      : {bg:'#f3f3f6',node:'#ffffff',nodeAlt:'#fcfcfd',border:'#d8d8e0',line:'#c4c4cf',ink:'#16161a',ink2:'#5c5c66',ink3:'#9a9aa5',acc:'#4b45c6',accBg:'#eeedfb',accBorder:'#c8c6f2',bad:'#b3372c',badBg:'#fdeceb',warn:'#8a5a00',warnBg:'#fdf3e2',good:'#10744a',lockBg:'#e9e9ee',lockBorder:'#dcdce3',lockInk:'#a4a4af'};
  }

  mapNodes(){
    const t=this.mapTheme();
    const N=(o)=>{
      const locked=!!o.locked, tier=o.tier||'spoke';
      const size={branch:172,spine:200,spoke:118}[tier];
      return {left:(o.cx-size/2)+'px',top:(o.cy-size/2)+'px',size:size+'px',
        title:o.title,stat:o.stat||'',meta:o.meta||'',
        titleSize:(tier==='spoke'?11.5:13.5)+'px',
        statSize:(tier==='spine'?24:tier==='branch'?23:15)+'px',
        metaSize:(tier==='spoke'?10.5:11.5)+'px',
        bg:locked?t.lockBg:(tier==='spine'?t.accBg:t.node),
        border:locked?t.lockBorder:(tier==='spine'?t.accBorder:t.border),
        borderW:(tier==='spoke')?'1px':'1.5px',
        pad:(tier==='spoke')?'0 14px':'0 22px',
        color:locked?t.lockInk:t.ink2,
        statColor:locked?t.lockInk:(o.statTone==='bad'?t.bad:o.statTone==='warn'?t.warn:o.statTone==='good'?t.good:tier==='spine'?t.acc:t.ink),
        metaColor:locked?t.lockInk:t.ink3,
        urgent:!!o.urgent,urgentColor:t.bad,
        dotOffset:(tier==='spoke'?24:36)+'px',
        locked:locked,lockLabel:locked?'Not in plan':'',
        cursor:locked?'default':'pointer',
        go:locked?()=>{}:()=>this.go(o.to)};
    };
    return [
      N({cx:331,cy:200,tier:'branch',title:'AEO',stat:'34 / 100',statTone:'bad',meta:'−13 pts / 30d',urgent:'2 urgent',to:'aeo'}),
      N({cx:781,cy:200,tier:'branch',title:'E-commerce',stat:'62%',statTone:'bad',meta:'buy box · 5 findings',urgent:'2 urgent',to:'ecom'}),
      N({cx:172,cy:105,title:'Prompt tracking',stat:'34 / 100',statTone:'bad',meta:'appear',to:'aeo'}),
      N({cx:97,cy:250,title:'Citation sources',stat:'31%',meta:'community weight',to:'aeo'}),
      N({cx:940,cy:105,title:'Buy box',stat:'62%',statTone:'bad',meta:'urgent',urgent:'•',to:'ecom'}),
      N({cx:1015,cy:250,title:'Pricing',stat:'Parity',statTone:'good',meta:'0 breaks',to:'ecom'}),
      N({cx:960,cy:395,title:'Reviews',stat:'5.4 / wk',statTone:'warn',meta:'median 11.4',to:'ecom'}),
      N({cx:830,cy:470,title:'Competitors',stat:'4',statTone:'bad',meta:'1 on your brand',urgent:'•',to:'ecom'}),
      N({cx:556,cy:650,tier:'spine',title:'Suggestion Engine',stat:'8 open',meta:'3 high impact · work top down',to:'sug'}),
      N({cx:250,cy:640,title:'Before / after',stat:'',meta:'',locked:true}),
      N({cx:862,cy:640,title:'AI Assistants',stat:'',meta:'',locked:true})];
  }

  mapVals(){
    const t=this.mapTheme();
    return {t:t,nodes:this.mapNodes(),
      dark:this.state.mapDark,
      themeLabel:this.state.mapDark?'Light':'Dark',
      toggleTheme:()=>this.setState(s=>({mapDark:!s.mapDark})),
      stacked:this.state.mapStacked,diagram:!this.state.mapStacked,
      stackLabel:this.state.mapStacked?'Show 1440px diagram':'Show < 1024px layout',
      toggleStack:()=>this.setState(s=>({mapStacked:!s.mapStacked})),
      groups:[
        {name:'AEO',stat:'34 / 100 · −13',tone:t.bad,go:()=>this.go('aeo'),items:[{label:'Prompt tracking',stat:'34 appear of 100',go:()=>this.go('aeo')},{label:'Citation sources',stat:'community 31%',go:()=>this.go('aeo')}]},
        {name:'E-commerce',stat:'62% buy box · 5 findings',tone:t.bad,go:()=>this.go('ecom'),items:[{label:'Buy box',stat:'62% · urgent',go:()=>this.go('ecom')},{label:'Pricing',stat:'parity held',go:()=>this.go('ecom')},{label:'Reviews',stat:'5.4 / wk',go:()=>this.go('ecom')},{label:'Competitors',stat:'4 tracked · urgent',go:()=>this.go('ecom')}]},
        {name:'Across both',stat:'8 open actions',tone:t.acc,go:()=>this.go('sug'),items:[{label:'Suggestion Engine',stat:'8 open · 3 high impact',go:()=>this.go('sug')},{label:'Before / after',stat:'Not in plan',go:()=>{}},{label:'AI Assistants',stat:'Not in plan',go:()=>{}}]}]};
  }

  drill(id){return !!this.state.drills[id];}
  toggleDrill(id){this.setState(s=>({drills:Object.assign({},s.drills,{[id]:!s.drills[id]})}));}
  traceTo(id){return {label:'Suggestion '+SUGGESTIONS.filter(s=>s.id===id)[0].rank+' · '+SUGGESTIONS.filter(s=>s.id===id)[0].title.slice(0,44)+'…',go:()=>this.setState({screen:'sug',drawer:id})};}

  drawerVals(){
    const id=this.state.drawer; if(!id)return null;
    const s=SUGGESTIONS.filter(x=>x.id===id)[0]; if(!s)return null;
    const d=this.decorate(s), choice=this.state.choices[id]||null;
    const opts=[
      {key:'self',label:"I’ll handle it",body:'You do it. We keep the evidence on file and re-measure automatically.',after:'Yours. Mark it complete whenever it ships — we will confirm from the data.'},
      {key:'with',label:'Do it with me',body:'A guided flow: four steps, each with the exact value to change.',after:'Guided flow ready — 4 steps, about 25 minutes. Nothing is submitted until you approve it.'},
      {key:'for',label:'Do it for me',body:'Hand it to your IntoFocus team. Included in your plan.',after:'Handed to Dana Whitfield, your liaison. You will see it move to In progress within one business day.'}];
    return {title:s.title,area:s.area,rationale:s.rationale,link:s.link,impact:s.impact,impactNote:s.impactNote,effort:s.effort,
      status:d.status,statusColor:d.statusColor,statusBg:d.statusBg,statusBorder:d.statusBorder,cycle:d.cycle,
      rank:'Suggestion '+s.rank+' of 8',
      evidence:s.evidence.map(e=>({k:e.k,v:e.v,n:e.n})),
      drillOpen:this.drill('dw-'+id),toggleDrill:()=>this.toggleDrill('dw-'+id),
      drillLabel:this.drill('dw-'+id)?'Hide the underlying data':'Show the underlying data',
      close:()=>this.setState({drawer:null}),
      markDone:()=>{this.setState(st=>({statuses:Object.assign({},st.statuses,{[id]:'Done'})}));},
      showMark:choice==='self',
      chosenAfter:choice?opts.filter(o=>o.key===choice)[0].after:'',
      hasChoice:!!choice,
      options:opts.map(o=>{const on=choice===o.key;return{label:o.label,body:o.body,
        border:on?C.acc:C.line,bg:on?C.accBg:'#ffffff',dot:on?C.acc:'#ffffff',dotBorder:on?C.acc:'#c9c9d2',
        titleColor:on?C.acc:C.ink,
        go:()=>this.setState(st=>({choices:Object.assign({},st.choices,{[id]:o.key})}))};}),
      traces:[{label:'AEO · prompt coverage',go:()=>this.go('aeo')},{label:'E-commerce · findings',go:()=>this.go('ecom')},{label:'Readiness · related checks',go:()=>this.go('read')}]};
  }

  positions(){
    const P=[
     ['Amazon strategy',[
      ['Buy box held on ≥90% of catalogue days',false,'62%','≥ 90%','amazon.offers · 1 Sep','Trailhead Mini 27%, Campfire 10 71%. Two listings lost the buy box to third-party sellers in August.','s3'],
      ['No unauthorised sellers on owned ASINs',false,'14 sellers','0','amazon.offers · 1 Sep','Six unauthorised offers on Trailhead Mini, four on Nightowl, four on Basecamp 30.','s3'],
      ['Brand registry enrolled and enforcing',true,'Enrolled','Enrolled','brand.registry · 12 Aug','Registry active since March 2025. Enforcement tooling available but unused.',null],
      ['Every owned ASIN has A+ content with a spec table',false,'2 / 17','17 / 17','amazon.aplus · 30 Aug','Fifteen listings have no extractable spec table.','s4']]],
     ['Category & taxonomy',[
      ['Primary browse node matches product function',false,'1 mismatch','0 mismatches','amazon.catalog · 1 Sep','Roadster 20 is filed under Portable Bluetooth Speakers. Assistants answering amp queries never read that node.','s1'],
      ['Owned site taxonomy mirrors retail taxonomy',true,'Match','Match','crawl · 30 Aug','Site categories map 1:1 to the intended retail nodes.',null],
      ['No duplicate ASINs for the same product',false,'4 duplicates','0','amazon.catalog · 1 Sep','Nightowl exists as four ASINs splitting 312 reviews.','s6']]],
     ['Review posture',[
      ['Rating ≥ 4.2 on all owned ASINs',true,'4.6 avg','≥ 4.2','keepa.reviews · 1 Sep','Lowest rated listing is 4.4. Rating is not a problem in this account.',null],
      ['Review count ≥ 50% of category median',false,'31%','≥ 50%','keepa.reviews · 1 Sep','Basecamp 30 has 14 reviews against a category median of 180.','s8'],
      ['Post-purchase review request flow live',false,'Not live','Live','integrations · 1 Sep','No request flow configured on any listing.','s8']]],
     ['Content depth',[
      ['≥ 4 owned use-case pages per priority segment',false,'0 camping','≥ 4','crawl · 30 Aug','No owned content addresses camping or busking use, the segment driving category growth.','s2'],
      ['Structured spec markup on all product pages',true,'17 / 17','17 / 17','crawl · 30 Aug','Shipped 28 August as part of suggestion 7.','s7'],
      ['Comparison content published in last 90 days',false,'0 pages','≥ 1','crawl · 30 Aug','No comparison or alternatives content exists on owned domains.','s4']]],
     ['Brand keyword defense',[
      ['No competitor bidding on brand terms unopposed',false,'1 competitor','0','ads.monitor · 1 Sep','Voxwell Audio has bid on “fender portable amp” for 19 consecutive days with no defensive bid.','s5'],
      ['Brand term appearance ≥ 90 / 100 prompts',false,'71 / 100','≥ 90','aeo.runs · 2 Sep','Branded prompt appearance fell from 94 in July as competitor copy entered the citation set.','s5']]],
     ['Data & feeds',[
      ['Product feed refreshed within 7 days',true,'2 days','≤ 7 days','feed.sync · 31 Aug','Feed sync healthy.',null],
      ['Price parity across owned channels',true,'Parity','Parity','price.monitor · 1 Sep','No parity breaks in the last 30 days.',null],
      ['Assistant crawlers permitted in robots.txt',true,'Permitted','Permitted','crawl · 30 Aug','All five tracked assistant user-agents are allowed.',null]]]];
    return P.map(([name,checks])=>{
      const pass=checks.filter(c=>c[1]).length;
      return {name:name,score:pass+' / '+checks.length,
        scoreColor:pass===checks.length?C.good:pass===0?C.bad:C.warn,
        checks:checks.map((c,i)=>{
          const id='rd-'+name+i, open=this.drill(id);
          return {label:c[0],pass:c[1],mark:c[1]?'✓':'✕',markColor:c[1]?C.good:C.bad,markBg:c[1]?C.goodBg:C.badBg,
            value:c[2],threshold:'Threshold '+c[3],source:c[4],why:c[5],
            open:open,toggle:()=>this.toggleDrill(id),
            caret:open?'Hide why':'Why this scored',
            trace:c[6]?this.traceTo(c[6]):null,
            traceLabel:c[6]?this.traceTo(c[6]).label:'',
            traceGo:c[6]?this.traceTo(c[6]).go:()=>{}};})};});
  }

  prompts(){
    const P=[
     ["best portable guitar amp",'23 / 100',23,'−6','Reddit r/guitar','bad'],
     ["battery powered guitar amp",'3 / 100',3,'−9','Marlowe blog','bad'],
     ["guitar amp for camping",'8 / 100',8,'−4','Reddit r/camping','bad'],
     ["best practice amp under $200",'41 / 100',41,'+2','Amazon category','warn'],
     ["small amp for busking",'11 / 100',11,'−3','YouTube transcript','bad'],
     ["fender portable amp",'71 / 100',71,'−23','Own product page','warn'],
     ["quietest practice amp",'52 / 100',52,'0','Sweet spot forum','good'],
     ["amp with 12 hour battery",'4 / 100',4,'−2','Voxwell spec page','bad']];
    return P.map((p,i)=>{
      const id='pr-'+i, open=this.drill(id);
      return {q:p[0],rate:p[1],pct:p[2]+'%',delta:p[3],src:p[4],
        barColor:p[5]==='bad'?C.bad:p[5]==='warn'?C.warn:C.good,
        deltaColor:p[3].indexOf('−')===0?C.bad:p[3]==='0'?C.ink3:C.good,
        open:open,toggle:()=>this.toggleDrill(id),caret:open?'−':'+',
        runs:'Run 20× per assistant, 5 assistants, 30-day window',
        detail:[{k:'Appeared in',v:p[1]},{k:'Position when present',v:'3rd of 4 named'},{k:'Top cited source',v:p[4]},{k:'Competitor leader',v:'Marlowe Amps — '+(p[2]+31)+' / 100'}],
        conclusion:i===2?'You are invisible for camping-use queries':i===1?'Category placement blocks battery-amp queries':'Coverage below competitor median',
        traceLabel:i===1?this.traceTo('s1').label:i===2?this.traceTo('s2').label:this.traceTo('s3').label,
        traceGo:i===1?this.traceTo('s1').go:i===2?this.traceTo('s2').go:this.traceTo('s3').go};});
  }

  sources(){
    return [['Reddit & forums','31%','24','#4b45c6'],['Amazon & retail pages','24%','18','#7c76dd'],['Editorial round-ups','19%','9','#a9a5e9'],['YouTube transcripts','14%','5','#c9c6f2'],['Owned domains','12%','7','#e2e0f9']]
      .map(s=>({name:s[0],weight:s[1],cites:s[2]+' citations',bar:s[1],color:s[3]}));
  }

  products(){
    return [
     ['Roadster 20 Combo','B0F2K91XQ','98%','41','$189','—','204','2','ok'],
     ['Trailhead Mini','B0F7TT4M2','27%','38','$129','↓ 22','96','9','bad'],
     ['Campfire 10 Acoustic','B0G11PLQ7','71%','12','$219','↑ 3','341','4','warn'],
     ['Nightowl Headphone Amp','B0G4M8VC1','89%','64','$99','↓ 9','41','4','warn'],
     ['Basecamp 30 Portable','B0H2R7KD9','94%','118','$249','↓ 31','14','1','warn']]
      .map(p=>({name:p[0],asin:p[1],buybox:p[2],rank:p[3],price:p[4],move:p[5],reviews:p[6],sellers:p[7],
        buyboxColor:p[8]==='bad'?C.bad:p[8]==='warn'?C.warn:C.good,
        moveColor:p[5].indexOf('↓')===0?C.bad:p[5].indexOf('↑')===0?C.good:C.ink3}));
  }

  findings(){
    const F=[
     {t:'Trailhead Mini has no buy box on 22 of the last 30 days',sev:'Urgent',
      d:'Ridgeline Deals undercut by $12 on 11 Aug and has held the offer since. Six of the nine sellers on the listing are unauthorised.',
      effect:'Appearance rate for practice-amp prompts fell 34 → 11 runs per 100, nine days after the buy-box loss.',
      ev:[{k:'Buy box share',v:'27%'},{k:'Sellers',v:'9 (6 unauthorised)'},{k:'Units / session',v:'−41%'},{k:'AEO appearance',v:'34 → 11 / 100'}],s:'s3'},
     {t:'Roadster 20 is filed in the wrong Amazon category',sev:'Urgent',
      d:'Primary browse node is Portable Bluetooth Speakers. Category round-ups and retail listing pages that answer amp queries therefore never contain it.',
      effect:'41 of 100 tracked prompts are answered from sources that structurally exclude the product.',
      ev:[{k:'Browse node',v:'Portable Bluetooth Speakers'},{k:'Correct node',v:'Guitar Amplifiers › Combo'},{k:'Prompts blocked',v:'41 / 100'},{k:'Category citations',v:'0'}],s:'s1'},
     {t:'Nightowl exists as four duplicate listings',sev:'Watch',
      d:'312 reviews are split across four ASINs. The variant that wins search carries 41 of them.',
      effect:'Review authority is understated in every retail-sourced answer — 41 against Marlowe’s 288.',
      ev:[{k:'Duplicate ASINs',v:'4'},{k:'Reviews, winning ASIN',v:'41'},{k:'Reviews, total',v:'312'},{k:'Case duration, est.',v:'3–4 weeks'}],s:'s6'},
     {t:'Campfire 10 A+ content has no comparison table',sev:'Watch',
      d:'Three lifestyle modules, no extractable specs. Six of eight competitor listings publish a comparison table.',
      effect:'You appear in 9 of the 41 spec-qualified prompts; competitors with tables average 28.',
      ev:[{k:'A+ modules',v:'3 (median 7)'},{k:'Comparison table',v:'No'},{k:'Spec prompts won',v:'9 / 41'},{k:'Detail-page conversion',v:'6.1% vs 9.4%'}],s:'s4'},
     {t:'Voxwell Audio is bidding on your brand keyword',sev:'Watch',
      d:'Nineteen consecutive days on “fender portable amp” across Amazon and Google, with no defensive bid from you.',
      effect:'Branded prompt appearance fell from 94 to 71 per 100 as competitor copy entered the citation set.',
      ev:[{k:'Days bid',v:'19'},{k:'Defensive bids',v:'0'},{k:'Branded appearance',v:'71 / 100'},{k:'Was, July',v:'94 / 100'}],s:'s5'}];
    return F.map((f,i)=>{
      const id='fd-'+i, open=this.drill(id), t=this.traceTo(f.s);
      return {title:f.t,sev:f.sev,sevColor:f.sev==='Urgent'?C.bad:C.warn,sevBg:f.sev==='Urgent'?C.badBg:C.warnBg,
        desc:f.d,effect:f.effect,ev:f.ev,open:open,toggle:()=>this.toggleDrill(id),
        caret:open?'Hide underlying data':'Show underlying data',
        traceLabel:t.label,traceGo:t.go,goAeo:()=>this.go('aeo')};});
  }
}