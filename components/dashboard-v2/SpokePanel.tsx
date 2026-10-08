"use client";

import { MetricCard, MetricGrid } from "@/lib/canvas-sdk/Panel";
import type { SpokeRenderContext } from "@/lib/dashboard-v2/canvas/build-spec";
import type { CardModel, SpokeId } from "@/lib/dashboard-v2/canvas/spec-model";
import { ActionsTable } from "./tables/ActionsTable";
import { AnswersTable } from "./tables/AnswersTable";
import { CategoriesTable } from "./tables/CategoriesTable";
import { FreshnessTable } from "./tables/FreshnessTable";
import { ListingsTable } from "./tables/ListingsTable";
import { MoneyTables } from "./tables/MoneyTables";
import { SpecTable } from "./tables/SpecTable";

/** Short static intros. They carry the glossary terms so hover definitions land on fixed copy. */
const INTRO: Record<SpokeId, string> = {
  hub: "Each Reading below shows its figure, its coverage, and when its source was last read. A Partial read is marked not final. An Unavailable reading shows the reason instead of a number.",
  aeo: "Share of Voice across the AI answers: how often an assistant named the brand when a shopper asked. Every rate shows the answers it rests on.",
  ecommerce: "The Featured Offer on each active ASIN: who holds it, where Amazon withholds it because the offer sits above the Competitive External Price, and which outside store price matches that benchmark. MAP checks stay unavailable until a MAP sheet is stored.",
  specs: "Whether each product page carries Schema.org data as JSON-LD that an assistant can read, and how many Amazon detail fields are filled. This is the AEO groundwork.",
  competitors: "The brand's answer share against the top rival in each prompt category, with the resolved answers each share rests on.",
  suggestions: "Each Action Item is tied to the Reading that raised it. Counts come from the stored rows.",
  money: "Money as a formula. The price gap is a gap, not revenue. Each estimate opens to the inputs its formula needs; a missing input keeps the estimate unavailable.",
};

function toneOf(card: CardModel): "danger" | "warning" | "success" | undefined {
  if (card.tone === "danger" || card.tone === "warning" || card.tone === "success") return card.tone;
  return undefined;
}

export function SpokePanel({ spokeId, ctx }: { spokeId: SpokeId; tabIdx: number; ctx: SpokeRenderContext }) {
  const cards = ctx.model.cards[spokeId] ?? [];
  return (
    <div className="dv2-spoke" data-spoke-id={spokeId}>
      <p className="dv2-spoke-intro">{INTRO[spokeId]}</p>
      <MetricGrid>
        {cards.map((card) => (
          <MetricCard key={card.id} label={card.label} value={card.value} sub={card.sub} tone={toneOf(card)} />
        ))}
      </MetricGrid>
      <div className="dv2-spoke-table">
        {spokeId === "hub" ? <FreshnessTable ctx={ctx} /> : null}
        {spokeId === "ecommerce" ? <ListingsTable ctx={ctx} /> : null}
        {spokeId === "aeo" ? <AnswersTable ctx={ctx} /> : null}
        {spokeId === "specs" ? <SpecTable ctx={ctx} /> : null}
        {spokeId === "competitors" ? <CategoriesTable ctx={ctx} /> : null}
        {spokeId === "suggestions" ? <ActionsTable ctx={ctx} /> : null}
        {spokeId === "money" ? <MoneyTables ctx={ctx} /> : null}
      </div>
    </div>
  );
}
