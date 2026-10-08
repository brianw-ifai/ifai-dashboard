"use client";

import type { ReactNode } from "react";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { CountBar, CountBars, GroupedBars, HubOverview, RateBar, StackedBar } from "@/lib/dashboard-v2/canvas/first-views";
import { markFigure } from "@/lib/dashboard-v2/canvas/first-views";
import type { CardModel, SpokeId } from "@/lib/dashboard-v2/canvas/spec-model";
import { UNAVAILABLE_WORD } from "@/lib/dashboard-v2/reading/format";
import { coverageLine } from "@/lib/dashboard-v2/reading/lines";
import { statusFor } from "@/lib/dashboard-v2/reading/status";
import { ACTION_ITEMS_OPEN_ID } from "@/lib/dashboard-v2/selectors/actions";
import { AI_ANSWER_SHARE_ID } from "@/lib/dashboard-v2/selectors/ai-answer-share";
import { registryFor, type AllSelections } from "@/lib/dashboard-v2/selectors/index";
import { CATEGORY_SHARE_ID } from "@/lib/dashboard-v2/selectors/weakest-category";
import { CountBarChart } from "./charts/CountBarChart";
import { DumbbellChart } from "./charts/DumbbellChart";
import { FormulaTreeView, PriceGapTreeView } from "./charts/FormulaTreeView";
import { GroupedBarChart } from "./charts/GroupedBarChart";
import { HubOverviewChart } from "./charts/HubOverviewChart";
import { RateBars } from "./charts/RateBars";
import { StackedBarChart } from "./charts/StackedBarChart";
import { ExplainerDrawer, ReadingCards, useDrawer, type ReadingCardModel } from "./ExplainerDrawer";
import { ActionsTable } from "./tables/ActionsTable";
import { AnswersTable, WrongSpecsTable } from "./tables/AnswersTable";
import { CategoriesTable } from "./tables/CategoriesTable";
import { FreshnessTable } from "./tables/FreshnessTable";
import { ListingsTable } from "./tables/ListingsTable";
import { PriceGapLinesTable, usePriceGapLines } from "./tables/MoneyTables";
import { OutsidePricesTable } from "./tables/OutsidePricesTable";
import { SpecTable } from "./tables/SpecTable";

/** Short intros for the "Read more" tabs. They carry the glossary terms so hover definitions land on fixed copy. */
const INTRO: Record<SpokeId, string> = {
  hub: "Each Reading below shows its figure, its coverage, and when its source was last read. A Partial read is marked not final. An Unavailable reading shows the reason instead of a number.",
  aeo: "Share of Voice across the AI answers: how often an assistant named the brand when a shopper asked. Every rate shows the answers it rests on.",
  ecommerce: "The Featured Offer on each active ASIN: who holds it, where Amazon withholds it because the offer sits above the Competitive External Price, and which outside store price matches that benchmark. MAP checks stay unavailable until a MAP sheet is stored.",
  specs: "Whether each product page carries Schema.org data as JSON-LD that an assistant can read, and how many Amazon detail fields are filled. This is the AEO groundwork.",
  competitors: "The brand's answer share against the top rival in each prompt category, with the resolved answers each share rests on.",
  suggestions: "Each Action Item is tied to the Reading that raised it. Counts come from the stored rows.",
  money: "Money as a formula. The price gap is a gap, not revenue. Each estimate opens to the inputs its formula needs; a missing input keeps the estimate unavailable.",
};

/** How each stacked slice is counted, for its drawer. Words only. */
const SLICE_NOTES: Record<string, string> = {
  present: "The stored count of listings whose Featured Offer flag reads present.",
  within: "Listings read minus Featured Offer present gives the withheld count; minus the withheld-above-benchmark count gives this slice. It includes withheld listings whose benchmark was not read.",
  above: "The stored suppressed count: withheld, and the offer sits above the Competitive External Price.",
  amazon_retail: "Stored seller-class count: Amazon Retail holds the Featured Offer.",
  third_party: "Stored seller-class count: a confirmed third-party seller holds the Featured Offer.",
  not_read: "Stored seller-class count: the seller read has not reached this listing yet.",
  no_offer: "Stored seller-class count: no offer to hold.",
};

function toCards(cards: CardModel[]): ReadingCardModel[] {
  return cards.map((c) => ({ id: c.id, registryId: c.registryId, label: c.label, value: c.value, sub: c.sub, tone: c.tone }));
}

function capital(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** One sentence per registry row a spoke shows: the registry meaning and the coverage sentence. */
function readMoreSentences(all: AllSelections, cards: CardModel[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const card of cards) {
    if (seen.has(card.registryId)) continue;
    seen.add(card.registryId);
    const registry = registryFor(all, card.registryId);
    const reading = all.readings[card.registryId];
    const cover = reading ? coverageLine(reading) : UNAVAILABLE_WORD;
    out.push(`${registry?.name ?? card.label}: ${registry?.meaning ?? "No registry row is stored for this reading."} ${capital(cover)}.`);
  }
  return out;
}

function ReadMore({ ctx, spokeId }: { ctx: SpokeRenderContext; spokeId: SpokeId }) {
  const cards = ctx.model.cards[spokeId] ?? [];
  const sentences = spokeId === "hub" ? ctx.model.firstViews.hub.readMore : readMoreSentences(ctx.all, cards);
  return (
    <div className="dv2-spoke" data-tab="read-more">
      <p className="dv2-spoke-intro">{INTRO[spokeId]}</p>
      <div className="content-box dv2-read-more">
        {sentences.map((s, i) => (
          <p key={i} className="dv2-read-more-line">
            {s}
          </p>
        ))}
      </div>
      <ReadingCards all={ctx.all} cards={toCards(cards)} />
    </div>
  );
}

/** The figure beside a chart, from the same Reading the chart plots. A button that opens its evidence. */
function Headline({ all, registryId, open, controls, onToggle }: { all: AllSelections; registryId: string; open: boolean; controls: string; onToggle: () => void }) {
  const reading = all.readings[registryId];
  const registry = registryFor(all, registryId);
  const tone = reading ? statusFor(reading, registry) : "neutral";
  const figure = reading ? markFigure(reading, registry) : UNAVAILABLE_WORD;
  const cover = reading ? coverageLine(reading) : UNAVAILABLE_WORD;
  return (
    <button type="button" className={`dv2-headline tone-${tone}`} aria-expanded={open} aria-controls={controls} onClick={onToggle} data-registry-id={registryId} data-testid="headline-figure">
      <span className="metric-card-label">{registry?.name ?? registryId.replace(/_/g, " ")}</span>
      <span className="dv2-headline-figure">{figure}</span>
      <span className="metric-card-sub">{cover}</span>
    </button>
  );
}

function ChartBlock({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="content-box dv2-chart-block">
      {title ? <h4 className="content-box-title">{title}</h4> : null}
      {children}
    </section>
  );
}

function AsOfStrip({ view }: { view: HubOverview }) {
  return (
    <ul className="dv2-asof-strip" aria-label="As of, per source, oldest first" data-testid="asof-strip">
      {view.asOf.map((item) => (
        <li key={item.runId}>
          <span className="dv2-asof-source">{item.sourceLabel}</span> <span className="dv2-chart-muted">({item.workflow})</span>: as of {item.asOfText}, {item.statusLabel}
        </li>
      ))}
    </ul>
  );
}

function HubView({ ctx }: { ctx: SpokeRenderContext }) {
  const view = ctx.model.firstViews.hub;
  const d = useDrawer();
  return (
    <div className="dv2-spoke" data-tab="overview">
      <ChartBlock title="The five executive outputs">
        <HubOverviewChart view={view} openId={d.openKey} controls={d.drawerId} onSelect={(m) => d.toggle(m.id, { registryId: m.registryId, reading: m.reading })} />
        <ExplainerDrawer all={ctx.all} target={d.target} id={d.drawerId} onClose={d.close} />
      </ChartBlock>
      <ChartBlock title="As of, per source">
        <AsOfStrip view={view} />
      </ChartBlock>
    </div>
  );
}

function GroupedBlock({ all, view, title, dumbbell = false }: { all: AllSelections; view: GroupedBars; title: string; dumbbell?: boolean }) {
  const d = useDrawer();
  const select = (row: GroupedBars["rows"][number]) =>
    d.toggle(`${dumbbell ? "rival" : "category"}-${row.category}`, {
      registryId: row.registryId,
      reading: row.clientReading,
      title: row.label,
      facts: [
        { label: "Top rival", value: row.rivalName ?? "not stored" },
        { label: "Rival share", value: row.rivalFigure },
        { label: "Resolved answers", value: row.resolvedText },
      ],
    });
  return (
    <ChartBlock title={title}>
      {dumbbell ? (
        <DumbbellChart view={view} openId={d.openKey} controls={d.drawerId} onSelect={select} />
      ) : (
        <GroupedBarChart view={view} openId={d.openKey} controls={d.drawerId} onSelect={select} />
      )}
      <ExplainerDrawer all={all} target={d.target} id={d.drawerId} onClose={d.close} />
    </ChartBlock>
  );
}

function RateBlock({ all, bars, title, ariaLabel }: { all: AllSelections; bars: RateBar[]; title: string; ariaLabel: string }) {
  const d = useDrawer();
  return (
    <ChartBlock title={title}>
      <RateBars bars={bars} openId={d.openKey} controls={d.drawerId} ariaLabel={ariaLabel} onSelect={(bar) => d.toggle(bar.id, { registryId: bar.registryId, reading: bar.reading, title: bar.label })} />
      <ExplainerDrawer all={all} target={d.target} id={d.drawerId} onClose={d.close} />
    </ChartBlock>
  );
}

function StackedBlock({ all, view }: { all: AllSelections; view: StackedBar }) {
  const d = useDrawer();
  return (
    <ChartBlock>
      <StackedBarChart
        view={view}
        openId={d.openKey}
        controls={d.drawerId}
        onSelect={(s) =>
          d.toggle(`${view.id}-${s.key}`, {
            registryId: s.registryId,
            reading: s.reading,
            title: s.label,
            facts: [{ label: "How this slice is counted", value: SLICE_NOTES[s.key] ?? "A stored count." }],
          })
        }
      />
      <ExplainerDrawer all={all} target={d.target} id={d.drawerId} onClose={d.close} />
    </ChartBlock>
  );
}

function CountBlock({ all, views }: { all: AllSelections; views: CountBars[] }) {
  const d = useDrawer();
  const select = (bar: CountBar, view: CountBars) =>
    d.toggle(`${view.id}-${bar.key}`, {
      registryId: view.registryId,
      title: `${view.title}, ${bar.label}`,
      facts: [{ label: "Count", value: `${bar.figure} open Action Items, counted from the stored rows` }],
    });
  return (
    <ChartBlock title="Open Action Items">
      <div className="dv2-chart-pair">
        {views.map((v) => (
          <CountBarChart key={v.id} view={v} openId={d.openKey} controls={d.drawerId} onSelect={select} />
        ))}
      </div>
      <ExplainerDrawer all={all} target={d.target} id={d.drawerId} onClose={d.close} />
    </ChartBlock>
  );
}

function AeoView({ ctx }: { ctx: SpokeRenderContext }) {
  const fv = ctx.model.firstViews.aeo;
  const d = useDrawer();
  return (
    <div className="dv2-spoke" data-tab="overview">
      <Headline all={ctx.all} registryId={AI_ANSWER_SHARE_ID} open={d.openKey === "headline"} controls={d.drawerId} onToggle={() => d.toggle("headline", { registryId: AI_ANSWER_SHARE_ID })} />
      <ExplainerDrawer all={ctx.all} target={d.target} id={d.drawerId} onClose={d.close} />
      <GroupedBlock all={ctx.all} view={fv.categories} title="Answer share by category, weakest first" />
      <RateBlock all={ctx.all} bars={fv.engines} title="Share by engine" ariaLabel="AI answer share by engine" />
    </div>
  );
}

function RetailView({ ctx }: { ctx: SpokeRenderContext }) {
  const fv = ctx.model.firstViews.ecommerce;
  const d = useDrawer();
  const headlineId = ctx.all.retail.headline?.registryId ?? fv.offerStates.registryId;
  const q = fv.question;
  return (
    <div className="dv2-spoke" data-tab="overview">
      <Headline all={ctx.all} registryId={headlineId} open={d.openKey === "headline"} controls={d.drawerId} onToggle={() => d.toggle("headline", { registryId: headlineId })} />
      <ExplainerDrawer all={ctx.all} target={d.target} id={d.drawerId} onClose={d.close} />
      <StackedBlock all={ctx.all} view={fv.offerStates} />
      <StackedBlock all={ctx.all} view={fv.sellerMix} />
      <p className="dv2-spoke-note" data-testid="primary-question">
        {q.sellerTypeLabel ? `${q.sellerTypeLabel} primary question: ` : "Primary question: "}
        {q.question ?? "not stored for this seller type"} {capital(q.statusLine).replace(/\.$/, "")}.
      </p>
    </div>
  );
}

function SpecsView({ ctx }: { ctx: SpokeRenderContext }) {
  return (
    <div className="dv2-spoke" data-tab="overview">
      <RateBlock all={ctx.all} bars={ctx.model.firstViews.specs.bars} title="Product data coverage" ariaLabel="Product data coverage, three rates" />
    </div>
  );
}

function CompetitorsView({ ctx }: { ctx: SpokeRenderContext }) {
  const d = useDrawer();
  return (
    <div className="dv2-spoke" data-tab="overview">
      <Headline all={ctx.all} registryId={CATEGORY_SHARE_ID} open={d.openKey === "headline"} controls={d.drawerId} onToggle={() => d.toggle("headline", { registryId: CATEGORY_SHARE_ID })} />
      <ExplainerDrawer all={ctx.all} target={d.target} id={d.drawerId} onClose={d.close} />
      <GroupedBlock all={ctx.all} view={ctx.model.firstViews.competitors.categories} title="Brand share and the top rival, per category" dumbbell />
    </div>
  );
}

function ActionsView({ ctx }: { ctx: SpokeRenderContext }) {
  const fv = ctx.model.firstViews.suggestions;
  const d = useDrawer();
  return (
    <div className="dv2-spoke" data-tab="overview">
      <Headline all={ctx.all} registryId={ACTION_ITEMS_OPEN_ID} open={d.openKey === "headline"} controls={d.drawerId} onToggle={() => d.toggle("headline", { registryId: ACTION_ITEMS_OPEN_ID })} />
      <ExplainerDrawer all={ctx.all} target={d.target} id={d.drawerId} onClose={d.close} />
      <CountBlock all={ctx.all} views={[fv.byOwner, fv.bySeverity]} />
      <div className="dv2-spoke-table">
        <ActionsTable ctx={ctx} />
      </div>
    </div>
  );
}

function MoneyView({ ctx }: { ctx: SpokeRenderContext }) {
  const fv = ctx.model.firstViews.money;
  const d = useDrawer();
  const { state, gap } = usePriceGapLines(ctx);
  const linesStatus = state.status === "loading" ? "loading the lines" : state.status === "error" ? `${UNAVAILABLE_WORD}: ${state.error ?? "the listings read failed"}` : null;
  return (
    <div className="dv2-spoke" data-tab="overview">
      <PriceGapTreeView
        view={fv.priceGap}
        lines={gap.lines}
        linesStatus={linesStatus}
        open={d.openKey === "price-gap"}
        controls={d.drawerId}
        onToggle={() => d.toggle("price-gap", { registryId: fv.priceGap.registryId, priceGapLines: gap.lines })}
      />
      {fv.estimates.map((tree) => (
        <FormulaTreeView key={tree.registryId} tree={tree} open={d.openKey === tree.registryId} controls={d.drawerId} onToggle={() => d.toggle(tree.registryId, { registryId: tree.registryId })} />
      ))}
      <ExplainerDrawer all={ctx.all} target={d.target} id={d.drawerId} onClose={d.close} />
    </div>
  );
}

function Table({ children }: { children: ReactNode }) {
  return <div className="dv2-spoke dv2-spoke-table">{children}</div>;
}

export function SpokePanel({ spokeId, tabIdx, ctx }: { spokeId: SpokeId; tabIdx: number; ctx: SpokeRenderContext }) {
  const tabs = ctx.model.spokes.find((s) => s.id === spokeId)?.tabs ?? [];
  const tab = tabs[tabIdx] ?? tabs[0] ?? "Overview";
  const body = (() => {
    if (tab === "Read more") return <ReadMore ctx={ctx} spokeId={spokeId} />;
    switch (spokeId) {
      case "hub":
        return tab === "Sources" ? <Table><FreshnessTable ctx={ctx} /></Table> : <HubView ctx={ctx} />;
      case "aeo":
        if (tab === "Answers") return <Table><AnswersTable ctx={ctx} /></Table>;
        if (tab === "Wrong specs") return <Table><WrongSpecsTable ctx={ctx} /></Table>;
        return <AeoView ctx={ctx} />;
      case "ecommerce":
        if (tab === "Listings") return <Table><ListingsTable ctx={ctx} /></Table>;
        if (tab === "Suppressed") return <Table><ListingsTable ctx={ctx} suppressedOnly /></Table>;
        if (tab === "Outside prices")
          return (
            <div className="dv2-spoke">
              <RateBlock all={ctx.all} bars={ctx.model.firstViews.ecommerce.channels} title="Outside prices on file, per channel" ariaLabel="Outside price coverage per channel" />
              <Table><OutsidePricesTable ctx={ctx} /></Table>
            </div>
          );
        return <RetailView ctx={ctx} />;
      case "specs":
        return tab === "Pages" ? <Table><SpecTable ctx={ctx} /></Table> : <SpecsView ctx={ctx} />;
      case "competitors":
        return tab === "Categories" ? <Table><CategoriesTable ctx={ctx} /></Table> : <CompetitorsView ctx={ctx} />;
      case "suggestions":
        return <ActionsView ctx={ctx} />;
      case "money":
        return tab === "Price gap lines" ? <Table><PriceGapLinesTable ctx={ctx} /></Table> : <MoneyView ctx={ctx} />;
      default:
        return null;
    }
  })();
  return (
    <div className="dv2-panel" data-spoke-id={spokeId} data-tab-name={tab}>
      {body}
    </div>
  );
}
