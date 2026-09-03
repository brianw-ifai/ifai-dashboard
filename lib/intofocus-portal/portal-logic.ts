import { C } from "@/lib/intofocus-portal/constants";
import { SUGGESTIONS, type Suggestion } from "@/lib/intofocus-portal/suggestions";
import type { DefaultView } from "@/lib/intofocus-portal/usePortalLogic";

type PortalState = {
  screen: string;
  hubMode: "today" | "map";
  mapDark: boolean;
  mapStacked: boolean;
  views: Record<string, string>;
  drawer: string | null;
  drills: Record<string, boolean>;
  statuses: Record<string, string>;
  choices: Record<string, string>;
  area: string;
  status: string;
  sort: string;
  help: boolean;
  resp: boolean;
  defaultView: DefaultView;
  showLockedModules: boolean;
  go: (screen: string) => void;
  set: (key: string, value: unknown) => void;
  setView: (v: string) => void;
  setDrawer: (id: string | null) => void;
  setDrills: (fn: (s: Record<string, boolean>) => Record<string, boolean>) => void;
  setStatuses: (fn: (s: Record<string, string>) => Record<string, string>) => void;
  setChoices: (fn: (s: Record<string, string>) => Record<string, string>) => void;
  setMapDark: (fn: (s: boolean) => boolean) => void;
  setMapStacked: (fn: (s: boolean) => boolean) => void;
  setHelp: (fn: (s: boolean) => boolean) => void;
  setResp: (fn: (s: boolean) => boolean) => void;
  toggleDrill: (id: string) => void;
};

function statusOf(s: Suggestion, statuses: Record<string, string>) {
  return statuses[s.id] || s.status;
}

function chipStyle(active: boolean) {
  return active
    ? { color: "#ffffff", bg: C.ink, border: C.ink }
    : { color: C.ink2, bg: "#ffffff", border: C.line };
}

function statusStyle(v: string) {
  if (v === "Done") return { color: C.good, bg: C.goodBg, border: "#cfe6da" };
  if (v === "In progress") return { color: C.warn, bg: C.warnBg, border: "#f0dfbc" };
  return { color: C.ink2, bg: "#ffffff", border: C.line };
}

function cell(
  v: string | number,
  opt: {
    align?: string;
    color?: string;
    weight?: string;
    mono?: boolean;
  } = {},
) {
  return {
    v: String(v),
    align: opt.align || "left",
    color: opt.color || C.ink,
    weight: opt.weight || "400",
    font: opt.mono ? C.mono : C.sans,
  };
}

export function buildPortalVals(state: PortalState) {
  const {
    screen: scr,
    hubMode,
    mapDark,
    mapStacked,
    views,
    drawer,
    drills,
    statuses,
    choices,
    area,
    status: statusFilter,
    sort,
    help,
    resp,
    defaultView,
    showLockedModules,
    go,
    set,
    setView,
    setDrawer,
    setStatuses,
    setChoices,
    setMapDark,
    setMapStacked,
    toggleDrill,
  } = state;

  const view = () => views[scr] || (defaultView === "Data" ? "data" : "simple");
  const v = view();
  const isData = v === "data";

  const cycle = (s: Suggestion) => {
    const o = ["Not started", "In progress", "Done"];
    const cur = statusOf(s, statuses);
    const nx = o[(o.indexOf(cur) + 1) % 3];
    setStatuses((st) => ({ ...st, [s.id]: nx }));
  };

  const decorate = (s: Suggestion) => {
    const st = statusOf(s, statuses);
    const ss = statusStyle(st);
    return {
      ...s,
      status: st,
      statusColor: ss.color,
      statusBg: ss.bg,
      statusBorder: ss.border,
      impactColor: s.impact === "High" ? C.bad : s.impact === "Medium" ? C.warn : C.ink2,
      rowBg: drawer === s.id ? "#fbfbfe" : "#ffffff",
      chips: (s.chips || []).map((c) => ({
        text: c.text,
        bg: c.t === "bad" ? C.badBg : c.t === "warn" ? C.warnBg : "#f4f4f6",
        color: c.t === "bad" ? C.bad : c.t === "warn" ? C.warn : C.ink2,
      })),
      open: () => setDrawer(s.id),
      cycle: () => cycle(s),
    };
  };

  const drill = (id: string) => !!drills[id];

  const traceTo = (id: string) => {
    const s = SUGGESTIONS.find((x) => x.id === id)!;
    return {
      label: `Suggestion ${s.rank} · ${s.title.slice(0, 44)}…`,
      go: () => {
        go("sug");
        setDrawer(id);
      },
    };
  };

  const positions = () => {
    const P: [string, [string, boolean, string, string, string, string, string | null][]][] = [
      [
        "Amazon strategy",
        [
          [
            "Buy box held on ≥90% of catalogue days",
            false,
            "62%",
            "≥ 90%",
            "amazon.offers · 1 Sep",
            "Trailhead Mini 27%, Campfire 10 71%. Two listings lost the buy box to third-party sellers in August.",
            "s3",
          ],
          [
            "No unauthorised sellers on owned ASINs",
            false,
            "14 sellers",
            "0",
            "amazon.offers · 1 Sep",
            "Six unauthorised offers on Trailhead Mini, four on Nightowl, four on Basecamp 30.",
            "s3",
          ],
          [
            "Brand registry enrolled and enforcing",
            true,
            "Enrolled",
            "Enrolled",
            "brand.registry · 12 Aug",
            "Registry active since March 2025. Enforcement tooling available but unused.",
            null,
          ],
          [
            "Every owned ASIN has A+ content with a spec table",
            false,
            "2 / 17",
            "17 / 17",
            "amazon.aplus · 30 Aug",
            "Fifteen listings have no extractable spec table.",
            "s4",
          ],
        ],
      ],
      [
        "Category & taxonomy",
        [
          [
            "Primary browse node matches product function",
            false,
            "1 mismatch",
            "0 mismatches",
            "amazon.catalog · 1 Sep",
            "Roadster 20 is filed under Portable Bluetooth Speakers. Assistants answering amp queries never read that node.",
            "s1",
          ],
          [
            "Owned site taxonomy mirrors retail taxonomy",
            true,
            "Match",
            "Match",
            "crawl · 30 Aug",
            "Site categories map 1:1 to the intended retail nodes.",
            null,
          ],
          [
            "No duplicate ASINs for the same product",
            false,
            "4 duplicates",
            "0",
            "amazon.catalog · 1 Sep",
            "Nightowl exists as four ASINs splitting 312 reviews.",
            "s6",
          ],
        ],
      ],
      [
        "Review posture",
        [
          [
            "Rating ≥ 4.2 on all owned ASINs",
            true,
            "4.6 avg",
            "≥ 4.2",
            "keepa.reviews · 1 Sep",
            "Lowest rated listing is 4.4. Rating is not a problem in this account.",
            null,
          ],
          [
            "Review count ≥ 50% of category median",
            false,
            "31%",
            "≥ 50%",
            "keepa.reviews · 1 Sep",
            "Basecamp 30 has 14 reviews against a category median of 180.",
            "s8",
          ],
          [
            "Post-purchase review request flow live",
            false,
            "Not live",
            "Live",
            "integrations · 1 Sep",
            "No request flow configured on any listing.",
            "s8",
          ],
        ],
      ],
      [
        "Content depth",
        [
          [
            "≥ 4 owned use-case pages per priority segment",
            false,
            "0 camping",
            "≥ 4",
            "crawl · 30 Aug",
            "No owned content addresses camping or busking use, the segment driving category growth.",
            "s2",
          ],
          [
            "Structured spec markup on all product pages",
            true,
            "17 / 17",
            "17 / 17",
            "crawl · 30 Aug",
            "Shipped 28 August as part of suggestion 7.",
            "s7",
          ],
          [
            "Comparison content published in last 90 days",
            false,
            "0 pages",
            "≥ 1",
            "crawl · 30 Aug",
            "No comparison or alternatives content exists on owned domains.",
            "s4",
          ],
        ],
      ],
      [
        "Brand keyword defense",
        [
          [
            "No competitor bidding on brand terms unopposed",
            false,
            "1 competitor",
            "0",
            "ads.monitor · 1 Sep",
            "Voxwell Audio has bid on “fender portable amp” for 19 consecutive days with no defensive bid.",
            "s5",
          ],
          [
            "Brand term appearance ≥ 90 / 100 prompts",
            false,
            "71 / 100",
            "≥ 90",
            "aeo.runs · 2 Sep",
            "Branded prompt appearance fell from 94 in July as competitor copy entered the citation set.",
            "s5",
          ],
        ],
      ],
      [
        "Data & feeds",
        [
          [
            "Product feed refreshed within 7 days",
            true,
            "2 days",
            "≤ 7 days",
            "feed.sync · 31 Aug",
            "Feed sync healthy.",
            null,
          ],
          [
            "Price parity across owned channels",
            true,
            "Parity",
            "Parity",
            "price.monitor · 1 Sep",
            "No parity breaks in the last 30 days.",
            null,
          ],
          [
            "Assistant crawlers permitted in robots.txt",
            true,
            "Permitted",
            "Permitted",
            "crawl · 30 Aug",
            "All five tracked assistant user-agents are allowed.",
            null,
          ],
        ],
      ],
    ];

    return P.map(([name, checks]) => {
      const pass = checks.filter((c) => c[1]).length;
      return {
        name,
        score: `${pass} / ${checks.length}`,
        scoreColor: pass === checks.length ? C.good : pass === 0 ? C.bad : C.warn,
        checks: checks.map((c, i) => {
          const id = `rd-${name}${i}`;
          const open = drill(id);
          const trace = c[6] ? traceTo(c[6]) : null;
          return {
            label: c[0],
            pass: c[1],
            mark: c[1] ? "✓" : "✕",
            markColor: c[1] ? C.good : C.bad,
            markBg: c[1] ? C.goodBg : C.badBg,
            value: c[2],
            threshold: `Threshold ${c[3]}`,
            source: c[4],
            why: c[5],
            open,
            toggle: () => toggleDrill(id),
            caret: open ? "Hide why" : "Why this scored",
            trace,
            traceLabel: trace?.label ?? "",
            traceGo: trace?.go ?? (() => {}),
          };
        }),
      };
    });
  };

  const prompts = () => {
    const P: [string, string, number, string, string, string][] = [
      ["best portable guitar amp", "23 / 100", 23, "−6", "Reddit r/guitar", "bad"],
      ["battery powered guitar amp", "3 / 100", 3, "−9", "Marlowe blog", "bad"],
      ["guitar amp for camping", "8 / 100", 8, "−4", "Reddit r/camping", "bad"],
      ["best practice amp under $200", "41 / 100", 41, "+2", "Amazon category", "warn"],
      ["small amp for busking", "11 / 100", 11, "−3", "YouTube transcript", "bad"],
      ["fender portable amp", "71 / 100", 71, "−23", "Own product page", "warn"],
      ["quietest practice amp", "52 / 100", 52, "0", "Sweet spot forum", "good"],
      ["amp with 12 hour battery", "4 / 100", 4, "−2", "Voxwell spec page", "bad"],
    ];
    return P.map((p, i) => {
      const id = `pr-${i}`;
      const open = drill(id);
      return {
        q: p[0],
        rate: p[1],
        pct: `${p[2]}%`,
        delta: p[3],
        src: p[4],
        barColor: p[5] === "bad" ? C.bad : p[5] === "warn" ? C.warn : C.good,
        deltaColor: p[3].indexOf("−") === 0 ? C.bad : p[3] === "0" ? C.ink3 : C.good,
        open,
        toggle: () => toggleDrill(id),
        caret: open ? "−" : "+",
        runs: "Run 20× per assistant, 5 assistants, 30-day window",
        detail: [
          { k: "Appeared in", v: p[1] },
          { k: "Position when present", v: "3rd of 4 named" },
          { k: "Top cited source", v: p[4] },
          { k: "Competitor leader", v: `Marlowe Amps — ${p[2] + 31} / 100` },
        ],
        conclusion:
          i === 2
            ? "You are invisible for camping-use queries"
            : i === 1
              ? "Category placement blocks battery-amp queries"
              : "Coverage below competitor median",
        traceLabel:
          i === 1 ? traceTo("s1").label : i === 2 ? traceTo("s2").label : traceTo("s3").label,
        traceGo: i === 1 ? traceTo("s1").go : i === 2 ? traceTo("s2").go : traceTo("s3").go,
      };
    });
  };

  const sources = () =>
    [
      ["Reddit & forums", "31%", "24", "#4b45c6"],
      ["Amazon & retail pages", "24%", "18", "#7c76dd"],
      ["Editorial round-ups", "19%", "9", "#a9a5e9"],
      ["YouTube transcripts", "14%", "5", "#c9c6f2"],
      ["Owned domains", "12%", "7", "#e2e0f9"],
    ].map((s) => ({
      name: s[0],
      weight: s[1],
      cites: `${s[2]} citations`,
      bar: s[1],
      color: s[3],
    }));

  const products = () =>
    [
      ["Roadster 20 Combo", "B0F2K91XQ", "98%", "41", "$189", "—", "204", "2", "ok"],
      ["Trailhead Mini", "B0F7TT4M2", "27%", "38", "$129", "↓ 22", "96", "9", "bad"],
      ["Campfire 10 Acoustic", "B0G11PLQ7", "71%", "12", "$219", "↑ 3", "341", "4", "warn"],
      ["Nightowl Headphone Amp", "B0G4M8VC1", "89%", "64", "$99", "↓ 9", "41", "4", "warn"],
      ["Basecamp 30 Portable", "B0H2R7KD9", "94%", "118", "$249", "↓ 31", "14", "1", "warn"],
    ].map((p) => ({
      name: p[0],
      asin: p[1],
      buybox: p[2],
      rank: p[3],
      price: p[4],
      move: p[5],
      reviews: p[6],
      sellers: p[7],
      buyboxColor: p[8] === "bad" ? C.bad : p[8] === "warn" ? C.warn : C.good,
      moveColor: p[5].indexOf("↓") === 0 ? C.bad : p[5].indexOf("↑") === 0 ? C.good : C.ink3,
    }));

  const findings = () => {
    const F = [
      {
        t: "Trailhead Mini has no buy box on 22 of the last 30 days",
        sev: "Urgent",
        d: "Ridgeline Deals undercut by $12 on 11 Aug and has held the offer since. Six of the nine sellers on the listing are unauthorised.",
        effect:
          "Appearance rate for practice-amp prompts fell 34 → 11 runs per 100, nine days after the buy-box loss.",
        ev: [
          { k: "Buy box share", v: "27%" },
          { k: "Sellers", v: "9 (6 unauthorised)" },
          { k: "Units / session", v: "−41%" },
          { k: "AEO appearance", v: "34 → 11 / 100" },
        ],
        s: "s3",
      },
      {
        t: "Roadster 20 is filed in the wrong Amazon category",
        sev: "Urgent",
        d: "Primary browse node is Portable Bluetooth Speakers. Category round-ups and retail listing pages that answer amp queries therefore never contain it.",
        effect: "41 of 100 tracked prompts are answered from sources that structurally exclude the product.",
        ev: [
          { k: "Browse node", v: "Portable Bluetooth Speakers" },
          { k: "Correct node", v: "Guitar Amplifiers › Combo" },
          { k: "Prompts blocked", v: "41 / 100" },
          { k: "Category citations", v: "0" },
        ],
        s: "s1",
      },
      {
        t: "Nightowl exists as four duplicate listings",
        sev: "Watch",
        d: "312 reviews are split across four ASINs. The variant that wins search carries 41 of them.",
        effect:
          "Review authority is understated in every retail-sourced answer — 41 against Marlowe’s 288.",
        ev: [
          { k: "Duplicate ASINs", v: "4" },
          { k: "Reviews, winning ASIN", v: "41" },
          { k: "Reviews, total", v: "312" },
          { k: "Case duration, est.", v: "3–4 weeks" },
        ],
        s: "s6",
      },
      {
        t: "Campfire 10 A+ content has no comparison table",
        sev: "Watch",
        d: "Three lifestyle modules, no extractable specs. Six of eight competitor listings publish a comparison table.",
        effect: "You appear in 9 of the 41 spec-qualified prompts; competitors with tables average 28.",
        ev: [
          { k: "A+ modules", v: "3 (median 7)" },
          { k: "Comparison table", v: "No" },
          { k: "Spec prompts won", v: "9 / 41" },
          { k: "Detail-page conversion", v: "6.1% vs 9.4%" },
        ],
        s: "s4",
      },
      {
        t: "Voxwell Audio is bidding on your brand keyword",
        sev: "Watch",
        d: "Nineteen consecutive days on “fender portable amp” across Amazon and Google, with no defensive bid from you.",
        effect:
          "Branded prompt appearance fell from 94 to 71 per 100 as competitor copy entered the citation set.",
        ev: [
          { k: "Days bid", v: "19" },
          { k: "Defensive bids", v: "0" },
          { k: "Branded appearance", v: "71 / 100" },
          { k: "Was, July", v: "94 / 100" },
        ],
        s: "s5",
      },
    ];
    return F.map((f, i) => {
      const id = `fd-${i}`;
      const open = drill(id);
      const t = traceTo(f.s);
      return {
        title: f.t,
        sev: f.sev,
        sevColor: f.sev === "Urgent" ? C.bad : C.warn,
        sevBg: f.sev === "Urgent" ? C.badBg : C.warnBg,
        desc: f.d,
        effect: f.effect,
        ev: f.ev,
        open,
        toggle: () => toggleDrill(id),
        caret: open ? "Hide underlying data" : "Show underlying data",
        traceLabel: t.label,
        traceGo: t.go,
        goAeo: () => go("aeo"),
      };
    });
  };

  const dataView = (screen: string) => {
    const R = (...cells: ReturnType<typeof cell>[]) => ({ cells });
    if (screen === "sug") {
      return {
        name: "suggestions.open · 2026-09-02T06:00Z",
        grid: "34px 1fr 74px 92px 68px 82px 104px",
        cols: [
          { label: "#", align: "left" },
          { label: "action", align: "left" },
          { label: "area", align: "left" },
          { label: "impact_pts", align: "right" },
          { label: "effort_h", align: "right" },
          { label: "status", align: "left" },
          { label: "signal_ref", align: "left" },
        ],
        rows: SUGGESTIONS.map((s) =>
          R(
            cell(s.rank, { mono: true, color: C.ink4 }),
            cell(s.title),
            cell(s.area, { mono: true, color: C.ink2 }),
            cell(s.impactNote.replace(/[^0-9–.]/g, ""), {
              align: "right",
              mono: true,
              weight: "600",
            }),
            cell(s.effort.replace(/[^0-9]/g, "") || "—", { align: "right", mono: true }),
            cell(statusOf(s, statuses), { mono: true, color: C.ink2 }),
            cell(s.chips[0].text, { mono: true, color: C.ink3 }),
          ),
        ),
      };
    }
    if (screen === "read") {
      const rows: ReturnType<typeof R>[] = [];
      positions().forEach((p) =>
        p.checks.forEach((c) =>
          rows.push(
            R(
              cell(p.name, { mono: true, color: C.ink3 }),
              cell(c.label),
              cell(c.pass ? "PASS" : "FAIL", {
                mono: true,
                weight: "600",
                color: c.pass ? C.good : C.bad,
              }),
              cell(c.value, { align: "right", mono: true }),
              cell(c.threshold.replace("Threshold ", ""), {
                align: "right",
                mono: true,
                color: C.ink3,
              }),
              cell(c.source, { mono: true, color: C.ink3 }),
            ),
          ),
        ),
      );
      return {
        name: "readiness.eval · 2026-09-02T05:40Z",
        grid: "1fr 1.9fr 62px 96px 96px 1.1fr",
        cols: [
          { label: "position", align: "left" },
          { label: "check", align: "left" },
          { label: "result", align: "left" },
          { label: "value", align: "right" },
          { label: "threshold", align: "right" },
          { label: "source", align: "left" },
        ],
        rows,
      };
    }
    if (screen === "aeo") {
      return {
        name: "aeo.runs · 30d · 5 assistants",
        grid: "1.7fr 84px 80px 64px 1.1fr 96px",
        cols: [
          { label: "prompt", align: "left" },
          { label: "appears", align: "right" },
          { label: "rate", align: "right" },
          { label: "Δ 30d", align: "right" },
          { label: "top_source", align: "left" },
          { label: "runs", align: "right" },
        ],
        rows: prompts().map((p) =>
          R(
            cell(p.q, { mono: true }),
            cell(p.rate, { align: "right", mono: true, weight: "600" }),
            cell(p.pct, { align: "right", mono: true, color: C.ink2 }),
            cell(p.delta, { align: "right", mono: true, color: p.deltaColor }),
            cell(p.src, { mono: true, color: C.ink3 }),
            cell("100", { align: "right", mono: true, color: C.ink4 }),
          ),
        ),
      };
    }
    if (screen === "ecom") {
      return {
        name: "catalogue.performance · 2026-09-01",
        grid: "1.4fr 108px 76px 62px 68px 68px 80px 68px",
        cols: [
          { label: "product", align: "left" },
          { label: "asin", align: "left" },
          { label: "buy_box", align: "right" },
          { label: "rank", align: "right" },
          { label: "Δ rank", align: "right" },
          { label: "price", align: "right" },
          { label: "reviews", align: "right" },
          { label: "sellers", align: "right" },
        ],
        rows: products().map((p) =>
          R(
            cell(p.name),
            cell(p.asin, { mono: true, color: C.ink3 }),
            cell(p.buybox, { align: "right", mono: true, weight: "600", color: p.buyboxColor }),
            cell(p.rank, { align: "right", mono: true }),
            cell(p.move, { align: "right", mono: true, color: p.moveColor }),
            cell(p.price, { align: "right", mono: true }),
            cell(p.reviews, { align: "right", mono: true }),
            cell(p.sellers, { align: "right", mono: true }),
          ),
        ),
      };
    }
    return {
      name: "metrics.snapshot · 2026-09-02T06:00Z",
      grid: "1.7fr 0.7fr 0.7fr 0.8fr 1.4fr",
      cols: [
        { label: "metric", align: "left" },
        { label: "value", align: "right" },
        { label: "Δ 30d", align: "right" },
        { label: "updated", align: "right" },
        { label: "source", align: "left" },
      ],
      rows: [
        ["AI visibility score", "34", "−13", "06:00", "aeo.runs · 5 assistants"],
        ["Readiness checks passing", "11 / 18", "−2", "05:40", "readiness.eval"],
        ["Buy-box coverage, catalogue", "62%", "−31 pp", "04:10", "amazon.offers"],
        ["Tracked prompts with appearance", "34 / 100", "−13", "06:00", "aeo.runs"],
        ["Citations, community sources", "7", "−9", "06:00", "citation.graph"],
        ["Unauthorised sellers", "14", "+9", "04:10", "amazon.offers"],
        ["Median rank, tracked ASINs", "38", "+22", "04:10", "keepa.rank"],
        ["Review velocity, catalogue", "5.4 / wk", "−2.7", "04:10", "keepa.reviews"],
        ["Open suggestions", "8", "+3", "06:00", "suggestion.engine"],
      ].map((r) =>
        R(
          cell(r[0]),
          cell(r[1], { align: "right", mono: true, weight: "600" }),
          cell(r[2], {
            align: "right",
            mono: true,
            color:
              r[2].indexOf("−") === 0 ||
              (r[2].indexOf("+") === 0 && r[0].indexOf("Unauth") === 0)
                ? C.bad
                : C.bad,
          }),
          cell(r[3], { align: "right", mono: true, color: C.ink4 }),
          cell(r[4], { mono: true, color: C.ink3 }),
        ),
      ),
    };
  };

  const tiles = () => {
    const t = (
      title: string,
      body: string,
      metric: string,
      mc: string,
      goFn: () => void,
      badge = "",
    ) => ({
      title,
      body,
      metric,
      metricColor: mc,
      go: goFn,
      badge,
      cursor: "pointer",
      bg: "#ffffff",
      titleColor: C.ink,
      bodyColor: C.ink2,
    });
    const locked = (title: string, body: string) => ({
      title,
      body,
      metric: "Ask your liaison to preview",
      metricColor: "#b3b3bd",
      go: () => {},
      badge: "Not in your plan",
      cursor: "default",
      bg: "#fcfcfd",
      titleColor: "#9a9aa5",
      bodyColor: "#b3b3bd",
    });
    return [
      t(
        "Suggestion Engine",
        "Every recommendation, ranked, with the signal that produced it.",
        "8 open · 3 high impact",
        C.bad,
        () => go("sug"),
      ),
      t(
        "AEO",
        "Prompt-level visibility, trend and citation sources.",
        "34 / 100 · −13 in 30d",
        C.bad,
        () => go("aeo"),
      ),
      t(
        "E-commerce",
        "Buy box, rank, price, reviews, sellers, competitors.",
        "5 findings · 2 urgent",
        C.bad,
        () => go("ecom"),
      ),
      t(
        "Readiness Score",
        "Eighteen objective checks across the AEO battlefronts.",
        "11 / 18 passing",
        C.warn,
        () => go("read"),
      ),
      locked("Before / after", "Onboarding state against today, across both halves."),
      locked("AI Assistants", "Working assistants for the tasks the suggestions create."),
    ];
  };

  const mapTheme = () =>
    mapDark
      ? {
          bg: "#0e0e11",
          node: "#20202a",
          nodeAlt: "#25252f",
          border: "#383843",
          line: "#45454f",
          ink: "#f2f2f4",
          ink2: "#a3a3ad",
          ink3: "#83838f",
          acc: "#8b85f0",
          accBg: "#262340",
          accBorder: "#4a4479",
          bad: "#e0685c",
          badBg: "#3a2320",
          warn: "#d9a441",
          warnBg: "#332816",
          good: "#4bab7d",
          lockBg: "#151519",
          lockBorder: "#2a2a32",
          lockInk: "#5f5f6b",
        }
      : {
          bg: "#f3f3f6",
          node: "#ffffff",
          nodeAlt: "#fcfcfd",
          border: "#d8d8e0",
          line: "#c4c4cf",
          ink: "#16161a",
          ink2: "#5c5c66",
          ink3: "#9a9aa5",
          acc: "#4b45c6",
          accBg: "#eeedfb",
          accBorder: "#c8c6f2",
          bad: "#b3372c",
          badBg: "#fdeceb",
          warn: "#8a5a00",
          warnBg: "#fdf3e2",
          good: "#10744a",
          lockBg: "#e9e9ee",
          lockBorder: "#dcdce3",
          lockInk: "#a4a4af",
        };

  const mapNodes = () => {
    const t = mapTheme();
    const N = (o: {
      cx: number;
      cy: number;
      tier?: string;
      title: string;
      stat?: string;
      statTone?: string;
      meta?: string;
      urgent?: string | boolean;
      to?: string;
      locked?: boolean;
    }) => {
      const locked = !!o.locked;
      const tier = o.tier || "spoke";
      const size = { branch: 172, spine: 200, spoke: 118 }[tier as "branch" | "spine" | "spoke"];
      return {
        left: `${o.cx - size / 2}px`,
        top: `${o.cy - size / 2}px`,
        size: `${size}px`,
        title: o.title,
        stat: o.stat || "",
        meta: o.meta || "",
        titleSize: `${tier === "spoke" ? 11.5 : 13.5}px`,
        statSize: `${tier === "spine" ? 24 : tier === "branch" ? 23 : 15}px`,
        metaSize: `${tier === "spoke" ? 10.5 : 11.5}px`,
        bg: locked ? t.lockBg : tier === "spine" ? t.accBg : t.node,
        border: locked ? t.lockBorder : tier === "spine" ? t.accBorder : t.border,
        borderW: tier === "spoke" ? "1px" : "1.5px",
        pad: tier === "spoke" ? "0 14px" : "0 22px",
        color: locked ? t.lockInk : t.ink2,
        statColor: locked
          ? t.lockInk
          : o.statTone === "bad"
            ? t.bad
            : o.statTone === "warn"
              ? t.warn
              : o.statTone === "good"
                ? t.good
                : tier === "spine"
                  ? t.acc
                  : t.ink,
        metaColor: locked ? t.lockInk : t.ink3,
        urgent: !!o.urgent,
        urgentColor: t.bad,
        dotOffset: `${tier === "spoke" ? 24 : 36}px`,
        locked,
        lockLabel: locked ? "Not in plan" : "",
        cursor: locked ? "default" : "pointer",
        go: locked ? () => {} : () => go(o.to!),
      };
    };
    return [
      N({
        cx: 331,
        cy: 200,
        tier: "branch",
        title: "AEO",
        stat: "34 / 100",
        statTone: "bad",
        meta: "−13 pts / 30d",
        urgent: "2 urgent",
        to: "aeo",
      }),
      N({
        cx: 781,
        cy: 200,
        tier: "branch",
        title: "E-commerce",
        stat: "62%",
        statTone: "bad",
        meta: "buy box · 5 findings",
        urgent: "2 urgent",
        to: "ecom",
      }),
      N({ cx: 172, cy: 105, title: "Prompt tracking", stat: "34 / 100", statTone: "bad", meta: "appear", to: "aeo" }),
      N({ cx: 97, cy: 250, title: "Citation sources", stat: "31%", meta: "community weight", to: "aeo" }),
      N({ cx: 940, cy: 105, title: "Buy box", stat: "62%", statTone: "bad", meta: "urgent", urgent: "•", to: "ecom" }),
      N({ cx: 1015, cy: 250, title: "Pricing", stat: "Parity", statTone: "good", meta: "0 breaks", to: "ecom" }),
      N({ cx: 960, cy: 395, title: "Reviews", stat: "5.4 / wk", statTone: "warn", meta: "median 11.4", to: "ecom" }),
      N({ cx: 830, cy: 470, title: "Competitors", stat: "4", statTone: "bad", meta: "1 on your brand", urgent: "•", to: "ecom" }),
      N({
        cx: 556,
        cy: 650,
        tier: "spine",
        title: "Suggestion Engine",
        stat: "8 open",
        meta: "3 high impact · work top down",
        to: "sug",
      }),
      N({ cx: 250, cy: 640, title: "Before / after", stat: "", meta: "", locked: true }),
      N({ cx: 862, cy: 640, title: "AI Assistants", stat: "", meta: "", locked: true }),
    ];
  };

  const mapVals = () => {
    const t = mapTheme();
    return {
      t,
      nodes: mapNodes(),
      dark: mapDark,
      themeLabel: mapDark ? "Light" : "Dark",
      toggleTheme: () => setMapDark((s) => !s),
      stacked: mapStacked,
      diagram: !mapStacked,
      stackLabel: mapStacked ? "Show 1440px diagram" : "Show < 1024px layout",
      toggleStack: () => setMapStacked((s) => !s),
      groups: [
        {
          name: "AEO",
          stat: "34 / 100 · −13",
          tone: t.bad,
          go: () => go("aeo"),
          items: [
            { label: "Prompt tracking", stat: "34 appear of 100", go: () => go("aeo") },
            { label: "Citation sources", stat: "community 31%", go: () => go("aeo") },
          ],
        },
        {
          name: "E-commerce",
          stat: "62% buy box · 5 findings",
          tone: t.bad,
          go: () => go("ecom"),
          items: [
            { label: "Buy box", stat: "62% · urgent", go: () => go("ecom") },
            { label: "Pricing", stat: "parity held", go: () => go("ecom") },
            { label: "Reviews", stat: "5.4 / wk", go: () => go("ecom") },
            { label: "Competitors", stat: "4 tracked · urgent", go: () => go("ecom") },
          ],
        },
        {
          name: "Across both",
          stat: "8 open actions",
          tone: t.acc,
          go: () => go("sug"),
          items: [
            { label: "Suggestion Engine", stat: "8 open · 3 high impact", go: () => go("sug") },
            { label: "Before / after", stat: "Not in plan", go: () => {} },
            { label: "AI Assistants", stat: "Not in plan", go: () => {} },
          ],
        },
      ],
    };
  };

  const drawerVals = () => {
    const id = drawer;
    if (!id) return null;
    const s = SUGGESTIONS.find((x) => x.id === id);
    if (!s) return null;
    const d = decorate(s);
    const choice = choices[id] || null;
    const opts = [
      {
        key: "self",
        label: "I’ll handle it",
        body: "You do it. We keep the evidence on file and re-measure automatically.",
        after: "Yours. Mark it complete whenever it ships — we will confirm from the data.",
      },
      {
        key: "with",
        label: "Do it with me",
        body: "A guided flow: four steps, each with the exact value to change.",
        after:
          "Guided flow ready — 4 steps, about 25 minutes. Nothing is submitted until you approve it.",
      },
      {
        key: "for",
        label: "Do it for me",
        body: "Hand it to your IntoFocus team. Included in your plan.",
        after:
          "Handed to Dana Whitfield, your liaison. You will see it move to In progress within one business day.",
      },
    ];
    return {
      title: s.title,
      area: s.area,
      rationale: s.rationale,
      link: s.link,
      impact: s.impact,
      impactNote: s.impactNote,
      effort: s.effort,
      status: d.status,
      statusColor: d.statusColor,
      statusBg: d.statusBg,
      statusBorder: d.statusBorder,
      cycle: d.cycle,
      rank: `Suggestion ${s.rank} of 8`,
      evidence: s.evidence.map((e) => ({ k: e.k, v: e.v, n: e.n })),
      drillOpen: drill(`dw-${id}`),
      toggleDrill: () => toggleDrill(`dw-${id}`),
      drillLabel: drill(`dw-${id}`) ? "Hide the underlying data" : "Show the underlying data",
      close: () => setDrawer(null),
      markDone: () => setStatuses((st) => ({ ...st, [id]: "Done" })),
      showMark: choice === "self",
      chosenAfter: choice ? opts.find((o) => o.key === choice)!.after : "",
      hasChoice: !!choice,
      options: opts.map((o) => {
        const on = choice === o.key;
        return {
          label: o.label,
          body: o.body,
          border: on ? C.acc : C.line,
          bg: on ? C.accBg : "#ffffff",
          dot: on ? C.acc : "#ffffff",
          dotBorder: on ? C.acc : "#c9c9d2",
          titleColor: on ? C.acc : C.ink,
          go: () => setChoices((st) => ({ ...st, [id]: o.key })),
        };
      }),
      traces: [
        { label: "AEO · prompt coverage", go: () => go("aeo") },
        { label: "E-commerce · findings", go: () => go("ecom") },
        { label: "Readiness · related checks", go: () => go("read") },
      ],
    };
  };

  const meta =
    {
      hub:
        hubMode === "map"
          ? {
              title: "Where you stand",
              sub: "Every module in the product, with its current state. The link between AEO and E-commerce is drawn, not asserted.",
              stamp: "Wednesday, 2 September 2026 · data through 06:00",
            }
          : {
              title: "What to do today",
              sub: "Three items are costing you AI visibility right now. Each one names the e-commerce signal behind it.",
              stamp: "Wednesday, 2 September 2026 · data through 06:00",
            },
      sug: {
        title: "Suggestion Engine",
        sub: "8 open recommendations. The default order is our opinion — work top down. Every suggestion cites the AEO or e-commerce signal that produced it.",
        stamp: "Re-ranked 2 September, 06:00 · 8 open",
      },
      read: {
        title: "Readiness Score",
        sub: "Eighteen checks that are objectively true or false today. No modelling, no confidence interval — every line shows the value it was measured against.",
        stamp: "Checked 2 September, 05:40",
      },
      aeo: {
        title: "AEO — AI visibility",
        sub: "How assistants answer the 100 prompts we track for you, and which sources they pulled from.",
        stamp: "100 prompts · 30-day window · 5 assistants",
      },
      ecom: {
        title: "E-commerce performance",
        sub: "What is actually happening where people buy — and, for each finding, the AI-visibility effect it produced.",
        stamp: "Amazon + Keepa + web · through 1 September",
      },
    }[scr] || { title: "", sub: "", stamp: "" };

  const showLocked = showLockedModules !== false;
  const navItems: [string, string, boolean][] = [
    ["hub", "Home", false],
    ["sug", "Suggestion Engine", false],
    ["read", "Readiness Score", false],
    ["aeo", "AEO", false],
    ["ecom", "E-commerce", false],
    ["ba", "Before / after", true],
    ["ai", "AI Assistants", true],
  ];

  const filtered = SUGGESTIONS.filter((s) => {
    const st = statusOf(s, statuses);
    if (area !== "All" && s.area !== area && s.area !== "Both") return false;
    if (statusFilter !== "All" && st !== statusFilter) return false;
    return true;
  });

  const order = { High: 0, Medium: 1, Low: 2 };
  const eff = (s: Suggestion) =>
    s.effort.indexOf("Low") === 0 ? 0 : s.effort.indexOf("Medium") === 0 ? 1 : 2;
  const sorted = filtered.slice().sort((a, b) => {
    if (sort === "Impact") return order[a.impact as keyof typeof order] - order[b.impact as keyof typeof order] || a.rank - b.rank;
    if (sort === "Effort") return eff(a) - eff(b) || a.rank - b.rank;
    return a.rank - b.rank;
  });

  const rows = sorted.map((s) => decorate(s));
  const dv = dataView(scr);
  const simpleOn = !isData;

  return {
    title: meta.title,
    subtitle: meta.sub,
    stamp: meta.stamp,
    crumbVis: scr === "hub" ? "hidden" : "visible",
    isHub: scr === "hub",
    todayBg: hubMode === "today" ? C.ink : "#ffffff",
    todayColor: hubMode === "today" ? "#ffffff" : C.ink2,
    mapBg: hubMode === "map" ? C.ink : "#ffffff",
    mapColor: hubMode === "map" ? "#ffffff" : C.ink2,
    setToday: () => set("hubMode", "today"),
    setMap: () => set("hubMode", "map"),
    m: mapVals(),
    isData,
    hubSimple: scr === "hub" && simpleOn && hubMode === "today",
    mapSimple: scr === "hub" && simpleOn && hubMode === "map",
    sugSimple: scr === "sug" && simpleOn,
    readSimple: scr === "read" && simpleOn,
    aeoSimple: scr === "aeo" && simpleOn,
    ecomSimple: scr === "ecom" && simpleOn,
    simpleBg: simpleOn ? C.ink : "#ffffff",
    simpleColor: simpleOn ? "#ffffff" : C.ink2,
    dataBg: isData ? C.ink : "#ffffff",
    dataColor: isData ? "#ffffff" : C.ink2,
    setSimple: () => setView("simple"),
    setData: () => setView("data"),
    nav: navItems
      .filter((n) => showLocked || !n[2])
      .map(([id, label, locked]) => ({
        label,
        locked,
        bg: scr === id ? "#f1f1f4" : "transparent",
        color: locked ? "#b3b3bd" : scr === id ? C.ink : C.ink2,
        weight: scr === id ? "600" : "400",
        cursor: locked ? "default" : "pointer",
        go: locked ? () => {} : () => go(id),
      })),
    goHub: () => go("hub"),
    goSug: () => go("sug"),
    goRead: () => go("read"),
    goAeo: () => go("aeo"),
    goEcom: () => go("ecom"),
    openHelp: () => set("help", true),
    closeHelp: () => set("help", false),
    help,
    topFour: SUGGESTIONS.slice(0, 4).map((s) => decorate(s)),
    tiles: showLocked ? tiles() : tiles().slice(0, 4),
    rows,
    rowCount: `${rows.length} of 8 suggestions shown · default order is the recommendation`,
    respRows: SUGGESTIONS.slice(0, 3).map((s) => decorate(s)),
    resp,
    respLabel: resp ? "Hide 390px view" : "Show 390px view",
    toggleResp: () => set("resp", !resp),
    areaChips: ["All", "AEO", "E-com", "Both"].map((l) => {
      const a = chipStyle(area === (l === "All" ? "All" : l));
      return {
        label: l === "All" ? "All areas" : l,
        color: a.color,
        bg: a.bg,
        border: a.border,
        go: () => set("area", l),
      };
    }),
    statusChips: ["All", "Not started", "In progress", "Done"].map((l) => {
      const a = chipStyle(statusFilter === l);
      return {
        label: l === "All" ? "Any status" : l,
        color: a.color,
        bg: a.bg,
        border: a.border,
        go: () => set("status", l),
      };
    }),
    sortChips: ["Recommended", "Impact", "Effort"].map((l) => {
      const on = sort === l;
      return {
        label: l,
        color: on ? C.acc : C.ink2,
        bg: on ? C.accBg : "transparent",
        go: () => set("sort", l),
      };
    }),
    drawer: drawerVals(),
    drawerOpen: !!drawer,
    positions: positions(),
    prompts: prompts(),
    sources: sources(),
    products: products(),
    findings: findings(),
    dataset: dv.name,
    dataGrid: dv.grid,
    dataCols: dv.cols,
    dataRows: dv.rows,
    dataCount: `${dv.rows.length} rows`,
  };
}
