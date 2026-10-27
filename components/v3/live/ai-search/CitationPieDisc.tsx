import type { CitationPieSlice, PieDiscData } from "@/lib/ai-search/citation-pies";

const SLICE_COLOR: Record<string, string> = {
  cited: "#22d3ee",
  none: "#64748b",
  owned: "#38bdf8",
  other: "#94a3b8",
  matched: "#10b981",
  contradicted: "#ef4444",
  fender_owned: "#38bdf8",
  retailer: "#818cf8",
  editorial: "#34d399",
  community: "#fbbf24",
  video: "#f472b6",
  reference: "#a78bfa",
  competitor_brand: "#fb7185",
  fender: "#38bdf8",
  yamaha: "#fb7185",
  gibson: "#fbbf24",
  taylor: "#34d399",
  prs: "#f472b6",
  sire: "#a78bfa",
  epiphone: "#818cf8",
  ibanez: "#22d3ee",
  martin: "#fb923c",
  boss: "#e879f9",
  "positive-grid": "#2dd4bf",
  schecter: "#facc15",
  gretsch: "#60a5fa",
  jackson: "#c084fc",
  charvel: "#fdba74",
  evh: "#f43f5e",
};

export function sliceColor(key: string): string {
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

/**
 * Structural pie for CitationPieDisc. Run Details role rates and Product Fact
 * Checks Accuracy reuse this; citation views keep the closed id union on CitationPie.
 */
export type PieDiscInput = PieDiscData;

export function CitationPieDisc({
  pie,
  sizeClass = "citation-pie-disc",
  tip,
}: {
  pie: PieDiscData;
  sizeClass?: string;
  /** Custom tooltip. Same chrome as definition terms, without a native title. */
  tip?: string;
}) {
  const label = pie.slices.map((slice) => `${slice.count} ${slice.label}`).join(". ");
  const description = tip ?? `${pie.title}. ${label}. Total ${pie.total} ${pie.totalLabel}.`;
  return (
    <div
      className={`${sizeClass} citation-chart-tip ifai-term`}
      style={{ background: `conic-gradient(${gradient(pie.slices, pie.total)})` }}
      role="img"
      aria-label={`${pie.title}. ${description}`}
      data-citation-pie-disc={pie.id}
      data-ifai-tooltip-title={pie.title}
      data-ifai-tooltip-desc={description}
      tabIndex={0}
    />
  );
}

export function CitationPieLegend({ pie }: { pie: PieDiscData }) {
  return (
    <ul className="citation-pie-legend">
      {pie.slices.map((slice) => (
        <li
          key={slice.key}
          data-pie-count={slice.count}
          data-pie-label={slice.label}
          className="citation-chart-tip ifai-term"
          data-ifai-tooltip-title={slice.label}
          data-ifai-tooltip-desc={`${slice.label}: ${slice.count} of ${pie.total} ${pie.totalLabel}.`}
          tabIndex={0}
          aria-label={`${slice.label}: ${slice.count} of ${pie.total} ${pie.totalLabel}.`}
        >
          <span className="citation-pie-swatch" style={{ background: sliceColor(slice.key) }} />
          <span>
            {slice.label}: {slice.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
