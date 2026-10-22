import { citationPies, type CitationPie, type CitationPieSlice } from "@/lib/ai-search/citation-pies";
import type { CitationRead } from "@/lib/ai-search/citations";
import { pct } from "@/lib/ai-search/summary";

const SLICE_COLOR: Record<string, string> = {
  cited: "#22d3ee",
  none: "#64748b",
  owned: "#38bdf8",
  other: "#94a3b8",
  fender_owned: "#38bdf8",
  retailer: "#818cf8",
  editorial: "#34d399",
  community: "#fbbf24",
  video: "#f472b6",
  reference: "#a78bfa",
  competitor_brand: "#fb7185",
};

function sliceColor(key: string): string {
  return SLICE_COLOR[key] ?? "#94a3b8";
}

function gradient(slices: CitationPieSlice[], total: number): string {
  let angle = 0;
  return slices
    .map((slice) => {
      const start = angle;
      angle += (slice.count / total) * 360;
      return `${sliceColor(slice.key)} ${start}deg ${angle}deg`;
    })
    .join(", ");
}

function Pie({ pie }: { pie: CitationPie }) {
  const label = pie.slices.map((slice) => `${slice.count} ${slice.label}`).join(". ");
  return (
    <figure className="citation-pie" data-citation-pie={pie.id} data-pie-total={pie.total}>
      <div
        className="citation-pie-disc"
        style={{ background: `conic-gradient(${gradient(pie.slices, pie.total)})` }}
        role="img"
        aria-label={`${pie.title}. ${label}. Total ${pie.total} ${pie.totalLabel}.`}
      />
      <figcaption>
        <strong>{pie.title}</strong>
        <ul>
          {pie.slices.map((slice) => (
            <li key={slice.key} data-pie-count={slice.count} data-pie-label={slice.label}>
              <span className="citation-pie-swatch" style={{ background: sliceColor(slice.key) }} />
              {slice.label}: {slice.count}
            </li>
          ))}
        </ul>
        <p>
          Slices total {pie.total} {pie.totalLabel}.
        </p>
      </figcaption>
    </figure>
  );
}

export function CitationHero({ read, scopeNoun }: { read: CitationRead; scopeNoun: string }) {
  const pies = citationPies(read);
  const value = read.answered > 0 ? pct(read.answersWithCitation, read.answered) : "No answers";
  return (
    <div className="citation-hero" data-citation-hero>
      <p className="citation-hero-value" data-citation-hero-value>
        {value}
      </p>
      <p className="citation-hero-ratio" data-citation-hero-ratio>
        {read.answersWithCitation} of {read.answered} {scopeNoun} cited web sources
      </p>
      {pies == null ? (
        <p data-citation-reconcile>The charts are hidden because their slices do not match the table totals.</p>
      ) : pies.length > 0 ? (
        <>
          <div className="citation-pie-row">
            {pies.map((pie) => (
              <Pie key={pie.id} pie={pie} />
            ))}
          </div>
          <p data-citation-reconcile>
            {pies.map((pie) => `${pie.title} totals ${pie.total}`).join(". ")}.
          </p>
        </>
      ) : (
        <p data-citation-reconcile>No chart is shown because this view has no answered calls and no cited links.</p>
      )}
    </div>
  );
}
