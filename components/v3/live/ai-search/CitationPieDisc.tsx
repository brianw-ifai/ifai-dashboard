import type { CitationPie, CitationPieSlice } from "@/lib/ai-search/citation-pies";

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

export function CitationPieDisc({
  pie,
  sizeClass = "citation-pie-disc",
}: {
  pie: CitationPie;
  sizeClass?: string;
}) {
  const label = pie.slices.map((slice) => `${slice.count} ${slice.label}`).join(". ");
  return (
    <div
      className={sizeClass}
      style={{ background: `conic-gradient(${gradient(pie.slices, pie.total)})` }}
      role="img"
      aria-label={`${pie.title}. ${label}. Total ${pie.total} ${pie.totalLabel}.`}
      data-citation-pie-disc={pie.id}
    />
  );
}

export function CitationPieLegend({ pie }: { pie: CitationPie }) {
  return (
    <ul className="citation-pie-legend">
      {pie.slices.map((slice) => (
        <li key={slice.key} data-pie-count={slice.count} data-pie-label={slice.label}>
          <span className="citation-pie-swatch" style={{ background: sliceColor(slice.key) }} />
          <span>
            {slice.label}: {slice.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
